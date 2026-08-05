import type { Account, MessageDetail, MessageSummary } from "@mail-agent/shared";

const demoAccounts: Account[] = [
  {
    id: "account_gmail_demo",
    userId: "demo-user",
    provider: "gmail" as Account["provider"],
    email: "founder@mail-agent.dev",
    displayName: "Founder Gmail",
    authType: "oauth",
    syncEnabled: true,
    syncStatus: "idle",
    lastSyncedAt: "2026-07-04T09:12:00+09:00",
    createdAt: "2026-07-01T09:00:00+09:00",
    updatedAt: "2026-07-04T09:12:00+09:00"
  },
  {
    id: "account_imap_demo",
    userId: "demo-user",
    provider: "imap" as Account["provider"],
    email: "ops@mail-agent.dev",
    displayName: "Ops IMAP",
    authType: "password",
    syncEnabled: true,
    syncStatus: "running",
    lastSyncedAt: "2026-07-04T08:58:00+09:00",
    createdAt: "2026-07-01T09:00:00+09:00",
    updatedAt: "2026-07-04T09:10:00+09:00"
  }
];

const demoDetails: MessageDetail[] = [
  {
    id: "demo-msg-1",
    userId: "demo-user",
    accountId: "account_gmail_demo",
    provider: "gmail" as MessageDetail["provider"],
    providerMessageId: "gmail-demo-1",
    providerThreadId: "thread-demo-1",
    threadId: "thread-demo-1",
    fromName: "Alex Morgan",
    fromEmail: "alex@northstar.vc",
    subject: "Follow-up on Mail Agent pilot",
    snippet: "We are interested in piloting this with two support inboxes next week.",
    receivedAt: "2026-07-04T09:05:00+09:00",
    isRead: false,
    isStarred: true,
    hasAttachments: true,
    labels: ["INBOX", "IMPORTANT", "CATEGORY_UPDATES"],
    to: ["founder@mail-agent.dev"],
    cc: ["ops@mail-agent.dev"],
    bodyText:
      "Hi team,\n\nWe are interested in piloting Mail Agent with two support inboxes next week.\nCan you send over a short setup checklist and the expected limitations for the MVP?\n\nBest,\nAlex",
    bodyHtml:
      "<p>Hi team,</p><p>We are interested in piloting <strong>Mail Agent</strong> with two support inboxes next week.</p><p>Can you send over a short setup checklist and the expected limitations for the MVP?</p><p>Best,<br/>Alex</p>",
    attachments: [
      {
        id: "att-demo-1",
        messageId: "demo-msg-1",
        filename: "pilot-scope.pdf",
        mimeType: "application/pdf",
        size: 242_180,
        providerAttachmentId: "pilot-scope-pdf",
        storageMode: "provider_reference"
      },
      {
        id: "att-demo-1b",
        messageId: "demo-msg-1",
        filename: "pilot-ui-preview.png",
        mimeType: "image/png",
        size: 918_204,
        providerAttachmentId: "pilot-ui-preview-png",
        storageMode: "provider_reference"
      }
    ]
  },
  {
    id: "demo-msg-2",
    userId: "demo-user",
    accountId: "account_imap_demo",
    provider: "imap" as MessageDetail["provider"],
    providerMessageId: "imap-demo-1",
    providerThreadId: "thread-demo-2",
    threadId: "thread-demo-2",
    fromName: "Buildkite",
    fromEmail: "builds@buildkite.com",
    subject: "CI failure in web deploy pipeline",
    snippet: "The latest build failed during the static page generation step.",
    receivedAt: "2026-07-04T08:44:00+09:00",
    isRead: false,
    isStarred: false,
    hasAttachments: true,
    labels: ["INBOX", "CATEGORY_FORUMS"],
    to: ["ops@mail-agent.dev"],
    cc: [],
    bodyText:
      "Build #184 failed in the web deploy pipeline during static page generation.\nPlease review the server render logs before the next release.",
    bodyHtml: "",
    attachments: [
      {
        id: "att-demo-2",
        messageId: "demo-msg-2",
        filename: "build-log-snippet.ts",
        mimeType: "text/typescript",
        size: 8_324,
        providerAttachmentId: "build-log-snippet-ts",
        storageMode: "mirror"
      },
      {
        id: "att-demo-2b",
        messageId: "demo-msg-2",
        filename: "render-debug.mp4",
        mimeType: "video/mp4",
        size: 4_382_190,
        providerAttachmentId: "render-debug-mp4",
        storageMode: "provider_reference"
      }
    ]
  },
  {
    id: "demo-msg-3",
    userId: "demo-user",
    accountId: "account_gmail_demo",
    provider: "gmail" as MessageDetail["provider"],
    providerMessageId: "gmail-demo-2",
    providerThreadId: "thread-demo-3",
    threadId: "thread-demo-3",
    fromName: "Notion",
    fromEmail: "team@makenotion.com",
    subject: "Workspace invite accepted",
    snippet: "Jordan accepted the shared workspace invitation for the launch plan.",
    receivedAt: "2026-07-03T17:20:00+09:00",
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    labels: ["INBOX", "CATEGORY_SOCIAL", "notion-linked"],
    to: ["founder@mail-agent.dev"],
    cc: [],
    bodyText:
      "Jordan accepted the shared workspace invitation for the launch plan. The launch board is ready for handoff.",
    bodyHtml:
      "<p>Jordan accepted the shared workspace invitation for the launch plan.</p><p>The launch board is ready for handoff.</p>",
    attachments: []
  },
  {
    id: "demo-msg-4",
    userId: "demo-user",
    accountId: "account_imap_demo",
    provider: "imap" as MessageDetail["provider"],
    providerMessageId: "imap-demo-2",
    providerThreadId: "thread-demo-4",
    threadId: "thread-demo-4",
    fromName: "Finance",
    fromEmail: "billing@infrastructure.dev",
    subject: "June invoice available",
    snippet: "Your monthly infrastructure invoice is attached and due on July 10.",
    receivedAt: "2026-07-02T14:12:00+09:00",
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    labels: ["INBOX", "finance"],
    to: ["ops@mail-agent.dev"],
    cc: [],
    bodyText:
      "Hello,\n\nYour June infrastructure invoice is attached. Payment is due on July 10.\n\nThanks.",
    bodyHtml: "",
    attachments: [
      {
        id: "att-demo-4",
        messageId: "demo-msg-4",
        filename: "invoice-june.pdf",
        mimeType: "application/pdf",
        size: 180_024,
        providerAttachmentId: "invoice-june-pdf",
        storageMode: "provider_reference"
      },
      {
        id: "att-demo-4b",
        messageId: "demo-msg-4",
        filename: "invoice-export.zip",
        mimeType: "application/zip",
        size: 1_280_024,
        providerAttachmentId: "invoice-export-zip",
        storageMode: "mirror"
      }
    ]
  }
];

