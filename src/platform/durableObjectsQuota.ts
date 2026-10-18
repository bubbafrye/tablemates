/**
 * Cloudflare Durable Objects free-plan duration quota resets daily at 00:00 UTC.
 * @see https://developers.cloudflare.com/durable-objects/platform/pricing/
 */

/** Free-plan duration budget (GB-seconds / day). */
export const DO_FREE_DURATION_GB_S = 13_000;

export function nextDurableObjectsResetUtc(now = new Date()): Date {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
  return next;
}

export function msUntilDurableObjectsReset(now = new Date()): number {
  return Math.max(0, nextDurableObjectsResetUtc(now).getTime() - now.getTime());
}

/** e.g. "4h 12m" or "38m" or "12s" */
export function formatDurationUntil(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function durableObjectsResetDetail(now = new Date()): string {
  const reset = nextDurableObjectsResetUtc(now);
  const local = reset.toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `00:00 UTC · ${local} local`;
}

export function durableObjectsResetLabel(now = new Date()): string {
  const ms = msUntilDurableObjectsReset(now);
  return `Free-tier DO duration resets in ${formatDurationUntil(ms)} (${durableObjectsResetDetail(now)})`;
}
