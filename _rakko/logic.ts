export const RACK_SIZE = 10;
export const DECK_SIZE = 60;
export const MATCH_TARGET = 500;
export const POINTS_PER_CARD = 5;
export const RAKKO_BONUS = 25;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export type RakkoPhase = "lobby" | "playing" | "round-end" | "match-end";

export type RakkoState = {
  phase: RakkoPhase;
  /** Seat order (2–4). Index 0 is first in turn order after coin toss offset. */
  playerIds: string[];
  readyIds: string[];
  /** rack[0] = top slot, rack[9] = bottom. Ascending = low→high top→bottom. */
  racks: Record<string, number[]>;
  drawPile: number[];
  /** Last element is the face-up top. */
  discardPile: number[];
  turnIndex: number;
  /** Card taken this turn, not yet placed/discarded. */
  held: number | null;
  heldSource: "draw" | "discard" | null;
  /** Points earned in the round that just ended. */
  roundScores: Record<string, number>;
  roundWinnerId: string | null;
  matchWinnerId: string | null;
};

export function createLobbyState(): RakkoState {
  return {
    phase: "lobby",
    playerIds: [],
    readyIds: [],
    racks: {},
    drawPile: [],
    discardPile: [],
    turnIndex: 0,
    held: null,
    heldSource: null,
    roundScores: {},
    roundWinnerId: null,
    matchWinnerId: null,
  };
}

export function isRakkoState(value: unknown): value is RakkoState {
  if (!value || typeof value !== "object") return false;
  const state = value as RakkoState;
  return (
    typeof state.phase === "string" &&
    Array.isArray(state.playerIds) &&
    Array.isArray(state.drawPile) &&
    Array.isArray(state.discardPile)
  );
}

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function buildDeck(): number[] {
  return Array.from({ length: DECK_SIZE }, (_, i) => i + 1);
}

/** Longest ascending run from the bottom (index 9) toward the top. */
export function ascendingStreak(rack: number[]): number {
  if (rack.length !== RACK_SIZE) return 0;
  let streak = 1;
  for (let i = RACK_SIZE - 2; i >= 0; i -= 1) {
    if (rack[i] < rack[i + 1]) streak += 1;
    else break;
  }
  return streak;
}

export function isRakko(rack: number[]): boolean {
  return ascendingStreak(rack) === RACK_SIZE;
}

export function scoreRack(rack: number[]): { points: number; isRakko: boolean; streak: number } {
  const streak = ascendingStreak(rack);
  const rakko = streak === RACK_SIZE;
  return {
    streak,
    isRakko: rakko,
    points: streak * POINTS_PER_CARD + (rakko ? RAKKO_BONUS : 0),
  };
}

export function syncSeats(state: RakkoState, connectedIds: string[]): RakkoState {
  if (state.phase !== "lobby") return state;
  const playerIds = connectedIds.slice(0, MAX_PLAYERS);
  const readyIds = state.readyIds.filter((id) => playerIds.includes(id));
  return { ...state, playerIds, readyIds };
}

export function toggleReady(state: RakkoState, playerId: string): RakkoState | null {
  if (state.phase !== "lobby") return null;
  if (!state.playerIds.includes(playerId)) return null;
  const ready = state.readyIds.includes(playerId);
  const readyIds = ready
    ? state.readyIds.filter((id) => id !== playerId)
    : [...state.readyIds, playerId];
  return { ...state, readyIds };
}

export function canStartRound(state: RakkoState): boolean {
  if (state.phase !== "lobby" && state.phase !== "round-end") return false;
  if (state.playerIds.length < MIN_PLAYERS || state.playerIds.length > MAX_PLAYERS) return false;
  if (state.phase === "lobby") {
    return state.playerIds.every((id) => state.readyIds.includes(id));
  }
  return true;
}

export function startRound(state: RakkoState, random = Math.random): RakkoState | null {
  if (!canStartRound(state)) return null;
  const deck = shuffle(buildDeck(), random);
  const racks: Record<string, number[]> = {};
  let cursor = 0;
  for (const playerId of state.playerIds) {
    // Deal into rack top→bottom (first dealt = top).
    racks[playerId] = deck.slice(cursor, cursor + RACK_SIZE);
    cursor += RACK_SIZE;
  }
  const discardPile = [deck[cursor]];
  const drawPile = deck.slice(cursor + 1);
  const turnIndex = Math.floor(random() * state.playerIds.length);

  return {
    ...state,
    phase: "playing",
    readyIds: [],
    racks,
    drawPile,
    discardPile,
    turnIndex,
    held: null,
    heldSource: null,
    roundScores: {},
    roundWinnerId: null,
    matchWinnerId: null,
  };
}

