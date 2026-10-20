"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionView } from "@/components/session/SessionView";
import { getGame } from "@/platform/catalog";
import { normalizeRoomCode, playPath } from "@/platform/codes";
import { withBasePath } from "@/platform/site";

function SessionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = useMemo(
    () => normalizeRoomCode(searchParams.get("code") ?? ""),
    [searchParams],
  );
  const gameId = searchParams.get("game") ?? undefined;
  const [mode, setMode] = useState<"pending" | "solo" | "session" | "missing">(
    "pending",
  );

  useEffect(() => {
    const solo = gameId ? getGame(gameId) : undefined;
    if (solo && !solo.multiplayer) {
      router.replace(playPath(solo.id));
      setMode("solo");
      return;
    }
    if (!code) {
      setMode("missing");
      return;
    }
    setMode("session");
  }, [code, gameId, router]);

  if (mode === "pending" || mode === "solo") return null;

  if (mode === "missing") {
    return (
      <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <p>Missing room code. Join from the home page or open an invite link.</p>
        <p>
          <a href={withBasePath("/")}>Back to tablemates</a>
        </p>
      </main>
    );
  }

  return <SessionView code={code} gameId={gameId} />;
}

export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionPageInner />
    </Suspense>
  );
}
