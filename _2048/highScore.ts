const HIGH_SCORE_KEY = "tm.2048.highScore";

export function readHighScore(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

/** Persist `score` if it beats the stored high score. Returns the new best. */
export function writeHighScoreIfBetter(score: number): number {
  if (typeof window === "undefined") return 0;
  const prev = readHighScore();
  const next = Math.max(prev, Math.floor(score) || 0);
  if (next > prev) {
    try {
      window.localStorage.setItem(HIGH_SCORE_KEY, String(next));
    } catch {
      /* private mode / quota — keep in-memory best via return value */
    }
  }
  return next;
}
