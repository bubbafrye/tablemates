import {
  currentPlayerId,
  discardHeld,
  replaceSlot,
  RACK_SIZE,
  scoreRack,
  takeDiscard,
  takeDraw,
  type RakkoState,
} from "./logic";

export const BOT_ID = "bot";
export const BOT_NAME = "H.A.L.";

export function isBotId(id: string | null | undefined): boolean {
  return id === BOT_ID;
}

/** Score a candidate rack after placing `card` at `slotIndex`. */
function placementScore(rack: number[], card: number, slotIndex: number): number {
  const next = [...rack];
  next[slotIndex] = card;
  const { points, isRakko } = scoreRack(next);
  return points + (isRakko ? 1000 : 0);
}

function bestSlot(rack: number[], card: number): { index: number; score: number } {
  let best = { index: 0, score: -Infinity };
  for (let i = 0; i < RACK_SIZE; i += 1) {
    const score = placementScore(rack, card, i);
    if (score > best.score) best = { index: i, score };
  }
  return best;
}

function finishHeld(state: RakkoState): RakkoState | null {
  if (state.held === null) return null;
  const rack = state.racks[BOT_ID];
  if (!rack || rack.length !== RACK_SIZE) return null;

  const current = scoreRack(rack).points;
  const { index, score } = bestSlot(rack, state.held);

  if (state.heldSource === "discard") {
    return replaceSlot(state, BOT_ID, index);
  }

  if (score > current) {
    return replaceSlot(state, BOT_ID, index);
  }

  return discardHeld(state, BOT_ID);
}

/**
 * Play one full bot turn: take discard (if useful) or draw, then place or discard.
 * Host-only; returns null if it is not the bot's turn.
 */
export function playBotTurn(state: RakkoState, random = Math.random): RakkoState | null {
  if (state.phase !== "playing") return null;
  if (currentPlayerId(state) !== BOT_ID) return null;

  if (state.held !== null) {
    return finishHeld(state);
  }

  const rack = state.racks[BOT_ID];
  if (!rack || rack.length !== RACK_SIZE) return null;

  const discardTop =
    state.discardPile.length > 0
      ? state.discardPile[state.discardPile.length - 1]
      : null;

  if (discardTop != null) {
    const current = scoreRack(rack).points;
    const { score } = bestSlot(rack, discardTop);
    if (score > current) {
      const taken = takeDiscard(state, BOT_ID);
      if (!taken) return null;
      return finishHeld(taken);
    }
  }

  const drawn = takeDraw(state, BOT_ID, random);
  if (!drawn) return null;
  return finishHeld(drawn);
}
