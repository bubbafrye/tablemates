/**
 * Figma tile tint fills (213:154683) — overlay on grey tile-base with mix-blend-overlay.
 * Colors cycle for higher values that reuse the same tint in the component set.
 */
export const TILE_TINT: Record<number, string> = {
  2: "#e7671c",
  4: "#06b6d4",
  8: "#ec4899",
  16: "#10b981",
  32: "#8b5cf6",
  64: "#f59e0b",
  128: "#3b82f6",
  256: "#c1642e",
  512: "#06b6d4",
  1024: "#ec4899",
  2048: "#f59e0b",
  4096: "#8b5cf6",
  8192: "#10b981",
  16384: "#3b82f6",
};

/** Soft glow for higher-scoring tiles (design.md). */
export function tileGlow(value: number): string | undefined {
  if (value < 512) return undefined;
  const tint = TILE_TINT[value] ?? "#e7671c";
  return `0 0 18px 2px ${tint}99, 0 4px 7px rgba(0, 0, 0, 0.25)`;
}

export function tileTint(value: number): string {
  return TILE_TINT[value] ?? TILE_TINT[2]!;
}
