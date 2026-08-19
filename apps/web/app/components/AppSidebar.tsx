"use client";

import { useEffect, useRef, useState } from "react";
import { Account } from "@mail-agent/shared";
import { Chip } from "./ui/Chip";
import {
  ArchiveIcon,
  ChevronDownIcon,
  FolderIcon,
  InboxIcon,
  LayersIcon,
  MailIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
  StarIcon
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
  currentUser?: { email: string; name?: string } | null;
  onLogout?: () => void;
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

function getInitials(name?: string, fallback = "A") {
  if (!name || !name.trim()) {
    return fallback;
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getNavIcon(key: string) {
  switch (key) {
    case "personal":
      return <SparkIcon width={16} height={16} />;
    case "unread":
      return <InboxIcon width={16} height={16} />;
    case "starred":
      return <StarIcon width={16} height={16} />;
    case "archive":
      return <ArchiveIcon width={16} height={16} />;
    case "trash":
      return <FolderIcon width={16} height={16} />;
    case "all":
    default:
      return <InboxIcon width={16} height={16} />;
  }
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
  smartViewItems,
  currentUser,
  onLogout
}: AppSidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeAccount = accounts.find((item) => item.id === activeAccountId);
  const unifiedUnreadCount = Object.values(accountUnreadCounts).reduce(
    (total, count) => total + count,
    0
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <aside className={styles.sidebar}>
      {/* Top Section: Accounts Dropdown */}
      <div className={styles.accountSelectorWrap} ref={dropdownRef}>
        <button
          className={styles.accountSelectorButton}
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <span className={styles.accountAvatar}>
            {activeAccountId === "all" ? (
              <MailIcon width={16} height={16} />
            ) : (
              getInitials(activeAccount?.displayName || activeAccount?.email, "U")
            )}
          </span>
          <div className={styles.accountSelectorCopy}>
            <span className={styles.accountSelectorName}>
              {activeAccountId === "all"
                ? "All Accounts"
                : activeAccount?.displayName || activeAccount?.email || "Account"}
            </span>
            <span className={styles.accountSelectorMeta}>
              {activeAccountId === "all"
                ? `${accounts.length} connected`
                : activeAccount?.email || "Active"}
            </span>
          </div>
          <span
            className={joinClassNames(
              styles.accountSelectorChevron,
              isDropdownOpen && styles.accountSelectorChevronOpen
            )}
          >
            <ChevronDownIcon width={14} height={14} />
          </span>
        </button>

        {isDropdownOpen && (
          <div className={styles.accountDropdownMenu} role="menu">
            <button
              className={joinClassNames(
                styles.accountDropdownItem,
                activeAccountId === "all" && styles.accountDropdownItemActive
              )}
              type="button"
              role="menuitem"
              onClick={() => {
                onAccountSelect("all");
                setIsDropdownOpen(false);
              }}
            >
              <span className={styles.accountAvatar}>
                <MailIcon width={14} height={14} />
              </span>
              <div className={styles.accountCopy}>
                <span className={styles.accountLabel}>All Accounts</span>
                <span className={styles.accountMeta}>Unified inbox scope</span>
              </div>
              <div className={styles.accountItemMeta}>
                <span className={styles.accountCount}>{unifiedUnreadCount}</span>
              </div>
            </button>

            <div className={styles.dropdownDivider} />

            {accounts.map((account) => (
              <button
                key={account.id}
                className={joinClassNames(
                  styles.accountDropdownItem,
                  activeAccountId === account.id && styles.accountDropdownItemActive
                )}
                type="button"
                role="menuitem"
                onClick={() => {
                  onAccountSelect(account.id);
                  setIsDropdownOpen(false);
                }}
              >
                <span className={styles.accountAvatar}>
                  {getInitials(account.displayName || account.email, "U")}
                </span>
                <div className={styles.accountCopy}>
                  <span className={styles.accountLabel}>{account.displayName}</span>
                  <span className={styles.accountMeta}>{account.email}</span>
                </div>
                <div className={styles.accountItemMeta}>
                  <span
                    className={joinClassNames(styles.accountStatus, getStatusTone(account))}
                    title={formatSyncStatus(account)}
                  />
                  <span className={styles.accountCount}>
                    {accountUnreadCounts[account.id] ?? 0}
                  </span>
                </div>
              </button>
            ))}

            <div className={styles.dropdownDivider} />

            <button
              className={styles.accountDropdownItem}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsDropdownOpen(false);
                onSettingsOpen();
              }}
            >
              <span className={styles.accountAvatar}>+</span>
              <div className={styles.accountCopy}>
                <span className={styles.accountLabel}>Add Account</span>
                <span className={styles.accountMeta}>Connect Google or IMAP</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 1. Smart Views (Combined with AI briefings) */}
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

      {/* 2. Navigation (Combined with Labels & Folders) */}
      <section className={styles.section} aria-label="Navigation">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Navigation</p>
        </div>
        <div className={styles.navList}>
          {items.map((item) => (
            <button
              key={item.key}
              className={joinClassNames(
                styles.navButton,
                activeView === item.key && styles.navButtonActive
              )}
              type="button"
              onClick={() => onViewSelect(item.key)}
            >
              {getNavIcon(item.key)}
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.navCount}>{item.count}</span>
            </button>
          ))}
          <div className={styles.previewRow}>
            <div className={styles.previewIcon}>
              <LayersIcon width={16} height={16} />
            </div>
            <div className={styles.previewCopy}>
              <span className={styles.previewLabel}>Categories</span>
              <span className={styles.previewMeta}>Triaged labels & categories.</span>
            </div>
            <Chip>Next</Chip>
          </div>
        </div>
      </section>

      {/* Footer: User profile, Command Menu & Settings */}
      <div className={styles.footer}>
        {currentUser && (
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-soft)", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.name || currentUser.email}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.email}
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: "4px 6px",
                  borderRadius: "4px",
                  flexShrink: 0
                }}
              >
                Sign out
              </button>
            )}
          </div>
        )}
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
