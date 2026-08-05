import { ReactNode } from "react";
import styles from "./AppShell.module.css";

interface AppShellProps {
  detail: ReactNode;
  hasActiveDetail: boolean;
  list: ReactNode;
  onCloseDetail: () => void;
  sidebar: ReactNode;
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function AppShell({ detail, hasActiveDetail, list, onCloseDetail, sidebar }: AppShellProps) {
  return (
    <main className={styles.appShell}>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>{sidebar}</aside>
        <section className={styles.list}>{list}</section>
        <div
          className={joinClassNames(styles.detailBackdrop, hasActiveDetail && styles.detailBackdropVisible)}
          aria-hidden={!hasActiveDetail}
          onClick={onCloseDetail}
        />
        <section
          className={joinClassNames(styles.detail, hasActiveDetail && styles.detailVisible)}
          aria-hidden={!hasActiveDetail}
        >
          {detail}
        </section>
      </div>
    </main>
  );
}
