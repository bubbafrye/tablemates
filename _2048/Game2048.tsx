"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ConnectionBanner } from "@/components/session/ConnectionBanner";
import type { SessionState } from "@/platform/protocol";
import { GameTray, SLIDE_MS } from "./GameTray";
import {
  commitSlide,
  continueAfterWin,
  createInitialState,
  isGame2048State,
  planSlide,
  resetGame,
  type Board,
  type Direction,
  type Game2048State,
  type SlidePlan,
} from "./logic";
import styles from "./Game2048.module.css";

type Game2048Props = {
  code: string;
  playerId: string;
  session: SessionState | null;
  connected: boolean;
  sendGame: (payload: unknown) => void;
  setScore: (playerId: string, absolute: number) => void;
};

const KEY_DIR: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

export function Game2048({
  code,
  playerId,
  session,
  connected,
  sendGame,
  setScore,
}: Game2048Props) {
  const router = useRouter();
  /* Empty board until client mount — avoids Math.random hydration mismatch. */
  const [local, setLocal] = useState<Game2048State | null>(null);
  const [popIndices, setPopIndices] = useState<ReadonlySet<number>>(new Set());
  const [slide, setSlide] = useState<{
    fromBoard: Board;
    plan: SlidePlan;
  } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastPublishedScore = useRef(-1);
  const seededRef = useRef(false);
  const slideTimer = useRef<number | null>(null);

  const remote = isGame2048State(session?.game) ? session.game : null;
  const game = remote ?? local;
  const isHost = session?.hostId === playerId;
  const paused = session?.status === "paused";
  const animating = Boolean(slide);
  /* Solo puzzle: playable locally even if Party is down; sync when connected. */
  const canPlay =
    Boolean(game) &&
    !animating &&
    !paused &&
    (game!.status === "playing" || (game!.status === "won" && game!.continued));

  useEffect(() => {
    return () => {
      if (slideTimer.current != null) window.clearTimeout(slideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (remote || seededRef.current) return;
    const seeded = createInitialState();
    seededRef.current = true;
    setLocal(seeded);
    if (session && connected && isHost) sendGame(seeded);
  }, [session, connected, remote, isHost, sendGame]);

  useEffect(() => {
    if (!game || !connected || !isHost) return;
    if (game.score === lastPublishedScore.current) return;
    lastPublishedScore.current = game.score;
    setScore(playerId, game.score);
  }, [game, connected, isHost, playerId, setScore]);

  function publish(next: Game2048State, pops?: ReadonlySet<number>) {
    setLocal(next);
    setPopIndices(pops ?? new Set());
    sendGame(next);
  }

  /** Commit after slide (or immediately when motion is reduced / empty). */
  function finishSlide(base: Game2048State, plan: SlidePlan) {
    const { state, spawnIndex } = commitSlide(base, plan);
    const pops = new Set(plan.mergeTargets);
    if (spawnIndex >= 0) pops.add(spawnIndex);
    setSlide(null);
    publish(state, pops);
  }

  function move(direction: Direction) {
    if (!canPlay || !game) return;
    const plan = planSlide(game, direction);
    if (!plan) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || plan.motions.length === 0) {
      finishSlide(game, plan);
      return;
    }

    setSlide({ fromBoard: game.board, plan });
    if (slideTimer.current != null) window.clearTimeout(slideTimer.current);
    const snapshot = game;
    slideTimer.current = window.setTimeout(() => {
      slideTimer.current = null;
      finishSlide(snapshot, plan);
    }, SLIDE_MS);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const dir = KEY_DIR[event.key] ?? KEY_DIR[event.key.toLowerCase()];
      if (!dir) return;
      event.preventDefault();
      move(dir);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- move closes over latest game
  }, [canPlay, game]);

  useEffect(() => {
    if (popIndices.size === 0) return;
    const id = window.setTimeout(() => setPopIndices(new Set()), 200);
    return () => window.clearTimeout(id);
  }, [popIndices]);

  function handleNewGame() {
    if (session && connected && !isHost) return;
    lastPublishedScore.current = -1;
    seededRef.current = true;
    publish(resetGame());
  }

  function handleContinue() {
    if (!game) return;
    if (session && connected && !isHost) return;
    publish(continueAfterWin(game));
  }

  function onTouchStart(event: TouchEvent) {
    const t = event.changedTouches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    const t = event.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 24) return;
    if (absX > absY) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
  }

  return (
    <div className={styles.page} data-name="2048">
      <SiteHeader roomCode={code} gameId="2048" />
      <div className={styles.content} data-name="content">
        <ConnectionBanner connected={connected} />
        <div className={styles.gameArea} data-name="game-area">
          <div className={styles.scoreRow}>
            <h1 className={styles.title}>2048</h1>
            <div className={styles.scoreboard} aria-live="polite">
              <p className={styles.scoreLabel}>Score</p>
              <p className={styles.scoreValue}>
                {(game?.score ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className={styles.boardSlot}
            data-name="game-board"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className={styles.boardScale}>
              <GameTray
                board={
                  slide?.fromBoard ??
                  game?.board ??
                  Array.from({ length: 16 }, () => 0)
                }
                motions={slide?.plan.motions ?? null}
                popIndices={popIndices}
              />
            </div>
          </div>

          {!game ? (
            <p className={styles.hint}>Loading…</p>
          ) : game.status === "won" && !game.continued ? (
            <p className={styles.status}>
              You reached 2048!
              <>
                <button className={styles.rematch} type="button" onClick={handleContinue}>
                  Keep going
                </button>
                <button className={styles.rematch} type="button" onClick={handleNewGame}>
                  New game
                </button>
              </>
            </p>
          ) : game.status === "lost" ? (
            <p className={styles.status}>No more moves.</p>
          ) : paused ? (
            <p className={styles.status}>Game paused</p>
          ) : (
            <p className={styles.hint}>Arrow keys or swipe to slide tiles</p>
          )}

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
              className={styles.newGame}
              type="button"
              disabled={Boolean(session && connected && !isHost)}
              onClick={handleNewGame}
            >
              new game
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
