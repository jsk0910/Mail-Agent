import { Account } from "@mail-agent/shared";
import { Button } from "./ui/Button";
import { Chip } from "./ui/Chip";
import styles from "./SettingsSheet.module.css";

interface SettingsSheetProps {
  accounts: Account[];
  aiEnabledByAccount: Record<string, boolean>;
  open: boolean;
  onClose: () => void;
  onToggleAi: (accountId: string) => void;
}

export function SettingsSheet({
  accounts,
  aiEnabledByAccount,
  open,
  onClose,
  onToggleAi
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
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Connected accounts</h3>
              <Chip>{accounts.length} active</Chip>
            </div>
            <div className={styles.cardList}>
              {accounts.map((account) => (
                <article key={account.id} className={styles.accountCard}>
                  <div className={styles.accountCopy}>
                    <span className={styles.accountTitle}>{account.displayName}</span>
                    <span className={styles.accountMeta}>
                      {account.email} · {account.provider}
                    </span>
                  </div>
                  <Chip tone={account.syncStatus === "error" ? "danger" : account.syncStatus === "running" ? "active" : "success"}>
                    {account.syncStatus === "running"
                      ? "Syncing"
                      : account.syncStatus === "error"
                        ? "Needs reconnect"
                        : "Connected"}
                  </Chip>
                </article>
              ))}
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

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Next actions</h3>
            </div>
            <div className={styles.cardList}>
              <article className={styles.infoCard}>
                <span className={styles.accountTitle}>Add account</span>
                <span className={styles.accountMeta}>
                  Gmail, IMAP, and Outlook connection flows will land in this sheet next.
                </span>
              </article>
              <article className={styles.infoCard}>
                <span className={styles.accountTitle}>Manage labels</span>
                <span className={styles.accountMeta}>
                  Label creation and organization are still handled from the message workflow.
                </span>
              </article>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
