import { withBasePath } from "@/platform/site";
import { Card } from "./Card";
import styles from "./DiscardDraw.module.css";

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
 * Figma draw-discard-tray + draw-discard-pile (168:32386):
 * card array under a mask, ONE slot in front of the array, holder below.
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
  const underDiscard = Math.min(2, Math.max(0, discardCount - (discardTop != null ? 1 : 0)));
  const underDraw = Math.min(2, Math.max(0, drawCount - 1));
  const slotSrc = withBasePath("/assets/rakko/slot-sm.svg");

  return (
    <div className={styles.tray} data-name="draw-discard-tray">
      <section className={styles.pile} data-name="discard">
        <div className={styles.pileBody} data-name="discard-pile">
          <div className={styles.cardSlot} data-name="card-slot">
            {Array.from({ length: underDiscard }, (_, i) => (
              <div
                key={`d-under-${i}`}
                className={i === 0 ? styles.discardBack : styles.discardMid}
                aria-hidden
              >
                <Card frame="face" blank />
              </div>
            ))}
            {holdingDiscard && held != null ? (
              <div className={styles.discardFront}>
                <Card
                  frame="face"
                  value={held}
                  selected
                  aria-label={`Held discard ${held}. Choose a rack slot.`}
                />
              </div>
            ) : discardTop != null ? (
              <div className={styles.discardFront}>
                <Card
                  frame="face"
                  value={discardTop}
                  selected={canDiscardHeld}
                  onClick={
                    canTakeDiscard
                      ? onTakeDiscard
                      : canDiscardHeld
                        ? onDiscardHeld
                        : undefined
                  }
                  disabled={!canTakeDiscard && !canDiscardHeld}
                  aria-label={
                    canDiscardHeld
                      ? `Discard held card ${held}`
                      : `Take discard ${discardTop}`
                  }
                />
              </div>
            ) : canDiscardHeld ? (
              <div className={styles.discardFront}>
                <Card
                  frame="face"
                  value={held!}
                  selected
                  onClick={onDiscardHeld}
                  aria-label={`Discard held card ${held}`}
                />
              </div>
            ) : (
              <div className={styles.emptyFace} aria-hidden />
            )}
          </div>
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
        <div className={`${styles.holder} ${styles.discardHolder}`} data-name="discard-holder">
          <span className={styles.label} data-name="discard-text">
            DISCARD
          </span>
        </div>
      </section>

      <section className={styles.pile} data-name="draw">
        <div className={`${styles.pileBody} ${styles.drawPileBody}`} data-name="draw-pile">
          <div className={`${styles.cardSlot} ${styles.drawCardSlot}`} data-name="card-slot">
            {holdingDraw && held != null ? (
              <>
                {drawCount > 0 ? (
                  <div className={styles.drawBack} aria-hidden>
                    <Card frame="face" face="back" />
                  </div>
                ) : null}
                <div className={styles.drawFront}>
                  <Card
                    frame="face"
                    value={held}
                    selected
                    onClick={canDiscardHeld ? onDiscardHeld : undefined}
                    disabled={!canDiscardHeld}
                    aria-label={`Held card ${held}. Discard or place in rack.`}
                  />
                </div>
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
        <div className={`${styles.holder} ${styles.drawHolder}`} data-name="draw-holder">
          <span className={styles.label} data-name="draw-text">
            DRAW
          </span>
        </div>
      </section>
    </div>
  );
}
