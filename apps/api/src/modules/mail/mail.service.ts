import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Account as AccountRecord, AgentResult, AgentTriggerType, Prisma } from "@prisma/client";
import { MailComposerPayload, MailProviderKind, MessageDetail, MessageSummary } from "@mail-agent/shared";

import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { EncryptionService } from "../../common/security/encryption.service";
import { AccountsRepository } from "../accounts/accounts.repository";
import { toSharedAccount } from "../accounts/accounts.mapper";
import { SmtpSender } from "../providers/connectors/smtp.sender";
import {
  ProviderRegistryService,
  ResolvedProviderAccount
} from "../providers/provider-registry.service";
import { MailRepository } from "./mail.repository";

type MailComposeResult = {
  accountId: string;
  provider: MailProviderKind;
  mode: "compose" | "reply" | "forward";
  status: "sent" | "accepted_placeholder";
  detail: string;
};

@Injectable()
export class MailService {
  constructor(
    private readonly mailRepository: MailRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly providerRegistryService: ProviderRegistryService,
    private readonly encryptionService: EncryptionService,
    private readonly smtpSender: SmtpSender
  ) {}

  async listInbox(user: AuthenticatedUserContext): Promise<MessageSummary[]> {
    return this.mailRepository.findInboxForUser(user);
  }

  async getMessage(
    user: AuthenticatedUserContext,
    messageId: string
  ): Promise<MessageDetail | null> {
    return this.mailRepository.findMessageDetailForUser(user, messageId);
  }

  async getLatestFailedAction(
    user: AuthenticatedUserContext,
    messageId: string
  ): Promise<{
    id: string;
    messageId: string;
    actionType: string;
    reason: string;
    createdAt: string;
  } | null> {
    const actionLog = await this.mailRepository.findLatestFailedActionLogForMessage(user, messageId);

    if (!actionLog) {
      return null;
    }

    return {
      ...actionLog,
      createdAt: actionLog.createdAt.toISOString()
    };
  }

  async downloadAttachment(
    user: AuthenticatedUserContext,
    messageId: string,
    attachmentId: string
  ): Promise<{
    filename: string;
    mimeType: string;
    data: Buffer;
    size: number;
  }> {
    const attachment = await this.mailRepository.findAttachmentRecordForUser(
      user,
      messageId,
      attachmentId
    );

    if (!attachment) {
      throw new NotFoundException(`Attachment ${attachmentId} was not found.`);
    }

    const resolvedProvider = this.resolveProviderWithCredentials(attachment.message.account);

    if (resolvedProvider.providerKind === MailProviderKind.GMAIL) {
      const result = await resolvedProvider.provider.getAttachment(
        resolvedProvider,
        attachment.message.providerMessageId,
        attachment.providerAttachmentId
      );

      return {
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        data: result.data,
        size: result.size || result.data.length
      };
    }

    throw new BadRequestException("Attachment download is currently supported for Gmail accounts.");
  }

  async composeMessage(
    user: AuthenticatedUserContext,
    input: {
      accountId: string;
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      bodyText: string;
      bodyHtml?: string;
    }
  ): Promise<MailComposeResult> {
    const account = await this.accountsRepository.findByIdForUser(user, input.accountId);

    if (!account) {
      throw new NotFoundException(`Account ${input.accountId} was not found.`);
    }

    return this.sendViaAccount(account, {
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml
    }, "compose");
  }

