import { routePartykitRequest } from "partyserver";
import type { Session } from "./session";
import type { Leaderboard } from "./leaderboard";
import type { Stats } from "./stats";

export { Session } from "./session";
export { Leaderboard } from "./leaderboard";
export { Stats } from "./stats";

type Env = {
  Session: DurableObjectNamespace<Session>;
  Leaderboard: DurableObjectNamespace<Leaderboard>;
  Stats: DurableObjectNamespace<Stats>;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
