import type { LeaderboardEntry } from "./protocol";
import { catalog } from "./catalog";
import { partyHost, partyHttpOrigin } from "./site";
import {
  getPlayerId,
  getPlayerName,
  getRegisteredEmail,
  listHostedRooms,
  type HostedRoom,
} from "./identity";

export type RoomSnapshot = {
  code: string;
  gameId: string;
  status: string;
  players: number;
  connections: number;
  updatedAt: string;
};

export type SiteStatsPayload = {
  at: string;
  rooms: RoomSnapshot[];
  totals: {
    roomsActive: number;
    lobbiesOpen: number;
    gamesPlaying: number;
    playersSeated: number;
    connectionsOnline: number;
    roomsSeen: number;
  };
  byGame: Record<string, { rooms: number; players: number; connections: number }>;
};

export type LocalUsage = {
  playerId: string;
  playerName: string;
  email: string;
  hostedRooms: HostedRoom[];
  partyHost: string;
};

export type UsageDashboardData = {
  local: LocalUsage;
  remote: SiteStatsPayload | null;
  leaderboards: Record<string, LeaderboardEntry[]>;
  error: string | null;
  fetchedAt: string;
};

function emptyRemote(): SiteStatsPayload {
  return {
    at: new Date().toISOString(),
    rooms: [],
    totals: {
      roomsActive: 0,
      lobbiesOpen: 0,
      gamesPlaying: 0,
      playersSeated: 0,
      connectionsOnline: 0,
      roomsSeen: 0,
    },
    byGame: {},
  };
}

export function readLocalUsage(): LocalUsage {
  return {
    playerId: getPlayerId(),
    playerName: getPlayerName(),
    email: getRegisteredEmail(),
    hostedRooms: listHostedRooms(),
    partyHost: partyHost(),
  };
}

export async function fetchUsageDashboard(): Promise<UsageDashboardData> {
  const local = readLocalUsage();
  const origin = partyHttpOrigin();
  const fetchedAt = new Date().toISOString();

  try {
    const statsRes = await fetch(`${origin}/parties/stats/global`, {
      cache: "no-store",
    });
    if (!statsRes.ok) {
      return {
        local,
        remote: null,
        leaderboards: {},
        error: `Game server responded ${statsRes.status}. Live room stats, leaderboards, and open lobbies are unavailable.`,
        fetchedAt,
      };
    }

    const remote = (await statsRes.json()) as SiteStatsPayload;
    const readyGames = catalog.filter((g) => g.ready).map((g) => g.id);
    const leaderboards: Record<string, LeaderboardEntry[]> = {};

    await Promise.all(
      readyGames.map(async (gameId) => {
        try {
          const res = await fetch(
            `${origin}/parties/leaderboard/global?gameId=${encodeURIComponent(gameId)}`,
            { cache: "no-store" },
          );
          if (res.ok) {
            leaderboards[gameId] = (await res.json()) as LeaderboardEntry[];
          }
        } catch {
          /* optional */
        }
      }),
    );

    return { local, remote: remote ?? emptyRemote(), leaderboards, error: null, fetchedAt };
  } catch {
    return {
      local,
      remote: null,
      leaderboards: {},
      error:
        "Can't reach the game server. Live room stats, leaderboards, and open lobbies are unavailable — showing this browser only.",
      fetchedAt,
    };
  }
}
