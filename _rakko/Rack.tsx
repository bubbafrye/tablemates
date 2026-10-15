import { withBasePath } from "@/platform/site";
import { Card } from "./Card";
import { RACK_SIZE } from "./logic";
import styles from "./Rack.module.css";

type RackProps = {
  cards: number[];
  canSelect?: boolean;
  onSelectSlot?: (index: number) => void;
};

/** Figma rack (sm): rack-base med PNG + default-sm cards. */
export function Rack({ cards, canSelect = false, onSelectSlot }: RackProps) {
  const slots = Array.from({ length: RACK_SIZE }, (_, i) => cards[i] ?? null);

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
      <div className={styles.face} data-name="face">
        <div className={styles.cards} data-name="cards">
          {slots.map((value, index) => {
            const isLast = index === RACK_SIZE - 1;
            /* Lower rows sit above higher rows (top card = bottom of z-order). */
            const order = { zIndex: index + 1 };
            if (value == null) {
              return (
                <div
                  key={index}
                  className={`${styles.empty} ${isLast ? "" : styles.stacked}`}
                  style={order}
                  aria-hidden
                />
              );
            }
            return (
              <Card
                key={`${index}-${value}`}
                size="sm"
                value={value}
                stacked={!isLast}
                style={order}
                onClick={canSelect ? () => onSelectSlot?.(index) : undefined}
                disabled={!canSelect}
                aria-label={`Rack slot ${index + 1}, card ${value}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
