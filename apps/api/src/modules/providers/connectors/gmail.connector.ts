import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import {
  MailComposerPayload,
  MailProviderKind,
  ProviderSyncResult,
  ProviderMessageSource,
  ReplyPayload,
  SyncCursor
} from "@mail-agent/shared";

import { AppConfigService } from "../../../config/app-config.service";
import { EncryptionService } from "../../../common/security/encryption.service";
import { AccountsRepository } from "../../accounts/accounts.repository";
import { GmailProviderContext, MailProvider } from "../mail-provider";

interface GmailListResponse {
  messages?: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string;
}

interface GmailHistoryResponse {
  history?: Array<{
    id: string;
    messages?: Array<{
      id: string;
      threadId: string;
    }>;
    messagesAdded?: Array<{
      message?: {
        id: string;
        threadId: string;
      };
    }>;
  }>;
  nextPageToken?: string;
  historyId?: string;
}

interface GmailProfileResponse {
  historyId?: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePartBody {
  data?: string;
  attachmentId?: string;
  size?: number;
}

interface GmailMessagePart {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  historyId?: string;
  snippet?: string;
  labelIds?: string[];
  payload?: GmailMessagePart;
}

interface GoogleRefreshTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token?: string;
}

@Injectable()
export class GmailConnector implements MailProvider<GmailProviderContext> {
  readonly provider = MailProviderKind.GMAIL;
  private readonly logger = new Logger(GmailConnector.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly accountsRepository: AccountsRepository
  ) {}

  async listMessages(
    context: GmailProviderContext,
    cursor?: SyncCursor
  ): Promise<ProviderSyncResult> {
    const accessToken = await this.getUsableAccessToken(context);
    const historyResult = cursor?.gmailHistoryId
      ? await this.listMessageRefsByHistory(accessToken, cursor.gmailHistoryId)
      : undefined;

    if (historyResult?.requiresFullSync) {
      this.logger.warn(
        `Gmail historyId ${cursor?.gmailHistoryId ?? "none"} is stale for ${context.account.email}; falling back to full sync.`
      );
    }

    const fallbackToFullSync = !historyResult || historyResult.requiresFullSync;
    const messageRefs = fallbackToFullSync
      ? await this.listRecentMessageRefs(accessToken)
      : historyResult.messages;
    const uniqueRefs = [...new Map(messageRefs.map((item) => [item.id, item])).values()];
    const messages = await Promise.all(
      uniqueRefs.map((messageRef) => this.fetchMessage(messageRef.id, accessToken))
    );
    const nextCursor = historyResult?.nextCursor
      ? historyResult.nextCursor
      : this.buildCursorFromMessages(messages);

    return {
      messages,
      nextCursor
    };
  }

  async getMessage(
    context: GmailProviderContext,
    providerMessageId: string
  ): Promise<ProviderMessageSource> {
    const accessToken = await this.getUsableAccessToken(context);
    return this.fetchMessage(providerMessageId, accessToken);
  }

