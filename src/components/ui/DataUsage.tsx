import styles from "./DataUsage.module.css";

export type DataUsageProps = {
  /** Left label — Figma `243:24324`. */
  label?: string;
  /** Right value — Figma `243:24329`, e.g. `99 of 32GB`. */
  valueLabel: string;
  /** Fill amount 0–1 — Figma `progress` / `bar`. */
  progress: number;
  className?: string;
};

/**
 * Figma `data-usage` (`243:24350`): label row + bordered progress track.
 * SoT: https://www.figma.com/design/tE15PVyJVeYZ6XP0d0xfMc/tablemates?node-id=243-24350
 */
export function DataUsage({
  label = "Durable Object Data Usage",
  valueLabel,
  progress,
  className,
}: DataUsageProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-name="data-usage"
      data-node-id="243:24350"
    >
      <div className={styles.text} data-name="text">
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{valueLabel}</p>
      </div>
      <div
        className={styles.progress}
        data-name="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={label}
      >
        <div
          className={styles.bar}
          data-name="bar"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
