import { basePath } from "./site";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createRoomCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function normalizeRoomCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replaceAll("0", "O")
    .replaceAll("1", "I");
}

/** Invite URL that works with static hosting (query param, not a dynamic path segment). */
export function inviteUrl(origin: string, code: string, gameId?: string) {
  const params = new URLSearchParams({ code: normalizeRoomCode(code) });
  if (gameId) params.set("game", gameId);
  return `${origin}${basePath()}/s/?${params.toString()}`;
}

export function sessionPath(code: string, gameId?: string) {
  const params = new URLSearchParams({ code: normalizeRoomCode(code) });
  if (gameId) params.set("game", gameId);
  return `/s/?${params.toString()}`;
}
