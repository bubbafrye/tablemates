"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import usePartySocket from "partysocket/react";
import { getPlayerId, getRegisteredEmail } from "./identity";
import type { ClientMessage, LeaderboardEntry, ServerMessage, SessionState } from "./protocol";
import { partyHost } from "./site";

function subscribe() {
  return () => undefined;
}

type UseSessionOptions = {
  code: string;
  gameId?: string;
};

export function useSession({ code, gameId }: UseSessionOptions) {
  const playerId = useSyncExternalStore(subscribe, getPlayerId, () => "");
  const email = useSyncExternalStore(subscribe, getRegisteredEmail, () => "");
  const [state, setState] = useState<SessionState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socket = usePartySocket({
    host: partyHost(),
    room: code,
    query: playerId
      ? {
          playerId,
          gameId: gameId ?? "",
          email,
        }
      : undefined,
    onMessage(event) {
      const message = JSON.parse(String(event.data)) as ServerMessage;
      if (message.type === "state") setState(message.state);
      if (message.type === "leaderboard") setLeaderboard(message.entries);
      if (message.type === "error") setError(message.message);
    },
    onOpen() {
      if (!playerId) return;
      send(socket, {
        type: "hello",
        playerId,
        email,
        gameId,
      });
    },
  });

  const api = useMemo(
    () => ({
      pause: () => send(socket, { type: "pause" }),
      resume: () => send(socket, { type: "resume" }),
      setScore: (id: string, absolute: number) => send(socket, { type: "score", playerId: id, absolute }),
      adjustScore: (id: string, delta: number) => send(socket, { type: "score", playerId: id, delta }),
      sendGame: (payload: unknown) => send(socket, { type: "game", payload }),
    }),
    [socket],
  );

  return {
    playerId,
    state,
    leaderboard,
    error,
    connected: socket.readyState === socket.OPEN,
    ...api,
  };
}

function send(socket: { send: (data: string) => void }, message: ClientMessage) {
  if (socket) socket.send(JSON.stringify(message));
}
