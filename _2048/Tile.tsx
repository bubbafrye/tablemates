import { Lighting, LightingBurn } from "./Lighting";
import { tileGlow, tileTint } from "./tileColors";
import styles from "./Tile.module.css";

type TileProps = {
  value: number;
  /** Play spawn pop when this tile just appeared. */
  pop?: boolean;
  /**
   * Skip SVG text filter (re-rasterizes every transform frame → jank).
   * Used while the board is sliding.
   */
  lite?: boolean;
};

/**
 * Figma `tile` (`213:154683` / tile-2 `213:154651`):
 * tile-base → tint (overlay) → tile-text → lighting speculars → color-burn.
 * Color-burn is a sibling of tint (not nested under lighting) so mix-blend works.
 */
export function Tile({ value, pop = false, lite = false }: TileProps) {
  const glow = tileGlow(value);
  return (
    <div
      className={[styles.root, pop ? styles.pop : ""].filter(Boolean).join(" ")}
      data-name={`tile-${value}`}
      data-node-id="213:154683"
      style={glow ? { boxShadow: glow } : undefined}
    >
      <div className={styles.base} data-name="tile-base" data-node-id="243:24471">
        <div className={styles.edge} data-name="edge" />
        <div className={styles.face} data-name="face" />
      </div>
      <div
        className={styles.tint}
        data-name="tint"
        style={{ background: tileTint(value) }}
      />
      {/* Speculars + color-burn under tile-text. */}
      <Lighting />
      <LightingBurn />
      <p
        className={[styles.label, lite ? styles.labelLite : ""].filter(Boolean).join(" ")}
        data-name="tile-text"
        data-node-id="243:24508"
      >
        {value}
      </p>
    </div>
  );
}
