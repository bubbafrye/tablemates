export type ConnectionMeta = {
  playerId: string;
  name?: string;
  ip: string;
  ua: string;
  country: string;
  colo: string;
  city: string;
  connectedAt: string;
};

type CfLike = {
  country?: string;
  colo?: string;
  city?: string;
};

/** Best-effort client fingerprint from the Cloudflare edge request. */
export function connectionMetaFromRequest(
  request: Request,
  playerId: string,
): ConnectionMeta {
  const cf = (request as Request & { cf?: CfLike }).cf;
  const ua = request.headers.get("User-Agent") ?? "";
  return {
    playerId,
    ip:
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
      "unknown",
    ua: ua.length > 160 ? `${ua.slice(0, 157)}…` : ua,
    country: cf?.country ?? "",
    colo: cf?.colo ?? "",
    city: typeof cf?.city === "string" ? cf.city : "",
    connectedAt: new Date().toISOString(),
  };
}

export function summarizeUserAgent(ua: string): string {
  if (!ua) return "unknown client";
  if (/iPhone|iPad/i.test(ua)) return "iOS Safari/WebKit";
  if (/Android/i.test(ua)) return "Android";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  return ua.slice(0, 48);
}
