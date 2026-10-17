"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/Button";
import { ShareModal } from "@/components/ui/ShareModal";
import { withBasePath } from "@/platform/site";
import type { Player, SessionState } from "@/platform/protocol";
import { BOT_ID, BOT_NAME, isBotId, playBotTurn } from "./bot";
import { DiscardDraw } from "./DiscardDraw";
import { Rack } from "./Rack";
import {
  applyRoundScoresToMatch,
  canStartRound,
  continueAfterRound,
  createLobbyState,
  currentPlayerId,
  discardHeld,
  isRakkoState,
  returnHeld,
  MATCH_TARGET,
  MAX_PLAYERS,
  MIN_PLAYERS,
  rematch,
  replaceSlot,
  resolveExistingRakko,
  startRound,
  syncSeats,
  takeDiscard,
  takeDraw,
  toggleReady,
  type RakkoState,
} from "./logic";
import "./rakkoBreakpoints.css";
import styles from "./RakkoGame.module.css";

type RakkoGameProps = {
  code: string;
  playerId: string;
  session: SessionState | null;
  connected: boolean;
  sendGame: (payload: unknown) => void;
  setScore: (playerId: string, absolute: number) => void;
  setName: (name: string) => void;
};

export function RakkoGame({
  code,
  playerId,
  session,
  connected,
  sendGame,
  setScore,
  setName,
}: RakkoGameProps) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [local, setLocal] = useState<RakkoState>(() => createLobbyState());
  const scoredKey = useRef<string | null>(null);

  const players = session?.players ?? [];
  const remote = isRakkoState(session?.game) ? session.game : null;
  const game = remote ?? local;
  const isHost = session?.hostId === playerId;
  const vsBot = game.playerIds.some(isBotId);
  const turnId = currentPlayerId(game);
  const turnPlayer = resolvePlayer(turnId, players);
  const myRack = game.racks[playerId] ?? [];
  const isMyTurn = turnId === playerId && game.phase === "playing";
  const paused = session?.status === "paused";
  const canStartBot =
    connected &&
    Boolean(isHost) &&
    !vsBot &&
    (game.phase === "lobby" || game.phase === "match-end");

  const seatedPlayers = useMemo(() => {
    if (game.playerIds.length > 0) {
      return game.playerIds
        .map((id) => resolvePlayer(id, players))
        .filter((p): p is Player => Boolean(p));
    }
    return players.slice(0, MAX_PLAYERS);
  }, [game.playerIds, players]);

  const connectedIds = useMemo(() => players.map((p) => p.id), [players]);

  useEffect(() => {
    if (!session || !playerId || !connected) return;
    if (remote) return;
    if (!isHost) return;
    if (connectedIds.length === 0) return;
    const seeded = syncSeats(createLobbyState(), connectedIds);
    setLocal(seeded);
    sendGame(seeded);
  }, [session, playerId, connected, remote, connectedIds, sendGame, isHost]);

  useEffect(() => {
    if (!remote || !isHost) return;
    if (remote.phase !== "lobby") return;
    if (remote.playerIds.some(isBotId)) return;
    if (connectedIds.length === 0) return;
    const withSeats = syncSeats(remote, connectedIds);
    if (withSeats.playerIds.join(",") !== remote.playerIds.join(",")) {
      sendGame(withSeats);
    }
  }, [remote, connectedIds, isHost, sendGame]);

  useEffect(() => {
    if (!remote || remote.phase !== "round-end" || !isHost) return;
    const key = `${remote.roundWinnerId}:${Object.values(remote.roundScores).join(",")}`;
    if (scoredKey.current === key) return;
    scoredKey.current = key;
    const { nextScores, matchWinnerId } = applyRoundScoresToMatch(
      session?.scores ?? {},
      remote.roundScores,
    );
    for (const [id, total] of Object.entries(nextScores)) {
      if (isBotId(id)) continue;
      if ((session?.scores[id] ?? 0) !== total) {
        setScore(id, total);
      }
    }
    if (matchWinnerId && remote.matchWinnerId !== matchWinnerId) {
      sendGame(continueAfterRound(remote, matchWinnerId));
    }
  }, [remote, isHost, session?.scores, setScore, sendGame]);

  /* End round if a rack is already Rakko (missed under inverted streak logic). */
  useEffect(() => {
    if (!isHost || !connected || paused) return;
    if (game.phase !== "playing") return;
    const next = resolveExistingRakko(game);
    if (!next) return;
    setLocal(next);
    sendGame(next);
  }, [isHost, connected, paused, game, sendGame]);

  function publish(next: RakkoState) {
    setLocal(next);
    sendGame(next);
  }

  useEffect(() => {
    if (!vsBot || !connected) return;
    if (!isHost) return;
    if (game.phase !== "playing" || paused) return;
    if (currentPlayerId(game) !== BOT_ID) return;

    const timer = window.setTimeout(() => {
      const next = playBotTurn(game);
      if (!next) return;
      setLocal(next);
      sendGame(next);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [vsBot, connected, isHost, paused, game, sendGame]);

  function seatedGame() {
    return syncSeats(game, connectedIds);
  }

  function handleReady() {
    const next = toggleReady(seatedGame(), playerId);
    if (!next) return;
    publish(next);
  }

  function handleStart() {
    if (!isHost) return;
    const next = startRound(seatedGame());
    if (!next) return;
    scoredKey.current = null;
    publish(next);
  }

  function handlePlayBot() {
    if (!canStartBot) return;
    const lobby: RakkoState = {
      ...createLobbyState(),
      playerIds: [playerId, BOT_ID],
      readyIds: [playerId, BOT_ID],
    };
    const next = startRound(lobby);
    if (!next) return;
    scoredKey.current = null;
    publish(next);
  }

  function handleTakeDiscard() {
    const next = takeDiscard(game, playerId);
    if (!next) return;
    publish(next);
  }

  function handleTakeDraw() {
    const next = takeDraw(game, playerId);
    if (!next) return;
    publish(next);
  }

  function handleDiscardHeld() {
    const next = discardHeld(game, playerId);
    if (!next) return;
    publish(next);
  }

  function handleReturnHeld() {
    const next = returnHeld(game, playerId);
    if (!next) return;
    publish(next);
  }

  function handleSelectSlot(index: number) {
    const next = replaceSlot(game, playerId, index);
    if (!next) return;
    publish(next);
  }

  function handleContinue() {
    if (!isHost || game.phase !== "round-end") return;
    const { matchWinnerId } = applyRoundScoresToMatch(
      session?.scores ?? {},
      game.roundScores,
    );
    publish(continueAfterRound(game, matchWinnerId));
  }

  function handleRematch() {
    if (!isHost) return;
    scoredKey.current = null;
    publish(rematch(game));
  }

  const canAct = connected && !paused && isMyTurn;
  const holding = game.held !== null;
  const canTakeDiscard =
    canAct && !holding && game.discardPile.length > 0;
  const canTakeDraw =
    canAct &&
    !holding &&
    (game.drawPile.length > 0 || game.discardPile.length > 1);
  const canDiscardHeld =
    canAct && holding && game.heldSource === "draw";
  const canReturnHeld = canAct && holding;
  const canSelectSlot = canAct && holding;
  const canStart =
    connected && Boolean(isHost) && game.phase === "lobby" && canStartRound(seatedGame());

  const turnLabel = turnPlayer
    ? `${displayName(turnPlayer)}'s Turn`
    : "Waiting…";

  const discardTop =
    game.discardPile.length > 0
      ? game.discardPile[game.discardPile.length - 1]
      : null;

  return (
    <div className={styles.page} data-name="rakko">
      <SiteHeader roomCode={code} gameId="rakko" />
      <div className={styles.content} data-name="content">
        {game.phase === "lobby" || game.phase === "match-end" ? (
          <LobbyPanel
            game={game}
            players={seatedPlayers}
            playerId={playerId}
            isHost={Boolean(isHost)}
            connected={connected}
            canStart={canStart}
            canStartBot={canStartBot}
            scores={session?.scores ?? {}}
            onReady={handleReady}
            onStart={handleStart}
            onPlayBot={handlePlayBot}
            onRematch={handleRematch}
            onRename={setName}
            onInvite={() => setShareOpen(true)}
            onExit={() => router.push("/")}
          />
        ) : null}

        {game.phase === "playing" || game.phase === "round-end" ? (
          <div className={styles.gameArea} data-name="game-area">
            <div className={styles.board} data-name="game-board">
              <div className={styles.left} data-name="L">
                <p className={styles.turn} data-name="turn">
                  {game.phase === "round-end" ? "Rakko!" : turnLabel}
                </p>
                <DiscardDraw
                  discardTop={discardTop}
                  discardCount={game.discardPile.length}
                  drawCount={game.drawPile.length}
                  held={game.held}
                  heldSource={game.heldSource}
                  revealHeldDraw={isMyTurn}
                  canTakeDiscard={canTakeDiscard}
                  canTakeDraw={canTakeDraw}
                  canDiscardHeld={canDiscardHeld}
                  canReturnHeld={canReturnHeld}
                  onTakeDiscard={handleTakeDiscard}
                  onTakeDraw={handleTakeDraw}
                  onDiscardHeld={handleDiscardHeld}
                  onReturnHeld={handleReturnHeld}
                />
              </div>
              <Rack
                cards={myRack}
                canSelect={canSelectSlot}
                onSelectSlot={handleSelectSlot}
                scoring={game.phase === "round-end"}
              />
            </div>

            {game.phase === "round-end" ? (
              <RoundEndBanner
                game={game}
                players={seatedPlayers}
                scores={session?.scores ?? {}}
                isHost={Boolean(isHost)}
                onContinue={handleContinue}
              />
            ) : null}

            {paused ? <p className={styles.status}>Game paused</p> : null}

            {!isMyTurn && game.phase === "playing" && !paused ? (
              <p className={styles.hint}>
                {`Waiting for ${turnPlayer ? displayName(turnPlayer) : "opponent"}…`}
              </p>
            ) : null}

            {isMyTurn && holding ? (
              <p className={styles.hint}>
                {game.heldSource === "discard"
                  ? "Swap into a rack slot, or undo via the discard icon."
                  : "Swap into a rack slot, or discard via the draw icon."}
              </p>
            ) : null}

            <div className={styles.actions} data-name="game-management">
              <button
                className={styles.exit}
                type="button"
                data-name="exit"
                onClick={() => router.push("/")}
              >
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
                <img
                  src={withBasePath("/assets/icon-qr.svg")}
                  alt=""
                  width={22}
                  height={22}
                />
              </button>
            </div>

            <ScoresStrip players={seatedPlayers} scores={session?.scores ?? {}} />
          </div>
        ) : null}
      </div>
      <SiteFooter />
      {shareOpen ? (
        <ShareModal code={code} gameId="rakko" onClose={() => setShareOpen(false)} />
      ) : null}
    </div>
  );
}

function LobbyPanel({
  game,
  players,
  playerId,
  isHost,
  connected,
  canStart,
  canStartBot,
  scores,
  onReady,
  onStart,
  onPlayBot,
  onRematch,
  onRename,
  onInvite,
  onExit,
}: {
  game: RakkoState;
  players: Player[];
  playerId: string;
  isHost: boolean;
  connected: boolean;
  canStart: boolean;
  canStartBot: boolean;
  scores: Record<string, number>;
  onReady: () => void;
  onStart: () => void;
  onPlayBot: () => void;
  onRematch: () => void;
  onRename: (name: string) => void;
  onInvite: () => void;
  onExit: () => void;
}) {
  const ready = game.readyIds.includes(playerId);
  const matchOver = game.phase === "match-end";
  const winner = players.find((p) => p.id === game.matchWinnerId);
  const humanCount = players.filter((p) => !isBotId(p.id)).length;

  return (
    <section className={styles.lobby} data-name="lobby">
      <h1 className={styles.lobbyTitle}>
        {matchOver ? `${winner ? displayName(winner) : "Someone"} wins the match!` : "Rakko"}
      </h1>
      <p className={styles.lobbyLede}>
        {matchOver
          ? `First to ${MATCH_TARGET} points. Start a rematch when you're ready.`
          : `2–4 players. Race to arrange your rack low→high (bottom→top). First to ${MATCH_TARGET} wins.`}
      </p>

      <ul className={styles.playerList}>
        {players.map((player) => {
          const isReady = game.readyIds.includes(player.id);
          const isMe = player.id === playerId;
          return (
            <li key={player.id} className={styles.playerRow}>
              {isMe ? (
                <input
                  className={styles.nameInput}
                  defaultValue={player.name}
                  aria-label="Your name"
                  maxLength={24}
                  onBlur={(e) => {
                    const next = e.target.value.trim();
                    if (next && next !== player.name) onRename(next);
                  }}
                />
              ) : (
                <span className={styles.playerName}>{displayName(player)}</span>
              )}
              <span className={styles.playerScore}>{scores[player.id] ?? 0}</span>
              {!matchOver ? (
                <span className={styles.readyTag}>
                  {isBotId(player.id) ? "Bot" : isReady ? "Ready" : "…"}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {humanCount < MIN_PLAYERS && !players.some((p) => isBotId(p.id)) ? (
        <p className={styles.status}>
          Waiting for players… ({humanCount}/{MIN_PLAYERS} minimum) — or play bot
        </p>
      ) : null}

      <div className={styles.lobbyActions}>
        {matchOver ? (
          isHost ? (
            <Button variant="primary" icon={false} onClick={onRematch}>
              Rematch
            </Button>
          ) : (
            <p className={styles.status}>Waiting for host to rematch…</p>
          )
        ) : (
          <>
            <Button variant="secondary" icon={false} onClick={onReady} disabled={!connected}>
              {ready ? "Unready" : "Ready"}
            </Button>
            {isHost ? (
              <Button variant="primary" icon={false} onClick={onStart} disabled={!canStart}>
                Start round
              </Button>
            ) : null}
            {isHost ? (
              <button
                className={styles.bot}
                type="button"
                data-name="play-bot"
                disabled={!canStartBot}
                onClick={onPlayBot}
              >
                play bot
              </button>
            ) : null}
          </>
        )}
        <Button variant="plain" icon={false} onClick={onInvite}>
          Invite
        </Button>
        <button className={styles.exit} type="button" onClick={onExit}>
          exit game
        </button>
      </div>
    </section>
  );
}

function RoundEndBanner({
  game,
  players,
  scores,
  isHost,
  onContinue,
}: {
  game: RakkoState;
  players: Player[];
  scores: Record<string, number>;
  isHost: boolean;
  onContinue: () => void;
}) {
  const winner = players.find((p) => p.id === game.roundWinnerId);
  return (
    <div className={styles.roundEnd}>
      <p className={styles.roundTitle}>
        {winner ? `${displayName(winner)} went Rakko!` : "Round over"}
      </p>
      <ul className={styles.roundScores}>
        {players.map((player) => (
          <li key={player.id}>
            {displayName(player)}: +{game.roundScores[player.id] ?? 0}{" "}
            <span className={styles.muted}>(total {scores[player.id] ?? 0})</span>
          </li>
        ))}
      </ul>
      {isHost ? (
        <Button variant="primary" icon={false} onClick={onContinue}>
          Continue
        </Button>
      ) : (
        <p className={styles.status}>Waiting for host…</p>
      )}
    </div>
  );
}

function ScoresStrip({
  players,
  scores,
}: {
  players: Player[];
  scores: Record<string, number>;
}) {
  if (players.length === 0) return null;
  return (
    <ul className={styles.scores}>
      {players.map((player) => (
        <li key={player.id}>
          {displayName(player)} <strong>{scores[player.id] ?? 0}</strong>
        </li>
      ))}
    </ul>
  );
}

function displayName(player: Player) {
  return player.name?.trim() || "Player";
}

function botPlayer(): Player {
  return { id: BOT_ID, name: BOT_NAME, isHost: false, score: 0 };
}

function resolvePlayer(id: string | null | undefined, players: Player[]): Player | null {
  if (!id) return null;
  if (isBotId(id)) return botPlayer();
  return players.find((p) => p.id === id) ?? { id, name: "Player", isHost: false, score: 0 };
}
