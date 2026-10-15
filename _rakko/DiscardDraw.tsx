"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/platform/site";
import { Card } from "./Card";
import styles from "./DiscardDraw.module.css";

/** Figma draw-discard-pile (168:32386) Property 1 variants. */
export type DiscardPileVariant = "discard-default" | "discard-disabled";
export type DrawPileVariant = "draw-default" | "draw-selected";

type DiscardDrawProps = {
  discardTop: number | null;
  discardCount: number;
  drawCount: number;
  held: number | null;
  heldSource: "draw" | "discard" | null;
  canTakeDiscard: boolean;
  canTakeDraw: boolean;
  canDiscardHeld: boolean;
  onTakeDiscard: () => void;
  onTakeDraw: () => void;
  onDiscardHeld: () => void;
};

/**
 * Figma draw-discard-tray (186:119537) + draw-discard-pile (168:32386).
 *
 * Pile variants:
 * - discard-default / discard-disabled (tucked when draw is active)
 * - held discard → card-front-selected-sm (tilted) over the pile slot
 * - draw-default / draw-selected (face-up held card lifted on draw)
 *
 * Motions:
 * - discard-anim-in (202:121332): front card entrance when a card is added
 * - draw-pile-flip-anim (169:81712): back→front flip when draw is taken
 */
