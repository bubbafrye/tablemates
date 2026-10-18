import { DataUsage } from "./DataUsage";
import styles from "./DashboardProgress.module.css";

export type DashboardProgressProps = {
  label?: string;
  valueLabel: string;
  progress: number;
  /** Bold segment — Figma e.g. `23h 13m`. */
  resetDuration: string;
  /** Trailing detail inside parens — e.g. `00:00 UTC · 5:00 PM PDT local`. */
  resetDetail: string;
  className?: string;
};

/**
 * Figma `dashboard-progress` (`243:24352`): data-usage + next-reset line.
 * SoT: https://www.figma.com/design/tE15PVyJVeYZ6XP0d0xfMc/tablemates?node-id=243-24352
 */
export function DashboardProgress({
  label,
  valueLabel,
  progress,
  resetDuration,
  resetDetail,
  className,
}: DashboardProgressProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-name="dashboard-progress"
      data-node-id="243:24352"
    >
      <DataUsage label={label} valueLabel={valueLabel} progress={progress} />
      <p className={styles.reset}>
        <span>Next reset in </span>
        <strong className={styles.resetDuration}>{resetDuration}</strong>
        <span>{` (${resetDetail}).`}</span>
      </p>
    </div>
  );
}
