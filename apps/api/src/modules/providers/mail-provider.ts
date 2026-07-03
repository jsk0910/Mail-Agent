import {
  Account,
  GmailProviderConfig,
  ImapProviderConfig,
  MailProviderKind,
  MailComposerPayload,
  ProviderSyncResult,
  ProviderMessageSource,
  ReplyPayload,
  SyncCursor
} from "@mail-agent/shared";

export interface GmailProviderContext {
  providerKind: MailProviderKind.GMAIL;
  account: Account;
  config: GmailProviderConfig;
  credentials?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface ImapProviderContext {
  providerKind: MailProviderKind.IMAP;
  account: Account;
  config: ImapProviderConfig;
  credentials?: {
    password?: string;
  };
}

export interface SmtpProviderContext {
  providerKind: MailProviderKind.SMTP;
  account: Account;
  config: ImapProviderConfig;
}

export type ProviderOperationContext = GmailProviderContext | ImapProviderContext;

export interface MailProvider<TContext extends ProviderOperationContext = ProviderOperationContext> {
  readonly provider: Account["provider"];
  listMessages(context: TContext, cursor?: SyncCursor): Promise<ProviderSyncResult>;
  getMessage(context: TContext, providerMessageId: string): Promise<ProviderMessageSource>;
  sendMessage(context: TContext, payload: MailComposerPayload): Promise<void>;
  replyMessage(
    context: TContext,
    providerMessageId: string,
    payload: ReplyPayload
  ): Promise<void>;
  archiveMessage(context: TContext, providerMessageId: string): Promise<void>;
  deleteMessage(context: TContext, providerMessageId: string): Promise<void>;
  markRead(context: TContext, providerMessageId: string): Promise<void>;
  markUnread(context: TContext, providerMessageId: string): Promise<void>;
  applyLabel(context: TContext, providerMessageId: string, label: string): Promise<void>;
}
