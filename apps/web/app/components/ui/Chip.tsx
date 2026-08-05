import { ButtonHTMLAttributes, HTMLAttributes } from "react";
import styles from "./Chip.module.css";

type ChipTone = "default" | "active" | "warning" | "success" | "danger";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
}

interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ChipTone;
}

export function Chip({ children, className, tone = "default", ...props }: ChipProps) {
  return (
    <span
      {...props}
      className={joinClassNames(
        styles.chip,
        tone !== "default" && styles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ChipButton({
  children,
  className,
  tone = "default",
  type = "button",
  ...props
}: ChipButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={joinClassNames(
        styles.chip,
        styles.buttonChip,
        tone !== "default" && styles[tone],
        className
      )}
    >
      {children}
    </button>
  );
}