  async sendMessage(context: GmailProviderContext, payload: MailComposerPayload): Promise<void> {
    const accessToken = await this.getUsableAccessToken(context);
    const raw = this.buildRawMimeMessage(context, payload);
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        raw
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new UnauthorizedException(`Gmail send failed: ${message}`);
    }
  }

  async replyMessage(
    context: GmailProviderContext,
    providerMessageId: string,
    _payload: ReplyPayload
  ): Promise<void> {
    this.logger.debug(
      `Gmail replyMessage skeleton called for ${context.account.email} -> ${providerMessageId}`
    );
  }

  async archiveMessage(context: GmailProviderContext, providerMessageId: string): Promise<void> {
    await this.modifyMessageLabels(context, providerMessageId, {
      removeLabelIds: ["INBOX"]
    });
  }

  async deleteMessage(context: GmailProviderContext, providerMessageId: string): Promise<void> {
    const accessToken = await this.getUsableAccessToken(context);
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
        providerMessageId
      )}/trash`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new UnauthorizedException(`Gmail delete failed: ${message}`);
    }
  }

  async markRead(context: GmailProviderContext, providerMessageId: string): Promise<void> {
    await this.modifyMessageLabels(context, providerMessageId, {
      removeLabelIds: ["UNREAD"]
    });
  }

  async markUnread(context: GmailProviderContext, providerMessageId: string): Promise<void> {
    await this.modifyMessageLabels(context, providerMessageId, {
      addLabelIds: ["UNREAD"]
    });
  }

  async applyLabel(
    context: GmailProviderContext,
    providerMessageId: string,
    label: string
  ): Promise<void> {
    await this.modifyMessageLabels(context, providerMessageId, {
      addLabelIds: [label]
    });
  }

  private async listRecentMessageRefs(
    accessToken: string
  ): Promise<Array<{ id: string; threadId: string }>> {
    const refs = new Map<string, { id: string; threadId: string }>();
    let pageToken: string | undefined;

    do {
      const query = new URLSearchParams({
        maxResults: "50"
      });

      if (pageToken) {
        query.set("pageToken", pageToken);
      }

      const response = await this.fetchGmail<GmailListResponse>(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${query.toString()}`,
        accessToken
      );

      for (const message of response.data.messages ?? []) {
        refs.set(message.id, message);
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken && refs.size < 100);

    return [...refs.values()].slice(0, 100);
  }

  private async listMessageRefsByHistory(
    accessToken: string,
    startHistoryId: string
  ): Promise<{
    messages: Array<{ id: string; threadId: string }>;
    nextCursor?: SyncCursor;
    requiresFullSync?: boolean;
  }> {
    const refs = new Map<string, { id: string; threadId: string }>();
    let pageToken: string | undefined;
    let latestHistoryId: string | undefined;

    do {
      const query = new URLSearchParams({
        startHistoryId,
        historyTypes: "messageAdded"
      });

      if (pageToken) {
        query.set("pageToken", pageToken);
      }

      const response = await this.fetchGmail<GmailHistoryResponse>(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?${query.toString()}`,
        accessToken,
        { allow404: true }
      );

      if (response.status === 404) {
        return {
          messages: [],
          requiresFullSync: true
        };
      }

      const payload = response.data;
      latestHistoryId = payload.historyId || latestHistoryId;

      for (const historyEntry of payload.history ?? []) {
        for (const item of historyEntry.messagesAdded ?? []) {
          if (item.message?.id && item.message.threadId) {
            refs.set(item.message.id, {
              id: item.message.id,
              threadId: item.message.threadId
            });
          }
        }
      }

      pageToken = payload.nextPageToken;
    } while (pageToken);

    return {
      messages: [...refs.values()],
      nextCursor: latestHistoryId ? { gmailHistoryId: latestHistoryId } : undefined
    };
  }

  private async fetchMessage(
    providerMessageId: string,
    accessToken: string
  ): Promise<ProviderMessageSource> {
    const response = await this.fetchGmail<GmailMessageResponse>(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
        providerMessageId
      )}?format=full`,
      accessToken
    );

    return {
      provider: MailProviderKind.GMAIL,
      providerMessageId: response.data.id,
      providerThreadId: response.data.threadId,
      historyId: response.data.historyId,
      subject: this.readHeader(response.data.payload, "subject") || "(no subject)",
      snippet: response.data.snippet || "",
      from: this.parseSingleParticipant(this.readHeader(response.data.payload, "from")),
      to: this.parseParticipants(this.readHeader(response.data.payload, "to")),
      cc: this.parseParticipants(this.readHeader(response.data.payload, "cc")),
      bodyText: this.extractBody(response.data.payload, "text/plain"),
      bodyHtml: this.extractBody(response.data.payload, "text/html"),
      labels: response.data.labelIds ?? [],
      isRead: !(response.data.labelIds ?? []).includes("UNREAD"),
      isStarred: (response.data.labelIds ?? []).includes("STARRED"),
      receivedAt: this.toIsoDate(this.readHeader(response.data.payload, "date")),
      attachments: this.extractAttachments(response.data.payload)
    };
  }

  private buildCursorFromMessages(messages: ProviderMessageSource[]): SyncCursor | undefined {
    const latestHistoryId = messages
      .map((message) => ("historyId" in message ? message.historyId : undefined))
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .sort((left, right) => Number(right) - Number(left))[0];

    return latestHistoryId ? { gmailHistoryId: latestHistoryId } : undefined;
  }

  private async getUsableAccessToken(context: GmailProviderContext): Promise<string> {
    if (context.credentials?.accessToken) {
      return context.credentials.accessToken;
    }

    if (!context.credentials?.refreshToken) {
      throw new UnauthorizedException("Gmail account is missing OAuth credentials.");
    }

    return this.refreshAccessToken(context, context.credentials.refreshToken);
  }

  private async refreshAccessToken(
    context: GmailProviderContext,
    refreshToken: string
  ): Promise<string> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: this.appConfigService.googleClientId,
        client_secret: this.appConfigService.googleClientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new UnauthorizedException("Failed to refresh Gmail access token.");
    }

    const tokenResponse = (await response.json()) as GoogleRefreshTokenResponse;
    await this.accountsRepository.updateOAuthTokens(context.account.id, {
      accessTokenEncrypted: this.encryptionService.encrypt(tokenResponse.access_token),
      refreshTokenEncrypted: tokenResponse.refresh_token
        ? this.encryptionService.encrypt(tokenResponse.refresh_token)
        : undefined
    });

    return tokenResponse.access_token;
  }

  private async modifyMessageLabels(
    context: GmailProviderContext,
    providerMessageId: string,
    body: {
      addLabelIds?: string[];
      removeLabelIds?: string[];
    }
  ): Promise<void> {
    const accessToken = await this.getUsableAccessToken(context);
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
        providerMessageId
      )}/modify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new UnauthorizedException(`Gmail modify failed: ${message}`);
    }
  }

  private async fetchGmail<T>(
    url: string,
    accessToken: string,
    options?: {
      allow404?: boolean;
    }
  ): Promise<{ status: number; data: T }> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (options?.allow404 && response.status === 404) {
      return {
        status: response.status,
        data: {} as T
      };
    }

    if (!response.ok) {
      const message = await response.text();
      throw new UnauthorizedException(`Gmail API request failed: ${message}`);
    }

    return {
      status: response.status,
      data: (await response.json()) as T
    };
  }

  private readHeader(payload: GmailMessagePart | undefined, key: string): string | undefined {
    return payload?.headers?.find((header) => header.name.toLowerCase() === key.toLowerCase())
      ?.value;
  }

  private parseSingleParticipant(value?: string): { name?: string; email: string } {
    const parsed = this.parseParticipants(value)[0];
    return parsed ?? { email: "unknown@gmail.local" };
  }

  private parseParticipants(value?: string): Array<{ name?: string; email: string }> {
    if (!value) {
      return [];
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const match = item.match(/^(?:"?([^"]*)"?\s)?<?([^<>@\s]+@[^<>@\s]+)>?$/);
        if (!match) {
          return { email: item };
        }

        return {
          name: match[1]?.trim() || undefined,
          email: match[2].trim().toLowerCase()
        };
      });
  }

  private extractBody(payload: GmailMessagePart | undefined, mimeType: string): string | undefined {
    if (!payload) {
      return undefined;
    }

    if (payload.mimeType === mimeType && payload.body?.data) {
      return this.decodeBase64Url(payload.body.data);
    }

    for (const part of payload.parts ?? []) {
      const value = this.extractBody(part, mimeType);
      if (value) {
        return value;
      }
    }

    return undefined;
  }

  private extractAttachments(payload: GmailMessagePart | undefined): Array<{
    filename: string;
    mimeType: string;
    size: number;
    providerAttachmentId: string;
  }> {
    if (!payload) {
      return [];
    }

    const current =
      payload.filename && payload.body?.attachmentId
        ? [
            {
              filename: payload.filename,
              mimeType: payload.mimeType || "application/octet-stream",
              size: payload.body.size || 0,
              providerAttachmentId: payload.body.attachmentId
            }
          ]
        : [];

    return [...current, ...(payload.parts ?? []).flatMap((part) => this.extractAttachments(part))];
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf8");
  }

  private buildRawMimeMessage(
    context: GmailProviderContext,
    payload: MailComposerPayload
  ): string {
    const boundary = `mail-agent-${Date.now()}`;
    const headers = [
      `From: ${payload.from || context.account.email}`,
      `To: ${payload.to.join(", ")}`,
      ...(payload.cc && payload.cc.length > 0 ? [`Cc: ${payload.cc.join(", ")}`] : []),
      `Subject: ${payload.subject}`,
      "MIME-Version: 1.0"
    ];

    const body = payload.bodyHtml
      ? [
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          "",
          `--${boundary}`,
          "Content-Type: text/plain; charset=UTF-8",
          "Content-Transfer-Encoding: 8bit",
          "",
          payload.bodyText,
          "",
          `--${boundary}`,
          "Content-Type: text/html; charset=UTF-8",
          "Content-Transfer-Encoding: 8bit",
          "",
          payload.bodyHtml,
          "",
          `--${boundary}--`
        ].join("\r\n")
      : [
          "Content-Type: text/plain; charset=UTF-8",
          "Content-Transfer-Encoding: 8bit",
          "",
          payload.bodyText
        ].join("\r\n");

    return Buffer.from([...headers, "", body].join("\r\n"), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  private toIsoDate(value?: string): string {
    if (!value) {
      return new Date().toISOString();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
}
