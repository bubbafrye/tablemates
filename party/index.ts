import { routePartykitRequest } from "partyserver";
import type { Session } from "./session";
import type { Leaderboard } from "./leaderboard";

export { Session } from "./session";
export { Leaderboard } from "./leaderboard";

type Env = {
  Session: DurableObjectNamespace<Session>;
  Leaderboard: DurableObjectNamespace<Leaderboard>;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
