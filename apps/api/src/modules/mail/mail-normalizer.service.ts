import { Injectable } from "@nestjs/common";
import {
  Attachment,
  MessageDetail,
  NormalizedMailRecord,
  ProviderMessageSource,
  SyncCursor,
  Thread
} from "@mail-agent/shared";

@Injectable()
export class MailNormalizerService {
  normalizeMessage(
    userId: string,
    accountId: string,
    source: ProviderMessageSource
  ): NormalizedMailRecord {
    const normalizedSubject = this.normalizeSubject(source.subject);
    const providerThreadId = source.providerThreadId || normalizedSubject || source.providerMessageId;
    const threadId = `thread:${accountId}:${providerThreadId}`;
    const messageId = `message:${accountId}:${source.providerMessageId}`;
    const attachments = (source.attachments ?? []).map((attachment, index) => ({
      id: `attachment:${messageId}:${index}`,
      messageId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      providerAttachmentId: attachment.providerAttachmentId,
      storageMode: "provider_reference" as const
    }));

    const thread: Thread = {
      id: threadId,
      userId,
      subjectNormalized: normalizedSubject,
      participants: this.extractParticipants(source),
      lastMessageAt: source.receivedAt,
      messageCount: 1,
      linkedNotionPageIds: []
    };

    const message: MessageDetail = {
      id: messageId,
      userId,
      accountId,
      provider: source.provider,
      providerMessageId: source.providerMessageId,
      providerThreadId: source.providerThreadId,
      threadId,
      fromName: source.from.name,
      fromEmail: source.from.email,
      to: source.to.map((participant) => participant.email),
      cc: (source.cc ?? []).map((participant) => participant.email),
      subject: source.subject,
      snippet: source.snippet,
      bodyText: source.bodyText ?? source.snippet,
      bodyHtml: source.bodyHtml ?? `<p>${this.escapeHtml(source.bodyText ?? source.snippet)}</p>`,
      receivedAt: source.receivedAt,
      isRead: source.isRead ?? false,
      isStarred: source.isStarred ?? false,
      hasAttachments: attachments.length > 0,
      labels: source.labels ?? [],
      attachments
    };

    return { thread, message };
  }

  buildNextCursor(source: ProviderMessageSource): SyncCursor | undefined {
    if (source.provider === "gmail") {
      return {
        gmailHistoryId: source.historyId || source.providerThreadId || source.providerMessageId
      };
    }

    const numericUid = Number(source.providerMessageId.replace(/\D/g, ""));
    return {
      imapUidValidity: source.uidValidity || source.providerThreadId || source.subject,
      imapLastUid: Number.isFinite(numericUid) && numericUid > 0 ? numericUid : undefined
    };
  }

  private extractParticipants(source: ProviderMessageSource): string[] {
    const values = [
      source.from.email,
      ...source.to.map((participant) => participant.email),
      ...(source.cc ?? []).map((participant) => participant.email)
    ];

    return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
  }

  private normalizeSubject(subject: string): string {
    return subject.replace(/^\s*(re|fw|fwd)\s*:\s*/gi, "").trim();
  }

  private escapeHtml(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
}
