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
  /** When false, a held draw stays face-down (no flip) — opponents must not see it. */
  revealHeldDraw?: boolean;
  canTakeDiscard: boolean;
  canTakeDraw: boolean;
  canDiscardHeld: boolean;
  canReturnHeld: boolean;
  onTakeDiscard: () => void;
  onTakeDraw: () => void;
  onDiscardHeld: () => void;
  onReturnHeld: () => void;
};

/**
 * Figma draw-discard-tray (186:119537) + draw-discard-pile (168:32386).
 *
 * Pile variants:
 * - discard-default / discard-disabled (tucked when draw is active)
 * - held discard → card-front-selected-sm / selected-xsm (tilted) over the pile slot

 * - draw-default / draw-selected (face-up held card lifted on draw)
 *
 * Holder: tray-text (202:148306) + discard-undo / draw-discard (210:148339).
 * Selected pile → selected text + interactive icon.
 * - draw-discard icon → discard held draw card
 * - discard-undo icon → return held discard card
 * - held draw card is not clickable (discard only via icon)
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
  revealHeldDraw = true,
  canTakeDiscard,
  canTakeDraw,
  canDiscardHeld,
  canReturnHeld,
  onTakeDiscard,
  onTakeDraw,
  onDiscardHeld,
  onReturnHeld,
}: DiscardDrawProps) {
  const holdingDraw = held !== null && heldSource === "draw";
  const holdingDiscard = held !== null && heldSource === "discard";
  const showDrawFace = holdingDraw && revealHeldDraw;

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

  const slotSmSrc = withBasePath("/assets/rakko/slot-sm.svg");
  const slotXsmSrc = withBasePath("/assets/rakko/slot-xsm.svg");
  const pileMaskSrc = withBasePath("/assets/rakko/pile-mask.svg");
  const pileMaskStyle = {
    WebkitMaskImage: `url("${pileMaskSrc}")`,
    maskImage: `url("${pileMaskSrc}")`,
  };

  const discardUndoSrc = withBasePath(
    holdingDiscard
      ? "/assets/rakko/discard-undo-selected.svg"
      : "/assets/rakko/discard-undo-default.svg",
  );
  const drawDiscardSrc = withBasePath(
    holdingDraw
      ? "/assets/rakko/draw-discard-selected.svg"
      : "/assets/rakko/draw-discard-default.svg",
  );

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

  /* Figma draw-pile-flip-anim: play once when *this* viewer may see the face. */
  const wasHoldingDraw = useRef(false);
  const [drawFlipAnim, setDrawFlipAnim] = useState(false);
  useEffect(() => {
    if (showDrawFace && !wasHoldingDraw.current) {
      setDrawFlipAnim(true);
    }
    if (!showDrawFace) {
      setDrawFlipAnim(false);
    }
    wasHoldingDraw.current = showDrawFace;
  }, [showDrawFace]);
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

  const canUndoDiscard = canReturnHeld && holdingDiscard;
  const canDrawDiscard = canDiscardHeld && holdingDraw;

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
                        : undefined
                  }
                  disabled={
                    discardVariant === "discard-disabled" || !canTakeDiscard
                  }
                  aria-label={
                    discardVariant === "discard-disabled"
                      ? `Discard ${discardTop} (unavailable while holding draw)`
                      : canTakeDiscard
                        ? `Take discard ${discardTop}`
                        : `Discard ${discardTop} (unavailable)`
                  }
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
              data-name="card-front-selected-xsm"
            >
              <Card
                size="sm"
                selected
                slot={false}
                value={held}
                aria-label={`Held discard ${held}. Choose a rack slot or undo.`}
              />

            </div>
          ) : null}
          <img
            className={`${styles.pileSlot} ${styles.slotSm}`}
            src={slotSmSrc}
            alt=""
            width={249}
            height={6}
            aria-hidden
            data-name="slot"
          />
          <img
            className={`${styles.pileSlot} ${styles.slotXsm}`}
            src={slotXsmSrc}
            alt=""
            width={163}
            height={5}
            aria-hidden
            data-name="slot"
          />
        </div>
        <div
          className={`${styles.holder} ${styles.discardHolder}`}
          data-name="discard-holder"
        >
          {canUndoDiscard ? (
            <button
              type="button"
              className={`${styles.holderIcon} ${styles.holderIconInteractive}`}
              onClick={onReturnHeld}
              aria-label="Undo discard selection"
              data-name="discard-undo"
              data-variant="discard-undo-selected"
            >
              <img src={discardUndoSrc} alt="" width={25} height={25} />
            </button>
          ) : (
            <span
              className={styles.holderIcon}
              aria-hidden
              data-name="discard-undo"
              data-variant="discard-undo-default"
            >
              <img src={discardUndoSrc} alt="" width={25} height={25} />
            </span>
          )}
        </div>
        <p
          className={`${styles.trayText} ${holdingDiscard ? styles.trayTextSelected : ""}`}
          data-name="tray-text"
          data-variant={holdingDiscard ? "selected" : "default"}
        >
          DISCARD
        </p>
      </section>

      <section className={styles.pile} data-name="draw">
        <div
          className={`${styles.pileBody} ${styles.drawPileBody} ${drawVariantClass}`}
          data-name="draw-pile"
          data-variant={drawVariant}
          data-reveal-held-draw={holdingDraw ? (showDrawFace ? "true" : "false") : undefined}
        >
          <div
            className={styles.cardSlot}
            style={pileMaskStyle}
            data-name="card-slot"
          >
            {holdingDraw && held != null ? (
              <>
                {Array.from({ length: underDraw }, (_, i) => (
                  <div
                    key={`draw-under-held-${i}`}
                    className={i === 0 ? styles.drawBack : styles.drawMid}
                    aria-hidden
                  >
                    <Card frame="face" face="back" />
                  </div>
                ))}
                {!drawFlipAnim ? (
                  <div className={styles.drawFront}>
                    {showDrawFace ? (
                      <Card
                        frame="face"
                        value={held}
                        aria-label={`Held card ${held}. Discard via icon or place in rack.`}
                      />
                    ) : (
                      <Card
                        frame="face"
                        face="back"
                        aria-label="Opponent is holding a drawn card"
                      />
                    )}
                  </div>
                ) : null}
              </>
            ) : drawCount > 0 || canTakeDraw ? (
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
                    aria-label={
                      drawCount > 0
                        ? "Take from draw pile"
                        : "Reshuffle discard into draw and take"
                    }
                  />
                </div>
              </>
            ) : (
              <div className={styles.emptyFace} aria-hidden />
            )}
          </div>
          {/* Flip in its own bottom clip — mid/back stay in cardSlot. Drawer only. */}
          {showDrawFace && held != null && drawFlipAnim ? (
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
                    aria-label={`Held card ${held}. Discard via icon or place in rack.`}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <img
            className={`${styles.pileSlot} ${styles.drawPileSlot} ${styles.slotSm}`}
            src={slotSmSrc}
            alt=""
            width={247}
            height={6}
            aria-hidden
            data-name="slot"
          />
          <img
            className={`${styles.pileSlot} ${styles.drawPileSlot} ${styles.slotXsm}`}
            src={slotXsmSrc}
            alt=""
            width={164}
            height={5}
            aria-hidden
            data-name="slot"
          />
        </div>
        <div
          className={`${styles.holder} ${styles.drawHolder}`}
          data-name="draw-holder"
        >
          {canDrawDiscard ? (
            <button
              type="button"
              className={`${styles.holderIcon} ${styles.holderIconInteractive}`}
              onClick={onDiscardHeld}
              aria-label="Discard held draw card"
              data-name="draw-discard"
              data-variant="draw-discard-selected"
            >
              <img src={drawDiscardSrc} alt="" width={25} height={25} />
            </button>
          ) : (
            <span
              className={styles.holderIcon}
              aria-hidden
              data-name="draw-discard"
              data-variant="draw-discard-default"
            >
              <img src={drawDiscardSrc} alt="" width={25} height={25} />
            </span>
          )}
        </div>
        <p
          className={`${styles.trayText} ${holdingDraw ? styles.trayTextSelected : ""}`}
          data-name="tray-text"
          data-variant={holdingDraw ? "selected" : "default"}
        >
          DRAW
        </p>
      </section>
    </div>
  );
}
