import { Account, MessageSummary } from "@mail-agent/shared";
import { PaperclipIcon, SearchIcon, StarIcon } from "./icons";
import { Button } from "./ui/Button";
import { ChipButton } from "./ui/Chip";
import { Kbd } from "./ui/Kbd";
import styles from "./InboxColumn.module.css";

type FetchState = "loading" | "ready" | "empty" | "error";
type StatusFilterKey = "unreadOnly" | "hideArchived" | "hasAttachmentsOnly";

interface InboxColumnProps {
  accounts: Account[];
  activeViewLabel: string;
  availableLabels: string[];
  fetchState: FetchState;
  filters: {
    accountId: string;
    label: string;
    unreadOnly: boolean;
    hideArchived: boolean;
    hasAttachmentsOnly: boolean;
  };
  hasActiveFilters: boolean;
  messagesCount: number;
  onCompose: () => void;
  onFilterReset: () => void;
  onRetryLoad: () => void;
  onSearchChange: (value: string) => void;
  onSelectMessage: (messageId: string) => void;
  onSetAccountFilter: (accountId: string) => void;
  onSetLabelFilter: (label: string) => void;
  onToggleFilter: (key: StatusFilterKey) => void;
  searchQuery: string;
  selectedMessageId: string | null;
  visibleMessages: MessageSummary[];
  formatReceivedAt: (value: string) => string;
  getAccountBadge: (message: MessageSummary) => string;
  errorMessage: string;
  onSyncAll?: () => void;
  isSyncing?: boolean;
}