  async replyToMessage(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      bodyText: string;
      bodyHtml?: string;
    }
  ): Promise<MailComposeResult> {
    const message = await this.mailRepository.findMessageRecordForUser(user, messageId);

    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const account = await this.accountsRepository.findByIdForUser(user, message.accountId);

    if (!account) {
      throw new NotFoundException(`Account ${message.accountId} was not found.`);
    }

    return this.sendViaAccount(
      account,
      {
        ...input,
        threadId: message.providerThreadId || message.providerMessageId
      },
      "reply"
    );
  }

  async forwardMessage(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      bodyText: string;
      bodyHtml?: string;
    }
  ): Promise<MailComposeResult> {
    const message = await this.mailRepository.findMessageRecordForUser(user, messageId);

    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const account = await this.accountsRepository.findByIdForUser(user, message.accountId);

    if (!account) {
      throw new NotFoundException(`Account ${message.accountId} was not found.`);
    }

    return this.sendViaAccount(account, input, "forward");
  }

  async updateReadState(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      isRead: boolean;
      reason?: string;
    }
  ): Promise<MessageDetail> {
    const message = await this.mailRepository.findMessageRecordForUser(user, messageId);

    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const account = await this.accountsRepository.findByIdForUser(user, message.accountId);

    if (!account) {
      throw new NotFoundException(`Account ${message.accountId} was not found.`);
    }
    const reason =
      input.reason ||
      (input.isRead ? "User marked the message as read." : "User marked the message as unread.");

    return this.executeActionWithRetryLogging(
      user,
      message,
      account,
      input.isRead ? "mark_read" : "mark_unread",
      reason,
      {
        isRead: input.isRead
      },
      async (resolvedProvider, providerMessageId) => {
        if (input.isRead) {
          if (resolvedProvider.providerKind === "gmail") {
            await resolvedProvider.provider.markRead(resolvedProvider, providerMessageId);
          } else {
            await resolvedProvider.provider.markRead(resolvedProvider, providerMessageId);
          }
        } else {
          if (resolvedProvider.providerKind === "gmail") {
            await resolvedProvider.provider.markUnread(resolvedProvider, providerMessageId);
          } else {
            await resolvedProvider.provider.markUnread(resolvedProvider, providerMessageId);
          }
        }
      },
      async () => this.mailRepository.updateReadStateForUser(user, messageId, { isRead: input.isRead, reason })
    );
  }

  async updateArchiveState(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      isArchived: boolean;
      reason?: string;
    }
  ): Promise<MessageDetail> {
    const message = await this.mailRepository.findMessageRecordForUser(user, messageId);

    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const account = await this.accountsRepository.findByIdForUser(user, message.accountId);

    if (!account) {
      throw new NotFoundException(`Account ${message.accountId} was not found.`);
    }

    const reason =
      input.reason ||
      (input.isArchived
        ? "User archived the message."
        : "User requested archive-state sync.");

    return this.executeActionWithRetryLogging(
      user,
      message,
      account,
      input.isArchived ? "archive_message" : "unarchive_message",
      reason,
      {
        isArchived: input.isArchived
      },
      async (resolvedProvider, providerMessageId) => {
        if (resolvedProvider.providerKind === "gmail") {
          await resolvedProvider.provider.archiveMessage(resolvedProvider, providerMessageId);
        } else {
          await resolvedProvider.provider.archiveMessage(resolvedProvider, providerMessageId);
        }
      },
      async () =>
        this.mailRepository.updateArchiveStateForUser(user, messageId, {
          isArchived: input.isArchived,
          reason
        })
    );
  }

  async deleteMessage(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      reason?: string;
    }
  ): Promise<MessageDetail> {
    const message = await this.mailRepository.findMessageRecordForUser(user, messageId);

    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const account = await this.accountsRepository.findByIdForUser(user, message.accountId);

    if (!account) {
      throw new NotFoundException(`Account ${message.accountId} was not found.`);
    }

    const reason = input.reason || "User deleted the message.";

    return this.executeActionWithRetryLogging(
      user,
      message,
      account,
      "delete_message",
      reason,
      {
        deleted: true
      },
      async (resolvedProvider, providerMessageId) => {
        if (resolvedProvider.providerKind === "gmail") {
          await resolvedProvider.provider.deleteMessage(resolvedProvider, providerMessageId);
        } else {
          await resolvedProvider.provider.deleteMessage(resolvedProvider, providerMessageId);
        }
      },
      async () => this.mailRepository.deleteMessageForUser(user, messageId, { reason })
    );
  }

  async applyLabel(
    user: AuthenticatedUserContext,
    messageId: string,
    input: {
      label: string;
      reason?: string;
    }
  ): Promise<MessageDetail> {
    const message = await this.mailRepository.findMessageRecordForUser(user, messageId);

    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const account = await this.accountsRepository.findByIdForUser(user, message.accountId);

    if (!account) {
      throw new NotFoundException(`Account ${message.accountId} was not found.`);
    }

    if (account.provider !== "gmail") {
      throw new BadRequestException("Manual label apply is currently supported only for Gmail accounts.");
    }

    const reason = input.reason || `User applied Gmail label '${input.label}'.`;

    return this.executeActionWithRetryLogging(
      user,
      message,
      account,
      "apply_label",
      reason,
      {
        label: input.label
      },
      async (resolvedProvider, providerMessageId) => {
        if (resolvedProvider.providerKind !== "gmail") {
          throw new BadRequestException(
            "Manual label apply is currently supported only for Gmail accounts."
          );
        }

        await resolvedProvider.provider.applyLabel(resolvedProvider, providerMessageId, input.label);
      },
      async () => this.mailRepository.addLabelForUser(user, messageId, { label: input.label, reason })
    );
  }

  async retryAction(
    user: AuthenticatedUserContext,
    actionLogId: string,
    input: {
      reason?: string;
    }
  ): Promise<MessageDetail> {
    const actionLog = await this.mailRepository.findActionLogForUser(user, actionLogId);

    if (!actionLog) {
      throw new NotFoundException(`Action log ${actionLogId} was not found.`);
    }

    if (actionLog.result !== AgentResult.failure) {
      throw new BadRequestException("Only failed action logs can be retried.");
    }

    const metadata = this.asRecord(actionLog.metadata);
    const retryReason = input.reason || `Retry requested for failed action ${actionLog.actionType}.`;

    switch (actionLog.actionType) {
      case "mark_read":
      case "mark_unread":
        return this.updateReadState(user, actionLog.messageId, {
          isRead: this.readBoolean(metadata?.isRead, actionLog.actionType === "mark_read"),
          reason: retryReason
        });
      case "archive_message":
      case "unarchive_message":
        return this.updateArchiveState(user, actionLog.messageId, {
          isArchived: this.readBoolean(metadata?.isArchived, actionLog.actionType === "archive_message"),
          reason: retryReason
        });
      case "delete_message":
        return this.deleteMessage(user, actionLog.messageId, {
          reason: retryReason
        });
      case "apply_label":
        return this.applyLabel(user, actionLog.messageId, {
          label: this.readRequiredString(metadata?.label, "Retry label metadata is missing."),
          reason: retryReason
        });
      default:
        throw new BadRequestException(`Retry is not supported for action ${actionLog.actionType}.`);
    }
  }

  private async executeActionWithRetryLogging(
    user: AuthenticatedUserContext,
    message: {
      id: string;
      userId: string;
      accountId: string;
      providerMessageId: string;
    },
    account: AccountRecord,
    actionType: string,
    reason: string,
    metadata: Prisma.InputJsonValue,
    providerAction: (
      resolvedProvider: ResolvedProviderAccount,
      providerMessageId: string
    ) => Promise<void>,
    persistSuccess: () => Promise<MessageDetail | null>
  ): Promise<MessageDetail> {
    const resolvedProvider = this.resolveProviderWithCredentials(account);

    try {
      await providerAction(resolvedProvider, message.providerMessageId);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unknown action failure.";
      await this.mailRepository.createActionLog({
        userId: message.userId,
        messageId: message.id,
        actionType,
        triggerType: AgentTriggerType.manual,
        reason: `${reason} Retryable failure: ${messageText}`,
        result: AgentResult.failure,
        metadata
      });
      throw error;
    }

    const updated = await persistSuccess();

    if (!updated) {
      throw new NotFoundException(`Message ${message.id} was not found.`);
    }

    return updated;
  }

  private resolveProviderWithCredentials(
    account: AccountRecord
  ): ResolvedProviderAccount {
    const resolvedProvider = this.providerRegistryService.resolveAccount(
      toSharedAccount(account)
    );

    switch (resolvedProvider.providerKind) {
      case "gmail":
        return {
          ...resolvedProvider,
          credentials: {
            accessToken: account.accessTokenEncrypted
              ? this.encryptionService.decrypt(account.accessTokenEncrypted)
              : undefined,
            refreshToken: account.refreshTokenEncrypted
              ? this.encryptionService.decrypt(account.refreshTokenEncrypted)
              : undefined
          }
        };
      case "imap":
        return {
          ...resolvedProvider,
          credentials: {
            password: account.passwordEncrypted
              ? this.encryptionService.decrypt(account.passwordEncrypted)
              : undefined
          }
        };
      default:
        throw new BadRequestException(`Unsupported provider ${resolvedProvider.providerKind}.`);
    }
  }

  private asRecord(value: Prisma.JsonValue | null): Record<string, unknown> | undefined {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private readBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
  }

  private readRequiredString(value: unknown, message: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException(message);
    }

    return value;
  }

  private async sendViaAccount(
    account: AccountRecord,
    payload: MailComposerPayload,
    mode: "compose" | "reply" | "forward"
  ): Promise<MailComposeResult> {
    const sharedAccount = toSharedAccount(account);
    const resolvedProvider = this.resolveProviderWithCredentials(account);

    if (resolvedProvider.providerKind === MailProviderKind.GMAIL) {
      await resolvedProvider.provider.sendMessage(resolvedProvider, payload);

      return {
        accountId: sharedAccount.id,
        provider: sharedAccount.provider,
        mode,
        status: "sent",
        detail: "Gmail API send request completed."
      };
    }

    await this.smtpSender.sendMessage(
      {
        providerKind: MailProviderKind.SMTP,
        account: sharedAccount,
        config: resolvedProvider.config,
        credentials:
          "credentials" in resolvedProvider ? resolvedProvider.credentials : undefined
      },
      payload
    );

    return {
      accountId: sharedAccount.id,
      provider: sharedAccount.provider,
      mode,
      status: "sent",
      detail: "SMTP send request completed successfully."
    };
  }
}
