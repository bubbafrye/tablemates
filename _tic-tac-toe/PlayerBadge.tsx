import type { Mark } from "./logic";
import { MarkIcon } from "./Mark";
import styles from "./PlayerBadge.module.css";

type PlayerBadgeProps = {
  mark: Mark;
  name: string;
  active: boolean;
};

export function PlayerBadge({ mark, name, active }: PlayerBadgeProps) {
  return (
    <div
      className={`${styles.player} ${active ? styles.active : styles.inactive}`}
      data-name="player"
      data-active={active ? "true" : "false"}
    >
      <MarkIcon mark={mark} size="xsm" />
      <span className={styles.name}>{name}</span>
    </div>
  );
}
