/** 4×4 board; 0 = empty. Values are powers of two. */
export type Board = number[];

export type Direction = "up" | "down" | "left" | "right";

export type Game2048Status = "playing" | "won" | "lost";

export type Game2048State = {
  board: Board;
  score: number;
  /** Highest tile value that has ever existed (unlocks spawn pool). */
  unlocked: number;
  status: Game2048Status;
  /** Continue after reaching 2048. */
  continued: boolean;
};

export const SIZE = 4;
export const WIN_TILE = 2048;
export const MAX_TILE = 16384;

export function emptyBoard(): Board {
  return Array.from({ length: SIZE * SIZE }, () => 0);
}

export function isGame2048State(value: unknown): value is Game2048State {
  if (!value || typeof value !== "object") return false;
  const s = value as Game2048State;
  return (
    Array.isArray(s.board) &&
    s.board.length === SIZE * SIZE &&
    typeof s.score === "number" &&
    typeof s.unlocked === "number" &&
    (s.status === "playing" || s.status === "won" || s.status === "lost")
  );
}

function idx(row: number, col: number): number {
  return row * SIZE + col;
}

function cloneBoard(board: Board): Board {
  return [...board];
}

function emptyCells(board: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) out.push(i);
  }
  return out;
}

/**
 * Spawn weights per design.md:
 * start 2=90% / 4=10%; each higher tile created by merge in this round
 * appears at 2%, taken from the "2" pool (4% stays 10%).
 */
export function spawnWeights(unlocked: number): Map<number, number> {
  let two = 0.9;
  const weights = new Map<number, number>([
    [2, two],
    [4, 0.1],
  ]);
  for (let v = 8; v <= unlocked && v <= MAX_TILE; v *= 2) {
    two = Math.max(0, two - 0.02);
    weights.set(2, two);
    weights.set(v, 0.02);
  }
  return weights;
}

export function pickSpawnValue(unlocked: number, rand = Math.random): number {
  const weights = spawnWeights(Math.max(4, unlocked));
  let r = rand();
  let total = 0;
  for (const w of weights.values()) total += w;
  r *= total;
  let acc = 0;
  for (const [value, w] of weights) {
    acc += w;
    if (r <= acc) return value;
  }
  return 2;
}

export function spawnTile(board: Board, unlocked: number, rand = Math.random): Board {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const next = cloneBoard(board);
  const at = cells[Math.floor(rand() * cells.length)]!;
  next[at] = pickSpawnValue(unlocked, rand);
  return next;
}

export function createInitialState(rand = Math.random): Game2048State {
  let board = emptyBoard();
  board = spawnTile(board, 4, rand);
  board = spawnTile(board, 4, rand);
  return {
    board,
    score: 0,
    unlocked: Math.max(4, ...board),
    status: "playing",
    continued: false,
  };
}

/** One tile sliding from board index `from` → `to` (same value while in flight). */
export type TileMotion = {
  key: string;
  from: number;
  to: number;
  value: number;
  /** Set when two tiles merge at `to` — shown after the slide lands. */
  mergedResult?: number;
};

export type SlidePlan = {
  /** Board after slide + merge, before spawn. */
  board: Board;
  scoreGain: number;
  motions: TileMotion[];
  /** Cells that received a merge (pop after slide). */
  mergeTargets: number[];
};

type LineArrival = {
  toLine: number;
  sources: { fromLine: number; value: number }[];
  result: number;
};

