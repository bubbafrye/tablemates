import type { CSSProperties } from "react";
import { withBasePath } from "@/platform/site";
import styles from "./Card.module.css";

type CardProps = {
  value?: number;
  face?: "front" | "back";
  selected?: boolean;
  stacked?: boolean;
  compact?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

/** Figma card-base: cream face + Anton cascade + value, or cyan diamond back. */
export function Card({
  value = 1,
  face = "front",
  selected = false,
  stacked = false,
  compact = false,
  style,
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
}: CardProps) {
  const Tag = onClick ? "button" : "div";
  const teeth = face === "front" ? Math.max(1, Math.min(60, value)) : 0;
  const className = [
    styles.card,
    selected ? styles.selected : "",
    stacked ? styles.stacked : "",
    compact ? styles.compact : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={className}
      style={style}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      aria-label={ariaLabel ?? (face === "back" ? "Card back" : `Card ${value}`)}
      data-name="card-base"
      data-face={face}
      data-interactive={onClick ? "true" : undefined}
    >
      <span className={styles.face} data-name="card">
        {face === "back" ? null : (
          <>
            {/* Only the value at its cascade index; preceding number slots are omitted. */}
            <span className={styles.cascade} aria-hidden>
              <span
                className={styles.tooth}
                style={{ left: `${(teeth - 1) * 5}px`, zIndex: teeth }}
              >
                {value}
              </span>
            </span>
          </>
        )}
      </span>
      {!compact ? (
        <img
          className={styles.slot}
          src={withBasePath("/assets/rakko/slot.svg")}
          alt=""
          width={364}
          height={8}
          aria-hidden
          data-name="slot"
        />
      ) : null}
    </Tag>
  );
}
