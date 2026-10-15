"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "@/platform/site";
import { Card } from "./Card";
import { PointValue, type PointValueVariant } from "./PointValue";
import {
  RACK_SIZE,
  ascendingStreak,
  pointValueVariant,
  slotPoints,
} from "./logic";
import styles from "./Rack.module.css";

type RackProps = {
  cards: number[];
  canSelect?: boolean;
  onSelectSlot?: (index: number) => void;
  /** Round-end: light mid-total / total from this rack's streak. */
  scoring?: boolean;
};

/* Score PointValue reveal timing — `_rakko/Rack.tsx` */
const SCORE_REVEAL_MS_START = 300;
const SCORE_REVEAL_MS_END = 50;
const SCORE_TOTAL_BLINK_MS = 100;
const SCORE_TOTAL_BLINK_TIMES = 3;

function revealGapMs(gapIndex: number, gapCount: number): number {
  if (gapCount <= 1) return SCORE_REVEAL_MS_START;
  const t = gapIndex / (gapCount - 1);
  return (
    SCORE_REVEAL_MS_START +
    (SCORE_REVEAL_MS_END - SCORE_REVEAL_MS_START) * t
  );
}

/** Reveal scoring variants from bottom up; hold Default until that step. */
function revealedVariant(
  slotIndex: number,
  streak: number | null,
  revealedFromBottom: number,
  totalBlinkOn: boolean,
): PointValueVariant {
  const final = pointValueVariant(slotIndex, streak);
  if (final === "default") return "default";
  /* Bottom slot (index 9) = step 1; next up = step 2; … */
  const step = RACK_SIZE - slotIndex;
  if (revealedFromBottom < step) return "default";
  /* Final (total) row blinks off as Default. */
  if (final === "total" && !totalBlinkOn) return "default";
  return final;
}

/** Figma rack sm (165:27001): rack-base + rows of rack-row (point-value + card-base). */
export function Rack({
  cards,
  canSelect = false,
  onSelectSlot,
  scoring = false,
}: RackProps) {
  const slots = Array.from({ length: RACK_SIZE }, (_, i) => cards[i] ?? null);
  const streak = scoring ? ascendingStreak(cards) : null;
  const [revealedFromBottom, setRevealedFromBottom] = useState(0);
  const [totalBlinkOn, setTotalBlinkOn] = useState(true);

  useEffect(() => {
    if (!scoring || streak == null || streak < 1) {
      setRevealedFromBottom(0);
      setTotalBlinkOn(true);
      return;
    }

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealedFromBottom(streak);
      setTotalBlinkOn(true);
      return;
    }

    const timeouts: number[] = [];
    setRevealedFromBottom(1);
    setTotalBlinkOn(true);

    /* Ramp gaps between steps: first gap = START, last gap = END. */
    let elapsed = 0;
    const gapCount = streak - 1;
    for (let step = 2; step <= streak; step += 1) {
      elapsed += revealGapMs(step - 2, gapCount);
      const next = step;
      timeouts.push(
        window.setTimeout(() => setRevealedFromBottom(next), elapsed),
      );
    }

    /* Final light: off/on × BLINK_TIMES at BLINK_MS, ending on. */
    let blinkAt = elapsed;
    for (let i = 0; i < SCORE_TOTAL_BLINK_TIMES; i += 1) {
      blinkAt += SCORE_TOTAL_BLINK_MS;
      timeouts.push(
        window.setTimeout(() => setTotalBlinkOn(false), blinkAt),
      );
      blinkAt += SCORE_TOTAL_BLINK_MS;
      timeouts.push(
        window.setTimeout(() => setTotalBlinkOn(true), blinkAt),
      );
    }

    return () => {
      for (const id of timeouts) window.clearTimeout(id);
    };
  }, [scoring, streak]);

  return (
    <div className={styles.rack} data-name="rack">
      <img
        className={styles.base}
        src={withBasePath("/assets/rakko/rack-base-med.png")}
        alt=""
        width={342}
        height={500}
        aria-hidden
        data-name="rack-base"
      />
      <div className={styles.rows} data-name="rows">
        {slots.map((value, index) => {
          /* Lower rows sit above higher rows (top card = bottom of z-order). */
          const order = { zIndex: index + 1, top: index * 42 };
          const points = slotPoints(index);
          const variant = revealedVariant(
            index,
            streak,
            revealedFromBottom,
            totalBlinkOn,
          );

          return (
            <div
              key={value == null ? `empty-${index}` : `${index}-${value}`}
              className={styles.row}
              style={order}
              data-name="rack-row"
            >
              <PointValue value={points} variant={variant} />
              {value == null ? (
                <div className={styles.empty} aria-hidden />
              ) : (
                <Card
                  size="sm"
                  value={value}
                  onClick={canSelect ? () => onSelectSlot?.(index) : undefined}
                  disabled={!canSelect}
                  aria-label={`Rack slot ${index + 1}, card ${value}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
