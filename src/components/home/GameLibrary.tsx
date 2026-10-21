"use client";

import { useRouter } from "next/navigation";
import { GameCard } from "@/components/ui/GameCard";
import { catalog, getGame } from "@/platform/catalog";
import { createRoomCode, playPath, sessionPath } from "@/platform/codes";
import { factsForGame, type GameFacts } from "@/platform/gamesData";
import { rememberRoom } from "@/platform/identity";
import styles from "./GameLibrary.module.css";

type GameLibraryProps = {
  rows: GameFacts[];
};

export function GameLibrary({ rows }: GameLibraryProps) {
  const router = useRouter();
  const catalogIds = catalog.map((game) => game.id);

  function launch(gameId: string) {
    const game = getGame(gameId);
    if (game && !game.multiplayer) {
      router.push(playPath(gameId));
      return;
    }
    const code = createRoomCode();
    rememberRoom({ code, gameId, createdAt: new Date().toISOString() });
    router.push(sessionPath(code, gameId));
  }

  return (
    <section className={styles.library} data-name="Games library">
      <div className={styles.grid}>
        {catalog.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            facts={factsForGame(game.id, catalogIds, rows)}
            onLaunch={launch}
          />
        ))}
      </div>
    </section>
  );
}
