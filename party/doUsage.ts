/** Free-plan DO duration budget (GB-seconds / UTC day). */
export const DO_FREE_DURATION_GB_S = 13_000;

export type DoDurationQuota = {
  usedGbS: number;
  limitGbS: number;
  asOf: string;
  /** Set when the last GraphQL refresh failed (previous usedGbS may still be shown). */
  error?: string;
};

type GraphQlResponse = {
  data?: {
    viewer?: {
      accounts?: Array<{
        durableObjectsPeriodicGroups?: Array<{
          sum?: { duration?: number | null };
        }>;
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

function utcDayBounds(now = new Date()): { start: string; end: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Today's Durable Objects wall-clock duration from GraphQL Analytics.
 * `sum.duration` is treated as GB-s (same as Cloudflare quota monitors).
 */
export async function fetchDoDurationQuota(
  apiToken: string,
  accountId: string,
  now = new Date(),
): Promise<DoDurationQuota> {
  const { start, end } = utcDayBounds(now);
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        durableObjectsPeriodicGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum { duration }
        }
      }
    }
  }`;

  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { accountTag: accountId, start, end },
    }),
  });

  const asOf = now.toISOString();
  if (!res.ok) {
    throw new Error(`Cloudflare GraphQL HTTP ${res.status}`);
  }

  const body = (await res.json()) as GraphQlResponse;
  if (body.errors?.length) {
    throw new Error(body.errors[0]?.message ?? "Cloudflare GraphQL error");
  }

  const groups =
    body.data?.viewer?.accounts?.[0]?.durableObjectsPeriodicGroups ?? [];
  let usedGbS = 0;
  for (const group of groups) {
    usedGbS += Number(group.sum?.duration ?? 0);
  }

  return {
    usedGbS: Math.max(0, usedGbS),
    limitGbS: DO_FREE_DURATION_GB_S,
    asOf,
  };
}
