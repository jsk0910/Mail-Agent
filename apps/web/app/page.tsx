"use client";

import { FormEvent, useEffect, useState } from "react";
import { Account, MessageDetail, MessageSummary } from "@mail-agent/shared";
import { AppShell } from "./components/AppShell";
import { AppSidebar } from "./components/AppSidebar";
import {
  ComposerAttachmentItem,
  fileToBase64,
  revokeComposerAttachmentPreview,
  toComposerAttachmentItem
} from "./components/attachmentUtils";
import { CommandPalette, CommandPaletteItem } from "./components/CommandPalette";
import { DetailColumn } from "./components/DetailColumn";
import { InboxColumn } from "./components/InboxColumn";
import { SettingsSheet } from "./components/SettingsSheet";
import { createDemoInboxData } from "./demoData";

const normalizeApiBaseUrl = (url?: string) => {
  if (!url) return "http://localhost:4000/api";
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
const defaultUserEmail = process.env.NEXT_PUBLIC_DEFAULT_USER_EMAIL || "dev@mail-agent.local";
const defaultUserName =
  process.env.NEXT_PUBLIC_DEFAULT_USER_NAME || "Mail Agent Developer";

interface InboxResponse {
  items: MessageSummary[];
}

interface AccountsResponse {
  items: Account[];
}

interface DetailResponse {
  item: MessageDetail | null;
}

interface FailedActionLog {
  id: string;
  messageId: string;
  actionType: string;
  reason: string;
  createdAt: string;
}

interface FailedActionResponse {
  item: FailedActionLog | null;
}

type FetchState = "loading" | "ready" | "empty" | "error";
type DetailFetchState = "idle" | "loading" | "ready" | "error";
type StatusFilterKey = "unreadOnly" | "hideArchived" | "hasAttachmentsOnly";
type ComposerMode = "compose" | "reply" | "replyAll" | "forward";
type MailboxView = "personal" | "all" | "unread" | "starred" | "archive" | "trash";
type SmartView = "reply-needed" | "notion-linked" | "briefing";
type SidebarView = MailboxView | SmartView;
type DataMode = "api" | "demo";

interface InboxFilters {
  accountId: string;
  label: string;
  unreadOnly: boolean;
  hideArchived: boolean;
  hasAttachmentsOnly: boolean;
}

interface SendResult {
  accountId: string;
  provider: MessageSummary["provider"];
  mode: "compose" | "reply" | "forward";
  status: "sent" | "accepted_placeholder";
  detail: string;
}

interface SendResultResponse {
  item: SendResult;
}

interface ComposerDraft {
  accountId: string;
  bodyHtml: string;
  to: string;
  cc: string;
  subject: string;
  bodyText: string;
}

interface ComposerAppearance {
  fontFamily: "geist" | "mono" | "pretendard";
}

function getRequestHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-email": defaultUserEmail,
    "x-user-name": defaultUserName
  };
}

function formatReceivedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatReceivedAtLong(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeMessageHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|form)[\s\S]*?>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function isArchivedMessage(message: MessageSummary) {
  return !message.labels.includes("INBOX") || message.labels.includes("TRASH");
}

function prefixSubject(prefix: string, subject: string) {
  return subject.startsWith(prefix) ? subject : `${prefix}${subject}`;
}

function joinRecipients(values: string[]) {
  return values.join(", ");
}

