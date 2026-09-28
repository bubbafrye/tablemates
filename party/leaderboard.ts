import { Server } from "partyserver";
import type { LeaderboardEntry } from "../src/platform/protocol";

const LIMIT = 20;

export class Leaderboard extends Server {
  async onRequest(req: Request) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname.endsWith("/score")) {
      const entry = (await req.json()) as LeaderboardEntry;
      const key = `scores:${entry.gameId}`;
      const current = (await this.ctx.storage.get<LeaderboardEntry[]>(key)) ?? [];
      const without = current.filter((item) => item.playerId !== entry.playerId);
      without.push(entry);
      without.sort((a, b) => b.score - a.score);
      await this.ctx.storage.put(key, without.slice(0, LIMIT));
      return Response.json({ ok: true });
    }

    if (req.method === "GET") {
      const gameId = url.searchParams.get("gameId") ?? "";
      const entries = gameId
        ? ((await this.ctx.storage.get<LeaderboardEntry[]>(`scores:${gameId}`)) ?? [])
        : [];
      return Response.json(entries);
    }

    return new Response("Not found", { status: 404 });
  }
}
