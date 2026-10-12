import { Card } from "./Card";
import { RACK_SIZE } from "./logic";
import styles from "./Rack.module.css";

const POINT_LABELS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10] as const;

type RackProps = {
  cards: number[];
  canSelect?: boolean;
  onSelectSlot?: (index: number) => void;
};

/** Figma rack: red tray, point labels 100→10, ten overlapping card slots. */
export function Rack({ cards, canSelect = false, onSelectSlot }: RackProps) {
  const slots = Array.from({ length: RACK_SIZE }, (_, i) => cards[i] ?? null);

  return (
    <div className={styles.rack} data-name="rack">
      <div className={styles.face} data-name="face">
        <div className={styles.points} data-name="points" aria-hidden>
          {POINT_LABELS.map((label) => (
            <span key={label} className={styles.point}>
              {label}
            </span>
          ))}
        </div>
        <div className={styles.cards} data-name="cards">
          {slots.map((value, index) => {
            const isLast = index === RACK_SIZE - 1;
            if (value == null) {
              return (
                <div
                  key={index}
                  className={`${styles.empty} ${isLast ? "" : styles.stacked}`}
                  aria-hidden
                />
              );
            }
            return (
              <Card
                key={`${index}-${value}`}
                value={value}
                stacked={!isLast}
                selected={canSelect}
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
