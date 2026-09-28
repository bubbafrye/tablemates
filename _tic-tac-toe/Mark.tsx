import { withBasePath } from "@/platform/site";
import type { Mark } from "./logic";
import styles from "./Mark.module.css";

type MarkProps = {
  mark: Mark;
  /** sm = board 740+, boardXsm = board <740, xsm = player badge */
  size?: "sm" | "boardXsm" | "xsm";
};

/**
 * Board marks use SVG (transparent on wood) + CSS drop-shadow for the Figma
 * ground shadow. SVG filters are stripped — they paint opaque boxes on mobile.
 */
const SRC: Record<Mark, Record<NonNullable<MarkProps["size"]>, string>> = {
  X: {
    sm: "/assets/tic-tac-toe/x-sm.svg",
    boardXsm: "/assets/tic-tac-toe/x-board-xsm.svg",
    xsm: "/assets/tic-tac-toe/x-xsm.svg",
  },
  O: {
    sm: "/assets/tic-tac-toe/o-sm.svg",
    boardXsm: "/assets/tic-tac-toe/o-board-xsm.svg",
    xsm: "/assets/tic-tac-toe/o-xsm.svg",
  },
};

/**
 * Percentages of the Figma XO frame so marks scale with the cell.
 * Values derived from nodes 26:5601 (sm) / 26:8021 (xsm).
 */
const LAYOUT: Record<
  Mark,
  Record<
    "sm" | "boardXsm",
    {
      frameW: number;
      frameH: number;
      /** left/top/width/height as % of frame */
      glyph: { left: number; top: number; width: number; height: number };
      /** top/right/bottom/left bleed % relative to glyph (Figma overflow insets) */
      bleed: [number, number, number, number];
    }
  >
> = {
  X: {
    sm: {
      frameW: 112,
      frameH: 112,
      glyph: { left: 12.054, top: 10.714, width: 75.893, height: 78.207 },
      bleed: [9.13, 14.12, 18.27, 14.12],
    },
    boardXsm: {
      frameW: 61,
      frameH: 64,
      glyph: { left: 8.361, top: 5.609, width: 81.967, height: 80.508 },
      bleed: [5.82, 10, 15.53, 10],
    },
  },
  O: {
    sm: {
      frameW: 112,
      frameH: 112,
      glyph: { left: 12.054, top: 9.821, width: 75.893, height: 80.41 },
      bleed: [6.66, 11.76, 15.55, 11.76],
    },
    boardXsm: {
      frameW: 60,
      frameH: 64,
      glyph: { left: 8.333, top: 4.688, width: 83.333, height: 82.775 },
      bleed: [5.66, 10, 15.1, 10],
    },
  },
};

const BADGE_DIM = { width: 35, height: 37 };

export function MarkIcon({ mark, size = "sm" }: MarkProps) {
  if (size === "xsm") {
    return (
      <img
        className={`${styles.mark} ${styles.xsm}`}
        src={withBasePath(SRC[mark].xsm)}
        alt=""
        width={BADGE_DIM.width}
        height={BADGE_DIM.height}
      />
    );
  }

  const layout = LAYOUT[mark][size];
  const [bleedT, bleedR, bleedB, bleedL] = layout.bleed;
  const shadowClass = size === "sm" ? styles[`shadow${mark}Sm`] : styles[`shadow${mark}Xsm`];

  return (
    <span
      className={`${styles.slot} ${shadowClass}`}
      style={{ aspectRatio: `${layout.frameW} / ${layout.frameH}` }}
    >
      <span
        className={styles.glyph}
        style={{
          left: `${layout.glyph.left}%`,
          top: `${layout.glyph.top}%`,
          width: `${layout.glyph.width}%`,
          height: `${layout.glyph.height}%`,
        }}
      >
        <span
          className={styles.bleed}
          style={{
            top: `-${bleedT}%`,
            right: `-${bleedR}%`,
            bottom: `-${bleedB}%`,
            left: `-${bleedL}%`,
          }}
        >
          <img className={styles.bleedImg} src={withBasePath(SRC[mark][size])} alt="" />
        </span>
      </span>
    </span>
  );
}
