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

/** Figma discard-draw tray: discard (face-up) over draw (backs). */
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
  const underDiscard = Math.min(3, Math.max(0, discardCount - (discardTop != null ? 1 : 0)));

  return (
    <div className={styles.tray} data-name="discard-draw">
      <div className={styles.sheen} aria-hidden />
      <div className={styles.face} data-name="face">
        <div className={styles.cards} data-name="cards">
          <section className={styles.pile} data-name="discard">
            <h2 className={styles.label} data-name="tray-text">
              DISCARD PILE
            </h2>
            <div className={styles.stack} data-name="discards">
              {Array.from({ length: underDiscard }, (_, i) => (
                <div
                  key={`d-under-${i}`}
                  className={styles.under}
                  style={{ transform: `translate(${(i + 1) * 3}px, ${(i + 1) * -1}px)` }}
                  aria-hidden
                >
                  <Card value={discardTop ?? 1} compact />
                </div>
              ))}
              {holdingDiscard && held != null ? (
                <Card
                  value={held}
                  compact
                  selected
                  aria-label={`Held discard ${held}. Choose a rack slot.`}
                />
              ) : discardTop != null ? (
                <Card
                  value={discardTop}
                  compact
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
              ) : canDiscardHeld ? (
                <Card
                  value={held!}
                  compact
                  selected
                  onClick={onDiscardHeld}
                  aria-label={`Discard held card ${held}`}
                />
              ) : (
                <div className={styles.emptySlot} aria-hidden />
              )}
              <img
                className={styles.slot}
                src={withBasePath("/assets/rakko/slot.svg")}
                alt=""
                width={364}
                height={8}
                aria-hidden
                data-name="slot"
              />
            </div>
          </section>

          <section className={styles.pile} data-name="draw">
            <h2 className={styles.label} data-name="tray-text">
              DRAW PILE
            </h2>
            <div className={styles.stack} data-name="draws">
              {holdingDraw && held != null ? (
                <>
                  {drawCount > 0 ? (
                    <div className={styles.under} style={{ transform: "translate(2px, 2px)" }} aria-hidden>
                      <Card face="back" compact />
                    </div>
                  ) : null}
                  <Card
                    value={held}
                    compact
                    selected
                    onClick={canDiscardHeld ? onDiscardHeld : undefined}
                    disabled={!canDiscardHeld}
                    aria-label={`Held card ${held}. Discard or place in rack.`}
                  />
                </>
              ) : drawCount > 0 ? (
                <>
                  {Array.from({ length: Math.min(3, drawCount - 1) }, (_, i) => (
                    <div
                      key={`draw-under-${i}`}
                      className={styles.under}
                      style={{ transform: `translate(${(i + 1) * 2}px, ${(i + 1) * 2}px)` }}
                      aria-hidden
                    >
                      <Card face="back" compact />
                    </div>
                  ))}
                  <Card
                    face="back"
                    compact
                    onClick={canTakeDraw ? onTakeDraw : undefined}
                    disabled={!canTakeDraw}
                    aria-label="Take from draw pile"
                  />
                </>
              ) : (
                <div className={styles.emptySlot} aria-hidden />
              )}
              <img
                className={styles.slot}
                src={withBasePath("/assets/rakko/slot.svg")}
                alt=""
                width={364}
                height={8}
                aria-hidden
                data-name="slot"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
