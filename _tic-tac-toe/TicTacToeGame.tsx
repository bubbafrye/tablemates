"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { withBasePath } from "@/platform/site";
import type { Player, SessionState } from "@/platform/protocol";
import { Board } from "./Board";
import {
  applyMove,
  assignSeats,
  createInitialState,
  isTicTacToeState,
  resetBoard,
  type TicTacToeState,
} from "./logic";
import { PlayerBadge } from "./PlayerBadge";
import { ShareModal } from "@/components/ui/ShareModal";
import styles from "./TicTacToeGame.module.css";

type TicTacToeGameProps = {
  code: string;
  playerId: string;
  session: SessionState | null;
  connected: boolean;
  sendGame: (payload: unknown) => void;
  setScore: (playerId: string, absolute: number) => void;
};

export function TicTacToeGame({
  code,
  playerId,
  session,
  connected,
  sendGame,
  setScore,
}: TicTacToeGameProps) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [local, setLocal] = useState<TicTacToeState>(createInitialState);
  const scoredKey = useRef<string | null>(null);

  const players = session?.players ?? [];
  const remote = isTicTacToeState(session?.game) ? session.game : null;
  const game = remote ?? local;

  useEffect(() => {
    if (!session || !playerId || !connected) return;
    if (remote) return;
    if (session.hostId !== playerId) return;

    const seeded = assignSeats(
      createInitialState(),
      players.map((player) => player.id),
    );
    setLocal(seeded);
    sendGame(seeded);
  }, [session, playerId, connected, remote, players, sendGame]);

  useEffect(() => {
    if (!remote || session?.hostId !== playerId) return;
    const withSeats = assignSeats(
      remote,
      players.map((player) => player.id),
    );
    if (
      withSeats.xPlayerId !== remote.xPlayerId ||
      withSeats.oPlayerId !== remote.oPlayerId
    ) {
      sendGame(withSeats);
    }
  }, [remote, players, session?.hostId, playerId, sendGame]);

  useEffect(() => {
    if (!remote?.winner) {
      scoredKey.current = null;
      return;
    }
    if (remote.winner === "draw" || session?.hostId !== playerId) return;
    const winnerId = remote.winner === "X" ? remote.xPlayerId : remote.oPlayerId;
    if (!winnerId) return;
    const key = `${remote.board.join("")}:${remote.winner}`;
    if (scoredKey.current === key) return;
    scoredKey.current = key;
    const current = session.scores[winnerId] ?? 0;
    setScore(winnerId, current + 1);
  }, [remote, session, playerId, setScore]);

  const xPlayer = useMemo(
    () => players.find((player) => player.id === game.xPlayerId) ?? fallbackPlayer("Player 1", true),
    [players, game.xPlayerId],
  );
  const oPlayer = useMemo(
    () => players.find((player) => player.id === game.oPlayerId) ?? fallbackPlayer("Player 2", false),
    [players, game.oPlayerId],
  );

  const myMark = game.xPlayerId === playerId ? "X" : game.oPlayerId === playerId ? "O" : null;
  const canPlay =
    connected &&
    !game.winner &&
    session?.status !== "paused" &&
    myMark === game.turn &&
    Boolean(game.xPlayerId && game.oPlayerId);

  function publish(next: TicTacToeState) {
    setLocal(next);
    sendGame(next);
  }

  function handleCell(index: number) {
    const next = applyMove(game, index, playerId);
    if (!next) return;
    publish(next);
  }

  function handleRematch() {
    if (session?.hostId !== playerId) return;
    publish(resetBoard(game));
  }

  return (
    <div className={styles.page} data-name="tic-tac-toe">
      <SiteHeader roomCode={code} gameId="tic-tac-toe" />
      <div className={styles.content} data-name="content">
        <div className={styles.gameArea} data-name="game-area">
          <div className={styles.players} data-name="players">
            <PlayerBadge mark="X" name={xPlayer.name} active={game.turn === "X" && !game.winner} />
            <PlayerBadge mark="O" name={oPlayer.name} active={game.turn === "O" && !game.winner} />
          </div>
          <div className={styles.boardSlot} data-name="game-board">
            <Board board={game.board} canPlay={canPlay} onCell={handleCell} />
          </div>
          {game.winner ? (
            <p className={styles.status}>
              {game.winner === "draw"
                ? "Draw!"
                : `${game.winner === "X" ? xPlayer.name : oPlayer.name} wins!`}
              {session?.hostId === playerId ? (
                <button className={styles.rematch} type="button" onClick={handleRematch}>
                  Play again
                </button>
              ) : null}
            </p>
          ) : !game.oPlayerId ? (
            <p className={styles.status}>Waiting for an opponent…</p>
          ) : session?.status === "paused" ? (
            <p className={styles.status}>Game paused</p>
          ) : null}
          <div className={styles.management} data-name="game-management">
            <button className={styles.exit} type="button" data-name="exit" onClick={() => router.push("/")}>
              exit game
            </button>
            <button
              className={styles.invite}
              type="button"
              data-name="invite"
              onClick={() => setShareOpen(true)}
            >
              <span>Invite others</span>
              <img src={withBasePath("/assets/icon-qr.svg")} alt="" width={22} height={22} />
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
      {shareOpen ? <ShareModal code={code} gameId="tic-tac-toe" onClose={() => setShareOpen(false)} /> : null}
    </div>
  );
}

function fallbackPlayer(name: string, isHost: boolean): Player {
  return { id: "", name, isHost, score: 0 };
}
