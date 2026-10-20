"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Game2048 } from "@_2048/Game2048";
import { getGame } from "@/platform/catalog";
import { withBasePath } from "@/platform/site";

function PlayPageInner() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("game") ?? "";
  const game = useMemo(() => getGame(gameId), [gameId]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  if (gameId === "2048") {
    return <Game2048 />;
  }

  if (!game || game.multiplayer) {
    return (
      <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <p>That game is not a solo tablemates title.</p>
        <p>
          <a href={withBasePath("/")}>Back to tablemates</a>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <p>{game.name} is not ready yet.</p>
      <p>
        <a href={withBasePath("/")}>Back to tablemates</a>
      </p>
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={null}>
      <PlayPageInner />
    </Suspense>
  );
}
