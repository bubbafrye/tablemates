"use client";

import { useEffect, useState } from "react";
import type { Board, TileMotion } from "./logic";
import { SIZE, cellOffset } from "./logic";
import { Tile } from "./Tile";
import { TileTextFilterDefs } from "./TileTextFilter";
import { Tray } from "./Tray";
import styles from "./GameTray.module.css";

export const SLIDE_MS = 140;

type GameTrayProps = {
  board: Board;
  /** Indices that should play the spawn / merge pop this paint. */
  popIndices?: ReadonlySet<number>;
  /**
   * Active slide: tiles animate from `from` → `to`.
   * When set, board cells that are motion sources are hidden (drawn as movers).
   */
  motions?: TileMotion[] | null;
};

type AnimTile = {
  key: string;
  value: number;
  index: number;
  pop: boolean;
};

/**
 * Figma `game-tray` (`268:25969`) — floor + duplicated edge (upper/lower masks) + tiles.
 * Paint: base → upperframe (behind) → tiles → lowerframe (in front).
 */
export function GameTray({ board, popIndices, motions = null }: GameTrayProps) {
  const sliding = Boolean(motions && motions.length > 0);
  const [slideProgressed, setSlideProgressed] = useState(false);

  useEffect(() => {
    if (!sliding) {
      setSlideProgressed(false);
      return;
    }
    setSlideProgressed(false);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSlideProgressed(true);
      return;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSlideProgressed(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [sliding, motions]);

  const leaving = new Set(motions?.map((m) => m.from) ?? []);

  const staticTiles: AnimTile[] = [];
  if (!sliding) {
    for (let i = 0; i < SIZE * SIZE; i++) {
      const value = board[i] ?? 0;
      if (value > 0) {
        staticTiles.push({
          key: `c${i}-${value}`,
          value,
          index: i,
          pop: popIndices?.has(i) ?? false,
        });
      }
    }
  } else {
    for (let i = 0; i < SIZE * SIZE; i++) {
      const value = board[i] ?? 0;
      if (value > 0 && !leaving.has(i)) {
        staticTiles.push({
          key: `stay-${i}`,
          value,
          index: i,
          pop: false,
        });
      }
    }
  }

  return (
    <div className={styles.root} data-name="game-tray" data-node-id="268:25969">
      <TileTextFilterDefs />
      <div className={styles.base} data-name="base">
        <Tray variant="floor" />
      </div>

      <div className={styles.upperframe} data-name="upperframe">
        <div className={styles.upperEdge}>
          <Tray variant="edge" />
        </div>
      </div>

      <div className={styles.tiles} data-name="tiles">
        {staticTiles.map((t) => {
          const { x, y } = cellOffset(t.index);
          return (
            <div
              key={t.key}
              className={styles.tileAbs}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <Tile value={t.value} pop={t.pop} />
            </div>
          );
        })}

        {motions?.map((m) => {
          const pos = cellOffset(slideProgressed ? m.to : m.from);
          return (
            <div
              key={m.key}
              className={[
                styles.tileAbs,
                styles.tileSliding,
                slideProgressed ? styles.tileSlidingGo : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            >
              <Tile value={m.value} />
            </div>
          );
        })}
      </div>

      <div className={styles.lowerframe} data-name="lowerframe">
        <div className={styles.lowerEdge}>
          <Tray variant="edge" />
        </div>
      </div>
    </div>
  );
}
