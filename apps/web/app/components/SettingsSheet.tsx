import { Account } from "@mail-agent/shared";
import { Button } from "./ui/Button";
import { Chip } from "./ui/Chip";
import styles from "./SettingsSheet.module.css";

interface SettingsSheetProps {
  currentUser?: { email: string; name?: string } | null;
  onLogout?: () => void;
  accounts: Account[];
  aiEnabledByAccount: Record<string, boolean>;
  open: boolean;
  onClose: () => void;
  onToggleAi: (accountId: string) => void;
  onConnectGoogle?: () => void;
  onSyncAccount?: (accountId: string) => void;
  syncingAccountId?: string | null;
}

export function SettingsSheet({
  currentUser,
  onLogout,
  accounts,
  aiEnabledByAccount,
  open,
  onClose,
  onToggleAi,
  onConnectGoogle,
  onSyncAccount,
  syncingAccountId
}: SettingsSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <aside
        className={styles.sheet}
        aria-label="Settings"
        aria-modal="true"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Settings</p>
            <h2 className={styles.title}>Accounts and AI controls</h2>
            <p className={styles.subcopy}>
              Manage connected sources and review account-level AI preferences.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className={styles.body}>
          {currentUser && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Signed in user</h3>
                {onLogout && (
                  <Button compact type="button" variant="secondary" onClick={onLogout}>
                    Sign out
                  </Button>
                )}
              </div>
              <div className={styles.cardList}>
                <article className={styles.accountCard}>
                  <div className={styles.accountCopy}>
                    <span className={styles.accountTitle}>{currentUser.name || currentUser.email}</span>
                    <span className={styles.accountMeta}>{currentUser.email}</span>
                  </div>
                  <Chip tone="active">Active Session</Chip>
                </article>
              </div>
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Connected accounts</h3>
              <Chip>{accounts.length} active</Chip>
            </div>
            <div className={styles.cardList}>
              {accounts.length === 0 ? (
                <div className={styles.infoCard}>
                  <span className={styles.accountMeta}>No accounts connected yet. Add one below.</span>
                </div>
              ) : (
                accounts.map((account) => (
                  <article key={account.id} className={styles.accountCard}>
                    <div className={styles.accountCopy}>
                      <span className={styles.accountTitle}>{account.displayName}</span>
                      <span className={styles.accountMeta}>
                        {account.email} · {account.provider}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Chip tone={account.syncStatus === "error" ? "danger" : account.syncStatus === "running" ? "active" : "success"}>
                        {account.syncStatus === "running"
                          ? "Syncing"
                          : account.syncStatus === "error"
                            ? "Needs reconnect"
                            : "Connected"}
                      </Chip>
                      {onSyncAccount && (
                        <Button
                          compact
                          type="button"
                          variant="secondary"
                          disabled={syncingAccountId === account.id}
                          onClick={() => onSyncAccount(account.id)}
                        >
                          {syncingAccountId === account.id ? "Syncing..." : "Sync"}
                        </Button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Add account</h3>
            </div>
            <div className={styles.cardList}>
              <article className={styles.infoCard} style={{ gap: "8px" }}>
                <span className={styles.accountTitle}>Google (Gmail)</span>
                <span className={styles.accountMeta}>
                  Connect with OAuth to sync mail, threads, and labels directly from Gmail.
                </span>
                {onConnectGoogle && (
                  <Button
                    compact
                    type="button"
                    variant="primary"
                    onClick={onConnectGoogle}
                  >
                    Connect Google Account
                  </Button>
                )}
              </article>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>AI preferences</h3>
              <Chip tone="active">User-controlled</Chip>
            </div>
            <div className={styles.cardList}>
              {accounts.map((account) => (
                <article key={account.id} className={styles.preferenceCard}>
                  <div className={styles.accountCopy}>
                    <span className={styles.accountTitle}>{account.displayName}</span>
                    <span className={styles.accountMeta}>
                      {aiEnabledByAccount[account.id] === false
                        ? "AI summaries and suggestions paused for this source."
                        : "AI summaries and suggestions available for this source."}
                    </span>
                  </div>
                  <Button
                    compact
                    type="button"
                    variant={aiEnabledByAccount[account.id] === false ? "secondary" : "primary"}
                    onClick={() => onToggleAi(account.id)}
                  >
                    {aiEnabledByAccount[account.id] === false ? "Enable AI" : "Disable AI"}
                  </Button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