export function DiscardDraw({
  discardTop,
  discardCount,
  drawCount,
  held,
  heldSource,
  canTakeDiscard,
  canTakeDraw,
  canDiscardHeld,
  onTakeDiscard,
  onTakeDraw,
  onDiscardHeld,
}: DiscardDrawProps) {
  const holdingDraw = held !== null && heldSource === "draw";
  const holdingDiscard = held !== null && heldSource === "discard";

  const discardVariant: DiscardPileVariant = holdingDraw
    ? "discard-disabled"
    : "discard-default";
  const drawVariant: DrawPileVariant = holdingDraw
    ? "draw-selected"
    : "draw-default";

  const underDiscard = Math.min(
    2,
    Math.max(0, discardCount - (discardTop != null || holdingDiscard ? 1 : 0)),
  );
  const underDraw = Math.min(2, Math.max(0, drawCount - (holdingDraw ? 0 : 1)));

  const slotSrc = withBasePath("/assets/rakko/slot-sm.svg");
  const pileMaskSrc = withBasePath("/assets/rakko/pile-mask.svg");
  const pileMaskStyle = {
    WebkitMaskImage: `url("${pileMaskSrc}")`,
    maskImage: `url("${pileMaskSrc}")`,
  };

  const discardVariantClass =
    discardVariant === "discard-disabled"
      ? styles.discardDisabled
      : styles.discardDefault;

  /* Figma discard-anim-in: play once when a card is added to discard. */
  const prevDiscardCount = useRef(discardCount);
  const [discardAnimIn, setDiscardAnimIn] = useState(false);
  useEffect(() => {
    if (
      discardCount > prevDiscardCount.current &&
      discardTop != null &&
      discardVariant === "discard-default"
    ) {
      setDiscardAnimIn(true);
    }
    prevDiscardCount.current = discardCount;
  }, [discardCount, discardTop, discardVariant]);

  /* Figma draw-pile-flip-anim: play once when draw is taken. */
  const wasHoldingDraw = useRef(false);
  const [drawFlipAnim, setDrawFlipAnim] = useState(false);
  useEffect(() => {
    if (holdingDraw && !wasHoldingDraw.current) {
      setDrawFlipAnim(true);
    }
    if (!holdingDraw) {
      setDrawFlipAnim(false);
    }
    wasHoldingDraw.current = holdingDraw;
  }, [holdingDraw]);
  useEffect(() => {
    if (!drawFlipAnim) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => setDrawFlipAnim(false),
      reduce ? 0 : 1010,
    );
    return () => window.clearTimeout(id);
  }, [drawFlipAnim]);

  /* During flip, keep mid/back on draw-default geometry (only front animates). */
  const drawVariantClass =
    drawFlipAnim || drawVariant === "draw-default"
      ? styles.drawDefault
      : styles.drawSelected;

  const discardFrontClass = [
    styles.discardFront,
    discardAnimIn ? styles.discardAnimIn : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.tray} data-name="draw-discard-tray">
      <section className={styles.pile} data-name="discard">
        <div
          className={`${styles.pileBody} ${discardVariantClass}`}
          data-name="discard-pile"
          data-variant={discardVariant}
        >
          <div
            className={styles.cardSlot}
            style={pileMaskStyle}
            data-name="card-slot"
          >
            {Array.from({ length: underDiscard }, (_, i) => (
              <div
                key={`d-under-${i}`}
                className={i === 0 ? styles.discardBack : styles.discardMid}
                aria-hidden
              >
                <Card frame="face" blank />
              </div>
            ))}
            {holdingDiscard ? null : discardTop != null ? (
              <div
                className={discardFrontClass}
                data-name="anim-in"
                onAnimationEnd={() => setDiscardAnimIn(false)}
              >
                <Card
                  frame="face"
                  value={discardTop}
                  onClick={
                    discardVariant === "discard-disabled"
                      ? undefined
                      : canTakeDiscard
                        ? onTakeDiscard
                        : canDiscardHeld
                          ? onDiscardHeld
                          : undefined
                  }
                  disabled={
                    discardVariant === "discard-disabled" ||
                    (!canTakeDiscard && !canDiscardHeld)
                  }
                  aria-label={
                    discardVariant === "discard-disabled"
                      ? `Discard ${discardTop} (unavailable while holding draw)`
                      : canDiscardHeld
                        ? `Discard held card ${held}`
                        : canTakeDiscard
                          ? `Take discard ${discardTop}`
                          : `Discard ${discardTop} (unavailable)`
                  }
                />
              </div>
            ) : canDiscardHeld && !holdingDraw ? (
              <div className={styles.discardFront}>
                <Card
                  frame="face"
                  value={held!}
                  onClick={onDiscardHeld}
                  aria-label={`Discard held card ${held}`}
                />
              </div>
            ) : (
              <div className={styles.emptyFace} aria-hidden />
            )}
          </div>
          {/* Selected-sm uses its own mask — sit outside the pile group mask. */}
          {holdingDiscard && held != null ? (
            <div
              className={styles.discardSelected}
              data-name="card-front-selected-sm"
            >
              <Card
                size="sm"
                selected
                slot={false}
                value={held}
                aria-label={`Held discard ${held}. Choose a rack slot.`}
              />
            </div>
          ) : null}
          <img
            className={styles.pileSlot}
            src={slotSrc}
            alt=""
            width={249}
            height={6}
            aria-hidden
            data-name="slot"
          />
        </div>
        <div
          className={`${styles.holder} ${styles.discardHolder}`}
          data-name="discard-holder"
        >
          <span className={styles.label} data-name="discard-text">
            DISCARD
          </span>
        </div>
      </section>

      <section className={styles.pile} data-name="draw">
        <div
          className={`${styles.pileBody} ${styles.drawPileBody} ${drawVariantClass}`}
          data-name="draw-pile"
          data-variant={drawVariant}
        >
          <div
            className={styles.cardSlot}
            style={pileMaskStyle}
            data-name="card-slot"
          >
            {holdingDraw && held != null ? (
              <>
                {drawCount > 0 ? (
                  <div className={styles.drawBack} aria-hidden>
                    <Card frame="face" face="back" />
                  </div>
                ) : null}
                {drawCount > 1 ? (
                  <div className={styles.drawMid} aria-hidden>
                    <Card frame="face" face="back" />
                  </div>
                ) : null}
                {!drawFlipAnim ? (
                  <div className={styles.drawFront}>
                    <Card
                      frame="face"
                      value={held}
                      onClick={canDiscardHeld ? onDiscardHeld : undefined}
                      disabled={!canDiscardHeld}
                      aria-label={`Held card ${held}. Discard or place in rack.`}
                    />
                  </div>
                ) : null}
              </>
            ) : drawCount > 0 ? (
              <>
                {Array.from({ length: underDraw }, (_, i) => (
                  <div
                    key={`draw-under-${i}`}
                    className={i === 0 ? styles.drawBack : styles.drawMid}
                    aria-hidden
                  >
                    <Card frame="face" face="back" />
                  </div>
                ))}
                <div className={styles.drawFront}>
                  <Card
                    frame="face"
                    face="back"
                    onClick={canTakeDraw ? onTakeDraw : undefined}
                    disabled={!canTakeDraw}
                    aria-label="Take from draw pile"
                  />
                </div>
              </>
            ) : (
              <div className={styles.emptyFace} aria-hidden />
            )}
          </div>
          {/* Flip in its own bottom clip — mid/back stay in cardSlot. */}
          {holdingDraw && held != null && drawFlipAnim ? (
            <div className={styles.drawFlipMask} data-name="draw-pile-flip-anim">
              <div className={styles.drawFrontFlipping}>
                <div
                  className={styles.drawFlipBack}
                  data-name="front"
                  aria-hidden
                >
                  <Card frame="face" face="back" />
                </div>
                <div className={styles.drawFlipFace} data-name="front-face">
                  <Card
                    frame="face"
                    value={held}
                    aria-label={`Held card ${held}. Discard or place in rack.`}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <img
            className={`${styles.pileSlot} ${styles.drawPileSlot}`}
            src={slotSrc}
            alt=""
            width={247}
            height={6}
            aria-hidden
            data-name="slot"
          />
        </div>
        <div
          className={`${styles.holder} ${styles.drawHolder}`}
          data-name="draw-holder"
        >
          <span className={styles.label} data-name="draw-text">
            DRAW
          </span>
        </div>
      </section>
    </div>
  );
}
