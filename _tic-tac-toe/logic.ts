export type Mark = "X" | "O";
export type Cell = Mark | null;

export type TicTacToeState = {
  board: Cell[];
  turn: Mark;
  winner: Mark | "draw" | null;
  xPlayerId: string | null;
  oPlayerId: string | null;
};

export const EMPTY_BOARD: Cell[] = Array.from({ length: 9 }, () => null);

export function createInitialState(): TicTacToeState {
  return {
    board: [...EMPTY_BOARD],
    turn: "X",
    winner: null,
    xPlayerId: null,
    oPlayerId: null,
  };
}

export function isTicTacToeState(value: unknown): value is TicTacToeState {
  if (!value || typeof value !== "object") return false;
  const state = value as TicTacToeState;
  return Array.isArray(state.board) && state.board.length === 9 && (state.turn === "X" || state.turn === "O");
}

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function findWinner(board: Cell[]): Mark | "draw" | null {
  for (const [a, b, c] of LINES) {
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) return mark;
  }
  if (board.every(Boolean)) return "draw";
  return null;
}

export function assignSeats(state: TicTacToeState, playerIds: string[]): TicTacToeState {
  const next = { ...state };
  if (!next.xPlayerId && playerIds[0]) next.xPlayerId = playerIds[0];
  if (!next.oPlayerId && playerIds[1] && playerIds[1] !== next.xPlayerId) {
    next.oPlayerId = playerIds[1];
  }
  return next;
}

export function applyMove(state: TicTacToeState, index: number, playerId: string): TicTacToeState | null {
  if (state.winner || index < 0 || index > 8 || state.board[index]) return null;

  const seat = state.turn === "X" ? state.xPlayerId : state.oPlayerId;
  if (!seat || seat !== playerId) return null;

  const board = [...state.board];
  board[index] = state.turn;
  const winner = findWinner(board);

  return {
    ...state,
    board,
    turn: state.turn === "X" ? "O" : "X",
    winner,
  };
}

export function resetBoard(state: TicTacToeState): TicTacToeState {
  return {
    ...state,
    board: [...EMPTY_BOARD],
    turn: "X",
    winner: null,
  };
}
