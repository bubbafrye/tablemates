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

export function inviteUrl(origin: string, code: string) {
  return `${origin}/s/${normalizeRoomCode(code)}`;
}
