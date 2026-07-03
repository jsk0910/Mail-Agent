import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ImapFlow, type FetchMessageObject, type MessageAddressObject, type MessageStructureObject } from "imapflow";
import {
  MailComposerPayload,
  MailProviderKind,
  ProviderSyncResult,
  ProviderMessageSource,
  ReplyPayload,
  SyncCursor
} from "@mail-agent/shared";

import { ImapProviderContext, MailProvider } from "../mail-provider";

@Injectable()
export class ImapConnector implements MailProvider<ImapProviderContext> {
  readonly provider = MailProviderKind.IMAP;
  private readonly logger = new Logger(ImapConnector.name);

  async listMessages(
    context: ImapProviderContext,
    cursor?: SyncCursor
  ): Promise<ProviderSyncResult> {
    const client = this.createClient(context);

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX", { readOnly: true });

      try {
        const uidValidity = client.mailbox ? String(client.mailbox.uidValidity) : undefined;
        const uids = await this.listTargetUids(client, cursor);
        const messages = await Promise.all(
          uids.map((uid) => this.fetchMessage(client, uid, uidValidity))
        );

        return {
          messages,
          nextCursor:
            messages.length > 0
              ? {
                  imapUidValidity: uidValidity,
                  imapLastUid: Number(messages[messages.length - 1].providerMessageId)
                }
              : cursor
        };
      } finally {
        lock.release();
      }
    } finally {
      await this.closeClient(client);
    }
  }

  async getMessage(
    context: ImapProviderContext,
    providerMessageId: string
  ): Promise<ProviderMessageSource> {
    const client = this.createClient(context);

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX", { readOnly: true });

      try {
        const uid = Number(providerMessageId);
        if (!Number.isFinite(uid) || uid <= 0) {
          throw new UnauthorizedException(`Invalid IMAP message UID: ${providerMessageId}`);
        }

        const uidValidity = client.mailbox ? String(client.mailbox.uidValidity) : undefined;
        return this.fetchMessage(client, uid, uidValidity);
      } finally {
        lock.release();
      }
    } finally {
      await this.closeClient(client);
    }
  }

  async sendMessage(context: ImapProviderContext, _payload: MailComposerPayload): Promise<void> {
    const smtpTarget = context.config.smtp?.host || context.config.imap.host;
    this.logger.debug(`IMAP/SMTP sendMessage skeleton called via ${smtpTarget}`);
  }

  async replyMessage(
    context: ImapProviderContext,
    providerMessageId: string,
    _payload: ReplyPayload
  ): Promise<void> {
    this.logger.debug(
      `IMAP replyMessage skeleton called for ${context.config.imap.username} -> ${providerMessageId}`
    );
  }

  async archiveMessage(context: ImapProviderContext, providerMessageId: string): Promise<void> {
    await this.moveMessage(context, providerMessageId, "Archive");
  }

  async deleteMessage(context: ImapProviderContext, providerMessageId: string): Promise<void> {
    await this.moveMessage(context, providerMessageId, "Trash");
  }

  async markRead(context: ImapProviderContext, providerMessageId: string): Promise<void> {
    await this.updateSeenFlag(context, providerMessageId, true);
  }

  async markUnread(context: ImapProviderContext, providerMessageId: string): Promise<void> {
    await this.updateSeenFlag(context, providerMessageId, false);
  }

  async applyLabel(
    context: ImapProviderContext,
    providerMessageId: string,
    label: string
  ): Promise<void> {
    this.logger.debug(
      `IMAP applyLabel skeleton called for ${context.config.imap.username} -> ${providerMessageId} -> ${label}`
    );
  }

  private createClient(context: ImapProviderContext): ImapFlow {
    if (!context.credentials?.password) {
      throw new UnauthorizedException("IMAP account is missing password credentials.");
    }

    return new ImapFlow({
      host: context.config.imap.host,
      port: context.config.imap.port,
      secure: context.config.imap.secure,
      auth: {
        user: context.config.imap.username,
        pass: context.credentials.password
      },
      logger: false
    });
  }

  private async listTargetUids(client: ImapFlow, cursor?: SyncCursor): Promise<number[]> {
    if (cursor?.imapLastUid && cursor.imapLastUid > 0) {
      const searched = await client.search(
        {
          uid: `${cursor.imapLastUid + 1}:*`
        },
        { uid: true }
      );

      return Array.isArray(searched) ? searched : [];
    }

    const searched = await client.search(
      {
        all: true
      },
      { uid: true }
    );

    return Array.isArray(searched) ? searched.slice(-20) : [];
  }

  private async fetchMessage(
    client: ImapFlow,
    uid: number,
    uidValidity?: string
  ): Promise<ProviderMessageSource> {
    const baseMessage = await client.fetchOne(
      String(uid),
      {
        uid: true,
        envelope: true,
        flags: true,
        bodyStructure: true,
        internalDate: true,
        headers: ["message-id", "in-reply-to", "references"]
      },
      { uid: true }
    );

    if (!baseMessage) {
      throw new UnauthorizedException(`IMAP message ${uid} could not be fetched.`);
    }

    const textPart = this.findBodyPart(baseMessage.bodyStructure, "text/plain");
    const htmlPart = this.findBodyPart(baseMessage.bodyStructure, "text/html");
    const bodyPartKeys = [textPart?.part, htmlPart?.part].filter(
      (value): value is string => typeof value === "string" && value.length > 0
    );

    const messageWithBody =
      bodyPartKeys.length > 0
        ? await client.fetchOne(
            String(uid),
            {
              uid: true,
              bodyParts: bodyPartKeys
            },
            { uid: true }
          )
        : baseMessage;

    const bodyParts = messageWithBody && "bodyParts" in messageWithBody ? messageWithBody.bodyParts : undefined;
    const bodyText = textPart?.part ? this.readBodyPart(bodyParts, textPart.part) : undefined;
    const bodyHtml = htmlPart?.part ? this.readBodyPart(bodyParts, htmlPart.part) : undefined;
    const subject = baseMessage.envelope?.subject || "(no subject)";
    const providerThreadId = this.resolveThreadId(baseMessage);

    return {
      provider: MailProviderKind.IMAP,
      providerMessageId: String(baseMessage.uid),
      providerThreadId,
      uidValidity,
      subject,
      snippet: this.buildSnippet(bodyText, bodyHtml, subject),
      from: this.mapSingleAddress(baseMessage.envelope?.from?.[0]),
      to: this.mapAddresses(baseMessage.envelope?.to),
      cc: this.mapAddresses(baseMessage.envelope?.cc),
      bodyText,
      bodyHtml,
      labels: this.mapFlags(baseMessage.flags),
      isRead: Boolean(baseMessage.flags?.has("\\Seen")),
      isStarred: Boolean(baseMessage.flags?.has("\\Flagged")),
      receivedAt: this.toIsoDate(baseMessage.internalDate),
      attachments: this.extractAttachments(baseMessage.bodyStructure)
    };
  }

  private findBodyPart(
    structure: MessageStructureObject | undefined,
    mimeType: string
  ): MessageStructureObject | undefined {
    if (!structure) {
      return undefined;
    }

    if ((structure.type || "").toLowerCase() === mimeType.toLowerCase()) {
      return structure;
    }

    for (const child of structure.childNodes ?? []) {
      const match = this.findBodyPart(child, mimeType);
      if (match) {
        return match;
      }
    }

    return undefined;
  }

  private readBodyPart(bodyParts: Map<string, Buffer> | undefined, key: string): string | undefined {
    const value = bodyParts?.get(key);
    return value ? value.toString("utf8") : undefined;
  }

  private resolveThreadId(message: FetchMessageObject): string | undefined {
    const headers = message.headers?.toString("utf8") || "";
    const messageId = this.readHeaderLine(headers, "message-id");
    const inReplyTo = this.readHeaderLine(headers, "in-reply-to");
    const references = this.readHeaderLine(headers, "references");

    return inReplyTo || references || messageId || undefined;
  }

  private readHeaderLine(headers: string, key: string): string | undefined {
    const regex = new RegExp(`^${key}:\\s*(.+)$`, "im");
    return headers.match(regex)?.[1]?.trim();
  }

  private mapSingleAddress(address?: MessageAddressObject): { name?: string; email: string } {
    return {
      name: address?.name || undefined,
      email: address?.address?.trim().toLowerCase() || "unknown@imap.local"
    };
  }

  private mapAddresses(addresses?: MessageAddressObject[]): Array<{ name?: string; email: string }> {
    return (addresses ?? [])
      .map((address) => ({
        name: address.name || undefined,
        email: address.address?.trim().toLowerCase() || ""
      }))
      .filter((address) => Boolean(address.email));
  }

  private mapFlags(flags?: Set<string>): string[] {
    return [...(flags ?? new Set<string>())].map((flag) => flag.replace(/^\\/, ""));
  }

  private extractAttachments(
    structure: MessageStructureObject | undefined
  ): Array<{
    filename: string;
    mimeType: string;
    size: number;
    providerAttachmentId: string;
  }> {
    if (!structure) {
      return [];
    }

    const filename =
      structure.dispositionParameters?.filename || structure.parameters?.name || undefined;
    const isAttachment =
      Boolean(filename) &&
      Boolean(structure.part) &&
      (structure.disposition?.toLowerCase() === "attachment" ||
        structure.disposition?.toLowerCase() === "inline");

    const current = isAttachment
      ? [
          {
            filename: filename!,
            mimeType: structure.type || "application/octet-stream",
            size: structure.size || 0,
            providerAttachmentId: structure.part!
          }
        ]
      : [];

    return [
      ...current,
      ...(structure.childNodes ?? []).flatMap((child) => this.extractAttachments(child))
    ];
  }

  private buildSnippet(bodyText?: string, bodyHtml?: string, subject?: string): string {
    const source = bodyText || this.stripHtml(bodyHtml) || subject || "";
    return source.replace(/\s+/g, " ").trim().slice(0, 180);
  }

  private stripHtml(value?: string): string {
    return value ? value.replace(/<[^>]+>/g, " ") : "";
  }

  private toIsoDate(value?: Date | string): string {
    if (!value) {
      return new Date().toISOString();
    }

    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  private async closeClient(client: ImapFlow): Promise<void> {
    try {
      if (client.usable) {
        await client.logout();
      } else {
        client.close();
      }
    } catch {
      client.close();
    }
  }

  private async updateSeenFlag(
    context: ImapProviderContext,
    providerMessageId: string,
    isRead: boolean
  ): Promise<void> {
    const uid = Number(providerMessageId);

    if (!Number.isFinite(uid) || uid <= 0) {
      throw new UnauthorizedException(`Invalid IMAP message UID: ${providerMessageId}`);
    }

    const client = this.createClient(context);

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        if (isRead) {
          await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
        } else {
          await client.messageFlagsRemove(String(uid), ["\\Seen"], { uid: true });
        }
      } finally {
        lock.release();
      }
    } finally {
      await this.closeClient(client);
    }
  }

  private async moveMessage(
    context: ImapProviderContext,
    providerMessageId: string,
    destination: string
  ): Promise<void> {
    const uid = Number(providerMessageId);

    if (!Number.isFinite(uid) || uid <= 0) {
      throw new UnauthorizedException(`Invalid IMAP message UID: ${providerMessageId}`);
    }

    const client = this.createClient(context);

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        await client.messageMove(String(uid), destination, { uid: true });
      } finally {
        lock.release();
      }
    } finally {
      await this.closeClient(client);
    }
  }
}
