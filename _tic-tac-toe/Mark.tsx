import { withBasePath } from "@/platform/site";
import type { Mark } from "./logic";
import styles from "./Mark.module.css";

type MarkProps = {
  mark: Mark;
  /** sm = board 740+, boardXsm = board <740, xsm = player badge */
  size?: "sm" | "boardXsm" | "xsm";
};

/** Board marks use PNG so Safari/Chrome render Figma drop shadows correctly (SVG filters in <img> break). */
const SRC: Record<Mark, Record<NonNullable<MarkProps["size"]>, string>> = {
  X: {
    sm: "/assets/tic-tac-toe/x-sm.png",
    boardXsm: "/assets/tic-tac-toe/x-board-xsm.png",
    xsm: "/assets/tic-tac-toe/x-xsm.svg",
  },
  O: {
    sm: "/assets/tic-tac-toe/o-sm.png",
    boardXsm: "/assets/tic-tac-toe/o-board-xsm.png",
    xsm: "/assets/tic-tac-toe/o-xsm.svg",
  },
};

/** Slot = Figma XO frame; glyph = mark art box before shadow bleed. */
const LAYOUT: Record<
  Mark,
  Record<
    "sm" | "boardXsm",
    {
      slotW: number;
      slotH: number;
      glyphW: number;
      glyphH: number;
      left: number;
      top: number;
      bleed: [number, number, number, number];
    }
  >
> = {
  X: {
    sm: {
      slotW: 112,
      slotH: 112,
      glyphW: 85,
      glyphH: 87.592,
      left: 13.5,
      top: 12,
      bleed: [9.13, 14.12, 18.27, 14.12],
    },
    boardXsm: {
      slotW: 61,
      slotH: 64,
      glyphW: 50,
      glyphH: 51.525,
      left: 5.1,
      top: 3.59,
      bleed: [5.82, 10, 15.53, 10],
    },
  },
  O: {
    sm: {
      slotW: 112,
      slotH: 112,
      glyphW: 85,
      glyphH: 90.059,
      left: 13.5,
      top: 11,
      bleed: [6.66, 11.76, 15.55, 11.76],
    },
    boardXsm: {
      slotW: 60,
      slotH: 64,
      glyphW: 50,
      glyphH: 52.976,
      left: 5,
      top: 3,
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

  return (
    <span
      className={`${styles.slot} ${styles[size]}`}
      style={{ width: layout.slotW, height: layout.slotH }}
    >
      <span
        className={styles.glyph}
        style={{
          width: layout.glyphW,
          height: layout.glyphH,
          left: layout.left,
          top: layout.top,
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