function splitRecipients(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupeRecipients(values: string[]) {
  return [...new Set(values.map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

function buildQuotedBody(detail: MessageDetail) {
  const source = detail.bodyText || detail.snippet || "";
  const quoted = source
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");

  return [
    "",
    "",
    `On ${formatReceivedAtLong(detail.receivedAt)}, ${detail.fromName || detail.fromEmail} wrote:`,
    quoted
  ].join("\n");
}

function escapeComposerHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainTextToComposerHtml(value: string) {
  if (!value.trim()) {
    return "";
  }

  return value
    .split("\n")
    .map((line) => {
      if (!line.trim()) {
        return "<div><br></div>";
      }

      return `<div>${escapeComposerHtml(line)}</div>`;
    })
    .join("");
}

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
    labels: detail.labels
  };
}

function isTextInput(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function isSocialOrPromoOrUpdate(message: MessageSummary): boolean {
  const labels = message.labels;
  if (
    labels.includes("CATEGORY_SOCIAL") ||
    labels.includes("CATEGORY_PROMOTIONS") ||
    labels.includes("CATEGORY_UPDATES") ||
    labels.includes("CATEGORY_FORUMS")
  ) {
    return true;
  }

  const aiCategory = message.analysis?.category?.toLowerCase() || "";
  if (
    aiCategory.includes("소셜") ||
    aiCategory.includes("프로모션") ||
    aiCategory.includes("광고") ||
    aiCategory.includes("뉴스레터") ||
    aiCategory.includes("업데이트")
  ) {
    return true;
  }

  return false;
}

function isPersonalMessage(message: MessageSummary): boolean {
  return !isSocialOrPromoOrUpdate(message);
}

function needsReply(message: MessageSummary) {
  // Exclude social, promo, updates from requiring reply
  if (isSocialOrPromoOrUpdate(message)) {
    return false;
  }

  if (message.analysis?.requiresReply) {
    return true;
  }

  const haystack = [message.fromName, message.fromEmail, message.subject, message.snippet]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    message.isStarred ||
    !message.isRead ||
    /reply|respond|follow up|please send|let me know|can you/.test(haystack)
  );
}

function messageMatchesView(message: MessageSummary, view: SidebarView) {
  if (view === "personal") {
    return (
      message.labels.includes("INBOX") &&
      !message.labels.includes("TRASH") &&
      isPersonalMessage(message)
    );
  }

  if (view === "all") {
    return message.labels.includes("INBOX") && !message.labels.includes("TRASH");
  }

  if (view === "unread") {
    return !message.isRead && message.labels.includes("INBOX") && !message.labels.includes("TRASH");
  }

  if (view === "starred") {
    return message.isStarred;
  }

  if (view === "archive") {
    return !message.labels.includes("INBOX") && !message.labels.includes("TRASH");
  }

  if (view === "trash") {
    return message.labels.includes("TRASH");
  }

  if (view === "reply-needed") {
    return (
      message.labels.includes("INBOX") &&
      !message.labels.includes("TRASH") &&
      needsReply(message)
    );
  }

  if (view === "notion-linked") {
    return !message.labels.includes("TRASH") && message.labels.includes("notion-linked");
  }

  if (view === "briefing") {
    if (isSocialOrPromoOrUpdate(message)) {
      return false;
    }
    return (
      message.labels.includes("INBOX") &&
      !message.labels.includes("TRASH") &&
      (message.isStarred || !message.isRead || message.hasAttachments || message.analysis?.priority === "high")
    );
  }

  return message.labels.includes("INBOX") && !message.labels.includes("TRASH");
}

function getViewLabel(view: SidebarView) {
  if (view === "personal") {
    return "Personal";
  }

  if (view === "unread") {
    return "Unread";
  }

  if (view === "starred") {
    return "Starred";
  }

  if (view === "archive") {
    return "Archive";
  }

  if (view === "trash") {
    return "Trash";
  }

  if (view === "reply-needed") {
    return "Reply Needed";
  }

  if (view === "notion-linked") {
    return "Notion Linked";
  }

  if (view === "briefing") {
    return "Daily Briefing";
  }

  return "All Inbox";
}

function messageMatchesFilters(
  message: MessageSummary,
  filters: InboxFilters,
  searchQuery: string,
  view: SidebarView
) {
  if (!messageMatchesView(message, view)) {
    return false;
  }

  if (filters.accountId !== "all" && message.accountId !== filters.accountId) {
    return false;
  }

  if (filters.label !== "all" && !message.labels.includes(filters.label)) {
    return false;
  }

  if (filters.unreadOnly && message.isRead) {
    return false;
  }

  if (filters.hideArchived && view !== "archive" && view !== "trash" && isArchivedMessage(message)) {
    return false;
  }

  if (filters.hasAttachmentsOnly && !message.hasAttachments) {
    return false;
  }

  if (!searchQuery.trim()) {
    return true;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const haystack = [
    message.fromName,
    message.fromEmail,
    message.subject,
    message.snippet,
    ...message.labels
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getDefaultViewForMessage(message: MessageSummary): MailboxView {
  if (message.labels.includes("TRASH")) {
    return "trash";
  }

  if (!message.labels.includes("INBOX")) {
    return "archive";
  }

  if (isPersonalMessage(message)) {
    return "personal";
  }

  return "all";
}

export default function HomePage() {
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>("api");
  const [demoDetailsById, setDemoDetailsById] = useState<Record<string, MessageDetail>>({});
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<MessageDetail | null>(null);
  const [detailFetchState, setDetailFetchState] = useState<DetailFetchState>("idle");
  const [detailErrorMessage, setDetailErrorMessage] = useState("");
  const [latestFailedAction, setLatestFailedAction] = useState<FailedActionLog | null>(null);
  const [detailActionState, setDetailActionState] = useState("");
  const [detailActionError, setDetailActionError] = useState("");
  const [detailActionSuccess, setDetailActionSuccess] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [mailboxView, setMailboxView] = useState<SidebarView>("personal");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>("compose");
  const [composerSourceMessageId, setComposerSourceMessageId] = useState<string | null>(null);
  const [composerDraft, setComposerDraft] = useState<ComposerDraft>({
    accountId: "",
    bodyHtml: "",
    to: "",
    cc: "",
    subject: "",
    bodyText: ""
  });
  const [composerState, setComposerState] = useState<"idle" | "sending">("idle");
  const [composerError, setComposerError] = useState("");
  const [composerSuccess, setComposerSuccess] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachmentItem[]>([]);
  const [composerAppearance, setComposerAppearance] = useState<ComposerAppearance>({
    fontFamily: "pretendard"
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiEnabledByAccount, setAiEnabledByAccount] = useState<Record<string, boolean>>({});
  const [isAnalyzingWithAi, setIsAnalyzingWithAi] = useState(false);
  const [reloadSequence, setReloadSequence] = useState(0);
  const [filters, setFilters] = useState<InboxFilters>({
    accountId: "all",
    label: "all",
    unreadOnly: false,
    hideArchived: true,
    hasAttachmentsOnly: false
  });

  useEffect(() => {
    let ignore = false;

    async function loadInbox() {
      setFetchState("loading");
      setErrorMessage("");

      if (dataMode === "demo") {
        const demoData = createDemoInboxData();
        if (ignore) return;
        setDemoDetailsById(demoData.detailsById);
        setMessages(demoData.messages);
        setAccounts(demoData.accounts);
        setSelectedMessageId((current) =>
          current && demoData.messages.some((message) => message.id === current)
            ? current
            : demoData.messages[0]?.id || null
        );
        setFetchState(demoData.messages.length > 0 ? "ready" : "empty");
        return;
      }

      try {
        const headers = getRequestHeaders();
        const [inboxResponse, accountsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/mail/inbox`, {
            headers,
            cache: "no-store"
          }),
          fetch(`${apiBaseUrl}/accounts`, {
            headers,
            cache: "no-store"
          })
        ]);

        if (!inboxResponse.ok) {
          throw new Error(`Inbox request failed with status ${inboxResponse.status}.`);
        }

        if (!accountsResponse.ok) {
          throw new Error(`Accounts request failed with status ${accountsResponse.status}.`);
        }

        const inboxData = (await inboxResponse.json()) as InboxResponse;
        const accountsData = (await accountsResponse.json()) as AccountsResponse;

        if (ignore) {
          return;
        }

        const nextMessages = inboxData.items ?? [];
        const nextAccounts = accountsData.items ?? [];

        setDemoDetailsById({});
        setMessages(nextMessages);
        setAccounts(nextAccounts);
        setSelectedMessageId((current) =>
          current && nextMessages.some((message) => message.id === current) ? current : null
        );
        setFetchState(nextMessages.length > 0 ? "ready" : "empty");
      } catch (error) {
        if (ignore) {
          return;
        }

        setDemoDetailsById({});
        setMessages([]);
        setAccounts([]);
        setSelectedMessageId(null);
        setFetchState("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load the connected inbox."
        );
      }
    }

    void loadInbox();

    return () => {
      ignore = true;
    };
  }, [dataMode, reloadSequence]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success" && params.get("provider") === "gmail") {
      const newAccountId = params.get("accountId");
      setDetailActionSuccess("Google account connected successfully!");
      window.history.replaceState({}, "", window.location.pathname);
      setReloadSequence((seq) => seq + 1);
      if (newAccountId) {
        void handleTriggerSync(newAccountId);
      }
    }
  }, []);

  async function handleConnectGoogle() {
    try {
      const headers = getRequestHeaders();
      const isDesktop = Boolean(window.mailAgentDesktop);
      const returnUri = isDesktop ? "mailagent://oauth" : window.location.origin;
      const clientType = isDesktop ? "desktop" : "web";
      const res = await fetch(`${apiBaseUrl}/auth/google/start?clientType=${clientType}&returnUri=${encodeURIComponent(returnUri)}`, {
        headers
      });
      if (!res.ok) {
        throw new Error(`Failed to start Google OAuth (HTTP ${res.status}). Check server configuration.`);
      }
      const data = (await res.json()) as { authUrl?: string };
      if (data.authUrl) {
        if (window.mailAgentDesktop) {
          await window.mailAgentDesktop.openOAuth(data.authUrl);
        } else {
          window.location.href = data.authUrl;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start Google OAuth";
      setDetailActionError(message);
    }
  }

  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  async function handleTriggerSync(accountId: string) {
    try {
      setSyncingAccountId(accountId);
      setDetailActionSuccess("Syncing emails from Gmail... Please wait a moment.");
      const headers = getRequestHeaders();
      const res = await fetch(`${apiBaseUrl}/sync/jobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          accountId,
          mode: "initial",
          trigger: "manual",
          reason: "Manual sync triggered from UI"
        })
      });
      if (res.ok) {
        setDetailActionSuccess("Sync complete! Updated inbox.");
        setReloadSequence((seq) => seq + 1);
      } else {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setDetailActionError(err?.message || `Sync failed (status ${res.status})`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to trigger sync";
      setDetailActionError(message);
    } finally {
      setSyncingAccountId(null);
    }
  }

  useEffect(() => {
    if (!detailActionSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDetailActionSuccess("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [detailActionSuccess]);

  useEffect(() => {
    setAiEnabledByAccount((current) =>
      Object.fromEntries(
        accounts.map((account) => [account.id, current[account.id] ?? true])
      )
    );
  }, [accounts]);

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setCommandQuery("");
      setActiveCommandIndex(0);
      return;
    }

    setActiveCommandIndex(0);
  }, [commandQuery, isCommandPaletteOpen]);

  useEffect(() => {
    if (
      !selectedMessageId ||
      detailFetchState !== "ready" ||
      isComposerOpen ||
      isCommandPaletteOpen ||
      isSettingsOpen
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      const replyButton = document.getElementById("detail-reply-button");
      if (replyButton instanceof HTMLButtonElement) {
        replyButton.focus();
      }
    });
  }, [
    detailFetchState,
    isCommandPaletteOpen,
    isComposerOpen,
    isSettingsOpen,
    selectedMessageId
  ]);

  const visibleMessages = messages.filter((message) =>
    messageMatchesFilters(message, filters, searchQuery, mailboxView)
  );

  useEffect(() => {
    if (visibleMessages.length === 0) {
      if (selectedMessageId !== null) {
        setSelectedMessageId(null);
      }
      return;
    }

    const selectedStillExists = visibleMessages.some((message) => message.id === selectedMessageId);
    if (!selectedStillExists && selectedMessageId !== null) {
      setSelectedMessageId(null);
    }
  }, [selectedMessageId, visibleMessages]);

  useEffect(() => {
    let ignore = false;

    async function loadDetail(messageId: string) {
      setDetailFetchState("loading");
      setDetailErrorMessage("");
      setDetailActionError("");
      setDetailActionSuccess("");
      setLatestFailedAction(null);
      setLabelInput("");

      if (dataMode === "demo") {
        const demoDetail = demoDetailsById[messageId];

        if (!demoDetail) {
          setSelectedDetail(null);
          setDetailFetchState("error");
          setDetailErrorMessage("The selected demo message could not be found.");
          return;
        }

        setSelectedDetail(demoDetail);
        setDetailFetchState("ready");
        return;
      }

      try {
        const headers = getRequestHeaders();
        const [detailResponse, failedActionResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/mail/messages/${messageId}`, {
            headers,
            cache: "no-store"
          }),
          fetch(`${apiBaseUrl}/mail/messages/${messageId}/action-logs/latest-failure`, {
            headers,
            cache: "no-store"
          })
        ]);

        if (!detailResponse.ok) {
          throw new Error(`Message detail request failed with status ${detailResponse.status}.`);
        }

        if (!failedActionResponse.ok) {
          throw new Error(
            `Latest failed action request failed with status ${failedActionResponse.status}.`
          );
        }

        const detailData = (await detailResponse.json()) as DetailResponse;
        const failedActionData = (await failedActionResponse.json()) as FailedActionResponse;

        if (ignore) {
          return;
        }

        if (!detailData.item) {
          setSelectedDetail(null);
          setLatestFailedAction(null);
          setDetailFetchState("error");
          setDetailErrorMessage("The selected message could not be found.");
          return;
        }

        setSelectedDetail(detailData.item);
        setLatestFailedAction(failedActionData.item);
        setDetailFetchState("ready");

        // Automatically mark as read if message is currently unread
        if (!detailData.item.isRead) {
          const targetId = messageId;
          setSelectedDetail((current) =>
            current && current.id === targetId
              ? {
                  ...current,
                  isRead: true,
                  labels: current.labels.filter((l) => l !== "UNREAD")
                }
              : current
          );
          setMessages((current) =>
            current.map((msg) =>
              msg.id === targetId
                ? {
                    ...msg,
                    isRead: true,
                    labels: msg.labels.filter((l) => l !== "UNREAD")
                  }
                : msg
            )
          );

          void fetch(`${apiBaseUrl}/mail/messages/${targetId}/read-state`, {
            method: "PATCH",
            headers: getRequestHeaders(),
            body: JSON.stringify({
              isRead: true,
              reason: "User opened message to read."
            })
          }).catch((err) => {
            console.warn(`Failed to auto mark message ${targetId} as read:`, err);
          });
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        setSelectedDetail(null);
        setLatestFailedAction(null);
        setDetailFetchState("error");
        setDetailErrorMessage(
          error instanceof Error ? error.message : "An unknown detail loading error occurred."
        );
      }
    }

    if (!selectedMessageId) {
      setSelectedDetail(null);
      setLatestFailedAction(null);
      setDetailFetchState("idle");
      setDetailErrorMessage("");
      return;
    }

    void loadDetail(selectedMessageId);

    return () => {
      ignore = true;
    };
  }, [dataMode, demoDetailsById, selectedMessageId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && isComposerOpen) {
        const form = document.getElementById("composer-form");
        if (form instanceof HTMLFormElement) {
          form.requestSubmit();
          event.preventDefault();
        }
        return;
      }

      if (isTextInput(event.target)) {
        if (event.key === "Escape" && isCommandPaletteOpen) {
          event.preventDefault();
          setIsCommandPaletteOpen(false);
          return;
        }

        if (event.key === "Escape" && isSettingsOpen) {
          event.preventDefault();
          setIsSettingsOpen(false);
          return;
        }

        if (event.key === "Escape" && isComposerOpen) {
          event.preventDefault();
          closeComposer();
        }
        return;
      }

      if (event.key === "Escape") {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isComposerOpen) {
          closeComposer();
        } else {
          setSelectedMessageId(null);
        }
        return;
      }

      if (isCommandPaletteOpen || isSettingsOpen) {
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key.toLowerCase() === "j" ||
        event.key.toLowerCase() === "k"
      ) {
        if (visibleMessages.length === 0) {
          return;
        }

        event.preventDefault();
        const currentIndex = visibleMessages.findIndex((message) => message.id === selectedMessageId);
        const offset =
          event.key === "ArrowDown" || event.key.toLowerCase() === "j" ? 1 : -1;
        const fallbackIndex = currentIndex < 0 ? 0 : currentIndex;
        const nextIndex = Math.min(
          visibleMessages.length - 1,
          Math.max(0, fallbackIndex + offset)
        );
        setSelectedMessageId(visibleMessages[nextIndex]?.id ?? null);
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        openComposer("compose");
        return;
      }

      if (!selectedDetail) {
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        openComposer("reply");
        return;
      }

      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        void archiveSelectedMessage();
        return;
      }

      if (event.key.toLowerCase() === "u") {
        event.preventDefault();
        void toggleReadState();
        return;
      }

      if (event.key === "#") {
        event.preventDefault();
        void deleteSelectedMessage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isCommandPaletteOpen,
    isComposerOpen,
    isSettingsOpen,
    selectedDetail,
    selectedMessageId,
    visibleMessages
  ]);

  const selectedSummary =
    messages.find((message) => message.id === selectedMessageId) ?? null;
  const selectedAccount = selectedDetail
    ? accounts.find((account) => account.id === selectedDetail.accountId) ?? null
    : selectedSummary
      ? accounts.find((account) => account.id === selectedSummary.accountId) ?? null
      : null;
  const canApplyLabel = selectedDetail?.provider === "gmail";
  const availableLabels = Array.from(
    new Set(messages.flatMap((message) => message.labels).filter((label) => label.trim().length > 0))
  ).sort((left, right) => left.localeCompare(right));
  const hasActiveFilters =
    filters.accountId !== "all" ||
    filters.label !== "all" ||
    filters.unreadOnly ||
    filters.hideArchived !== true ||
    filters.hasAttachmentsOnly;

  const mailboxItems: Array<{ count: number; key: MailboxView; label: string }> = [
    {
      key: "personal",
      label: "Personal",
      count: messages.filter((item) => messageMatchesView(item, "personal")).length
    },
    { key: "all", label: "All Inbox", count: messages.filter((item) => messageMatchesView(item, "all")).length },
    {
      key: "unread",
      label: "Unread",
      count: messages.filter((item) => messageMatchesView(item, "unread")).length
    },
    {
      key: "starred",
      label: "Starred",
      count: messages.filter((item) => messageMatchesView(item, "starred")).length
    },
    {
      key: "archive",
      label: "Archive",
      count: messages.filter((item) => messageMatchesView(item, "archive")).length
    },
    {
      key: "trash",
      label: "Trash",
      count: messages.filter((item) => messageMatchesView(item, "trash")).length
    }
  ];
  const smartViewItems: Array<{ count: number; key: SmartView; label: string }> = [
    {
      key: "reply-needed",
      label: "Reply needed",
      count: messages.filter((item) => messageMatchesView(item, "reply-needed")).length
    },
    {
      key: "notion-linked",
      label: "Notion linked",
      count: messages.filter((item) => messageMatchesView(item, "notion-linked")).length
    },
    {
      key: "briefing",
      label: "Daily briefing",
      count: messages.filter((item) => messageMatchesView(item, "briefing")).length
    }
  ];
  const commandNavigationItems: CommandPaletteItem[] = [
    ...mailboxItems.map((item) => ({
      category: "Navigation",
      id: `view:${item.key}`,
      subtitle: `${item.count} messages in ${item.label.toLowerCase()}`,
      title: `Go to ${item.label}`
    })),
    ...smartViewItems.map((item) => ({
      category: "Navigation",
      id: `view:${item.key}`,
      subtitle: `${item.count} messages in this smart view`,
      title: `Go to ${item.label}`
    })),
    ...accounts.map((account) => ({
      category: "Accounts",
      id: `account:${account.id}`,
      subtitle: `${account.email} · ${formatAccountSyncStatus(account)}`,
      title: `Switch to ${account.displayName}`
    }))
  ];
  const commandActionItems: CommandPaletteItem[] = [
    {
      category: "Compose",
      id: "action:compose",
      subtitle: "Start a new outbound message",
      title: "Compose new"
    },
    {
      category: "Settings",
      id: "action:settings",
      subtitle: "Open account, label, and AI preferences",
      title: "Open settings"
    },
    {
      category: "Settings",
      id: "action:add-account",
      subtitle: "Open the settings sheet to connect another inbox",
      title: "Add account"
    },
    {
      category: "Settings",
      id: "action:manage-labels",
      subtitle: "Review labels and mailbox organization",
      title: "Manage labels"
    },
    ...(selectedDetail
      ? [
          {
            category: "Message actions",
            id: "action:reply",
            subtitle: `Reply to ${selectedDetail.fromName || selectedDetail.fromEmail}`,
            title: "Reply to current thread"
          },
          {
            category: "Message actions",
            id: "action:archive",
            subtitle: "Archive the selected message",
            title: "Archive current thread"
          },
          {
            category: "Message actions",
            id: "action:read-toggle",
            subtitle: selectedDetail.isRead ? "Mark the thread as unread" : "Mark the thread as read",
            title: selectedDetail.isRead ? "Mark unread" : "Mark read"
          },
          {
            category: "Message actions",
            id: "action:delete",
            subtitle: "Move the selected thread to trash",
            title: "Delete current thread"
          }
        ]
      : [])
  ];
  const commandMessageItems: CommandPaletteItem[] = (commandQuery.trim() ? messages : messages.slice(0, 6))
    .filter((message) => {
      if (!commandQuery.trim()) {
        return true;
      }

      const haystack = [
        message.fromName,
        message.fromEmail,
        message.subject,
        message.snippet,
        ...message.labels
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(commandQuery.trim().toLowerCase());
    })
    .slice(0, 8)
    .map((message) => ({
      category: "Messages",
      id: `message:${message.id}`,
      subtitle: `${message.fromName || message.fromEmail} · ${formatReceivedAt(message.receivedAt)}`,
      title: message.subject
    }));
  const commandItems = [...commandActionItems, ...commandNavigationItems, ...commandMessageItems].filter(
    (item) =>
      !commandQuery.trim() ||
      [item.title, item.subtitle, item.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(commandQuery.trim().toLowerCase())
  );
  const accountUnreadCounts = Object.fromEntries(
    accounts.map((account) => [
      account.id,
      messages.filter(
        (message) =>
          message.accountId === account.id &&
          !message.isRead &&
          message.labels.includes("INBOX") &&
          !message.labels.includes("TRASH")
      ).length
    ])
  ) as Record<string, number>;

  function getAccountBadge(message: MessageSummary) {
    const account = accounts.find((item) => item.id === message.accountId);

    if (account?.displayName) {
      return account.displayName;
    }

    if (message.provider === "gmail") {
      return "Gmail";
    }

    if (message.provider === "imap") {
      return "IMAP";
    }

    return message.provider;
  }

  function updateStatusFilter(key: StatusFilterKey) {
    setFilters((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  function resetFilters() {
    setFilters({
      accountId: "all",
      label: "all",
      unreadOnly: false,
      hideArchived: true,
      hasAttachmentsOnly: false
    });
  }

  function openSettingsSheet() {
    setIsCommandPaletteOpen(false);
    setIsSettingsOpen(true);
  }

  function revealMessageInList(message: MessageSummary) {
    const nextView = getDefaultViewForMessage(message);
    setMailboxView(nextView);
    setSearchQuery("");
    setFilters({
      accountId: "all",
      label: "all",
      unreadOnly: false,
      hideArchived: nextView !== "archive" && nextView !== "trash",
      hasAttachmentsOnly: false
    });
    setSelectedMessageId(message.id);
  }

  function runCommand(item: CommandPaletteItem) {
    setIsCommandPaletteOpen(false);

    if (item.id.startsWith("view:")) {
      const view = item.id.replace("view:", "") as SidebarView;
      setMailboxView(view);
      setFilters((current) => ({
        ...current,
        hideArchived: view !== "archive" && view !== "trash"
      }));
      return;
    }

    if (item.id.startsWith("account:")) {
      const accountId = item.id.replace("account:", "");
      setFilters((current) => ({
        ...current,
        accountId
      }));
      return;
    }

    if (item.id.startsWith("message:")) {
      const messageId = item.id.replace("message:", "");
      const message = messages.find((entry) => entry.id === messageId);
      if (message) {
        revealMessageInList(message);
      }
      return;
    }

    if (item.id === "action:compose") {
      openComposer("compose");
      return;
    }

    if (item.id === "action:settings" || item.id === "action:add-account" || item.id === "action:manage-labels") {
      openSettingsSheet();
      return;
    }

    if (item.id === "action:reply") {
      openComposer("reply");
      return;
    }

    if (item.id === "action:archive") {
      void archiveSelectedMessage();
      return;
    }

    if (item.id === "action:read-toggle") {
      void toggleReadState();
      return;
    }

    if (item.id === "action:delete") {
      void deleteSelectedMessage();
    }
  }

  function openComposer(mode: ComposerMode, options?: { initialBodyText?: string }) {
    const activeDropdownAccount =
      filters.accountId !== "all"
        ? accounts.find((account) => account.id === filters.accountId)
        : null;
    const fallbackAccountId =
      selectedAccount?.id || activeDropdownAccount?.id || accounts[0]?.id || "";
    const detail = selectedDetail;
    const currentUserEmail = fallbackAccountId
      ? accounts.find((account) => account.id === fallbackAccountId)?.email || defaultUserEmail
      : defaultUserEmail;

    let nextDraft: ComposerDraft = {
      accountId: fallbackAccountId,
      bodyHtml: "",
      to: "",
      cc: "",
      subject: "",
      bodyText: ""
    };

    if (detail) {
      if (mode === "reply") {
        const replyBody = options?.initialBodyText
          ? `${options.initialBodyText}\n\n${buildQuotedBody(detail)}`
          : buildQuotedBody(detail);

        nextDraft = {
          accountId: detail.accountId,
          bodyHtml: plainTextToComposerHtml(replyBody),
          to: detail.fromEmail,
          cc: "",
          subject: prefixSubject("Re: ", detail.subject),
          bodyText: replyBody
        };
      } else if (mode === "replyAll") {
        nextDraft = {
          accountId: detail.accountId,
          bodyHtml: plainTextToComposerHtml(buildQuotedBody(detail)),
          to: joinRecipients(
            dedupeRecipients([detail.fromEmail, ...detail.to].filter((value) => value !== currentUserEmail))
          ),
          cc: joinRecipients(
            dedupeRecipients(detail.cc.filter((value) => value !== currentUserEmail))
          ),
          subject: prefixSubject("Re: ", detail.subject),
          bodyText: buildQuotedBody(detail)
        };
      } else if (mode === "forward") {
        nextDraft = {
          accountId: detail.accountId,
          bodyHtml: plainTextToComposerHtml(buildQuotedBody(detail)),
          to: "",
          cc: "",
          subject: prefixSubject("Fwd: ", detail.subject),
          bodyText: buildQuotedBody(detail)
        };
      }
    }

    setComposerMode(mode);
    setComposerSourceMessageId(detail ? detail.id : null);
    setComposerDraft(nextDraft);
    composerAttachments.forEach(revokeComposerAttachmentPreview);
    setComposerAttachments([]);
    setComposerError("");
    setComposerSuccess("");
    setIsComposerOpen(true);
  }

  function closeComposer() {
    setIsComposerOpen(false);
    setComposerState("idle");
    composerAttachments.forEach(revokeComposerAttachmentPreview);
    setComposerAttachments([]);
    setComposerError("");
    setComposerSuccess("");
  }

  function attachFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const nextItems = Array.from(files).map((file) => toComposerAttachmentItem(file));
    setComposerAttachments((current) => {
      const seen = new Set(current.map((item) => item.id));
      return [...current, ...nextItems.filter((item) => !seen.has(item.id))];
    });
  }

  function removeComposerAttachment(id: string) {
    setComposerAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);
      if (target) {
        revokeComposerAttachmentPreview(target);
      }
      return current.filter((attachment) => attachment.id !== id);
    });
  }

  async function refreshLatestFailedAction(messageId: string) {
    if (dataMode === "demo") {
      setLatestFailedAction(null);
      return;
    }

    const response = await fetch(`${apiBaseUrl}/mail/messages/${messageId}/action-logs/latest-failure`, {
      headers: getRequestHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Latest failed action request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as FailedActionResponse;
    setLatestFailedAction(data.item);
  }

  function selectNeighborAfterMutation(updatedDetail: MessageDetail, actionKey: string) {
    if (!selectedMessageId) {
      return;
    }

    const currentIndex = visibleMessages.findIndex((message) => message.id === selectedMessageId);
    const updatedSummary = toSummary(updatedDetail);
    const updatedVisible = messageMatchesFilters(updatedSummary, filters, searchQuery, mailboxView);

    if (actionKey !== "archive-state" && actionKey !== "delete") {
      if (updatedVisible) {
        setSelectedMessageId(updatedDetail.id);
      }
      return;
    }

    if (updatedVisible) {
      setSelectedMessageId(updatedDetail.id);
      return;
    }

    const nextCandidate =
      visibleMessages[currentIndex + 1]?.id || visibleMessages[currentIndex - 1]?.id || null;
    setSelectedMessageId(nextCandidate);
  }

  function applyDemoDetailUpdate(
    actionKey: string,
    updater: (detail: MessageDetail) => MessageDetail,
    successMessage: string
  ) {
    if (!selectedDetail) {
      return;
    }

    setDetailActionState(actionKey);
    setDetailActionError("");
    setDetailActionSuccess("");

    const updatedDetail = updater(selectedDetail);

    setDemoDetailsById((current) => ({
      ...current,
      [updatedDetail.id]: updatedDetail
    }));
    setSelectedDetail(updatedDetail);
    setMessages((current) =>
      current.map((message) => (message.id === updatedDetail.id ? toSummary(updatedDetail) : message))
    );
    setLatestFailedAction(null);
    setDetailActionSuccess(successMessage);
    selectNeighborAfterMutation(updatedDetail, actionKey);
    setDetailActionState("");
  }

  async function handleMessageMutation(
    actionKey: string,
    request: () => Promise<Response>,
    successMessage: string
  ) {
    if (!selectedMessageId) {
      return;
    }

    setDetailActionState(actionKey);
    setDetailActionError("");
    setDetailActionSuccess("");

    try {
      const response = await request();

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || `Request failed with status ${response.status}.`);
      }

      const data = (await response.json()) as DetailResponse;
      if (!data.item) {
        throw new Error("Updated message detail was not returned.");
      }

      setSelectedDetail(data.item);
      setMessages((current) =>
        current.map((message) => (message.id === data.item?.id ? toSummary(data.item) : message))
      );
      setDetailActionSuccess(successMessage);
      setLatestFailedAction(null);
      selectNeighborAfterMutation(data.item, actionKey);
    } catch (error) {
      setDetailActionError(
        error instanceof Error ? error.message : "An unknown message action error occurred."
      );

      try {
        await refreshLatestFailedAction(selectedMessageId);
      } catch (refreshError) {
        setDetailActionError(
          refreshError instanceof Error
            ? refreshError.message
            : "The failed action state could not be refreshed."
        );
      }
    } finally {
      setDetailActionState("");
    }
  }

  async function handleApplyLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMessageId || !labelInput.trim()) {
      return;
    }

    if (dataMode === "demo") {
      applyDemoDetailUpdate(
        "label",
        (detail) => ({
          ...detail,
          labels: detail.labels.includes(labelInput.trim())
            ? detail.labels
            : [...detail.labels, labelInput.trim()]
        }),
        "The label was applied locally to the demo message."
      );
      setLabelInput("");
      return;
    }

    await handleMessageMutation(
      "label",
      () =>
        fetch(`${apiBaseUrl}/mail/messages/${selectedMessageId}/labels`, {
          method: "PATCH",
          headers: getRequestHeaders(),
          body: JSON.stringify({
            label: labelInput.trim(),
            reason: "User applied a label from the message detail overflow menu."
          })
        }),
      "The label was applied."
    );

    setLabelInput("");
  }

  async function handleComposerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const toRecipients = splitRecipients(composerDraft.to);
    if (toRecipients.length === 0) {
      setComposerError("Please specify at least one recipient.");
      return;
    }

    let bodyText = composerDraft.bodyText.trim();
    const bodyHtml = composerDraft.bodyHtml.trim();
    if (!bodyText && bodyHtml) {
      bodyText = bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }

    setComposerState("sending");
    setComposerError("");
    setComposerSuccess("");

    let outboundAttachments: Array<{
      filename: string;
      mimeType: string;
      contentBase64: string;
    }> = [];

    try {
      outboundAttachments = await Promise.all(
        composerAttachments
          .filter((item) => item.file)
          .map(async (item) => ({
            filename: item.name,
            mimeType: item.mimeType,
            contentBase64: await fileToBase64(item.file!)
          }))
      );
    } catch {
      setComposerState("idle");
      setComposerError("Failed to read attached file contents.");
      return;
    }

    const payload = {
      ...(composerMode === "compose" ? { accountId: composerDraft.accountId } : {}),
      to: toRecipients,
      cc: splitRecipients(composerDraft.cc),
      subject: composerDraft.subject.trim() || "(no subject)",
      bodyText: bodyText || "(no content)",
      bodyHtml: bodyHtml || undefined,
      attachments: outboundAttachments.length > 0 ? outboundAttachments : undefined
    };

    if (dataMode === "demo") {
      closeComposer();
      setDetailActionSuccess("데모 환경: 메일이 가상으로 전송되었습니다.");
      return;
    }

    try {
      const endpoint =
        composerMode === "compose"
          ? `${apiBaseUrl}/mail/compose`
          : composerMode === "forward"
            ? `${apiBaseUrl}/mail/messages/${composerSourceMessageId}/forward`
            : `${apiBaseUrl}/mail/messages/${composerSourceMessageId}/reply`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(failure?.message || `Send request failed with status ${response.status}.`);
      }

      const data = (await response.json()) as SendResultResponse;
      closeComposer();
      setDetailActionSuccess(
        data.item.status === "sent"
          ? "메일이 성공적으로 전송되었습니다."
          : "메일 전송이 접수되었습니다."
      );
      setReloadSequence((seq) => seq + 1);
    } catch (error) {
      setComposerState("idle");
      setComposerError(
        error instanceof Error ? error.message : "An unknown send error occurred."
      );
    }
  }

  async function handleDownloadAttachment(attachment: import("@mail-agent/shared").Attachment) {
    if (!selectedDetail) {
      return;
    }

    if (dataMode === "demo") {
      setDetailActionSuccess(`Demo mode: ${attachment.filename} download simulated.`);
      return;
    }

    try {
      const headers = getRequestHeaders();
      const response = await fetch(
        `${apiBaseUrl}/mail/messages/${selectedDetail.id}/attachments/${attachment.id}/download`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to download attachment (HTTP ${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDetailActionError(
        err instanceof Error ? err.message : "Failed to download attachment"
      );
    }
  }

  async function toggleReadState() {
    if (!selectedDetail) {
      return;
    }

    if (dataMode === "demo") {
      applyDemoDetailUpdate(
        "read-state",
        (detail) => ({
          ...detail,
          isRead: !detail.isRead
        }),
        selectedDetail.isRead ? "Marked as unread." : "Marked as read."
      );
      return;
    }

    await handleMessageMutation(
      "read-state",
      () =>
        fetch(`${apiBaseUrl}/mail/messages/${selectedDetail.id}/read-state`, {
          method: "PATCH",
          headers: getRequestHeaders(),
          body: JSON.stringify({
            isRead: !selectedDetail.isRead,
            reason: "User toggled read state from the detail toolbar."
          })
        }),
      selectedDetail.isRead ? "Marked as unread." : "Marked as read."
    );
  }

  async function archiveSelectedMessage() {
    if (!selectedDetail) {
      return;
    }

    if (dataMode === "demo") {
      applyDemoDetailUpdate(
        "archive-state",
        (detail) => ({
          ...detail,
          labels: detail.labels.includes("INBOX")
            ? detail.labels.filter((label) => label !== "INBOX")
            : ["INBOX", ...detail.labels.filter((label) => label !== "TRASH")]
        }),
        selectedDetail.labels.includes("INBOX") ? "Message archived." : "Archive state refreshed."
      );
      return;
    }

    await handleMessageMutation(
      "archive-state",
      () =>
        fetch(`${apiBaseUrl}/mail/messages/${selectedDetail.id}/archive-state`, {
          method: "PATCH",
          headers: getRequestHeaders(),
          body: JSON.stringify({
            isArchived: !selectedDetail.labels.includes("INBOX"),
            reason: "User changed archive state from the detail toolbar."
          })
        }),
      selectedDetail.labels.includes("INBOX") ? "Message archived." : "Archive state refreshed."
    );
  }

  async function deleteSelectedMessage() {
    if (!selectedDetail) {
      return;
    }

    if (dataMode === "demo") {
      applyDemoDetailUpdate(
        "delete",
        (detail) => ({
          ...detail,
          labels: ["TRASH", ...detail.labels.filter((label) => label !== "INBOX" && label !== "TRASH")]
        }),
        "Message moved to trash."
      );
      return;
    }

    await handleMessageMutation(
      "delete",
      () =>
        fetch(`${apiBaseUrl}/mail/messages/${selectedDetail.id}/delete`, {
          method: "PATCH",
          headers: getRequestHeaders(),
          body: JSON.stringify({
            reason: "User deleted the message from the detail toolbar."
          })
        }),
      "Message moved to trash."
    );
  }

  async function handleTriggerAnalysis() {
    if (!selectedDetail) {
      return;
    }

    if (dataMode === "demo") {
      setDetailActionSuccess("데모 모드: 로컬 AI 분석이 시뮬레이션되었습니다.");
      return;
    }

    setIsAnalyzingWithAi(true);
    try {
      if (window.mailAgentDesktop) {
        const output = await window.mailAgentDesktop.analyzeMessage({
          from: selectedDetail.fromName
            ? `${selectedDetail.fromName} <${selectedDetail.fromEmail}>`
            : selectedDetail.fromEmail,
          receivedAt: selectedDetail.receivedAt,
          subject: selectedDetail.subject,
          bodyText: selectedDetail.bodyText || selectedDetail.snippet
        });
        const localResponse = await fetch(
          `${apiBaseUrl}/agent/messages/${selectedDetail.id}/analysis/local`,
          {
            method: "POST",
            headers: getRequestHeaders(),
            body: JSON.stringify({
              output,
              model: "Qwen3-4B-Q4_K_M (local desktop)"
            })
          }
        );
        if (!localResponse.ok) {
          const failure = (await localResponse.json().catch(() => null)) as { message?: string } | null;
          throw new Error(failure?.message || `Local analysis save failed (${localResponse.status}).`);
        }
        const localData = (await localResponse.json()) as {
          item: import("@mail-agent/shared").AgentAnalysis;
        };
        setSelectedDetail((current) =>
          current ? { ...current, analysis: localData.item } : null
        );
        setDetailActionSuccess(
          localData.item.status === "invalid"
            ? "로컬 분석 결과의 품질이 낮습니다. 다시 분석해 주세요."
            : "이 메일은 사용자 컴퓨터에서 로컬로 분석되었습니다."
        );
        return;
      }

      const response = await fetch(`${apiBaseUrl}/agent/messages/${selectedDetail.id}/analyze`, {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(failure?.message || `AI analysis failed (status ${response.status}).`);
      }

      const data = (await response.json()) as { item: import("@mail-agent/shared").AgentAnalysis };
      setSelectedDetail((current) => (current ? { ...current, analysis: data.item } : null));
      setDetailActionSuccess(
        data.item.status === "invalid"
          ? "분석은 완료됐지만 결과 품질이 낮습니다. 다시 분석해 주세요."
          : "로컬 AI(Qwen) 분석이 완료되었습니다."
      );
    } catch (err) {
      setDetailActionError(
        err instanceof Error ? err.message : "AI 분석 중 오류가 발생했습니다."
      );
    } finally {
      setIsAnalyzingWithAi(false);
    }
  }

  function handleUseSuggestedReply(suggestedText: string) {
    openComposer("reply", { initialBodyText: suggestedText });
  }

  const detailHtml =
    selectedDetail?.bodyHtml && selectedDetail.bodyHtml.trim().length > 0
      ? sanitizeMessageHtml(selectedDetail.bodyHtml)
      : "";
  const analysisState =
    isAnalyzingWithAi
      ? "loading"
      : selectedDetail?.analysis?.status === "invalid"
        ? "invalid"
        : selectedDetail?.analysis?.status === "failed"
          ? "failed"
          : selectedDetail?.analysis?.source === "heuristic" ||
              (selectedDetail?.analysis && !selectedDetail.analysis.source)
            ? "basic"
            : selectedDetail?.analysis
              ? "ready"
              : detailFetchState === "loading"
                ? "loading"
                : detailFetchState === "error"
                  ? "failed"
                  : "pending";

  function formatAccountSyncStatus(account: Account) {
    if (account.syncStatus === "running") {
      return "Syncing now";
    }

    if (account.syncStatus === "error") {
      return "Needs attention";
    }

    if (account.lastSyncedAt) {
      return `Last sync ${formatReceivedAt(account.lastSyncedAt)}`;
    }

    return "Connected";
  }

  const shouldShowDetailPanel =
    Boolean(selectedMessageId) || (isComposerOpen && composerMode === "compose");

  return (
    <>
      <AppShell
        hasActiveDetail={shouldShowDetailPanel}
        onCloseDetail={() => {
          if (isComposerOpen && composerMode === "compose") {
            closeComposer();
            return;
          }

          setSelectedMessageId(null);
        }}
        sidebar={
          <AppSidebar
            accounts={accounts}
            activeAccountId={filters.accountId}
            activeView={mailboxView}
            accountUnreadCounts={accountUnreadCounts}
            formatSyncStatus={formatAccountSyncStatus}
            items={mailboxItems}
            onCommandOpen={() => setIsCommandPaletteOpen(true)}
            smartViewItems={smartViewItems}
            onAccountSelect={(accountId) =>
              setFilters((current) => ({
                ...current,
                accountId
              }))
            }
            onReconnectAccount={(accountId) => {
              setFilters((current) => ({
                ...current,
                accountId
              }));
              setReloadSequence((current) => current + 1);
            }}
            onSettingsOpen={() => {
              openSettingsSheet();
            }}
            onViewSelect={(view) => {
              setMailboxView(view as SidebarView);
              if (view === "archive" || view === "trash") {
                setFilters((current) => ({ ...current, hideArchived: false }));
                return;
              }

              setFilters((current) => ({
                ...current,
                hideArchived: true
              }));
            }}
          />
        }
        list={
          <InboxColumn
            accounts={accounts}
            activeViewLabel={getViewLabel(mailboxView)}
            availableLabels={availableLabels}
            errorMessage={errorMessage}
            fetchState={fetchState}
            filters={filters}
            formatReceivedAt={formatReceivedAt}
            getAccountBadge={getAccountBadge}
            hasActiveFilters={hasActiveFilters}
            messagesCount={visibleMessages.length}
            onCompose={() => openComposer("compose")}
            onFilterReset={resetFilters}
            onRetryLoad={() => setReloadSequence((current) => current + 1)}
            onSearchChange={setSearchQuery}
            onSelectMessage={setSelectedMessageId}
            onSetAccountFilter={(accountId) =>
              setFilters((current) => ({
                ...current,
                accountId
              }))
            }
            onSetLabelFilter={(label) =>
              setFilters((current) => ({
                ...current,
                label
              }))
            }
            onToggleFilter={updateStatusFilter}
            searchQuery={searchQuery}
            selectedMessageId={selectedMessageId}
            visibleMessages={visibleMessages}
          />
        }
        detail={
          <DetailColumn
            accounts={accounts.map((account) => ({
              id: account.id,
              displayName: account.displayName
            }))}
            composerAttachments={composerAttachments}
            composerAppearance={composerAppearance}
            canApplyLabel={canApplyLabel}
            composerDraft={composerDraft}
            composerError={composerError}
            composerMode={composerMode}
            composerOpen={isComposerOpen}
            composerSending={composerState === "sending"}
            composerSuccess={composerSuccess}
            detailActionError={detailActionError}
            detailActionLoading={detailActionState.length > 0}
            detailActionSuccess={detailActionSuccess}
            detailErrorMessage={detailErrorMessage}
            detailFetchState={detailFetchState}
            detailHtml={detailHtml}
            formatFileSize={formatFileSize}
            formatReceivedAtLong={formatReceivedAtLong}
            labelInput={labelInput}
            latestFailedAction={latestFailedAction}
            analysisState={analysisState}
            onApplyLabel={handleApplyLabel}
            onArchive={() => {
              void archiveSelectedMessage();
            }}
            onAttachFiles={attachFiles}
            onAppearanceChange={(appearance) => {
              setComposerAppearance(appearance);
            }}
            onComposerChange={(field, value) =>
              setComposerDraft((current) => ({
                ...current,
                [field]: value
              }))
            }
            onComposerClose={closeComposer}
            onRemoveAttachment={removeComposerAttachment}
            onComposerSubmit={handleComposerSubmit}
            onDelete={() => {
              void deleteSelectedMessage();
            }}
            onDismissDetailFeedback={() => {
              setDetailActionError("");
              setDetailActionSuccess("");
            }}
            onDownloadAttachment={handleDownloadAttachment}
            onLabelInputChange={setLabelInput}
            onMarkReadToggle={() => {
              void toggleReadState();
            }}
            onOpenComposer={openComposer}
            onRetryFailedAction={
              latestFailedAction
                ? () => {
                    void handleMessageMutation(
                      "retry",
                      () =>
                        fetch(`${apiBaseUrl}/mail/actions/${latestFailedAction.id}/retry`, {
                          method: "POST",
                          headers: getRequestHeaders(),
                          body: JSON.stringify({
                            reason: "User retried the latest failed action from the detail toolbar."
                          })
                        }),
                      "The failed action was retried."
                    );
                  }
                : null
            }
            onSelectBack={() => setSelectedMessageId(null)}
            onTriggerAnalysis={handleTriggerAnalysis}
            onUseSuggestedReply={handleUseSuggestedReply}
            selectedAccountLabel={selectedAccount?.displayName || (selectedDetail ? getAccountBadge(selectedDetail) : "")}
            selectedDetail={selectedDetail}
          />
        }
      />
      <CommandPalette
        activeIndex={activeCommandIndex}
        items={commandItems}
        open={isCommandPaletteOpen}
        query={commandQuery}
        onActiveIndexChange={setActiveCommandIndex}
        onClose={() => setIsCommandPaletteOpen(false)}
        onQueryChange={setCommandQuery}
        onSelect={runCommand}
      />
      <SettingsSheet
        accounts={accounts}
        aiEnabledByAccount={aiEnabledByAccount}
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConnectGoogle={handleConnectGoogle}
        onSyncAccount={handleTriggerSync}
        syncingAccountId={syncingAccountId}
        onToggleAi={(accountId) =>
          setAiEnabledByAccount((current) => ({
            ...current,
            [accountId]: !current[accountId]
          }))
        }
      />
      {detailActionSuccess && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            background: "var(--surface-panel, #ffffff)",
            color: "var(--text-strong, #1a202c)",
            border: "1px solid var(--border-default, #e2e8f0)",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            fontSize: "14px",
            fontWeight: 500
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--status-success, #10b981)"
            }}
          />
          <span>{detailActionSuccess}</span>
          <button
            type="button"
            onClick={() => setDetailActionSuccess("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginLeft: "6px",
              color: "var(--text-secondary, #718096)",
              fontSize: "16px",
              lineHeight: 1,
              padding: "2px"
            }}
          >
            ×
          </button>
        </div>
      )}
      {detailActionError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            background: "var(--surface-panel, #ffffff)",
            color: "var(--status-danger, #ef4444)",
            border: "1px solid var(--border-danger, #fecaca)",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            fontSize: "14px",
            fontWeight: 500
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--status-danger, #ef4444)"
            }}
          />
          <span>{detailActionError}</span>
          <button
            type="button"
            onClick={() => setDetailActionError("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginLeft: "6px",
              color: "var(--text-secondary, #718096)",
              fontSize: "16px",
              lineHeight: 1,
              padding: "2px"
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
