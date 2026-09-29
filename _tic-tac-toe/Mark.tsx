import { withBasePath } from "@/platform/site";
import type { Mark } from "./logic";
import styles from "./Mark.module.css";

type MarkProps = {
  mark: Mark;
  /** sm = board 740+, boardXsm = board <740, xsm = player badge */
  size?: "sm" | "boardXsm" | "xsm";
};

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

/** Mark width as % of a base-face cell (even 3×3 over .base). */
const CELL_WIDTH_PCT: Record<"sm" | "boardXsm", number> = {
  sm: 84,
  boardXsm: 57,
};

const FRAME_RATIO: Record<"sm" | "boardXsm", string> = {
  sm: "1 / 1",
  boardXsm: "61 / 64",
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

  const shadowClass = size === "sm" ? styles[`shadow${mark}Sm`] : styles[`shadow${mark}Xsm`];

  return (
    <img
      className={`${styles.boardMark} ${shadowClass}`}
      src={withBasePath(SRC[mark][size])}
      alt=""
      style={{
        width: `${CELL_WIDTH_PCT[size]}%`,
        aspectRatio: FRAME_RATIO[size],
      }}
    />
  );
}
