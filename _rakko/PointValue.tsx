import styles from "./PointValue.module.css";

export type PointValueVariant = "default" | "mid-total" | "total";

type PointValueProps = {
  /** Slot points: 50 (top) … 5 (bottom). */
  value: number;
  variant?: PointValueVariant;
};

/** Figma point-value (202:143086): Default | mid-total | total. */
export function PointValue({ value, variant = "default" }: PointValueProps) {
  const variantClass =
    variant === "total"
      ? styles.total
      : variant === "mid-total"
        ? styles.midTotal
        : styles.defaultVariant;

  return (
    <div
      className={`${styles.root} ${variantClass}`}
      data-name="point-value"
      data-variant={variant}
      aria-hidden
    >
      <span className={styles.label}>{value}</span>
    </div>
  );
}
