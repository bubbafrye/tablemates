"use client";

import { useRouter } from "next/navigation";
import { GameCard } from "@/components/ui/GameCard";
import { catalog } from "@/platform/catalog";
import { createRoomCode, sessionPath } from "@/platform/codes";
import { rememberRoom } from "@/platform/identity";
import styles from "./GameLibrary.module.css";

export function GameLibrary() {
  const router = useRouter();

  function launch(gameId: string) {
    const code = createRoomCode();
    rememberRoom({ code, gameId, createdAt: new Date().toISOString() });
    router.push(sessionPath(code, gameId));
  }

  return (
    <section className={styles.library} data-name="Games library">
      <div className={styles.grid}>
        {catalog.map((game) => (
          <GameCard key={game.id} game={game} onLaunch={launch} />
        ))}
      </div>
    </section>
  );
}