function advanceTurn(state: RakkoState): RakkoState {
  const turnIndex = (state.turnIndex + 1) % state.playerIds.length;
  return { ...state, turnIndex, held: null, heldSource: null };
}

function ensureDrawPile(state: RakkoState, random = Math.random): RakkoState {
  if (state.drawPile.length > 0) return state;
  if (state.discardPile.length <= 1) return state;
  const top = state.discardPile[state.discardPile.length - 1];
  const rest = state.discardPile.slice(0, -1);
  return {
    ...state,
    drawPile: shuffle(rest, random),
    discardPile: [top],
  };
}

export function currentPlayerId(state: RakkoState): string | null {
  return state.playerIds[state.turnIndex] ?? null;
}

export function takeDiscard(state: RakkoState, playerId: string): RakkoState | null {
  if (state.phase !== "playing") return null;
  if (currentPlayerId(state) !== playerId) return null;
  if (state.held !== null) return null;
  if (state.discardPile.length === 0) return null;
  const discardPile = [...state.discardPile];
  const held = discardPile.pop()!;
  return { ...state, discardPile, held, heldSource: "discard" };
}

export function takeDraw(state: RakkoState, playerId: string, random = Math.random): RakkoState | null {
  if (state.phase !== "playing") return null;
  if (currentPlayerId(state) !== playerId) return null;
  if (state.held !== null) return null;
  const refreshed = ensureDrawPile(state, random);
  if (refreshed.drawPile.length === 0) return null;
  const drawPile = [...refreshed.drawPile];
  const held = drawPile.pop()!;
  return { ...refreshed, drawPile, held, heldSource: "draw" };
}

export function discardHeld(state: RakkoState, playerId: string): RakkoState | null {
  if (state.phase !== "playing") return null;
  if (currentPlayerId(state) !== playerId) return null;
  if (state.held === null || state.heldSource !== "draw") return null;
  const discardPile = [...state.discardPile, state.held];
  return advanceTurn({ ...state, discardPile, held: null, heldSource: null });
}

export function replaceSlot(
  state: RakkoState,
  playerId: string,
  slotIndex: number,
): RakkoState | null {
  if (state.phase !== "playing") return null;
  if (currentPlayerId(state) !== playerId) return null;
  if (state.held === null) return null;
  if (slotIndex < 0 || slotIndex >= RACK_SIZE) return null;

  const rack = [...(state.racks[playerId] ?? [])];
  if (rack.length !== RACK_SIZE) return null;
  const outgoing = rack[slotIndex];
  rack[slotIndex] = state.held;
  const discardPile = [...state.discardPile, outgoing];
  const racks = { ...state.racks, [playerId]: rack };

  if (isRakko(rack)) {
    return endRound({ ...state, racks, discardPile, held: null, heldSource: null }, playerId);
  }

  return advanceTurn({ ...state, racks, discardPile, held: null, heldSource: null });
}

function endRound(state: RakkoState, roundWinnerId: string): RakkoState {
  const roundScores: Record<string, number> = {};
  for (const id of state.playerIds) {
    roundScores[id] = scoreRack(state.racks[id] ?? []).points;
  }
  return {
    ...state,
    phase: "round-end",
    held: null,
    heldSource: null,
    roundScores,
    roundWinnerId,
  };
}

export function applyRoundScoresToMatch(
  matchScores: Record<string, number>,
  roundScores: Record<string, number>,
): { nextScores: Record<string, number>; matchWinnerId: string | null } {
  const nextScores = { ...matchScores };
  for (const [id, points] of Object.entries(roundScores)) {
    nextScores[id] = (nextScores[id] ?? 0) + points;
  }
  let matchWinnerId: string | null = null;
  let best = -1;
  for (const [id, total] of Object.entries(nextScores)) {
    if (total >= MATCH_TARGET && total > best) {
      best = total;
      matchWinnerId = id;
    }
  }
  return { nextScores, matchWinnerId };
}

export function continueAfterRound(state: RakkoState, matchWinnerId: string | null): RakkoState {
  if (state.phase !== "round-end") return state;
  if (matchWinnerId) {
    return { ...state, phase: "match-end", matchWinnerId };
  }
  return {
    ...state,
    phase: "lobby",
    readyIds: [],
    racks: {},
    drawPile: [],
    discardPile: [],
    turnIndex: 0,
    held: null,
    heldSource: null,
  };
}

export function rematch(state: RakkoState): RakkoState {
  return {
    ...createLobbyState(),
    playerIds: state.playerIds,
    readyIds: [],
  };
}
