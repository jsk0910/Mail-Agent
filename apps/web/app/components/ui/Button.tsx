import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  compact?: boolean;
  icon?: ReactNode;
  shortcut?: string;
  tooltip?: string;
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Button({
  children,
  className,
  compact = false,
  icon,
  shortcut,
  tooltip,
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={joinClassNames(
        styles.button,
        styles[variant],
        compact && styles.compact,
        className
      )}
    >
      <span className={styles.content}>
        {icon}
        {children}
      </span>
      {(tooltip || shortcut) && (
        <span className={styles.tooltip} role="tooltip">
          {tooltip}
          {shortcut && <span className={styles.tooltipShortcut}>{shortcut}</span>}
        </span>
      )}
    </button>
  );
}
