const PLAYER_KEY = "tm.playerId";
const EMAIL_KEY = "tm.email";
const ROOMS_KEY = "tm.rooms";

export type HostedRoom = {
  code: string;
  gameId: string;
  createdAt: string;
};

export function getPlayerId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(PLAYER_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(PLAYER_KEY, id);
  return id;
}

export function getRegisteredEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(EMAIL_KEY) ?? "";
}

export function registerEmail(email: string) {
  window.localStorage.setItem(EMAIL_KEY, email);
}

export function rememberRoom(room: HostedRoom) {
  const rooms = listHostedRooms().filter((item) => item.code !== room.code);
  rooms.unshift(room);
  window.localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms.slice(0, 20)));
}

export function listHostedRooms(): HostedRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ROOMS_KEY);
    return raw ? (JSON.parse(raw) as HostedRoom[]) : [];
  } catch {
    return [];
  }
}
