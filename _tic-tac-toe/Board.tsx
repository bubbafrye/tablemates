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
        <div className={styles.surface} data-name="surface">
          <div className={styles.edge} data-name="edge" />
          <div className={styles.base} data-name="base" />
          <div className={`${styles.cuts} ${styles.cutsXsm}`} data-name="cuts">
            <img
              className={styles.cutsImg}
              src={withBasePath("/assets/tic-tac-toe/cuts-xsm.svg")}
              alt=""
            />
          </div>
          <div className={`${styles.cuts} ${styles.cutsSm}`} data-name="cuts">
            <img
              className={styles.cutsImg}
              src={withBasePath("/assets/tic-tac-toe/cuts-sm.svg")}
              alt=""
            />
          </div>
          <div className={styles.hilight} data-name="hilight" />
          <div className={styles.texture} data-name="texture">
            <img src={withBasePath("/assets/tic-tac-toe/texture.png")} alt="" />
          </div>
        </div>
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
