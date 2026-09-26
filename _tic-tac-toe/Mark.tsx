import { withBasePath } from "@/platform/site";
import type { Mark } from "./logic";
import styles from "./Mark.module.css";

type MarkProps = {
  mark: Mark;
  size?: "med" | "sm" | "xsm";
};

const SRC: Record<Mark, Record<NonNullable<MarkProps["size"]>, string>> = {
  X: {
    med: "/assets/tic-tac-toe/x-med.svg",
    sm: "/assets/tic-tac-toe/x-sm.svg",
    xsm: "/assets/tic-tac-toe/x-xsm.svg",
  },
  O: {
    med: "/assets/tic-tac-toe/o-med.svg",
    sm: "/assets/tic-tac-toe/o-sm.svg",
    xsm: "/assets/tic-tac-toe/o-xsm.svg",
  },
};

export function MarkIcon({ mark, size = "med" }: MarkProps) {
  const dimensions = size === "xsm" ? { width: 35, height: 37 } : size === "sm" ? { width: 112, height: 112 } : { width: 168, height: 168 };

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
