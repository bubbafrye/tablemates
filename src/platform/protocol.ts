export type SessionStatus = "lobby" | "playing" | "paused" | "ended";

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
};

export type SessionState = {
  code: string;
  gameId: string;
  status: SessionStatus;
  hostId: string;
  players: Player[];
  scores: Record<string, number>;
  game?: unknown;
};

export type LeaderboardEntry = {
  playerId: string;
  name: string;
  gameId: string;
  score: number;
  at: string;
};

export type ClientMessage =
  | { type: "hello"; playerId: string; name?: string; email?: string; gameId?: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "score"; playerId: string; delta?: number; absolute?: number }
  | { type: "game"; payload: unknown };

export type ServerMessage =
  | { type: "state"; state: SessionState }
  | { type: "leaderboard"; entries: LeaderboardEntry[] }
  | { type: "error"; message: string };
