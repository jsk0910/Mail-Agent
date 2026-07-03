"use client";

import { FormEvent, useEffect, useState } from "react";
import { Account, MessageDetail, MessageSummary } from "@mail-agent/shared";

const mailboxSections = [
  { label: "All Inbox", count: null, active: true },
  { label: "Assigned", count: 0 },
  { label: "Archive", count: 0 },
  { label: "Trash", count: 0 }
];

const smartViews = [
  { label: "Reply Needed", tone: "warning" },
  { label: "Today", tone: "neutral" },
  { label: "Notion Linked", tone: "success" }
] as const;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
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
  to: string;
  cc: string;
  subject: string;
  bodyText: string;
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
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric"
  }).format(date);
}

function formatReceivedAtLong(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
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

function buildRowChips(message: MessageSummary) {
  const chips: string[] = [];

  if (!message.isRead) {
    chips.push("Unread");
  }

  if (message.hasAttachments) {
    chips.push("Attachment");
  }

  if (message.labels.includes("TRASH")) {
    chips.push("Trash");
  } else if (message.labels.includes("INBOX")) {
    chips.push("Inbox");
  }

  return chips.slice(0, 3);
}

function getAccountBadge(message: MessageSummary, accounts: Account[]) {
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

function getAccountStatusLabel(account: Account) {
  if (account.syncStatus === "running") {
    return "Syncing";
  }

  if (account.syncStatus === "error") {
    return "Needs attention";
  }

  return "Connected";
}

function getAccountStatusTone(account: Account) {
  if (account.syncStatus === "running") {
    return "info";
  }

  if (account.syncStatus === "error") {
    return "warning";
  }

  return "success";
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

function getActionLabel(actionType: string) {
  switch (actionType) {
    case "mark_read":
      return "읽음 처리";
    case "mark_unread":
      return "안읽음 처리";
    case "archive_message":
      return "보관";
    case "unarchive_message":
      return "보관 취소";
    case "delete_message":
      return "삭제";
    case "apply_label":
      return "라벨 적용";
    default:
      return actionType;
  }
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

export default function HomePage() {
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<MessageDetail | null>(null);
  const [detailFetchState, setDetailFetchState] = useState<DetailFetchState>("idle");
  const [detailErrorMessage, setDetailErrorMessage] = useState<string>("");
  const [latestFailedAction, setLatestFailedAction] = useState<FailedActionLog | null>(null);
  const [detailActionState, setDetailActionState] = useState<string>("");
  const [detailActionError, setDetailActionError] = useState<string>("");
  const [detailActionSuccess, setDetailActionSuccess] = useState<string>("");
  const [labelInput, setLabelInput] = useState<string>("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>("compose");
  const [composerSourceMessageId, setComposerSourceMessageId] = useState<string | null>(null);
  const [composerDraft, setComposerDraft] = useState<ComposerDraft>({
    accountId: "",
    to: "",
    cc: "",
    subject: "",
    bodyText: ""
  });
  const [composerState, setComposerState] = useState<"idle" | "sending">("idle");
  const [composerError, setComposerError] = useState("");
  const [composerSuccess, setComposerSuccess] = useState("");
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

        setMessages([]);
        setAccounts([]);
        setSelectedMessageId(null);
        setFetchState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Inbox 목록을 불러오는 중 알 수 없는 오류가 발생했습니다."
        );
      }
    }

    void loadInbox();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const nextVisibleMessages = messages.filter((message) => {
      if (filters.accountId !== "all" && message.accountId !== filters.accountId) {
        return false;
      }

      if (filters.label !== "all" && !message.labels.includes(filters.label)) {
        return false;
      }

      if (filters.unreadOnly && message.isRead) {
        return false;
      }

      if (filters.hideArchived && isArchivedMessage(message)) {
        return false;
      }

      if (filters.hasAttachmentsOnly && !message.hasAttachments) {
        return false;
      }

      return true;
    });

    if (nextVisibleMessages.length === 0) {
      if (selectedMessageId !== null) {
        setSelectedMessageId(null);
      }
      return;
    }

    const selectedStillExists = nextVisibleMessages.some(
      (message) => message.id === selectedMessageId
    );
    if (!selectedStillExists && selectedMessageId !== null) {
      setSelectedMessageId(null);
    }
  }, [filters, messages, selectedMessageId]);

  useEffect(() => {
    let ignore = false;

    async function loadDetail(messageId: string) {
      setDetailFetchState("loading");
      setDetailErrorMessage("");
      setDetailActionError("");
      setDetailActionSuccess("");
      setLatestFailedAction(null);
      setLabelInput("");

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
          setDetailErrorMessage("선택한 메일 상세를 찾을 수 없습니다.");
          return;
        }

        setSelectedDetail(detailData.item);
        setLatestFailedAction(failedActionData.item);
        setLabelInput("");
        setDetailFetchState("ready");
      } catch (error) {
        if (ignore) {
          return;
        }

        setSelectedDetail(null);
        setLatestFailedAction(null);
        setDetailFetchState("error");
        setDetailErrorMessage(
          error instanceof Error
            ? error.message
            : "메일 상세를 불러오는 중 알 수 없는 오류가 발생했습니다."
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
  }, [selectedMessageId]);

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
  const visibleMessages = messages.filter((message) => {
    if (filters.accountId !== "all" && message.accountId !== filters.accountId) {
      return false;
    }

    if (filters.label !== "all" && !message.labels.includes(filters.label)) {
      return false;
    }

    if (filters.unreadOnly && message.isRead) {
      return false;
    }

    if (filters.hideArchived && isArchivedMessage(message)) {
      return false;
    }

    if (filters.hasAttachmentsOnly && !message.hasAttachments) {
      return false;
    }

    return true;
  });
  const hasActiveFilters =
    filters.accountId !== "all" ||
    filters.label !== "all" ||
    filters.unreadOnly ||
    filters.hideArchived !== true ||
    filters.hasAttachmentsOnly;

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

  function openComposer(mode: ComposerMode) {
    const fallbackAccountId = selectedAccount?.id || accounts[0]?.id || "";
    const detail = selectedDetail;
    const currentUserEmail = fallbackAccountId
      ? accounts.find((account) => account.id === fallbackAccountId)?.email || defaultUserEmail
      : defaultUserEmail;

    let nextDraft: ComposerDraft = {
      accountId: fallbackAccountId,
      to: "",
      cc: "",
      subject: "",
      bodyText: ""
    };

    if (detail) {
      if (mode === "reply") {
        nextDraft = {
          accountId: detail.accountId,
          to: detail.fromEmail,
          cc: "",
          subject: prefixSubject("Re: ", detail.subject),
          bodyText: buildQuotedBody(detail)
        };
      } else if (mode === "replyAll") {
        nextDraft = {
          accountId: detail.accountId,
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
    setComposerError("");
    setComposerSuccess("");
    setIsComposerOpen(true);
  }

  function closeComposer() {
    setIsComposerOpen(false);
    setComposerState("idle");
    setComposerError("");
    setComposerSuccess("");
  }

  async function refreshLatestFailedAction(messageId: string) {
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
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
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
    } catch (error) {
      setDetailActionError(
        error instanceof Error ? error.message : "메일 액션 실행 중 오류가 발생했습니다."
      );

      try {
        await refreshLatestFailedAction(selectedMessageId);
      } catch (refreshError) {
        setDetailActionError(
          refreshError instanceof Error
            ? refreshError.message
            : "실패한 액션 정보를 갱신하지 못했습니다."
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

    await handleMessageMutation(
      "label",
      () =>
        fetch(`${apiBaseUrl}/mail/messages/${selectedMessageId}/labels`, {
          method: "PATCH",
          headers: getRequestHeaders(),
          body: JSON.stringify({
            label: labelInput.trim(),
            reason: "User applied a label from the message detail panel."
          })
        }),
      "라벨을 적용했습니다."
    );

    setLabelInput("");
  }

  async function handleComposerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      ...(composerMode === "compose" ? { accountId: composerDraft.accountId } : {}),
      to: splitRecipients(composerDraft.to),
      cc: splitRecipients(composerDraft.cc),
      subject: composerDraft.subject.trim(),
      bodyText: composerDraft.bodyText.trim()
    };

    setComposerState("sending");
    setComposerError("");
    setComposerSuccess("");

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
      setComposerSuccess(
        data.item.status === "sent"
          ? "메일 전송을 완료했습니다."
          : "발송 플로우는 연결되었지만, 현재 SMTP transport는 placeholder 상태입니다."
      );
      setComposerState("idle");
    } catch (error) {
      setComposerState("idle");
      setComposerError(
        error instanceof Error ? error.message : "메일 전송 중 알 수 없는 오류가 발생했습니다."
      );
    }
  }

  const detailHtml =
    selectedDetail?.bodyHtml && selectedDetail.bodyHtml.trim().length > 0
      ? sanitizeMessageHtml(selectedDetail.bodyHtml)
      : "";

  return (
    <main className="app-shell">
      <div className={`workspace${selectedMessageId ? "" : " workspace--inbox-only"}`}>
      <aside className="sidebar panel">
        <div className="sidebar__brand">
          <p className="sidebar__eyebrow">MAIL AGENT</p>
          <h1 className="sidebar__title">Inbox Workspace</h1>
          <p className="sidebar__copy">
            빠르게 훑고, 판단하고, 처리하는 데 맞춘 데스크톱 메일 셸입니다.
          </p>
        </div>

        <section className="sidebar__section">
          <div className="section-heading">
            <h2>Mailboxes</h2>
            <button className="button button--tertiary" type="button">
              Add
            </button>
          </div>
          <nav className="stack-list" aria-label="Mailbox navigation">
            {mailboxSections.map((item) => (
              <button
                key={item.label}
                className={`nav-row${item.active ? " nav-row--active" : ""}`}
                type="button"
              >
                <span>{item.label}</span>
                <span className="nav-row__count">
                  {item.active ? messages.length : item.count}
                </span>
              </button>
            ))}
          </nav>
        </section>

        <section className="sidebar__section">
          <div className="section-heading">
            <h2>Smart Views</h2>
          </div>
          <div className="chip-list">
            {smartViews.map((view) => (
              <span key={view.label} className={`chip chip--${view.tone}`}>
                {view.label}
              </span>
            ))}
          </div>
        </section>

        <section className="sidebar__section">
          <div className="section-heading">
            <h2>Accounts</h2>
          </div>
          <div className="account-list">
            {accounts.length === 0 ? (
              <div className="account-card account-card--placeholder">
                <div>
                  <p className="account-card__label">No accounts loaded</p>
                  <p className="account-card__meta">
                    inbox 연결은 되었지만 계정 정보가 아직 없을 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="account-card">
                  <div>
                    <p className="account-card__label">{account.displayName}</p>
                    <p className="account-card__meta">{getAccountStatusLabel(account)}</p>
                  </div>
                  <span
                    className={`status-dot status-dot--${getAccountStatusTone(account)}`}
                    aria-hidden="true"
                  />
                </div>
              ))
            )}
          </div>
        </section>
      </aside>

      <section className="mail-column panel">
        <div className="top-notice">
          <span className="top-notice__label">Mail Agent</span>
          <span className="top-notice__copy">
            Quiet inbox triage with account-aware filters, quick actions, and supporting AI panels.
          </span>
          <button className="button button--secondary button--compact" type="button">
            Review Setup
          </button>
        </div>

        <header className="toolbar">
          <div>
            <p className="toolbar__eyebrow">Unified Inbox</p>
            <h2 className="toolbar__title">최근 메일을 한 흐름으로 확인</h2>
          </div>
          <div className="toolbar__actions">
            <button className="button button--secondary" type="button">
              Filters
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => openComposer("compose")}
            >
              Compose
            </button>
          </div>
        </header>

        <div className="mail-toolbar-bar">
          <div className="searchbar">
            <span className="searchbar__icon" aria-hidden="true">
              Search
            </span>
            <span className="searchbar__placeholder">subject, sender, keyword</span>
            <span className="kbd">/</span>
          </div>
          <div className="mail-toolbar-meta">
            <span className="status-pill status-pill--muted">{visibleMessages.length} visible</span>
            <span className="status-pill status-pill--muted">{accounts.length} accounts</span>
          </div>
        </div>

        <div className="filter-rail" aria-label="Inbox quick filters">
          <span className="filter-token filter-token--active">Inbox</span>
          {filters.unreadOnly && <span className="filter-token">Unread only</span>}
          {filters.hideArchived && <span className="filter-token">Hide archived</span>}
          {filters.hasAttachmentsOnly && <span className="filter-token">Attachments</span>}
          {filters.label !== "all" && <span className="filter-token">{filters.label}</span>}
        </div>

        <div className="status-banner">
          <span
            className={`status-pill ${
              fetchState === "error"
                ? "status-pill--warning"
                : fetchState === "loading"
                  ? "status-pill--info"
                  : "status-pill--muted"
            }`}
          >
            {fetchState === "loading"
              ? "Loading inbox"
              : fetchState === "error"
                ? "Inbox unavailable"
                : fetchState === "empty"
                  ? "No mail yet"
                  : "Inbox connected"}
          </span>
          <p>
            {fetchState === "loading" &&
              "메일 목록을 불러오는 중입니다. 실제 inbox row 구조를 먼저 맞추고 있습니다."}
            {fetchState === "error" &&
              "API 연결에 실패했습니다. 로컬 API 실행 상태와 기본 사용자 헤더를 확인해 주세요."}
            {fetchState === "empty" &&
              "현재 사용자 기준으로 저장된 메일이 없습니다. sync 이후 이 영역에 실제 목록이 표시됩니다."}
            {fetchState === "ready" &&
              `${messages.length}개 중 ${visibleMessages.length}개를 표시 중입니다. 이번 단계에서는 계정/상태 필터를 로컬 상태로 연결합니다.`}
          </p>
        </div>

        <section className="filterbar" aria-label="Inbox filters">
          <div className="filterbar__group">
            <label className="filter-control">
              <span className="filter-control__label">Account</span>
              <select
                className="filter-select"
                value={filters.accountId}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    accountId: event.target.value
                  }))
                }
              >
                <option value="all">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-control">
              <span className="filter-control__label">Label</span>
              <select
                className="filter-select"
                value={filters.label}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    label: event.target.value
                  }))
                }
              >
                <option value="all">All labels</option>
                {availableLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filterbar__group filterbar__group--chips">
            <button
              className={`filter-chip${filters.unreadOnly ? " filter-chip--active" : ""}`}
              type="button"
              onClick={() => updateStatusFilter("unreadOnly")}
            >
              Unread
            </button>
            <button
              className={`filter-chip${filters.hideArchived ? " filter-chip--active" : ""}`}
              type="button"
              onClick={() => updateStatusFilter("hideArchived")}
            >
              Hide archived
            </button>
            <button
              className={`filter-chip${filters.hasAttachmentsOnly ? " filter-chip--active" : ""}`}
              type="button"
              onClick={() => updateStatusFilter("hasAttachmentsOnly")}
            >
              Attachments
            </button>
            <button
              className="button button--tertiary button--compact"
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              Reset
            </button>
          </div>
        </section>

        {fetchState === "loading" && (
          <div className="mail-list" role="list" aria-label="Inbox loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="mail-row mail-row--skeleton" role="listitem">
                <div className="mail-row__accent">
                  <span className="mail-row__dot mail-row__dot--visible" aria-hidden="true" />
                </div>
                <div className="mail-row__body">
                  <div className="mail-row__topline">
                    <span className="skeleton skeleton--badge" />
                    <span className="skeleton skeleton--sender" />
                    <span className="skeleton skeleton--time" />
                  </div>
                  <span className="skeleton skeleton--subject" />
                  <span className="skeleton skeleton--snippet" />
                </div>
              </article>
            ))}
          </div>
        )}

        {fetchState === "error" && (
          <section className="list-state-card" aria-live="polite">
            <h3>Inbox를 불러오지 못했습니다</h3>
            <p>{errorMessage}</p>
          </section>
        )}

        {fetchState === "empty" && (
          <section className="list-state-card" aria-live="polite">
            <h3>표시할 메일이 없습니다</h3>
            <p>sync가 완료되면 이 영역에 실제 unified inbox 목록이 나타납니다.</p>
          </section>
        )}

        {fetchState === "ready" && visibleMessages.length === 0 && (
          <section className="list-state-card" aria-live="polite">
            <h3>필터에 맞는 메일이 없습니다</h3>
            <p>계정 또는 상태 필터를 조정해서 다른 메일을 확인해 보세요.</p>
          </section>
        )}

        {fetchState === "ready" && visibleMessages.length > 0 && (
          <div className="mail-list" role="list" aria-label="Inbox list">
            {visibleMessages.map((message) => {
              const selected = selectedMessageId === message.id;
              const chips = buildRowChips(message);

              return (
                <button
                  key={message.id}
                  className={`mail-row mail-row--interactive${
                    selected ? " mail-row--selected" : ""
                  }`}
                  type="button"
                  role="listitem"
                  onClick={() => setSelectedMessageId(message.id)}
                >
                  <div className="mail-row__accent">
                    <span
                      className={`mail-row__dot${!message.isRead ? " mail-row__dot--visible" : ""}`}
                      aria-hidden="true"
                    />
                  </div>
                    <div className="mail-row__body">
                      <div className="mail-row__topline">
                        <span className={`mail-row__sender${!message.isRead ? " is-unread" : ""}`}>
                          {message.fromName || message.fromEmail}
                        </span>
                        <span className="mail-row__time">{formatReceivedAt(message.receivedAt)}</span>
                      </div>
                      <div className="mail-row__headline">
                        <p className={`mail-row__subject${!message.isRead ? " is-unread" : ""}`}>
                          {message.subject}
                        </p>
                        <p className="mail-row__snippet">{message.snippet}</p>
                      </div>
                      <div className="mail-row__footer">
                        <span className="account-badge">{getAccountBadge(message, accounts)}</span>
                        {chips.length > 0 && (
                          <div className="chip-list chip-list--row">
                            {chips.map((chip) => (
                              <span key={`${message.id}-${chip}`} className="chip chip--neutral">
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedMessageId && (
        <section className="detail-column panel">
          <div className="detail-layout">
          <article className="detail-main">
            <header className="detail-header">
              <div className="detail-subject-block">
                <p className="detail-header__eyebrow">
                  {selectedDetail
                    ? selectedDetail.isRead
                      ? "Read message"
                      : "Unread message"
                    : selectedMessageId
                      ? "Loading detail"
                      : "No mail selected"}
                </p>
                <h2 className="detail-header__title">
                  {selectedDetail?.subject ||
                    (selectedMessageId
                      ? "선택한 메일의 상세를 불러오는 중입니다"
                      : "메일을 선택하면 여기서 바로 처리합니다")}
                </h2>
                {selectedDetail && (
                  <div className="detail-meta-inline">
                    <span>{selectedDetail.fromName || selectedDetail.fromEmail}</span>
                    <span>{formatReceivedAtLong(selectedDetail.receivedAt)}</span>
                    <span>{selectedAccount?.displayName || getAccountBadge(selectedDetail, accounts)}</span>
                  </div>
                )}
              </div>
              <div className="detail-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={!selectedDetail}
                  onClick={() => openComposer("reply")}
                >
                  Reply
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={!selectedDetail}
                  onClick={() => openComposer("replyAll")}
                >
                  Reply All
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={!selectedDetail}
                  onClick={() => openComposer("forward")}
                >
                  Forward
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={!selectedDetail || detailActionState.length > 0}
                  onClick={() =>
                    selectedDetail &&
                    handleMessageMutation(
                      "read-state",
                      () =>
                        fetch(`${apiBaseUrl}/mail/messages/${selectedDetail.id}/read-state`, {
                          method: "PATCH",
                          headers: getRequestHeaders(),
                          body: JSON.stringify({
                            isRead: !selectedDetail.isRead,
                            reason: "User toggled read state from the message detail panel."
                          })
                        }),
                      selectedDetail.isRead ? "안읽음 상태로 변경했습니다." : "읽음 상태로 변경했습니다."
                    )
                  }
                >
                  {selectedDetail?.isRead ? "Mark Unread" : "Mark Read"}
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={!selectedDetail || detailActionState.length > 0}
                  onClick={() =>
                    selectedDetail &&
                    handleMessageMutation(
                      "archive-state",
                      () =>
                        fetch(`${apiBaseUrl}/mail/messages/${selectedDetail.id}/archive-state`, {
                          method: "PATCH",
                          headers: getRequestHeaders(),
                          body: JSON.stringify({
                            isArchived: !selectedDetail.labels.includes("INBOX"),
                            reason: "User changed archive state from the message detail panel."
                          })
                        }),
                      selectedDetail.labels.includes("INBOX")
                        ? "메일을 보관했습니다."
                        : "보관 상태를 다시 동기화했습니다."
                    )
                  }
                >
                  {selectedDetail?.labels.includes("INBOX") ? "Archive" : "Sync Archive"}
                </button>
                <button
                  className="button button--tertiary button--danger"
                  type="button"
                  disabled={!selectedDetail || detailActionState.length > 0}
                  onClick={() =>
                    selectedDetail &&
                    handleMessageMutation(
                      "delete",
                      () =>
                        fetch(`${apiBaseUrl}/mail/messages/${selectedDetail.id}/delete`, {
                          method: "PATCH",
                          headers: getRequestHeaders(),
                          body: JSON.stringify({
                            reason: "User deleted the message from the message detail panel."
                          })
                        }),
                      "메일을 휴지통 상태로 이동했습니다."
                    )
                  }
                >
                  Delete
                </button>
                {latestFailedAction && (
                  <button
                    className="button button--secondary"
                    type="button"
                    disabled={detailActionState.length > 0}
                    onClick={() =>
                      handleMessageMutation(
                        "retry",
                        () =>
                          fetch(`${apiBaseUrl}/mail/actions/${latestFailedAction.id}/retry`, {
                            method: "POST",
                            headers: getRequestHeaders(),
                            body: JSON.stringify({
                              reason: "User retried the latest failed action from the message detail panel."
                            })
                          }),
                        "실패한 액션을 다시 실행했습니다."
                      )
                    }
                  >
                    Retry Failed Action
                  </button>
                )}
              </div>
            </header>

            {detailActionError && (
              <div className="inline-alert inline-alert--warning" aria-live="polite">
                <strong>Action failed.</strong>
                <span>{detailActionError}</span>
              </div>
            )}

            {detailActionSuccess && (
              <div className="inline-alert inline-alert--success" aria-live="polite">
                <strong>Updated.</strong>
                <span>{detailActionSuccess}</span>
              </div>
            )}

            {detailFetchState === "idle" && (
              <section className="empty-state">
                <div className="empty-state__icon" aria-hidden="true">
                  ···
                </div>
                <h3>작업 패널 준비 완료</h3>
                <p>메일을 선택하면 본문, 첨부, quick actions를 실제 데이터로 표시합니다.</p>
              </section>
            )}

            {detailFetchState === "loading" && (
              <section className="detail-loading">
                <span className="skeleton skeleton--detail-title" />
                <span className="skeleton skeleton--detail-meta" />
                <span className="skeleton skeleton--detail-body" />
                <span className="skeleton skeleton--detail-body" />
                <span className="skeleton skeleton--detail-body skeleton--detail-body-short" />
              </section>
            )}

            {detailFetchState === "error" && (
              <section className="list-state-card" aria-live="polite">
                <h3>메일 상세를 불러오지 못했습니다</h3>
                <p>{detailErrorMessage}</p>
              </section>
            )}

            {detailFetchState === "ready" && selectedDetail && (
              <div className="detail-content">
                <section className="detail-meta-grid">
                  <div className="detail-meta-row">
                    <span className="detail-meta-label">From</span>
                    <span className="detail-meta-value">
                      {selectedDetail.fromName
                        ? `${selectedDetail.fromName} <${selectedDetail.fromEmail}>`
                        : selectedDetail.fromEmail}
                    </span>
                  </div>
                  <div className="detail-meta-row">
                    <span className="detail-meta-label">To</span>
                    <span className="detail-meta-value">{selectedDetail.to.join(", ") || "-"}</span>
                  </div>
                  {selectedDetail.cc.length > 0 && (
                    <div className="detail-meta-row">
                      <span className="detail-meta-label">Cc</span>
                      <span className="detail-meta-value">{selectedDetail.cc.join(", ")}</span>
                    </div>
                  )}
                  <div className="detail-meta-row">
                    <span className="detail-meta-label">Account</span>
                    <span className="detail-meta-value">
                      {selectedAccount?.displayName || getAccountBadge(selectedDetail, accounts)}
                    </span>
                  </div>
                  <div className="detail-meta-row">
                    <span className="detail-meta-label">Received</span>
                    <span className="detail-meta-value">
                      {formatReceivedAtLong(selectedDetail.receivedAt)}
                    </span>
                  </div>
                </section>

                {selectedDetail.labels.length > 0 && (
                  <section className="detail-section">
                    <div className="section-heading">
                      <h3>Labels</h3>
                    </div>
                    <div className="chip-list chip-list--row">
                      {selectedDetail.labels.map((label) => (
                        <span key={label} className="chip chip--neutral">
                          {label}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="detail-section">
                  <div className="section-heading">
                    <h3>Message Body</h3>
                    <span className="status-pill status-pill--muted">
                      {detailHtml ? "HTML preferred" : "Text fallback"}
                    </span>
                  </div>
                  {detailHtml ? (
                    <div
                      className="message-body message-body--html"
                      dangerouslySetInnerHTML={{ __html: detailHtml }}
                    />
                  ) : (
                    <pre className="message-body message-body--text">
                      {selectedDetail.bodyText || selectedDetail.snippet || "본문이 비어 있습니다."}
                    </pre>
                  )}
                </section>

                <section className="detail-section">
                  <div className="section-heading">
                    <h3>Attachments</h3>
                    <span className="status-pill status-pill--muted">
                      {selectedDetail.attachments.length} files
                    </span>
                  </div>
                  {selectedDetail.attachments.length === 0 ? (
                    <p className="detail-muted-copy">첨부 파일이 없습니다.</p>
                  ) : (
                    <div className="attachment-list">
                      {selectedDetail.attachments.map((attachment) => (
                        <article key={attachment.id} className="attachment-card">
                          <div>
                            <p className="attachment-card__title">{attachment.filename}</p>
                            <p className="attachment-card__meta">
                              {attachment.mimeType} · {formatFileSize(attachment.size)}
                            </p>
                          </div>
                          <span className="status-pill status-pill--muted">
                            {attachment.storageMode}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </article>

          <aside className="utility-stack" aria-label="Supporting panels">
            <section className="utility-panel">
              <div className="section-heading">
                <h3>AI Panel</h3>
                <span className="status-pill status-pill--muted">Pending</span>
              </div>
              <p className="utility-panel__copy">
                요약, 중요도, 답장 필요 여부는 detail 연결 이후 보조 패널로 붙습니다.
              </p>
            </section>

            <section className="utility-panel">
              <div className="section-heading">
                <h3>Labels</h3>
                <span className="status-pill status-pill--muted">
                  {canApplyLabel ? "Gmail supported" : "View only"}
                </span>
              </div>
              <form className="label-form" onSubmit={handleApplyLabel}>
                <input
                  className="text-input"
                  type="text"
                  value={labelInput}
                  onChange={(event) => setLabelInput(event.target.value)}
                  placeholder={canApplyLabel ? "new-label" : "Gmail account only"}
                  disabled={!selectedDetail || !canApplyLabel || detailActionState.length > 0}
                />
                <button
                  className="button button--secondary"
                  type="submit"
                  disabled={
                    !selectedDetail ||
                    !canApplyLabel ||
                    !labelInput.trim() ||
                    detailActionState.length > 0
                  }
                >
                  Apply Label
                </button>
              </form>
              <p className="utility-panel__copy">
                Gmail 계정은 detail 패널에서 직접 라벨을 적용할 수 있습니다.
              </p>
            </section>

            <section className="utility-panel">
              <div className="section-heading">
                <h3>Failure State</h3>
                <span className="status-pill status-pill--muted">
                  {latestFailedAction ? "Retry available" : "No failure"}
                </span>
              </div>
              {latestFailedAction ? (
                <div className="failure-card">
                  <p className="failure-card__title">{getActionLabel(latestFailedAction.actionType)}</p>
                  <p className="failure-card__meta">{formatReceivedAtLong(latestFailedAction.createdAt)}</p>
                  <p className="utility-panel__copy">{latestFailedAction.reason}</p>
                </div>
              ) : (
                <p className="utility-panel__copy">
                  최근 실패한 읽음/보관/삭제/라벨 액션이 있으면 여기서 바로 재시도할 수 있습니다.
                </p>
              )}
            </section>
          </aside>
          </div>
        </section>
      )}

      </div>

      {isComposerOpen && (
        <div className="composer-backdrop" role="presentation" onClick={closeComposer}>
          <section
            className="composer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="composer-header">
              <div>
                <p className="sidebar__eyebrow">
                  {composerMode === "compose"
                    ? "New message"
                    : composerMode === "reply"
                      ? "Reply"
                      : composerMode === "replyAll"
                        ? "Reply all"
                        : "Forward"}
                </p>
                <h2 id="composer-title" className="composer-title">
                  {composerMode === "compose"
                    ? "새 메일 작성"
                    : composerMode === "reply"
                      ? "답장 보내기"
                      : composerMode === "replyAll"
                        ? "전체 답장 보내기"
                        : "메일 전달"}
                </h2>
              </div>
              <button className="button button--tertiary" type="button" onClick={closeComposer}>
                Close
              </button>
            </header>

            <form className="composer-form" onSubmit={handleComposerSubmit}>
              <label className="composer-field">
                <span className="filter-control__label">Account</span>
                <select
                  className="filter-select"
                  value={composerDraft.accountId}
                  onChange={(event) =>
                    setComposerDraft((current) => ({
                      ...current,
                      accountId: event.target.value
                    }))
                  }
                  disabled={composerMode !== "compose" || composerState === "sending"}
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="composer-field">
                <span className="filter-control__label">To</span>
                <input
                  className="text-input"
                  type="text"
                  value={composerDraft.to}
                  onChange={(event) =>
                    setComposerDraft((current) => ({
                      ...current,
                      to: event.target.value
                    }))
                  }
                  placeholder="person@example.com, team@example.com"
                  disabled={composerState === "sending"}
                />
              </label>

              <label className="composer-field">
                <span className="filter-control__label">Cc</span>
                <input
                  className="text-input"
                  type="text"
                  value={composerDraft.cc}
                  onChange={(event) =>
                    setComposerDraft((current) => ({
                      ...current,
                      cc: event.target.value
                    }))
                  }
                  placeholder="optional"
                  disabled={composerState === "sending"}
                />
              </label>

              <label className="composer-field">
                <span className="filter-control__label">Subject</span>
                <input
                  className="text-input"
                  type="text"
                  value={composerDraft.subject}
                  onChange={(event) =>
                    setComposerDraft((current) => ({
                      ...current,
                      subject: event.target.value
                    }))
                  }
                  placeholder="Subject"
                  disabled={composerState === "sending"}
                />
              </label>

              <label className="composer-field">
                <span className="filter-control__label">Body</span>
                <textarea
                  className="text-input text-input--multiline"
                  value={composerDraft.bodyText}
                  onChange={(event) =>
                    setComposerDraft((current) => ({
                      ...current,
                      bodyText: event.target.value
                    }))
                  }
                  placeholder="Write your message"
                  disabled={composerState === "sending"}
                />
              </label>

              {composerError && (
                <div className="inline-alert inline-alert--warning" aria-live="polite">
                  <strong>Send failed.</strong>
                  <span>{composerError}</span>
                </div>
              )}

              {composerSuccess && (
                <div className="inline-alert inline-alert--success" aria-live="polite">
                  <strong>Composer updated.</strong>
                  <span>{composerSuccess}</span>
                </div>
              )}

              <div className="composer-actions">
                <button className="button button--secondary" type="button" onClick={closeComposer}>
                  Cancel
                </button>
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={
                    composerState === "sending" ||
                    !composerDraft.subject.trim() ||
                    !composerDraft.bodyText.trim() ||
                    !composerDraft.to.trim() ||
                    !composerDraft.accountId.trim()
                  }
                >
                  {composerState === "sending" ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
