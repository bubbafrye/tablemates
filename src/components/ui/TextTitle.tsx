import type { ReactNode } from "react";
import styles from "./TextTitle.module.css";

type TextTitleProps = {
  children: ReactNode;
  as?: "h2" | "h3" | "p";
};

export function TextTitle({ children, as: Tag = "h3" }: TextTitleProps) {
  return (
    <Tag className={styles.title} data-name="text-title">
      {children}
    </Tag>
  );
}
