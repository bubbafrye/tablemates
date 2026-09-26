import type * as Party from "partykit/server";
import type { ClientMessage, Player, ServerMessage, SessionState } from "../src/platform/protocol";

export default class SessionServer implements Party.Server {
  state: SessionState;

  constructor(readonly room: Party.Room) {
    this.state = {
      code: room.id,
      gameId: "",
      status: "lobby",
      hostId: "",
      players: [],
      scores: {},
    };
  }

  async onStart() {
    const stored = await this.room.storage.get<SessionState>("state");
    if (stored) this.state = stored;
  }

  async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const playerId = url.searchParams.get("playerId") ?? connection.id;
    const gameId = url.searchParams.get("gameId") ?? "";
    await this.upsertPlayer(playerId, gameId);
    this.push(connection);
  }

  async onMessage(message: string, sender: Party.Connection) {
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(message) as ClientMessage;
    } catch {
      this.send(sender, { type: "error", message: "Invalid message" });
      return;
    }

    if (parsed.type === "hello") {
      await this.upsertPlayer(parsed.playerId, parsed.gameId ?? "");
      this.push();
      return;
    }

    if (parsed.type === "pause") {
      if (this.state.status === "playing" || this.state.status === "lobby") {
        this.state.status = "paused";
        await this.persist();
        this.push();
      }
      return;
    }

    if (parsed.type === "resume") {
      this.state.status = this.state.players.length ? "playing" : "lobby";
      await this.persist();
      this.push();
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
      return;
    }
  }

  private async upsertPlayer(playerId: string, gameId: string) {
    if (gameId && !this.state.gameId) this.state.gameId = gameId;
    if (!this.state.hostId) this.state.hostId = playerId;

    const existing = this.state.players.find((player) => player.id === playerId);
    if (!existing) {
      const player: Player = {
        id: playerId,
        name: `Player ${this.state.players.length + 1}`,
        isHost: this.state.hostId === playerId,
        score: this.state.scores[playerId] ?? 0,
      };
      this.state.players.push(player);
      this.state.scores[playerId] = player.score;
    }

    await this.persist();
  }

  private async persist() {
    await this.room.storage.put("state", this.state);
  }

  private async recordHighScore(playerId: string, score: number) {
    const player = this.state.players.find((item) => item.id === playerId);
    if (!player || !this.state.gameId) return;
    const stub = this.room.context.parties.leaderboard.get("global");
    await stub.fetch("/score", {
      method: "POST",
      body: JSON.stringify({
        playerId,
        name: player.name,
        gameId: this.state.gameId,
        score,
        at: new Date().toISOString(),
      }),
    });
    const response = await stub.fetch(`/list?gameId=${this.state.gameId}`);
    const entries = await response.json();
    this.room.broadcast(JSON.stringify({ type: "leaderboard", entries } satisfies ServerMessage));
  }

  private push(connection?: Party.Connection) {
    const payload = JSON.stringify({ type: "state", state: this.state } satisfies ServerMessage);
    if (connection) connection.send(payload);
    else this.room.broadcast(payload);
  }

  private send(connection: Party.Connection, message: ServerMessage) {
    connection.send(JSON.stringify(message));
  }
}

SessionServer satisfies Party.Worker;
