export enum MailProviderKind {
  GMAIL = "gmail",
  IMAP = "imap",
  SMTP = "smtp",
  OUTLOOK = "outlook"
}

export type AuthType = "oauth" | "password";
export type SyncStatus = "idle" | "running" | "error";
export type StorageMode = "provider_reference" | "mirror";
export type SyncMode = "initial" | "incremental" | "resync";
export type SyncTrigger = "manual" | "scheduled" | "oauth_callback" | "reconnect";

export interface GmailOAuthConfig {
  scope?: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface GmailProfileConfig {
  id?: string;
  email?: string;
}

export interface GmailProviderConfig {
  gmailProfile?: GmailProfileConfig;
  oauth?: GmailOAuthConfig;
}

export interface ImapConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
}

export interface SmtpConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
}

export interface ImapProviderConfig {
  imap: ImapConnectionConfig;
  smtp?: SmtpConnectionConfig;
}

export type AccountProviderConfig = GmailProviderConfig | ImapProviderConfig;

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  provider: MailProviderKind;
  email: string;
  displayName: string;
  authType: AuthType;
  providerConfig?: AccountProviderConfig;
  syncCursor?: SyncCursor;
  syncEnabled: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncCursor {
  gmailHistoryId?: string;
  imapUidValidity?: string;
  imapLastUid?: number;
}

export interface SyncJobInput {
  accountId: string;
  mode: SyncMode;
  trigger: SyncTrigger;
  reason?: string;
  cursor?: SyncCursor;
}

export interface SyncJobRecord extends SyncJobInput {
  jobId: string;
  userId: string;
  provider: MailProviderKind;
  queuedAt: string;
}

export interface ProviderSyncResult {
  messages: ProviderMessageSource[];
  nextCursor?: SyncCursor;
}

export interface MailParticipant {
  name?: string;
  email: string;
}

export interface RawMailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  providerAttachmentId: string;
}

export interface GmailMessageSource {
  provider: MailProviderKind.GMAIL;
  providerMessageId: string;
  providerThreadId?: string;
  historyId?: string;
  subject: string;
  snippet: string;
  from: MailParticipant;
  to: MailParticipant[];
  cc?: MailParticipant[];
  bodyText?: string;
  bodyHtml?: string;
  labels?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  receivedAt: string;
  attachments?: RawMailAttachment[];
}

export interface ImapMessageSource {
  provider: MailProviderKind.IMAP;
  providerMessageId: string;
  providerThreadId?: string;
  uidValidity?: string;
  subject: string;
  snippet: string;
  from: MailParticipant;
  to: MailParticipant[];
  cc?: MailParticipant[];
  bodyText?: string;
  bodyHtml?: string;
  labels?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  receivedAt: string;
  attachments?: RawMailAttachment[];
}

export type ProviderMessageSource = GmailMessageSource | ImapMessageSource;

export interface MessageSummary {
  id: string;
  userId: string;
  accountId: string;
  provider: MailProviderKind;
  providerMessageId: string;
  providerThreadId?: string;
  threadId?: string;
  fromName?: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
}

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  providerAttachmentId: string;
  storageMode: StorageMode;
}

export interface MessageDetail extends MessageSummary {
  to: string[];
  cc: string[];
  bodyText: string;
  bodyHtml: string;
  attachments: Attachment[];
}

export interface NormalizedMailRecord {
  thread: Thread;
  message: MessageDetail;
}

export interface MailComposerPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  from?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}

export interface ReplyPayload {
  bodyText: string;
  bodyHtml?: string;
  replyAll?: boolean;
}

export interface Thread {
  id: string;
  userId: string;
  subjectNormalized: string;
  participants: string[];
  lastMessageAt: string;
  messageCount: number;
  linkedNotionPageIds: string[];
}

export interface AgentAnalysis {
  id: string;
  messageId: string;
  summary: string;
  category: string;
  priority: "low" | "medium" | "high";
  requiresReply: boolean;
  requiresAction: boolean;
  dueDate?: string;
  confidence: number;
  createdAt: string;
}

export interface AgentActionLog {
  id: string;
  userId: string;
  messageId: string;
  actionType: string;
  triggerType: "manual" | "automatic";
  reason: string;
  result: "success" | "failure";
  notionPageId?: string;
  createdAt: string;
}
