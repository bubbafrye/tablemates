import { Server, type Connection, type ConnectionContext, getServerByName } from "partyserver";
import type { ClientMessage, Player, ServerMessage, SessionState } from "../src/platform/protocol";
import { corsHeaders } from "./cors";
import type { Leaderboard } from "./leaderboard";
import type { Stats } from "./stats";

type Env = {
  Session: DurableObjectNamespace;
  Leaderboard: DurableObjectNamespace<Leaderboard>;
  Stats: DurableObjectNamespace<Stats>;
};

export class Session extends Server<Env> {
  static options = {
    hibernate: true,
  };

  state: SessionState = {
    code: "",
    gameId: "",
    status: "lobby",
    hostId: "",
    players: [],
    scores: {},
  };

  async onStart() {
    this.state = {
      code: this.name,
      gameId: "",
      status: "lobby",
      hostId: "",
      players: [],
      scores: {},
    };
    const stored = await this.ctx.storage.get<SessionState>("state");
    if (stored) this.state = stored;
  }

  async onRequest(request: Request) {
    const headers = corsHeaders(request);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "POST" && new URL(request.url).pathname.endsWith("/close")) {
      await this.closeRoom();
      return Response.json({ ok: true }, { headers });
    }

    return new Response("Not found", { status: 404, headers });
  }

  async onConnect(connection: Connection, ctx: ConnectionContext) {
    const url = new URL(ctx.request.url);
    const playerId = url.searchParams.get("playerId") ?? connection.id;
    const gameId = url.searchParams.get("gameId") ?? "";
    await this.upsertPlayer(playerId, gameId);
    this.push(connection);
    await this.reportStats();
  }

  async onClose() {
    await this.reportStats();
  }

  async onMessage(connection: Connection, message: string | ArrayBuffer) {
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(String(message)) as ClientMessage;
    } catch {
      this.send(connection, { type: "error", message: "Invalid message" });
      return;
    }

    if (parsed.type === "hello") {
      await this.upsertPlayer(parsed.playerId, parsed.gameId ?? "", parsed.name);
      this.push();
      await this.reportStats();
      return;
    }

    if (parsed.type === "pause") {
      if (this.state.status === "playing" || this.state.status === "lobby") {
        this.state.status = "paused";
        await this.persist();
        this.push();
        await this.reportStats();
      }
      return;
    }

    if (parsed.type === "resume") {
      this.state.status = this.state.players.length ? "playing" : "lobby";
      await this.persist();
      this.push();
      await this.reportStats();
      return;
    }

    if (parsed.type === "score") {
      const current = this.state.scores[parsed.playerId] ?? 0;
      const next = parsed.absolute ?? current + (parsed.delta ?? 0);
      this.state.scores[parsed.playerId] = next;
      const player = this.state.players.find((item) => item.id === parsed.playerId);
      if (player) player.score = next;
      await this.persist();
      this.push();
      await this.recordHighScore(parsed.playerId, next);
      return;
    }

    if (parsed.type === "game") {
      this.state.game = parsed.payload;
      if (this.state.status === "lobby") this.state.status = "playing";
      await this.persist();
      this.push();
      await this.reportStats();
      return;
    }
  }

  /** Kick everyone and clear the live-room registry entry. */
  private async closeRoom() {
    for (const connection of [...this.getConnections()]) {
      try {
        connection.close(1000, "Room closed");
      } catch {
        /* already closed */
      }
    }
    this.state.players = [];
    this.state.hostId = "";
    this.state.status = "lobby";
    this.state.game = undefined;
    await this.persist();
    await this.reportStats(0);
  }

  private async upsertPlayer(playerId: string, gameId: string, name?: string) {
    if (gameId && !this.state.gameId) this.state.gameId = gameId;
    if (!this.state.hostId) this.state.hostId = playerId;

    const trimmed = name?.trim().slice(0, 20);
    const existing = this.state.players.find((player) => player.id === playerId);
    if (existing) {
      if (trimmed) existing.name = trimmed;
    } else {
      const player: Player = {
        id: playerId,
        name: trimmed || `Player ${this.state.players.length + 1}`,
        isHost: this.state.hostId === playerId,
        score: this.state.scores[playerId] ?? 0,
      };
      this.state.players.push(player);
      this.state.scores[playerId] = player.score;
    }

    await this.persist();
  }

  private async persist() {
    await this.ctx.storage.put("state", this.state);
  }

  private connectionCount() {
    let n = 0;
    for (const _ of this.getConnections()) n += 1;
    return n;
  }

  private async reportStats(connections = this.connectionCount()) {
    try {
      const stub = await getServerByName(this.env.Stats, "global");
      await stub.fetch("https://stats/room", {
        method: "POST",
        body: JSON.stringify({
          code: this.state.code || this.name,
          gameId: this.state.gameId,
          status: this.state.status,
          players: connections <= 0 ? 0 : this.state.players.length,
          connections,
          updatedAt: new Date().toISOString(),
        }),
      });
    } catch {
      /* stats are best-effort */
    }
  }

  private async recordHighScore(playerId: string, score: number) {
    const player = this.state.players.find((item) => item.id === playerId);
    if (!player || !this.state.gameId) return;
    const stub = await getServerByName(this.env.Leaderboard, "global");
    await stub.fetch("https://leaderboard/score", {
      method: "POST",
      body: JSON.stringify({
        playerId,
        name: player.name,
        gameId: this.state.gameId,
        score,
        at: new Date().toISOString(),
      }),
    });
    const response = await stub.fetch(`https://leaderboard/list?gameId=${this.state.gameId}`);
    const entries = await response.json();
    this.broadcast(JSON.stringify({ type: "leaderboard", entries } satisfies ServerMessage));
  }

  private push(connection?: Connection) {
    const payload = JSON.stringify({ type: "state", state: this.state } satisfies ServerMessage);
    if (connection) connection.send(payload);
    else this.broadcast(payload);
  }

  private send(connection: Connection, message: ServerMessage) {
    connection.send(JSON.stringify(message));
  }
}
