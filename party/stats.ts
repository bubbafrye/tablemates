import { Server } from "partyserver";

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

type Stored = {
  rooms: Record<string, RoomSnapshot>;
  roomsSeen: number;
};

const STALE_MS = 15 * 60 * 1000;

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

/** Singleton registry of live rooms for the usage dashboard. */
export class Stats extends Server {
  async onRequest(request: Request) {
    const headers = corsHeaders(request);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname.endsWith("/room")) {
      const snap = (await request.json()) as RoomSnapshot;
      if (!snap?.code) {
        return Response.json({ ok: false }, { status: 400, headers });
      }
      await this.upsertRoom(snap);
      return Response.json({ ok: true }, { headers });
    }

    if (request.method === "GET") {
      return Response.json(await this.payload(), { headers });
    }

    return new Response("Not found", { status: 404, headers });
  }

  private async load(): Promise<Stored> {
    return (
      (await this.ctx.storage.get<Stored>("stats")) ?? {
        rooms: {},
        roomsSeen: 0,
      }
    );
  }

  private async save(data: Stored) {
    await this.ctx.storage.put("stats", data);
  }

  private async upsertRoom(snap: RoomSnapshot) {
    const data = await this.load();
    const code = snap.code.toUpperCase();
    const existed = Boolean(data.rooms[code]);

    if (snap.connections <= 0) {
      delete data.rooms[code];
    } else {
      if (!existed) data.roomsSeen += 1;
      data.rooms[code] = { ...snap, code };
    }

    await this.save(data);
  }

  private async payload(): Promise<SiteStatsPayload> {
    const data = await this.load();
    const now = Date.now();
    let changed = false;

    const rooms = Object.values(data.rooms).filter((room) => {
      const age = now - Date.parse(room.updatedAt || "") || 0;
      if (age > STALE_MS || room.connections <= 0) {
        delete data.rooms[room.code];
        changed = true;
        return false;
      }
      return true;
    });

    if (changed) await this.save(data);

    rooms.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const byGame: SiteStatsPayload["byGame"] = {};
    for (const room of rooms) {
      const key = room.gameId || "unknown";
      const bucket = byGame[key] ?? { rooms: 0, players: 0, connections: 0 };
      bucket.rooms += 1;
      bucket.players += room.players;
      bucket.connections += room.connections;
      byGame[key] = bucket;
    }

    return {
      at: new Date().toISOString(),
      rooms,
      totals: {
        roomsActive: rooms.length,
        lobbiesOpen: rooms.filter((r) => r.status === "lobby").length,
        gamesPlaying: rooms.filter(
          (r) => r.status === "playing" || r.status === "paused",
        ).length,
        playersSeated: rooms.reduce((sum, r) => sum + r.players, 0),
        connectionsOnline: rooms.reduce((sum, r) => sum + r.connections, 0),
        roomsSeen: data.roomsSeen,
      },
      byGame,
    };
  }
}
