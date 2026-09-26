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

const DIM: Record<NonNullable<MarkProps["size"]>, { width: number; height: number }> = {
  sm: { width: 112, height: 112 },
  boardXsm: { width: 61, height: 64 },
  xsm: { width: 35, height: 37 },
};

export function MarkIcon({ mark, size = "sm" }: MarkProps) {
  const dimensions = DIM[size];

  return (
    <img
      className={`${styles.mark} ${styles[size]}`}
      src={withBasePath(SRC[mark][size])}
      alt=""
      width={dimensions.width}
      height={dimensions.height}
    />
  );
}
