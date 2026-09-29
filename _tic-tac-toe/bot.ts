import type { Cell, Mark } from "./logic";
import { findWinner } from "./logic";

export const BOT_ID = "bot";
export const BOT_NAME = "HAL";

export function isBotId(id: string | null | undefined): boolean {
  return id === BOT_ID;
}

/** Perfect-play tic-tac-toe: win > block > center > corner > side. */
export function pickBotMove(board: Cell[], botMark: Mark): number {
  const empty = board
    .map((cell, index) => (cell ? -1 : index))
    .filter((index) => index >= 0);
  if (empty.length === 0) return -1;

  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const index of empty) {
    const next = [...board];
    next[index] = botMark;
    const score = minimax(next, botMark, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }
  return bestMove;
}

function minimax(board: Cell[], botMark: Mark, maximizing: boolean): number {
  const winner = findWinner(board);
  if (winner === botMark) return 10;
  if (winner && winner !== "draw") return -10;
  if (winner === "draw") return 0;

  const empty = board
    .map((cell, index) => (cell ? -1 : index))
    .filter((index) => index >= 0);
  const humanMark: Mark = botMark === "X" ? "O" : "X";

  if (maximizing) {
    let best = -Infinity;
    for (const index of empty) {
      const next = [...board];
      next[index] = botMark;
      best = Math.max(best, minimax(next, botMark, false));
    }
    return best;
  }

  let best = Infinity;
  for (const index of empty) {
    const next = [...board];
    next[index] = humanMark;
    best = Math.min(best, minimax(next, botMark, true));
  }
  return best;
}
