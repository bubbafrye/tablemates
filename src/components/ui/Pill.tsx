import { withBasePath } from "@/platform/site";
import type { GameType } from "@/platform/gamesData";
import styles from "./Pill.module.css";

export type PillKind = "controller" | "player-count" | `type-${GameType}`;

type PillProps = {
  kind: PillKind;
  /** Figma `pill/player-count` label — CSV `player-count` cell. */
  label?: string;
};

const TYPE_ICON: Record<
  GameType,
  { src: string; width: number; height: number; label: string }
> = {
  puzzle: {
    src: "/assets/pills/type-puzzle.svg",
    width: 45,
    height: 20,
    label: "Puzzle",
  },
  arcade: {
    src: "/assets/pills/type-arcade.svg",
    width: 14,
    height: 13.0667,
    label: "Arcade",
  },
  card: {
    src: "/assets/pills/type-card.svg",
    width: 17,
    height: 13.5584,
    label: "Card",
  },
};

export function Pill({ kind, label }: PillProps) {
  if (kind === "player-count") {
    return (
      <span
        className={styles.count}
        data-name="pill"
        data-kind="player-count"
        data-node-id="327:53945"
      >
        {label}
      </span>
    );
  }

  if (kind === "controller") {
    return (
      <span
        className={styles.iconPill}
        data-name="pill"
        data-kind="controller"
        data-node-id="327:53939"
        role="img"
        aria-label="Controller"
      >
        <img
          src={withBasePath("/assets/pills/controller.svg")}
          alt=""
          width={45}
          height={20}
        />
      </span>
    );
  }

  const type = kind.slice("type-".length) as GameType;
  const icon = TYPE_ICON[type];
  const puzzle = type === "puzzle";

  return (
    <span
      className={puzzle ? styles.iconPill : styles.shell}
      data-name="pill"
      data-kind={kind}
      role="img"
      aria-label={icon.label}
    >
      <img
        className={puzzle ? undefined : styles.typeIcon}
        src={withBasePath(icon.src)}
        alt=""
        width={icon.width}
        height={icon.height}
      />
    </span>
  );
}
