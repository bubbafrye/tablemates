import type { CSSProperties } from "react";
import { withBasePath } from "@/platform/site";
import { TILE_ART } from "./tileArt.generated";
import { tileGlow } from "./tileColors";
import styles from "./Tile.module.css";

type TileProps = {
  value: number;
  /** Play spawn pop when this tile just appeared. */
  pop?: boolean;
};

function tileSrc(value: number): string {
  return withBasePath(`/assets/2048/tiles/${value}.png`);
}

const PRELOAD_VALUES = [
  2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384,
];
let preloaded = false;
function preloadTileArt() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  for (const value of PRELOAD_VALUES) {
    const img = new Image();
    img.src = tileSrc(value);
  }
}

/**
 * Figma `tile` (`213:154683`) — baked PNG per value (see scripts/export-2048-tiles.mjs).
 * Number + lighting + blends are in the asset for mobile-safe compositing.
 */
export function Tile({ value, pop = false }: TileProps) {
  preloadTileArt();
  const glow = tileGlow(value);
  const artStyle = {
    ...(glow ? { boxShadow: glow } : {}),
    "--tile-art-x": `${TILE_ART.offsetX}px`,
    "--tile-art-y": `${TILE_ART.offsetY}px`,
    "--tile-art-w": `${TILE_ART.imgWidth}px`,
    "--tile-art-h": `${TILE_ART.imgHeight}px`,
  } as CSSProperties;

  return (
    <div
      className={[styles.root, pop ? styles.pop : ""].filter(Boolean).join(" ")}
      data-name={`tile-${value}`}
      data-node-id="213:154683"
      style={artStyle}
    >
      <img
        className={styles.art}
        src={tileSrc(value)}
        alt=""
        width={TILE_ART.imgWidth}
        height={TILE_ART.imgHeight}
        draggable={false}
        decoding="sync"
        loading="eager"
      />
    </div>
  );
}
