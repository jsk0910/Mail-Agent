import { useEffect, useMemo, useRef } from "react";
import { SearchIcon } from "./icons";
import { Kbd } from "./ui/Kbd";
import styles from "./CommandPalette.module.css";

export interface CommandPaletteItem {
  category: string;
  id: string;
  subtitle?: string;
  title: string;
}

interface CommandPaletteProps {
  activeIndex: number;
  items: CommandPaletteItem[];
  open: boolean;
  query: string;
  onActiveIndexChange: (index: number) => void;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (item: CommandPaletteItem) => void;
}

export function CommandPalette({
  activeIndex,
  items,
  open,
  query,
  onActiveIndexChange,
  onClose,
  onQueryChange,
  onSelect
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    if (activeIndex < 0 || activeIndex >= items.length) {
      onActiveIndexChange(0);
    }
  }, [activeIndex, items, onActiveIndexChange]);

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, CommandPaletteItem[]>>((groups, item) => {
      groups[item.category] = [...(groups[item.category] || []), item];
      return groups;
    }, {});
  }, [items]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <section
        className={styles.palette}
        aria-label="Command palette"
        aria-modal="true"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <label className={styles.searchField}>
          <SearchIcon width={18} height={18} />
          <input
            ref={inputRef}
            aria-label="Type a command or search"
            placeholder="Type a command or search..."
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (!items.length) {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onClose();
                }
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                onActiveIndexChange(Math.min(activeIndex + 1, items.length - 1));
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                onActiveIndexChange(Math.max(activeIndex - 1, 0));
              }

              if (event.key === "Enter" && items[activeIndex]) {
                event.preventDefault();
                onSelect(items[activeIndex]);
              }

              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }
            }}
          />
          <Kbd>Esc</Kbd>
        </label>

        <div className={styles.results} role="listbox" aria-label="Command results">
          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No matches found</p>
              <p className={styles.emptyCopy}>Try a message subject, sender, or command like "settings".</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <section key={category} className={styles.group}>
                <p className={styles.groupLabel}>{category}</p>
                <div className={styles.groupList}>
                  {categoryItems.map((item) => {
                    const itemIndex = items.findIndex((entry) => entry.id === item.id);
                    const isActive = itemIndex === activeIndex;

                    return (
                      <button
                        key={item.id}
                        aria-selected={isActive}
                        className={`${styles.resultRow}${isActive ? ` ${styles.resultRowActive}` : ""}`}
                        type="button"
                        role="option"
                        onMouseEnter={() => onActiveIndexChange(itemIndex)}
                        onClick={() => onSelect(item)}
                      >
                        <div className={styles.resultCopy}>
                          <span className={styles.resultTitle}>{item.title}</span>
                          {item.subtitle && <span className={styles.resultSubtitle}>{item.subtitle}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerHint}>
            <Kbd>↑↓</Kbd>
            navigate
          </span>
          <span className={styles.footerHint}>
            <Kbd>Enter</Kbd>
            run
          </span>
          <span className={styles.footerHint}>
            <Kbd>⌘K</Kbd>
            global
          </span>
        </div>
      </section>
    </div>
  );
}
