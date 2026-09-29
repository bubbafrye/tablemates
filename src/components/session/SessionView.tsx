"use client";

import { TicTacToeGame } from "@_tic-tac-toe/TicTacToeGame";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/Button";
import { TextDescription } from "@/components/ui/TextDescription";
import { TextTitle } from "@/components/ui/TextTitle";
import { getGame } from "@/platform/catalog";
import { useSession } from "@/platform/session";
import styles from "./SessionView.module.css";

type SessionViewProps = {
  code: string;
  gameId?: string;
};

export function SessionView({ code, gameId }: SessionViewProps) {
  const session = useSession({ code, gameId });
  const resolvedGameId = session.state?.gameId || gameId;
  const game = getGame(resolvedGameId);
  const isHost = session.state?.hostId === session.playerId;
  const paused = session.state?.status === "paused";

  if (resolvedGameId === "tic-tac-toe") {
    return (
      <TicTacToeGame
        code={code}
        playerId={session.playerId}
        session={session.state}
        connected={session.connected}
        sendGame={session.sendGame}
        setScore={session.setScore}
        setName={session.setName}
      />
    );
  }

  return (
    <div className={styles.page}>
      <SiteHeader roomCode={code} gameId={resolvedGameId} />
      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles.copy}>
            <h1 className={styles.title}>{game?.name ?? "Game Name"}</h1>
            <p className={styles.lede}>
              {game?.description ??
                "Game description.  Short text.  Two sentences maximum. Short text.  Two sentences maximum. Short text.  Two sentences maximum. "}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.library}>
        <article className={styles.card}>
          <div className={styles.meta}>
            <TextTitle>{game?.name ?? "Game Name"}</TextTitle>
            {isHost ? (
              <Button variant="secondary" icon={false} onClick={paused ? session.resume : session.pause}>
                {paused ? "Resume" : "Pause"}
              </Button>
            ) : (
              <Button variant="plain" icon={false}>
                {paused ? "Paused" : "Playing"}
              </Button>
            )}
          </div>
          <TextDescription>
            Share the room code from the header, or open the QR button so nearby players can join.
          </TextDescription>
          {session.state ? (
            <ul className={styles.scores}>
              {session.state.players.map((player) => (
                <li key={player.id}>
                  {player.name} {player.score}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
      <SiteFooter />
    </div>
  );
}