function renderEmptyState(
  title: string,
  copy: string,
  action?: { label: string; onClick: () => void }
) {
  return (
    <section className={styles.stateCard} aria-live="polite">
      <h3>{title}</h3>
      <p>{copy}</p>
      {action ? (
        <div className={styles.stateAction}>
          <Button variant="secondary" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function getProviderLabel(message: MessageSummary) {
  if (message.provider === "gmail") {
    return "Gmail";
  }

  if (message.provider === "imap") {
    return "IMAP";
  }

  if (message.provider === "outlook") {
    return "Outlook";
  }

  return "Mail";
}

function getPriorityTone(message: MessageSummary) {
  if (message.isStarred) {
    return { label: "Priority", tone: "high" as const };
  }

  if (!message.isRead) {
    return { label: "New", tone: "medium" as const };
  }

  return null;
}

function getCategoryInfo(message: MessageSummary): { label: string; isAi: boolean } | null {
  if (message.analysis?.category) {
    return {
      label: `✨ ${message.analysis.category}`,
      isAi: true
    };
  }

  const categoryLabel = message.labels.find((label) => label.startsWith("CATEGORY_"));
  if (categoryLabel) {
    const raw = categoryLabel.replace("CATEGORY_", "").toLowerCase().replace(/_/g, " ");
    const nameMap: Record<string, string> = {
      personal: "Personal",
      social: "Social",
      promotions: "Promotions",
      updates: "Updates",
      forums: "Forums"
    };
    return {
      label: nameMap[raw] || raw,
      isAi: false
    };
  }

  const visibleLabel = message.labels.find(
    (label) =>
      label !== "INBOX" &&
      label !== "UNREAD" &&
      label !== "STARRED" &&
      label !== "TRASH"
  );

  if (visibleLabel) {
    return {
      label: visibleLabel.toLowerCase().replace(/_/g, " "),
      isAi: false
    };
  }

  return null;
}

export function InboxColumn({
  accounts,
  activeViewLabel,
  availableLabels,
  errorMessage,
  fetchState,
  filters,
  formatReceivedAt,
  getAccountBadge,
  hasActiveFilters,
  messagesCount,
  onCompose,
  onFilterReset,
  onRetryLoad,
  onSearchChange,
  onSelectMessage,
  onSetAccountFilter,
  onSetLabelFilter,
  onToggleFilter,
  searchQuery,
  selectedMessageId,
  visibleMessages,
  onSyncAll,
  isSyncing
}: InboxColumnProps) {
  return (
    <section className={styles.column}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{activeViewLabel}</h1>
          <span className={styles.meta}>Unified mail list · {messagesCount} messages</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onSyncAll && (
            <Button
              variant="secondary"
              tooltip="Sync emails now"
              onClick={onSyncAll}
              disabled={isSyncing}
            >
              <span style={{ display: "inline-block", transform: isSyncing ? "rotate(360deg)" : "none", transition: isSyncing ? "transform 1s linear infinite" : "none" }}>
                ↻
              </span>
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </Button>
          )}
          <Button variant="primary" shortcut="C" tooltip="Compose new message" onClick={onCompose}>
            Compose
          </Button>
        </div>
      </header>

      <div className={styles.searchZone}>
        <label className={styles.searchField}>
          <SearchIcon width={16} height={16} />
          <input
            aria-label="Search inbox"
            placeholder="Search sender, subject, or keyword"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Kbd className={styles.shortcut}>Cmd+K</Kbd>
        </label>

        <div className={styles.filterBar}>
          <div className={styles.filterLeft}>
            <div className={styles.activeFilters}>
              {filters.accountId !== "all" && (
                <ChipButton onClick={() => onSetAccountFilter("all")}>Account ×</ChipButton>
              )}
              {filters.label !== "all" && (
                <ChipButton onClick={() => onSetLabelFilter("all")}>{filters.label} ×</ChipButton>
              )}
              {filters.unreadOnly && (
                <ChipButton onClick={() => onToggleFilter("unreadOnly")}>Unread ×</ChipButton>
              )}
              {filters.hideArchived && (
                <ChipButton onClick={() => onToggleFilter("hideArchived")}>
                  Hide archived ×
                </ChipButton>
              )}
              {filters.hasAttachmentsOnly && (
                <ChipButton onClick={() => onToggleFilter("hasAttachmentsOnly")}>
                  Attachments ×
                </ChipButton>
              )}
              {hasActiveFilters && (
                <ChipButton tone="active" onClick={onFilterReset}>
                  Clear all
                </ChipButton>
              )}
            </div>
          </div>

          <div className={styles.filterRight}>
            <div className={styles.chipRow}>
              <ChipButton
                tone={filters.unreadOnly ? "active" : "default"}
                onClick={() => onToggleFilter("unreadOnly")}
              >
                Unread
              </ChipButton>
              <ChipButton
                tone={filters.hasAttachmentsOnly ? "active" : "default"}
                onClick={() => onToggleFilter("hasAttachmentsOnly")}
              >
                Attachments
              </ChipButton>
              <ChipButton
                tone={filters.hideArchived ? "active" : "default"}
                onClick={() => onToggleFilter("hideArchived")}
              >
                Hide archived
              </ChipButton>
            </div>

            <div className={styles.chipRow}>
              <select
                className={styles.select}
                value={filters.accountId}
                onChange={(event) => onSetAccountFilter(event.target.value)}
              >
                <option value="all">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={filters.label}
                onChange={(event) => onSetLabelFilter(event.target.value)}
              >
                <option value="all">All labels</option>
                {availableLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {fetchState === "loading" && (
        <div className={styles.list} role="list" aria-label="Inbox loading">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className={styles.skeletonRow} role="listitem">
              <span className={styles.skeletonDot} />
              <div className={styles.skeletonBody}>
                <span className={`${styles.skeletonLine} ${styles.lineSm}`} />
                <span className={`${styles.skeletonLine} ${styles.lineMd}`} />
                <span className={`${styles.skeletonLine} ${styles.lineLg}`} />
              </div>
            </article>
          ))}
        </div>
      )}

      {fetchState === "error" &&
        renderEmptyState(
          "Inbox unavailable",
          errorMessage || "The inbox could not be loaded.",
          { label: "Retry loading inbox", onClick: onRetryLoad }
        )}

      {fetchState === "empty" &&
        renderEmptyState(
          "No mail yet",
          "Messages will appear here after the next sync completes.",
          { label: "Compose a new message", onClick: onCompose }
        )}

      {fetchState === "ready" &&
        visibleMessages.length === 0 &&
        renderEmptyState(
          "No messages match these filters",
          "Adjust the current view or clear filters to continue triage.",
          { label: "Clear filters", onClick: onFilterReset }
        )}

      {fetchState === "ready" && visibleMessages.length > 0 && (
        <div className={styles.list} role="list" aria-label="Inbox list">
          {visibleMessages.map((message) => {
            const isSelected = selectedMessageId === message.id;
            const priority = getPriorityTone(message);
            const categoryInfo = getCategoryInfo(message);
            const isAiHigh = message.analysis?.priority === "high";

            return (
              <button
                key={message.id}
                aria-selected={isSelected}
                className={`${styles.rowButton}${message.isRead ? "" : ` ${styles.rowUnread}`}${
                  priority?.tone === "high" || isAiHigh ? ` ${styles.rowPriority}` : ""
                }${isSelected ? ` ${styles.rowSelected}` : ""}`}
                type="button"
                role="listitem"
                onClick={() => onSelectMessage(message.id)}
              >
                <div className={styles.rowAccent}>
                  {!message.isRead && (
                    <span className={styles.unreadDot} aria-label="Unread" role="img" />
                  )}
                </div>
                <div className={styles.rowBody}>
                  <div className={styles.rowTop}>
                    <span className={styles.senderGroup}>
                      <span className={styles.sender}>{message.fromName || message.fromEmail}</span>
                      <span className={styles.providerBadge}>{getProviderLabel(message)}</span>
                    </span>
                    <span className={styles.time}>{formatReceivedAt(message.receivedAt)}</span>
                  </div>
                  <div className={styles.rowMeta}>
                    <span className={styles.accountBadge}>{getAccountBadge(message)}</span>
                    {isAiHigh ? (
                      <span className={`${styles.statusBadge} ${styles.statusHigh}`}>
                        🔥 중요
                      </span>
                    ) : priority ? (
                      <span
                        className={`${styles.statusBadge} ${
                          priority.tone === "high" ? styles.statusHigh : styles.statusMedium
                        }`}
                      >
                        {priority.label}
                      </span>
                    ) : null}
                    {categoryInfo && (
                      <span
                        className={categoryInfo.isAi ? styles.aiBadge : styles.categoryBadge}
                      >
                        {categoryInfo.label}
                      </span>
                    )}
                    {message.analysis?.requiresReply && (
                      <span className={`${styles.statusBadge} ${styles.aiReplyBadge}`}>
                        💬 답장 필요
                      </span>
                    )}
                  </div>
                  <div className={`${styles.subject}${message.isRead ? "" : ` ${styles.subjectUnread}`}`}>
                    {message.subject}
                  </div>
                  <div className={styles.rowFooter}>
                    <span className={styles.snippet}>{message.snippet}</span>
                    <span className={styles.iconRail}>
                      {message.hasAttachments && <PaperclipIcon width={14} height={14} />}
                      {message.isStarred && <StarIcon width={14} height={14} />}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
