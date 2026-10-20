import type { LeaderboardEntry } from "./protocol";
import { getPlayerId, getPlayerName } from "./identity";
import { partyHttpOrigin } from "./site";

const DEBOUNCE_MS = 1500;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: { gameId: string; score: number } | null = null;

function scoreUrl() {
  return `${partyHttpOrigin()}/parties/leaderboard/global/score`;
}

async function postScore(gameId: string, score: number) {
  const entry: LeaderboardEntry = {
    playerId: getPlayerId(),
    name: getPlayerName() || "Player",
    gameId,
    score,
    at: new Date().toISOString(),
  };
  try {
    await fetch(scoreUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    /* Party down — local best still stands */
  }
}

/** Immediate flush of a debounced personal-best POST. */
export function flushHighScoreSubmit() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const job = pending;
  pending = null;
  if (!job || job.score <= 0) return;
  void postScore(job.gameId, job.score);
}

/**
 * POST a personal best to the global Leaderboard Durable Object (HTTP, no room).
 * Debounced so a scoring streak is one request.
 */
export function submitHighScore(gameId: string, score: number) {
  if (!gameId || !Number.isFinite(score) || score <= 0) return;
  if (typeof window === "undefined") return;
  const next = Math.floor(score);
  if (pending && pending.gameId === gameId && pending.score >= next) return;
  pending = { gameId, score: next };
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flushHighScoreSubmit();
  }, DEBOUNCE_MS);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushHighScoreSubmit);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushHighScoreSubmit();
  });
}
