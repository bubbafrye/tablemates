"use client";

import { useEffect, useState } from "react";
import {
  formatDurationUntil,
  msUntilDurableObjectsReset,
  nextDurableObjectsResetUtc,
} from "@/platform/durableObjectsQuota";
import styles from "./ConnectionBanner.module.css";

type ConnectionBannerProps = {
  connected: boolean;
};

function resetCountdown(): string {
  const ms = msUntilDurableObjectsReset();
  const local = nextDurableObjectsResetUtc().toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `${formatDurationUntil(ms)} (00:00 UTC · ${local} local)`;
}

/** Shown when the PartyServer socket is down — lobby looks like “join only” otherwise. */
export function ConnectionBanner({ connected }: ConnectionBannerProps) {
  const [untilReset, setUntilReset] = useState(resetCountdown);

  useEffect(() => {
    if (connected) return;
    setUntilReset(resetCountdown());
    const id = window.setInterval(() => setUntilReset(resetCountdown()), 1000);
    return () => window.clearInterval(id);
  }, [connected]);

  if (connected) return null;

  return (
    <p className={styles.banner} role="status" data-name="connection-banner">
      Can&apos;t connect to the game server. Live rooms need Durable Objects — if today&apos;s
      free-tier duration quota is used up, it resets in {untilReset}.
    </p>
  );
}