function toSummary(detail: MessageDetail): MessageSummary {
  return {
    id: detail.id,
    userId: detail.userId,
    accountId: detail.accountId,
    provider: detail.provider,
    providerMessageId: detail.providerMessageId,
    providerThreadId: detail.providerThreadId,
    threadId: detail.threadId,
    fromName: detail.fromName,
    fromEmail: detail.fromEmail,
    subject: detail.subject,
    snippet: detail.snippet,
    receivedAt: detail.receivedAt,
    isRead: detail.isRead,
    isStarred: detail.isStarred,
    hasAttachments: detail.hasAttachments,
    labels: [...detail.labels]
  };
}

function cloneDetail(detail: MessageDetail): MessageDetail {
  return {
    ...detail,
    labels: [...detail.labels],
    to: [...detail.to],
    cc: [...detail.cc],
    attachments: detail.attachments.map((attachment) => ({ ...attachment }))
  };
}

export function createDemoInboxData() {
  const detailsById = Object.fromEntries(
    demoDetails.map((detail) => [detail.id, cloneDetail(detail)])
  ) as Record<string, MessageDetail>;

  return {
    accounts: demoAccounts.map((account) => ({ ...account })),
    detailsById,
    messages: demoDetails.map((detail) => toSummary(cloneDetail(detail)))
  };
}
