"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { withBasePath } from "@/platform/site";
import type { Player, SessionState } from "@/platform/protocol";
import { Board } from "./Board";
import { BOT_ID, BOT_NAME, isBotId, pickBotMove } from "./bot";
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
  setName: (name: string) => void;
};

export function TicTacToeGame({
  code,
  playerId,
  session,
  connected,
  sendGame,
  setScore,
  setName,
}: TicTacToeGameProps) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [local, setLocal] = useState<TicTacToeState>(() => createInitialState());
  const scoredKey = useRef<string | null>(null);

  const players = session?.players ?? [];
  const remote = isTicTacToeState(session?.game) ? session.game : null;
  const game = remote ?? local;
  const vsBot = isBotId(game.oPlayerId) || isBotId(game.xPlayerId);
  const canStartBot =
    connected &&
    session?.hostId === playerId &&
    !vsBot &&
    !game.oPlayerId &&
    !game.winner &&
    game.board.every((cell) => cell === null);

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
    if (vsBot) return;
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
  }, [remote, players, session?.hostId, playerId, sendGame, vsBot]);

  useEffect(() => {
    if (!remote?.winner) {
      scoredKey.current = null;
      return;
    }
    if (remote.winner === "draw" || session?.hostId !== playerId) return;
    const winnerId = remote.winner === "X" ? remote.xPlayerId : remote.oPlayerId;
    if (!winnerId || isBotId(winnerId)) return;
    const key = `${remote.board.join("")}:${remote.winner}`;
    if (scoredKey.current === key) return;
    scoredKey.current = key;
    const current = session.scores[winnerId] ?? 0;
    setScore(winnerId, current + 1);
  }, [remote, session, playerId, setScore]);

  function publish(next: TicTacToeState) {
    setLocal(next);
    sendGame(next);
  }

  useEffect(() => {
    if (!vsBot || !connected) return;
    if (session?.hostId !== playerId) return;
    if (game.winner || session?.status === "paused") return;

    const botMark =
      game.xPlayerId === BOT_ID ? "X" : game.oPlayerId === BOT_ID ? "O" : null;
    if (!botMark || game.turn !== botMark) return;

    const timer = window.setTimeout(() => {
      const index = pickBotMove(game.board, botMark);
      if (index < 0) return;
      const next = applyMove(game, index, BOT_ID);
      if (!next) return;
      setLocal(next);
      sendGame(next);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    vsBot,
    connected,
    session?.hostId,
    session?.status,
    playerId,
    game,
    sendGame,
  ]);

  const xPlayer = useMemo(
    () =>
      isBotId(game.xPlayerId)
        ? botPlayer()
        : (players.find((player) => player.id === game.xPlayerId) ??
          fallbackPlayer("Player 1", true)),
    [players, game.xPlayerId],
  );
  const oPlayer = useMemo(
    () =>
      isBotId(game.oPlayerId)
        ? botPlayer()
        : (players.find((player) => player.id === game.oPlayerId) ??
          fallbackPlayer("Player 2", false)),
    [players, game.oPlayerId],
  );

  const myMark = game.xPlayerId === playerId ? "X" : game.oPlayerId === playerId ? "O" : null;
  const canPlay =
    connected &&
    !game.winner &&
    session?.status !== "paused" &&
    myMark === game.turn &&
    Boolean(game.xPlayerId && game.oPlayerId);

  function handleCell(index: number) {
    const next = applyMove(game, index, playerId);
    if (!next) return;
    publish(next);
  }

  function handleRematch() {
    if (session?.hostId !== playerId) return;
    publish(resetBoard(game));
  }

  function handlePlayBot() {
    if (!canStartBot) return;
    publish({
      ...createInitialState(),
      xPlayerId: playerId,
      oPlayerId: BOT_ID,
    });
  }

  return (
    <div className={styles.page} data-name="tic-tac-toe">
      <SiteHeader roomCode={code} gameId="tic-tac-toe" />
      <div className={styles.content} data-name="content">
        <div className={styles.gameArea} data-name="game-area">
          <div className={styles.players} data-name="players">
            <PlayerBadge
              mark="X"
              name={xPlayer.name}
              active={game.turn === "X" && !game.winner}
              editable={game.xPlayerId === playerId}
              onRename={setName}
            />
            <PlayerBadge
              mark="O"
              name={oPlayer.name}
              active={game.turn === "O" && !game.winner}
              editable={game.oPlayerId === playerId}
              onRename={setName}
            />
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
          <div className={styles.actions} data-name="game-management">
            <button className={styles.exit} type="button" data-name="exit" onClick={() => router.push("/")}>
              exit game
            </button>
            <button
              className={styles.bot}
              type="button"
              data-name="play-bot"
              disabled={!canStartBot}
              onClick={handlePlayBot}
            >
              play bot
            </button>
            <button
              className={styles.invite}
              type="button"
              data-name="invite"
              onClick={() => setShareOpen(true)}
            >
              <span>Invite</span>
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

function botPlayer(): Player {
  return { id: BOT_ID, name: BOT_NAME, isHost: false, score: 0 };
}
