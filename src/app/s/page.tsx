"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SessionView } from "@/components/session/SessionView";
import { normalizeRoomCode } from "@/platform/codes";
import { withBasePath } from "@/platform/site";

function SessionPageInner() {
  const searchParams = useSearchParams();
  const code = useMemo(
    () => normalizeRoomCode(searchParams.get("code") ?? ""),
    [searchParams],
  );
  const gameId = searchParams.get("game") ?? undefined;

  if (!code) {
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
