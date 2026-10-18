import { Server, getServerByName } from "partyserver";
import type { ConnectionMeta } from "./connectionMeta";
import { corsHeaders } from "./cors";
import {
  DO_FREE_DURATION_GB_S,
  fetchDoDurationQuota,
  type DoDurationQuota,
} from "./doUsage";

export type RoomSnapshot = {
  code: string;
  gameId: string;
  status: string;
  players: number;
  connections: number;
  clients?: ConnectionMeta[];
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
  /** Cloudflare GraphQL snapshot of free-tier DO duration (may be null if never refreshed). */
  doQuota: DoDurationQuota | null;
};

type Stored = {
  rooms: Record<string, RoomSnapshot>;
  roomsSeen: number;
  doQuota?: DoDurationQuota;
};

type Env = {
  Session: DurableObjectNamespace;
  Stats: DurableObjectNamespace;
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
};

const STALE_MS = 15 * 60 * 1000;
/** How often to re-query Cloudflare Analytics for DO duration. */
const QUOTA_STALE_MS = 10 * 60 * 1000;

/** Singleton registry of live rooms for the usage dashboard. */
export class Stats extends Server<Env> {
  static options = {
    hibernate: true,
  };

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

    if (request.method === "POST" && url.pathname.endsWith("/close")) {
      const body = (await request.json()) as { code?: string };
      const code = body?.code?.trim().toUpperCase();
      if (!code) {
        return Response.json({ ok: false, error: "Missing code" }, { status: 400, headers });
      }

      try {
        const session = await getServerByName(this.env.Session, code);
        await session.fetch("https://session/close", { method: "POST" });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Close failed" },
          { status: 502, headers },
        );
      }

      const data = await this.load();
      delete data.rooms[code];
      await this.save(data);

      return Response.json({ ok: true }, { headers });
    }

    if (request.method === "GET") {
      return Response.json(await this.payload({ refreshQuota: true }), { headers });
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

  private quotaIsStale(quota: DoDurationQuota | undefined, now: number): boolean {
    if (!quota?.asOf) return true;
    const age = now - Date.parse(quota.asOf);
    if (!Number.isFinite(age) || age < 0) return true;
    return age > QUOTA_STALE_MS;
  }

  /** Pull today's DO duration from GraphQL when secrets exist and the snapshot is stale. */
  private async maybeRefreshQuota(data: Stored): Promise<Stored> {
    const token = this.env.CF_API_TOKEN;
    const accountId = this.env.CF_ACCOUNT_ID;
    if (!token || !accountId) return data;

    const now = Date.now();
    if (!this.quotaIsStale(data.doQuota, now)) return data;

    try {
      const next = await fetchDoDurationQuota(token, accountId, new Date(now));
      data.doQuota = next;
      await this.save(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Quota refresh failed";
      data.doQuota = {
        usedGbS: data.doQuota?.usedGbS ?? 0,
        limitGbS: data.doQuota?.limitGbS ?? DO_FREE_DURATION_GB_S,
        asOf: data.doQuota?.asOf ?? new Date(now).toISOString(),
        error: message,
      };
      await this.save(data);
    }

    return data;
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

  private async payload(opts?: { refreshQuota?: boolean }): Promise<SiteStatsPayload> {
    let data = await this.load();
    if (opts?.refreshQuota) {
      data = await this.maybeRefreshQuota(data);
    }

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
      doQuota: data.doQuota ?? null,
    };
  }
}
