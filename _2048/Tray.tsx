import type { CSSProperties } from "react";
import { withBasePath } from "@/platform/site";
import styles from "./Tray.module.css";

type TrayProps = {
  variant?: "floor" | "edge";
  className?: string;
  style?: CSSProperties;
};

/** Figma `tray` floor (`217:12169`) / edge (`213:154934`). */
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
          src={withBasePath("/assets/2048/tray-edge.svg?v=ds1")}
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
      <div className={styles.recess} data-name="Recessed interior" data-node-id="217:12148">
        {/*
          Figma `Tile grid` (`217:12150`) — vector `307:49625` at (15,9) 406×421
          inside a full 434×434 frame. Lines baked in tray-grid.svg.
        */}
        <img
          className={styles.grid}
          src={withBasePath("/assets/2048/tray-grid.svg?v=y9")}
          alt=""
          width={434}
          height={434}
          data-name="Tile grid"
          data-node-id="217:12150"
          aria-hidden
          draggable={false}
        />
      </div>
    </div>
  );
}
