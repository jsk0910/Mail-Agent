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
    const historyResult = cursor?.gmailHistoryId
      ? await this.listMessageRefsByHistory(context, cursor.gmailHistoryId)
      : undefined;

    if (historyResult?.requiresFullSync) {
      this.logger.warn(
        `Gmail historyId ${cursor?.gmailHistoryId ?? "none"} is stale for ${context.account.email}; falling back to full sync.`
      );
    }

    const fallbackToFullSync = !historyResult || historyResult.requiresFullSync;
    const messageRefs = fallbackToFullSync
      ? await this.listRecentMessageRefs(context)
      : historyResult.messages;
    const uniqueRefs = [...new Map(messageRefs.map((item) => [item.id, item])).values()];
    const messages: ProviderMessageSource[] = [];
    const concurrency = 5;

    for (let i = 0; i < uniqueRefs.length; i += concurrency) {
      const batch = uniqueRefs.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((messageRef) => this.fetchMessage(context, messageRef.id))
      );
      messages.push(...batchResults);
      if (i + concurrency < uniqueRefs.length) {
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    }

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
    return this.fetchMessage(context, providerMessageId);
  }

  async sendMessage(context: GmailProviderContext, payload: MailComposerPayload): Promise<void> {
    return this.withTokenRetry(context, async (accessToken) => {
      const raw = this.buildRawMimeMessage(context, payload);
      const body: { raw: string; threadId?: string } = { raw };

      if (payload.threadId) {
        body.threadId = payload.threadId;
      }

      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.status === 401) {
        const message = await response.text();
        throw new UnauthorizedException(`Gmail send failed: ${message}`);
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Gmail send failed: ${message}`);
      }
    });
  }

  async replyMessage(
    context: GmailProviderContext,
    providerMessageId: string,
    payload: ReplyPayload
  ): Promise<void> {
    const originalMessage = await this.getMessage(context, providerMessageId);
    const recipients = payload.replyAll
      ? [originalMessage.from.email, ...(originalMessage.to || []).map((t) => t.email)]
          .filter((email) => email.toLowerCase() !== context.account.email.toLowerCase())
      : [originalMessage.from.email];

    const uniqueRecipients = [...new Set(recipients)];
    const subject = originalMessage.subject.startsWith("Re:")
      ? originalMessage.subject
      : `Re: ${originalMessage.subject}`;

    await this.sendMessage(context, {
      to: uniqueRecipients.length > 0 ? uniqueRecipients : [originalMessage.from.email],
      subject,
      bodyText: payload.bodyText,
      bodyHtml: payload.bodyHtml,
      threadId: originalMessage.providerThreadId || originalMessage.providerMessageId
    });
  }

  async archiveMessage(context: GmailProviderContext, providerMessageId: string): Promise<void> {
    await this.modifyMessageLabels(context, providerMessageId, {
      removeLabelIds: ["INBOX"]
    });
  }

  async deleteMessage(context: GmailProviderContext, providerMessageId: string): Promise<void> {
    return this.withTokenRetry(context, async (accessToken) => {
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

      if (response.status === 401) {
        const message = await response.text();
        throw new UnauthorizedException(`Gmail delete failed: ${message}`);
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Gmail delete failed: ${message}`);
      }
    });
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
    context: GmailProviderContext
  ): Promise<Array<{ id: string; threadId: string }>> {
    const refs = new Map<string, { id: string; threadId: string }>();
    let pageToken: string | undefined;

    do {
      const query = new URLSearchParams({
        maxResults: "30"
      });

      if (pageToken) {
        query.set("pageToken", pageToken);
      }

      const response = await this.fetchGmail<GmailListResponse>(
        context,
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${query.toString()}`
      );

      for (const message of response.data.messages ?? []) {
        refs.set(message.id, message);
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken && refs.size < 30);

    return [...refs.values()].slice(0, 30);
  }

  private async listMessageRefsByHistory(
    context: GmailProviderContext,
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
        context,
        `https://gmail.googleapis.com/gmail/v1/users/me/history?${query.toString()}`,
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
    context: GmailProviderContext,
    providerMessageId: string
  ): Promise<ProviderMessageSource> {
    const response = await this.fetchGmail<GmailMessageResponse>(
      context,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
        providerMessageId
      )}?format=full`
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

  private async getUsableAccessToken(
    context: GmailProviderContext,
    forceRefresh = false
  ): Promise<string> {
    if (!forceRefresh && context.credentials?.accessToken) {
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
    this.logger.log(`Refreshing Gmail OAuth access token for ${context.account.email}...`);
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
      const errText = await response.text();
      this.logger.error(`Failed to refresh Gmail access token: ${errText}`);
      throw new UnauthorizedException("Failed to refresh Gmail access token. Please reconnect account.");
    }

    const tokenResponse = (await response.json()) as GoogleRefreshTokenResponse;
    await this.accountsRepository.updateOAuthTokens(context.account.id, {
      accessTokenEncrypted: this.encryptionService.encrypt(tokenResponse.access_token),
      refreshTokenEncrypted: tokenResponse.refresh_token
        ? this.encryptionService.encrypt(tokenResponse.refresh_token)
        : undefined
    });

    if (context.credentials) {
      context.credentials.accessToken = tokenResponse.access_token;
      if (tokenResponse.refresh_token) {
        context.credentials.refreshToken = tokenResponse.refresh_token;
      }
    }

    return tokenResponse.access_token;
  }

  private async withTokenRetry<T>(
    context: GmailProviderContext,
    fn: (accessToken: string) => Promise<T>
  ): Promise<T> {
    let accessToken = await this.getUsableAccessToken(context);
    try {
      return await fn(accessToken);
    } catch (error) {
      if (
        (error instanceof UnauthorizedException || (error as any)?.status === 401) &&
        context.credentials?.refreshToken
      ) {
        this.logger.warn(
          `Gmail access token expired for ${context.account.email}. Auto-refreshing token and retrying...`
        );
        accessToken = await this.getUsableAccessToken(context, true);
        return await fn(accessToken);
      }
      throw error;
    }
  }

  private async modifyMessageLabels(
    context: GmailProviderContext,
    providerMessageId: string,
    body: {
      addLabelIds?: string[];
      removeLabelIds?: string[];
    }
  ): Promise<void> {
    return this.withTokenRetry(context, async (accessToken) => {
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

      if (response.status === 401) {
        const message = await response.text();
        throw new UnauthorizedException(`Gmail modify failed: ${message}`);
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Gmail modify failed: ${message}`);
      }
    });
  }

  private async fetchGmail<T>(
    context: GmailProviderContext,
    url: string,
    options?: {
      allow404?: boolean;
    }
  ): Promise<{ status: number; data: T }> {
    return this.withTokenRetry(context, async (accessToken) => {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          const backoff = 500 * Math.pow(2, attempt);
          this.logger.warn(
            `Gmail API rate limit reached (429/503). Backing off for ${backoff}ms (attempt ${attempt + 1}/3)...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }

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

        if (response.status === 401) {
          const message = await response.text();
          throw new UnauthorizedException(`Gmail API request failed: ${message}`);
        }

        if (response.status === 429 || response.status === 503) {
          const message = await response.text();
          lastError = new Error(`Gmail API request failed: ${message}`);
          continue;
        }

        if (!response.ok) {
          const message = await response.text();
          throw new Error(`Gmail API request failed: ${message}`);
        }

        return {
          status: response.status,
          data: (await response.json()) as T
        };
      }

      throw lastError || new Error(`Gmail API rate limit exceeded after 3 retries.`);
    });
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

  private encodeMimeHeader(value: string): string {
    if (/^[\x20-\x7E]*$/.test(value)) {
      return value;
    }
    return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
  }

  async getAttachment(
    context: GmailProviderContext,
    providerMessageId: string,
    attachmentId: string
  ): Promise<{ data: Buffer; size: number }> {
    const response = await this.fetchGmail<{ data?: string; size?: number }>(
      context,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
        providerMessageId
      )}/attachments/${encodeURIComponent(attachmentId)}`
    );

    const base64Data = response.data.data
      ? response.data.data.replace(/-/g, "+").replace(/_/g, "/")
      : "";
    return {
      data: Buffer.from(base64Data, "base64"),
      size: response.data.size || 0
    };
  }

  private buildRawMimeMessage(
    context: GmailProviderContext,
    payload: MailComposerPayload
  ): string {
    const hasAttachments = payload.attachments && payload.attachments.length > 0;
    const mixedBoundary = `mail-agent-mixed-${Date.now()}`;
    const altBoundary = `mail-agent-alt-${Date.now()}`;

    const headers = [
      `From: ${payload.from || context.account.email}`,
      `To: ${payload.to.join(", ")}`,
      ...(payload.cc && payload.cc.length > 0 ? [`Cc: ${payload.cc.join(", ")}`] : []),
      ...(payload.bcc && payload.bcc.length > 0 ? [`Bcc: ${payload.bcc.join(", ")}`] : []),
      ...(payload.inReplyTo ? [`In-Reply-To: ${payload.inReplyTo}`] : []),
      ...(payload.references ? [`References: ${payload.references}`] : []),
      `Subject: ${this.encodeMimeHeader(payload.subject)}`,
      "MIME-Version: 1.0"
    ];

    let fullMessage: string;

    if (hasAttachments) {
      const messageHeaders = [
        ...headers,
        `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`
      ];

      const bodyPartContent = payload.bodyHtml
        ? [
            `--${mixedBoundary}`,
            `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
            "",
            `--${altBoundary}`,
            "Content-Type: text/plain; charset=UTF-8",
            "Content-Transfer-Encoding: base64",
            "",
            Buffer.from(payload.bodyText || "", "utf8").toString("base64"),
            "",
            `--${altBoundary}`,
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: base64",
            "",
            Buffer.from(payload.bodyHtml, "utf8").toString("base64"),
            "",
            `--${altBoundary}--`
          ].join("\r\n")
        : [
            `--${mixedBoundary}`,
            "Content-Type: text/plain; charset=UTF-8",
            "Content-Transfer-Encoding: base64",
            "",
            Buffer.from(payload.bodyText || "", "utf8").toString("base64")
          ].join("\r\n");

      const attachmentParts = (payload.attachments || []).map((attachment) => {
        const cleanBase64 = attachment.contentBase64.replace(/^data:[^;]+;base64,/, "");
        return [
          `--${mixedBoundary}`,
          `Content-Type: ${attachment.mimeType || "application/octet-stream"}; name="${this.encodeMimeHeader(attachment.filename)}"`,
          `Content-Disposition: attachment; filename="${this.encodeMimeHeader(attachment.filename)}"`,
          "Content-Transfer-Encoding: base64",
          "",
          cleanBase64
        ].join("\r\n");
      });

      fullMessage = [
        messageHeaders.join("\r\n"),
        "",
        bodyPartContent,
        ...(attachmentParts.length > 0 ? [attachmentParts.join("\r\n")] : []),
        `--${mixedBoundary}--`
      ].join("\r\n");
    } else if (payload.bodyHtml) {
      const messageHeaders = [
        ...headers,
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`
      ];

      const bodyContent = [
        `--${altBoundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(payload.bodyText || "", "utf8").toString("base64"),
        "",
        `--${altBoundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(payload.bodyHtml, "utf8").toString("base64"),
        "",
        `--${altBoundary}--`
      ].join("\r\n");

      fullMessage = [messageHeaders.join("\r\n"), "", bodyContent].join("\r\n");
    } else {
      const messageHeaders = [
        ...headers,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64"
      ];

      fullMessage = [
        messageHeaders.join("\r\n"),
        "",
        Buffer.from(payload.bodyText || "", "utf8").toString("base64")
      ].join("\r\n");
    }

    return Buffer.from(fullMessage, "utf8")
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
