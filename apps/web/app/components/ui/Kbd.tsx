import { HTMLAttributes } from "react";
import styles from "./Kbd.module.css";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Kbd({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd {...props} className={joinClassNames(styles.kbd, className)}>
      {children}
    </kbd>
  );
}
