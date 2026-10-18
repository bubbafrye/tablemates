import { getServerByName, routePartykitRequest } from "partyserver";
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
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
};

/** Hit Stats GET so it refreshes the GraphQL DO-duration snapshot when stale. */
async function refreshDoQuotaSnapshot(env: Env): Promise<void> {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) return;
  const stub = await getServerByName(env.Stats, "global");
  await stub.fetch("https://stats/", { method: "GET" });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      refreshDoQuotaSnapshot(env).catch((error) => {
        console.error("DO quota refresh failed", error);
      }),
    );
  },
} satisfies ExportedHandler<Env>;
