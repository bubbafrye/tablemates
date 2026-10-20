"use client";

import { useEffect, useRef, useState, type TransitionEvent } from "react";
import type { Board, TileMotion } from "./logic";
import { SIZE, cellOffset } from "./logic";
import { Tile } from "./Tile";
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
  /** Fires once when the CSS slide transition finishes (or immediately if reduced). */
  onSlideComplete?: () => void;
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
export function GameTray({
  board,
  popIndices,
  motions = null,
  onSlideComplete,
}: GameTrayProps) {
  const sliding = Boolean(motions && motions.length > 0);
  const [slideProgressed, setSlideProgressed] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onSlideComplete);
  onCompleteRef.current = onSlideComplete;

  useEffect(() => {
    completedRef.current = false;
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
      onCompleteRef.current?.();
      return;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSlideProgressed(true));
    });
    /* Fallback if transitionend is skipped (tab background, etc.). */
    const fallback = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current?.();
    }, SLIDE_MS + 50);
    return () => {
      window.cancelAnimationFrame(id);
      window.clearTimeout(fallback);
    };
  }, [sliding, motions]);

  function handleSlideTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "transform") return;
    if (event.target !== event.currentTarget) return;
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.();
  }

  const leaving = new Set(motions?.map((m) => m.from) ?? []);
  const destSeen = new Map<number, number>();

  const staticTiles: AnimTile[] = [];
  if (!sliding) {
    for (let i = 0; i < SIZE * SIZE; i++) {
      const value = board[i] ?? 0;
      if (value > 0) {
        staticTiles.push({
          /* Stable per cell so a landed slide reuses the same DOM node. */
          key: `cell-${i}`,
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
          key: `cell-${i}`,
          value,
          index: i,
          pop: false,
        });
      }
    }
  }

  return (
    <div className={styles.root} data-name="game-tray" data-node-id="268:25969">
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
              style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
            >
              <Tile value={t.value} pop={t.pop} />
            </div>
          );
        })}

        {motions?.map((m, i) => {
          const pos = cellOffset(slideProgressed ? m.to : m.from);
          const seen = destSeen.get(m.to) ?? 0;
          destSeen.set(m.to, seen + 1);
          /* Non-merge (and the first merge source) keep `cell-${to}` so React
             does not remount the <img> when the slide commits. */
          const key =
            seen === 0 ? `cell-${m.to}` : m.key;
          const value =
            seen === 0 && slideProgressed && m.mergedResult
              ? m.mergedResult
              : m.value;
          return (
            <div
              key={key}
              className={[
                styles.tileAbs,
                styles.tileSliding,
                slideProgressed ? styles.tileSlidingGo : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
              onTransitionEnd={i === 0 ? handleSlideTransitionEnd : undefined}
            >
              <Tile value={value} />
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
