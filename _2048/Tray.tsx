import type { CSSProperties } from "react";
import { withBasePath } from "@/platform/site";
import styles from "./Tray.module.css";

type TrayProps = {
  variant?: "floor" | "edge";
  className?: string;
  style?: CSSProperties;
};

/** Figma `tray` (`213:154933`) — recessed floor grid or edge chrome. */
export function Tray({ variant = "floor", className, style }: TrayProps) {
  if (variant === "edge") {
    return (
      <div
        className={[styles.edgeWrap, className].filter(Boolean).join(" ")}
        style={style}
        data-name="tray"
        data-variant="edge"
        data-node-id="213:154934"
      >
        <img
          className={styles.edgeImg}
          src={withBasePath("/assets/2048/tray-edge.svg")}
          alt=""
          width={452}
          height={458}
        />
      </div>
    );
  }

  return (
    <div
      className={[styles.floor, className].filter(Boolean).join(" ")}
      style={style}
      data-name="tray"
      data-variant="floor"
      data-node-id="217:12169"
    >
      <div className={styles.recess} data-name="Recessed interior">
        <div className={styles.grid} data-name="Tile grid" aria-hidden>
          <span className={`${styles.dividerH} ${styles.d1}`} />
          <span className={`${styles.highlightH} ${styles.h1}`} />
          <span className={`${styles.dividerV} ${styles.vd1}`} />
          <span className={`${styles.highlightV} ${styles.vh1}`} />
          <span className={`${styles.dividerH} ${styles.d2}`} />
          <span className={`${styles.highlightH} ${styles.h2}`} />
          <span className={`${styles.dividerV} ${styles.vd2}`} />
          <span className={`${styles.highlightV} ${styles.vh2}`} />
          <span className={`${styles.dividerH} ${styles.d3}`} />
          <span className={`${styles.highlightH} ${styles.h3}`} />
          <span className={`${styles.dividerV} ${styles.vd3}`} />
          <span className={`${styles.highlightV} ${styles.vh3}`} />
        </div>
      </div>
    </div>
  );
}
