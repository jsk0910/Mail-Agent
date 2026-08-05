import { Account } from "@mail-agent/shared";
import { Chip } from "./ui/Chip";
import {
  FolderIcon,
  InboxIcon,
  LayersIcon,
  MailIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon
} from "./icons";
import { Kbd } from "./ui/Kbd";
import styles from "./AppSidebar.module.css";

interface NavItem {
  count: number;
  key: string;
  label: string;
}

interface SmartViewItem {
  count: number;
  key: string;
  label: string;
}

interface AppSidebarProps {
  accounts: Account[];
  activeAccountId: string;
  accountUnreadCounts: Record<string, number>;
  activeView: string;
  items: NavItem[];
  formatSyncStatus: (account: Account) => string;
  onAccountSelect: (accountId: string) => void;
  onCommandOpen: () => void;
  onReconnectAccount: (accountId: string) => void;
  onSettingsOpen: () => void;
  onViewSelect: (view: string) => void;
  smartViewItems: SmartViewItem[];
}

function getStatusTone(account: Account) {
  if (account.syncStatus === "running") {
    return styles.statusInfo;
  }

  if (account.syncStatus === "error") {
    return styles.statusError;
  }

  return styles.statusSuccess;
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function AppSidebar({
  accounts,
  activeAccountId,
  accountUnreadCounts,
  activeView,
  formatSyncStatus,
  items,
  onAccountSelect,
  onCommandOpen,
  onReconnectAccount,
  onSettingsOpen,
  onViewSelect,
  smartViewItems
}: AppSidebarProps) {
  const primaryItems = items.filter((item) => item.key === "all" || item.key === "unread" || item.key === "starred");
  const folderItems = items.filter((item) => item.key === "archive" || item.key === "trash");
  const unifiedUnreadCount = Object.values(accountUnreadCounts).reduce(
    (total, count) => total + count,
    0
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <MailIcon width={16} height={16} />
        </span>
        <div className={styles.brandCopy}>
          <p className={styles.brandTitle}>Mail Agent</p>
          <span className={styles.brandMeta}>Unified inbox workspace</span>
        </div>
      </div>

      <section className={styles.section} aria-label="Main navigation">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Navigation</p>
        </div>
        <div className={styles.navList}>
          {primaryItems.map((item) => (
            <button
              key={item.key}
              className={joinClassNames(
                styles.navButton,
                activeView === item.key && styles.navButtonActive
              )}
              type="button"
              onClick={() => onViewSelect(item.key)}
            >
              <InboxIcon width={16} height={16} />
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.navCount}>{item.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-label="Smart views">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Smart views</p>
          <Chip tone="active">AI-assisted</Chip>
        </div>
        <div className={styles.navList}>
          {smartViewItems.map((item) => (
            <button
              key={item.key}
              className={joinClassNames(
                styles.navButton,
                styles.smartViewButton,
                activeView === item.key && styles.navButtonActive
              )}
              type="button"
              onClick={() => onViewSelect(item.key)}
            >
              <SparkIcon width={16} height={16} />
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.navCount}>{item.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-label="Labels and folders">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Labels & folders</p>
        </div>
        <div className={styles.navList}>
          <div className={styles.previewRow}>
            <div className={styles.previewIcon}>
              <LayersIcon width={16} height={16} />
            </div>
            <div className={styles.previewCopy}>
              <span className={styles.previewLabel}>Categories</span>
              <span className={styles.previewMeta}>Triaged labels and source-aware organization.</span>
            </div>
            <Chip>Next</Chip>
          </div>
          {folderItems.map((item) => (
            <button
              key={item.key}
              className={joinClassNames(
                styles.navButton,
                activeView === item.key && styles.navButtonActive
              )}
              type="button"
              onClick={() => onViewSelect(item.key)}
            >
              <FolderIcon width={16} height={16} />
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.navCount}>{item.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-label="AI briefings">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>AI briefings</p>
        </div>
        <div className={styles.briefingCard}>
          <div className={styles.briefingHeader}>
            <SparkIcon width={16} height={16} />
            <span className={styles.briefingTitle}>Daily brief</span>
            <Chip tone="active">Soon</Chip>
          </div>
          <p className={styles.briefingCopy}>
            A compact summary area for priorities, follow-ups, and suggested actions.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-label="Accounts">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Accounts</p>
          <Chip>{accounts.length + 1} sources</Chip>
        </div>
        <div className={styles.accountList}>
          <button
            className={joinClassNames(
              styles.accountButton,
              activeAccountId === "all" && styles.accountButtonActive
            )}
            type="button"
            onClick={() => onAccountSelect("all")}
          >
            <span className={joinClassNames(styles.accountStatus, styles.statusSuccess)} />
            <div className={styles.accountCopy}>
              <span className={styles.accountLabel}>All accounts</span>
              <span className={styles.accountMeta}>Unified inbox scope</span>
            </div>
            <span className={styles.accountCount}>{unifiedUnreadCount}</span>
          </button>
          {accounts.map((account) => (
            <button
              key={account.id}
              className={joinClassNames(
                styles.accountButton,
                activeAccountId === account.id && styles.accountButtonActive
              )}
              type="button"
              onClick={() => onAccountSelect(account.id)}
            >
              <span className={joinClassNames(styles.accountStatus, getStatusTone(account))} />
              <div className={styles.accountCopy}>
                <span className={styles.accountLabel}>{account.displayName}</span>
                <span className={styles.accountMeta}>{formatSyncStatus(account)}</span>
                {account.syncStatus === "running" && <span className={styles.syncProgress} />}
              </div>
              {account.syncStatus === "error" ? (
                <span className={styles.accountActionWrap}>
                  <span className={styles.accountMetaAction}>Issue</span>
                  <span
                    className={styles.reconnectButton}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onReconnectAccount(account.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onReconnectAccount(account.id);
                      }
                    }}
                  >
                    Reconnect
                  </span>
                </span>
              ) : (
                <span className={styles.accountCount}>{accountUnreadCounts[account.id] ?? 0}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.footer}>
        <button className={styles.footerLink} type="button" onClick={onCommandOpen}>
          <SearchIcon width={16} height={16} />
          <span className={styles.footerLabel}>Command menu</span>
          <Kbd className={styles.footerShortcut}>⌘K</Kbd>
        </button>
        <button className={styles.footerLink} type="button" onClick={onSettingsOpen}>
          <SettingsIcon width={16} height={16} />
          <span className={styles.footerLabel}>Settings</span>
        </button>
      </div>
    </aside>
  );
}
