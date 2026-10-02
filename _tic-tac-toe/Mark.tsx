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
    sm: "/assets/tic-tac-toe/x-sm.png",
    boardXsm: "/assets/tic-tac-toe/x-xsm.png",
    xsm: "/assets/tic-tac-toe/x-xsm.png",
  },
  O: {
    sm: "/assets/tic-tac-toe/o-sm.png",
    boardXsm: "/assets/tic-tac-toe/o-xsm.png",
    xsm: "/assets/tic-tac-toe/o-xsm.png",
  },
};

/**
 * Mark width as % of a base-face cell (even 3×3 over base).
 * sm: Figma 112 on 400 face → 84% of cell.
 * boardXsm: Figma ~61 on 320 face → 57% of cell.
 * Shadows are baked into the flattened PNGs.
 */
const CELL_WIDTH_PCT: Record<"sm" | "boardXsm", number> = {
  sm: 84,
  boardXsm: 57,
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

  return (
    <img
      className={styles.boardMark}
      src={withBasePath(SRC[mark][size])}
      alt=""
      style={{ width: `${CELL_WIDTH_PCT[size]}%` }}
    />
  );
}
