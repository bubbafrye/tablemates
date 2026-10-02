import { withBasePath } from "@/platform/site";
import type { Cell } from "./logic";
import { MarkIcon } from "./Mark";
import styles from "./Board.module.css";

type BoardProps = {
  board: Cell[];
  canPlay: boolean;
  onCell: (index: number) => void;
};

export function Board({ board, canPlay, onCell }: BoardProps) {
  return (
    <div className={styles.wrap} data-name="set">
      <div className={styles.board} data-name="board">
        <img
          className={`${styles.boardImg} ${styles.boardXsm}`}
          src={withBasePath("/assets/tic-tac-toe/board-xsm.png")}
          alt=""
          width={360}
          height={374}
        />
        <img
          className={`${styles.boardImg} ${styles.boardSm}`}
          src={withBasePath("/assets/tic-tac-toe/board-sm.png")}
          alt=""
          width={440}
          height={458}
        />
        <div className={styles.tokens} data-name="tokens">
          {board.map((cell, index) => (
            <button
              key={index}
              type="button"
              className={styles.cell}
              disabled={!canPlay || Boolean(cell)}
              aria-label={cell ? `Cell ${index + 1}, ${cell}` : `Play in cell ${index + 1}`}
              onClick={() => onCell(index)}
            >
              {cell ? (
                <>
                  <span className={styles.markXsm}>
                    <MarkIcon mark={cell} size="boardXsm" />
                  </span>
                  <span className={styles.markSm}>
                    <MarkIcon mark={cell} size="sm" />
                  </span>
                </>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
