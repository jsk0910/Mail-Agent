import { Injectable } from "@nestjs/common";
import { AgentResult, AgentTriggerType, MailProvider, Prisma } from "@prisma/client";
import {
  Attachment,
  MailProviderKind,
  MessageDetail,
  MessageSummary,
  NormalizedMailRecord
} from "@mail-agent/shared";

import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class MailRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActionLogForUser(
    user: AuthenticatedUserContext,
    actionLogId: string
  ): Promise<{
    id: string;
    userId: string;
    messageId: string;
    actionType: string;
    reason: string;
    result: AgentResult;
    metadata: Prisma.JsonValue | null;
  } | null> {
    const actionLog = await this.prisma.agentActionLog.findFirst({
      where: {
        id: actionLogId,
        ...this.buildActionLogWhere(user)
      },
      select: {
        id: true,
        userId: true,
        messageId: true,
        actionType: true,
        reason: true,
        result: true,
        metadata: true
      }
    });

    return actionLog;
  }

  async findLatestFailedActionLogForMessage(
    user: AuthenticatedUserContext,
    messageId: string
  ): Promise<{
    id: string;
    messageId: string;
    actionType: string;
    reason: string;
    createdAt: Date;
  } | null> {
    return this.prisma.agentActionLog.findFirst({
      where: {
        messageId,
        result: AgentResult.failure,
        ...this.buildActionLogWhere(user)
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        messageId: true,
        actionType: true,
        reason: true,
        createdAt: true
      }
    });
  }

  async createActionLog(
    input: {
      userId: string;
      messageId: string;
      actionType: string;
      triggerType: AgentTriggerType;
      reason: string;
      result: AgentResult;
      metadata?: Prisma.InputJsonValue;
    }
  ): Promise<void> {
    await this.prisma.agentActionLog.create({
      data: {
        userId: input.userId,
        messageId: input.messageId,
        actionType: input.actionType,
        triggerType: input.triggerType,
        reason: input.reason,
        result: input.result,
        metadata: input.metadata
      }
    });
  }

  async findMessageRecordForUser(
    user: AuthenticatedUserContext,
    messageId: string
  ): Promise<{
    id: string;
    userId: string;
    accountId: string;
    provider: MailProviderKind;
    providerMessageId: string;
  } | null> {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        ...this.buildUserWhere(user)
      },
      select: {
        id: true,
        userId: true,
        accountId: true,
        provider: true,
        providerMessageId: true
      }
    });

    if (!message) {
      return null;
    }

    return {
      id: message.id,
      userId: message.userId,
      accountId: message.accountId,
      provider: message.provider as MailProviderKind,
      providerMessageId: message.providerMessageId
    };
  }

  async findInboxForUser(user: AuthenticatedUserContext): Promise<MessageSummary[]> {
    const messages = await this.prisma.message.findMany({
      where: this.buildUserWhere(user),
      orderBy: {
        receivedAt: "desc"
      }
    });

    return messages.map((message) => ({
      ...this.toMessageSummary(message)
    }));
  }

  async findMessageDetailForUser(
    user: AuthenticatedUserContext,
    messageId: string
  ): Promise<MessageDetail | null> {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        ...this.buildUserWhere(user)
      },
      include: {
        attachments: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!message) {
      return null;
    }

    return {
      ...this.toMessageSummary(message),
      to: message.toRecipients,
      cc: message.ccRecipients,
      bodyText: message.bodyText ?? "",
      bodyHtml: message.bodyHtml ?? "",
      attachments: message.attachments.map((attachment) => this.toAttachment(attachment))
    };
  }

  async persistNormalizedRecords(records: NormalizedMailRecord[]): Promise<void> {
    for (const record of records) {
      await this.persistNormalizedRecord(record);
    }
  }

  async persistNormalizedRecord(record: NormalizedMailRecord): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.thread.upsert({
        where: {
          id: record.thread.id
        },
        create: {
          id: record.thread.id,
          userId: record.thread.userId,
          subjectNormalized: record.thread.subjectNormalized,
          participants: record.thread.participants,
          lastMessageAt: new Date(record.thread.lastMessageAt),
          messageCount: record.thread.messageCount,
          linkedNotionPageIds: record.thread.linkedNotionPageIds
        },
        update: {
          subjectNormalized: record.thread.subjectNormalized,
          participants: record.thread.participants
        }
      });

      const message = await tx.message.upsert({
        where: {
          accountId_providerMessageId: {
            accountId: record.message.accountId,
            providerMessageId: record.message.providerMessageId
          }
        },
        create: {
          id: record.message.id,
          userId: record.message.userId,
          accountId: record.message.accountId,
          provider: record.message.provider as MailProvider,
          providerMessageId: record.message.providerMessageId,
          providerThreadId: record.message.providerThreadId,
          threadId: record.message.threadId,
          fromName: record.message.fromName,
          fromEmail: record.message.fromEmail,
          toRecipients: record.message.to,
          ccRecipients: record.message.cc,
          subject: record.message.subject,
          snippet: record.message.snippet,
          bodyText: record.message.bodyText,
          bodyHtml: record.message.bodyHtml,
          receivedAt: new Date(record.message.receivedAt),
          isRead: record.message.isRead,
          isStarred: record.message.isStarred,
          hasAttachments: record.message.hasAttachments,
          labels: record.message.labels
        },
        update: {
          threadId: record.message.threadId,
          fromName: record.message.fromName,
          fromEmail: record.message.fromEmail,
          toRecipients: record.message.to,
          ccRecipients: record.message.cc,
          subject: record.message.subject,
          snippet: record.message.snippet,
          bodyText: record.message.bodyText,
          bodyHtml: record.message.bodyHtml,
          receivedAt: new Date(record.message.receivedAt),
          isRead: record.message.isRead,
          isStarred: record.message.isStarred,
          hasAttachments: record.message.hasAttachments,
          labels: record.message.labels
        }
      });

      await tx.attachment.deleteMany({
        where: {
          messageId: message.id
        }
      });

      if (record.message.attachments.length > 0) {
        await tx.attachment.createMany({
          data: record.message.attachments.map((attachment) => ({
            id: attachment.id,
            messageId: message.id,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size,
            providerAttachmentId: attachment.providerAttachmentId,
            storageMode: attachment.storageMode
          }))
        });
      }

      const [messageCount, latestMessage] = await Promise.all([
        tx.message.count({
          where: {
            threadId: record.thread.id
          }
        }),
        tx.message.findFirst({
          where: {
            threadId: record.thread.id
          },
          orderBy: {
            receivedAt: "desc"
          },
          select: {
            receivedAt: true
          }
        })
      ]);

      await tx.thread.update({
        where: {
          id: record.thread.id
        },
        data: {
          messageCount,
          lastMessageAt: latestMessage?.receivedAt ?? new Date(record.thread.lastMessageAt),
          participants: record.thread.participants,
          subjectNormalized: record.thread.subjectNormalized,
          linkedNotionPageIds: record.thread.linkedNotionPageIds
        }
      });
    });
  }

  async updateReadStateForUser(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      isRead: boolean;
      reason: string;
    }
  ): Promise<MessageDetail | null> {
    const message = await this.findMessageRecordForUser(user, messageId);

    if (!message) {
      return null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: {
          id: messageId
        },
        data: {
          isRead: input.isRead
        }
      });

      await tx.agentActionLog.create({
        data: {
          userId: message.userId,
          messageId,
          actionType: input.isRead ? "mark_read" : "mark_unread",
          triggerType: AgentTriggerType.manual,
          reason: input.reason,
          result: AgentResult.success,
          metadata: {
            isRead: input.isRead
          }
        }
      });
    });

    return this.findMessageDetailForUser(user, messageId);
  }

  async updateArchiveStateForUser(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      isArchived: boolean;
      reason: string;
    }
  ): Promise<MessageDetail | null> {
    const message = await this.findMessageRecordForUser(user, messageId);

    if (!message) {
      return null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: {
          id: messageId
        },
        data: {
          isArchived: input.isArchived
        }
      });

      await tx.agentActionLog.create({
        data: {
          userId: message.userId,
          messageId,
          actionType: input.isArchived ? "archive_message" : "unarchive_message",
          triggerType: AgentTriggerType.manual,
          reason: input.reason,
          result: AgentResult.success,
          metadata: {
            isArchived: input.isArchived
          }
        }
      });
    });

    return this.findMessageDetailForUser(user, messageId);
  }

  async deleteMessageForUser(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      reason: string;
    }
  ): Promise<MessageDetail | null> {
    const message = await this.findMessageRecordForUser(user, messageId);

    if (!message) {
      return null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: {
          id: messageId
        },
        data: {
          isArchived: true,
          labels: ["TRASH"]
        }
      });

      await tx.agentActionLog.create({
        data: {
          userId: message.userId,
          messageId,
          actionType: "delete_message",
          triggerType: AgentTriggerType.manual,
          reason: input.reason,
          result: AgentResult.success,
          metadata: {
            deleted: true
          }
        }
      });
    });

    return this.findMessageDetailForUser(user, messageId);
  }

  async addLabelForUser(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      label: string;
      reason: string;
    }
  ): Promise<MessageDetail | null> {
    const message = await this.findMessageRecordForUser(user, messageId);

    if (!message) {
      return null;
    }

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.message.findUnique({
        where: {
          id: messageId
        },
        select: {
          labels: true
        }
      });

      const nextLabels = [...new Set([...(current?.labels ?? []), input.label])];

      await tx.message.update({
        where: {
          id: messageId
        },
        data: {
          labels: nextLabels
        }
      });

      await tx.agentActionLog.create({
        data: {
          userId: message.userId,
          messageId,
          actionType: "apply_label",
          triggerType: AgentTriggerType.manual,
          reason: input.reason,
          result: AgentResult.success,
          metadata: {
            label: input.label
          }
        }
      });
    });

    return this.findMessageDetailForUser(user, messageId);
  }

  private buildUserWhere(user: AuthenticatedUserContext) {
    if (user.id) {
      return {
        userId: user.id
      };
    }

    return {
      user: {
        email: user.email
      }
    };
  }

  private buildActionLogWhere(user: AuthenticatedUserContext) {
    if (user.id) {
      return {
        userId: user.id
      };
    }

    return {
      user: {
        email: user.email
      }
    };
  }

  private toMessageSummary(message: {
    id: string;
    userId: string;
    accountId: string;
    provider: MailProvider;
    providerMessageId: string;
    providerThreadId: string | null;
    threadId: string | null;
    fromName: string | null;
    fromEmail: string;
    subject: string;
    snippet: string;
    receivedAt: Date;
    isRead: boolean;
    isStarred: boolean;
    hasAttachments: boolean;
    labels: string[];
  }): MessageSummary {
    return {
      id: message.id,
      userId: message.userId,
      accountId: message.accountId,
      provider: message.provider as MailProviderKind,
      providerMessageId: message.providerMessageId,
      providerThreadId: message.providerThreadId ?? undefined,
      threadId: message.threadId ?? undefined,
      fromName: message.fromName ?? undefined,
      fromEmail: message.fromEmail,
      subject: message.subject,
      snippet: message.snippet,
      receivedAt: message.receivedAt.toISOString(),
      isRead: message.isRead,
      isStarred: message.isStarred,
      hasAttachments: message.hasAttachments,
      labels: message.labels
    };
  }

  private toAttachment(attachment: {
    id: string;
    messageId: string;
    filename: string;
    mimeType: string;
    size: number;
    providerAttachmentId: string;
    storageMode: string;
  }): Attachment {
    return {
      id: attachment.id,
      messageId: attachment.messageId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      providerAttachmentId: attachment.providerAttachmentId,
      storageMode: attachment.storageMode as Attachment["storageMode"]
    };
  }
}