/** Slide + merge one line toward the start (index 0), tracking origins. */
function slideLineTracked(line: number[]): {
  line: number[];
  score: number;
  moved: boolean;
  arrivals: LineArrival[];
} {
  const pieces: { value: number; fromLine: number }[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i]) pieces.push({ value: line[i]!, fromLine: i });
  }

  const merged: number[] = [];
  const arrivals: LineArrival[] = [];
  let score = 0;
  let i = 0;
  let out = 0;
  while (i < pieces.length) {
    const a = pieces[i]!;
    const b = pieces[i + 1];
    if (b && a.value === b.value) {
      const result = a.value * 2;
      merged.push(result);
      score += result;
      arrivals.push({
        toLine: out,
        sources: [
          { fromLine: a.fromLine, value: a.value },
          { fromLine: b.fromLine, value: b.value },
        ],
        result,
      });
      i += 2;
      out += 1;
    } else {
      merged.push(a.value);
      arrivals.push({
        toLine: out,
        sources: [{ fromLine: a.fromLine, value: a.value }],
        result: a.value,
      });
      i += 1;
      out += 1;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  const moved = merged.some((v, j) => v !== line[j]);
  return { line: merged, score, moved, arrivals };
}

function readLine(board: Board, direction: Direction, index: number): number[] {
  const line: number[] = [];
  for (let i = 0; i < SIZE; i++) {
    if (direction === "left") line.push(board[idx(index, i)]!);
    else if (direction === "right") line.push(board[idx(index, SIZE - 1 - i)]!);
    else if (direction === "up") line.push(board[idx(i, index)]!);
    else line.push(board[idx(SIZE - 1 - i, index)]!);
  }
  return line;
}

function writeLine(board: Board, direction: Direction, index: number, line: number[]) {
  for (let i = 0; i < SIZE; i++) {
    const v = line[i]!;
    if (direction === "left") board[idx(index, i)] = v;
    else if (direction === "right") board[idx(index, SIZE - 1 - i)] = v;
    else if (direction === "up") board[idx(i, index)] = v;
    else board[idx(SIZE - 1 - i, index)] = v;
  }
}

/** Map a position along a slid line back to a board index. */
function lineToBoard(direction: Direction, lineIndex: number, along: number): number {
  if (direction === "left") return idx(lineIndex, along);
  if (direction === "right") return idx(lineIndex, SIZE - 1 - along);
  if (direction === "up") return idx(along, lineIndex);
  return idx(SIZE - 1 - along, lineIndex);
}

/**
 * Compute slide + merge without spawning. Used for animation, then spawn.
 * Returns null when the move does nothing.
 */
export function planSlide(state: Game2048State, direction: Direction): SlidePlan | null {
  if (state.status === "lost") return null;
  if (state.status === "won" && !state.continued) return null;

  const board = cloneBoard(state.board);
  let scoreGain = 0;
  let moved = false;
  const motions: TileMotion[] = [];
  const mergeTargets: number[] = [];
  let motionSeq = 0;

  for (let lineIndex = 0; lineIndex < SIZE; lineIndex++) {
    const line = readLine(board, direction, lineIndex);
    const result = slideLineTracked(line);
    if (result.moved) moved = true;
    scoreGain += result.score;
    writeLine(board, direction, lineIndex, result.line);

    for (const arrival of result.arrivals) {
      const to = lineToBoard(direction, lineIndex, arrival.toLine);
      const isMerge = arrival.sources.length > 1;
      if (isMerge) mergeTargets.push(to);
      for (const src of arrival.sources) {
        const from = lineToBoard(direction, lineIndex, src.fromLine);
        if (from === to && !isMerge) continue;
        motions.push({
          key: `m${motionSeq++}`,
          from,
          to,
          value: src.value,
          mergedResult: isMerge ? arrival.result : undefined,
        });
      }
      // Stationary tile still needs a render key when siblings move — skip.
    }
  }

  if (!moved) return null;
  return { board, scoreGain, motions, mergeTargets };
}

/** Figma tile grid pitch (100×109 tiles, 1px gap, −4px row overlap). */
export const CELL_STEP_X = 101;
export const CELL_STEP_Y = 105;

export function cellOffset(index: number): { x: number; y: number } {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  return { x: col * CELL_STEP_X, y: row * CELL_STEP_Y };
}

export function canMove(board: Board): boolean {
  if (emptyCells(board).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[idx(r, c)]!;
      if (c + 1 < SIZE && board[idx(r, c + 1)] === v) return true;
      if (r + 1 < SIZE && board[idx(r + 1, c)] === v) return true;
    }
  }
  return false;
}

/** Finish a planned slide: spawn + status. Returns spawn index (−1 if none). */
export function commitSlide(
  state: Game2048State,
  plan: SlidePlan,
  rand = Math.random,
): { state: Game2048State; spawnIndex: number } {
  const unlocked = Math.max(state.unlocked, ...plan.board);
  const before = plan.board;
  const withSpawn = spawnTile(before, unlocked, rand);
  let spawnIndex = -1;
  for (let i = 0; i < withSpawn.length; i++) {
    if (before[i] === 0 && withSpawn[i]! > 0) {
      spawnIndex = i;
      break;
    }
  }

  const score = state.score + plan.scoreGain;
  const hitWin = withSpawn.some((v) => v >= WIN_TILE);
  let status: Game2048Status = state.status;
  const continued = state.continued;

  if (hitWin && !continued && state.status !== "won") {
    status = "won";
  } else if (!canMove(withSpawn)) {
    status = "lost";
  } else if (status === "won" && continued) {
    status = "playing";
  } else if (status !== "won") {
    status = "playing";
  }

  return {
    state: {
      board: withSpawn,
      score,
      unlocked,
      status,
      continued,
    },
    spawnIndex,
  };
}

export function applyMove(
  state: Game2048State,
  direction: Direction,
  rand = Math.random,
): Game2048State | null {
  const plan = planSlide(state, direction);
  if (!plan) return null;
  return commitSlide(state, plan, rand).state;
}

export function continueAfterWin(state: Game2048State): Game2048State {
  if (state.status !== "won") return state;
  return { ...state, continued: true, status: "playing" };
}

export function resetGame(rand = Math.random): Game2048State {
  return createInitialState(rand);
}
