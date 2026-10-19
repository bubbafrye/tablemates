import { withBasePath } from "@/platform/site";
import styles from "./Lighting.module.css";

/**
 * Figma `lighting` (`242:23026`) — specular unions only.
 * Color-burn must be a *sibling* of the tint (see Tile), not nested here:
 * a positioned+z-indexed parent creates a stacking context that traps
 * mix-blend-mode so the burn paints opaque white instead of blending.
 */
export function Lighting() {
  return (
    <div className={styles.root} data-name="lighting" data-node-id="242:23026" aria-hidden>
      <img
        className={`${styles.unionTl} ${styles.img}`}
        src={withBasePath("/assets/2048/lighting-union-tl.svg")}
        alt=""
        data-name="Union"
      />
      <img
        className={`${styles.unionTl2} ${styles.img}`}
        src={withBasePath("/assets/2048/lighting-union-mid2.svg")}
        alt=""
        data-name="Union"
      />
      <div className={styles.unionBrWrap}>
        <img
          className={styles.unionBr}
          src={withBasePath("/assets/2048/lighting-union-br.svg")}
          alt=""
          data-name="Union"
        />
      </div>
      <img
        className={`${styles.rectTl} ${styles.img}`}
        src={withBasePath("/assets/2048/lighting-rect-tl.svg")}
        alt=""
      />
      <div className={styles.rectBrWrap}>
        <img className={styles.rectBr} src={withBasePath("/assets/2048/lighting-rect-br.svg")} alt="" />
      </div>
      <img
        className={`${styles.rectTlDup} ${styles.img}`}
        src={withBasePath("/assets/2048/lighting-rect-tl.svg")}
        alt=""
      />
    </div>
  );
}

/** Figma 242:22912 — must sit as a direct child of the isolated tile root. */
export function LightingBurn() {
  return (
    <div
      className={styles.burn}
      data-name="color-burn"
      data-node-id="242:22912"
      aria-hidden
    />
  );
}
