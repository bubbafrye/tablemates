"use client";

import { useEffect, useId, useState } from "react";
import { getGame } from "@/platform/catalog";
import {
  formatDurationUntil,
  msUntilDurableObjectsReset,
  nextDurableObjectsResetUtc,
} from "@/platform/durableObjectsQuota";
import { forgetHostedRoom } from "@/platform/identity";
import {
  closeRoom,
  fetchUsageDashboard,
  type UsageDashboardData,
} from "@/platform/stats";
import { withBasePath } from "@/platform/site";
import styles from "./UsageDashboard.module.css";

type UsageDashboardProps = {
  onClose: () => void;
};

function resetCountdown(): string {
  const ms = msUntilDurableObjectsReset();
  const local = nextDurableObjectsResetUtc().toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `${formatDurationUntil(ms)} (00:00 UTC · ${local} local)`;
}

export function UsageDashboard({ onClose }: UsageDashboardProps) {
  const titleId = useId();
  const [data, setData] = useState<UsageDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [untilReset, setUntilReset] = useState(resetCountdown);
  const [closingCode, setClosingCode] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(quiet = false) {
      if (!quiet) setLoading(true);
      const next = await fetchUsageDashboard();
      if (!cancelled) {
        setData(next);
        setLoading(false);
      }
    }

    void load();
    const id = window.setInterval(() => void load(true), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  async function handleCloseRoom(code: string) {
    setCloseError(null);
    setClosingCode(code);
    const result = await closeRoom(code);
    setClosingCode(null);
    if (!result.ok) {
      setCloseError(
        result.error ??
          "Close failed. The game server must be reachable (free-tier quota may be exhausted).",
      );
      return;
    }
    forgetHostedRoom(code);
    setData((prev) => {
      if (!prev) return prev;
      const rooms = prev.remote?.rooms.filter((room) => room.code !== code) ?? [];
      return {
        ...prev,
        local: {
          ...prev.local,
          hostedRooms: prev.local.hostedRooms.filter(
            (room) => room.code.toUpperCase() !== code.toUpperCase(),
          ),
        },
        remote: prev.remote
          ? {
              ...prev.remote,
              rooms,
              totals: {
                ...prev.remote.totals,
                roomsActive: rooms.length,
                lobbiesOpen: rooms.filter((r) => r.status === "lobby").length,
                gamesPlaying: rooms.filter(
                  (r) => r.status === "playing" || r.status === "paused",
                ).length,
                playersSeated: rooms.reduce((sum, r) => sum + r.players, 0),
                connectionsOnline: rooms.reduce((sum, r) => sum + r.connections, 0),
              },
            }
          : null,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  useEffect(() => {
    setUntilReset(resetCountdown());
    const id = window.setInterval(() => setUntilReset(resetCountdown()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const remote = data?.remote;
  const totals = remote?.totals;
  const serverDown = Boolean(data?.error);

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-name="usage-dashboard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.closeRow}>
          <button className={styles.close} type="button" aria-label="Close" onClick={onClose}>
            <img
              src={withBasePath("/assets/tic-tac-toe/icon-close.svg")}
              alt=""
              width={26}
              height={26}
            />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h2 id={titleId} className={styles.title}>
              Site usage
            </h2>
            <a
              className={styles.readme}
              href={withBasePath("/docs/backend/")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Readme
            </a>
          </div>
          <p className={styles.meta}>
            {loading && !data
              ? "Loading…"
              : `Updated ${formatTime(data?.fetchedAt)} · Party ${data?.local.partyHost || "—"}`}
          </p>

          {data?.error ? (
            <p className={styles.error}>
              {data.error} Free-tier Durable Object duration resets in {untilReset}.
            </p>
          ) : null}

          <section className={styles.section} aria-label="Cloudflare quota">
            <h3 className={styles.heading}>Durable Objects free tier</h3>
            <p className={styles.empty}>
              Duration quota: 13,000 GB-s / day · resets daily at 00:00 UTC
              {serverDown ? " · currently unreachable (quota may be exhausted)" : ""}.
              Next reset in <strong>{untilReset}</strong>.
            </p>
          </section>

          <section className={styles.section} aria-label="Live rooms">
            <h3 className={styles.heading}>Live now</h3>
            <dl className={styles.grid}>
              <Stat label="Open lobbies" value={totals?.lobbiesOpen} />
              <Stat label="Games in progress" value={totals?.gamesPlaying} />
              <Stat label="Active rooms" value={totals?.roomsActive} />
              <Stat label="Players seated" value={totals?.playersSeated} />
              <Stat label="Socket connections" value={totals?.connectionsOnline} />
              <Stat label="Rooms seen (lifetime)" value={totals?.roomsSeen} />
            </dl>
          </section>

          <section className={styles.section} aria-label="Open rooms">
            <h3 className={styles.heading}>Open rooms (live)</h3>
            {remote && remote.rooms.length > 0 ? (
              <ul className={styles.rooms}>
                {remote.rooms.map((room) => (
                  <li key={room.code} className={styles.roomBlock}>
                    <div className={styles.room}>
                      <span className={styles.roomCode}>{room.code}</span>
                      <span className={styles.roomGame}>
                        {getGame(room.gameId)?.name ?? (room.gameId || "—")}
                      </span>
                      <span className={styles.roomStatus}>{room.status}</span>
                      <span className={styles.roomPlayers}>
                        {room.players}p · {room.connections}c
                      </span>
                      <button
                        type="button"
                        className={styles.closeRoom}
                        disabled={closingCode === room.code}
                        onClick={() => void handleCloseRoom(room.code)}
                      >
                        {closingCode === room.code ? "Closing…" : "Close"}
                      </button>
                    </div>
                    {room.clients && room.clients.length > 0 ? (
                      <ul className={styles.clients}>
                        {room.clients.map((client) => (
                          <li key={`${client.playerId}-${client.connectedAt}`}>
                            <span className={styles.clientName}>
                              {client.name || shortId(client.playerId)}
                            </span>
                            <span className={styles.clientMeta}>
                              {[
                                client.ip,
                                [client.city, client.country].filter(Boolean).join(", "),
                                client.colo ? `colo ${client.colo}` : "",
                                summarizeUserAgent(client.ua),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.clientMeta}>
                        No client fingerprints yet (reconnect after deploy to populate).
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>
                {data?.error
                  ? "No live room list while the game server is unreachable. Use Close under Rooms you launched below to kick a room by code once the server is back."
                  : "No open rooms right now."}
              </p>
            )}
          </section>

          {remote && Object.keys(remote.byGame).length > 0 ? (
            <section className={styles.section} aria-label="By game">
              <h3 className={styles.heading}>By game</h3>
              <ul className={styles.rooms}>
                {Object.entries(remote.byGame).map(([gameId, bucket]) => (
                  <li key={gameId} className={styles.room}>
                    <span className={styles.roomGame}>
                      {getGame(gameId)?.name ?? gameId}
                    </span>
                    <span className={styles.roomPlayers}>
                      {bucket.rooms} rooms · {bucket.players} players
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data && Object.keys(data.leaderboards).some((k) => data.leaderboards[k]?.length) ? (
            <section className={styles.section} aria-label="Leaderboards">
              <h3 className={styles.heading}>High scores</h3>
              {Object.entries(data.leaderboards).map(([gameId, entries]) =>
                entries.length ? (
                  <div key={gameId} className={styles.boardBlock}>
                    <p className={styles.boardTitle}>
                      {getGame(gameId)?.name ?? gameId}
                    </p>
                    <ol className={styles.boardList}>
                      {entries.slice(0, 5).map((entry) => (
                        <li key={`${entry.playerId}-${entry.at}`}>
                          {entry.name} — {entry.score}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null,
              )}
            </section>
          ) : null}

          <section className={styles.section} aria-label="This browser">
            <h3 className={styles.heading}>This browser</h3>
            <dl className={styles.local}>
              <div>
                <dt>Player</dt>
                <dd>{data?.local.playerName || "—"}</dd>
              </div>
              <div>
                <dt>Player id</dt>
                <dd className={styles.mono}>{shortId(data?.local.playerId)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{data?.local.email || "not registered"}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.section} aria-label="Rooms you launched">
            <h3 className={styles.heading}>Rooms you launched</h3>
            <p className={styles.empty}>
              Saved in this browser only — not proof a room is still live. Close
              kicks sockets on the game server when it is reachable.
            </p>
            {closeError ? <p className={styles.error}>{closeError}</p> : null}
            {data?.local.hostedRooms.length ? (
              <ul className={styles.rooms}>
                {data.local.hostedRooms.slice(0, 12).map((room) => (
                  <li key={room.code} className={styles.room}>
                    <span className={styles.roomCode}>{room.code}</span>
                    <span className={styles.roomGame}>
                      {getGame(room.gameId)?.name ?? room.gameId}
                    </span>
                    <span className={styles.roomStatus}>launched</span>
                    <span className={styles.roomPlayers}>
                      {new Date(room.createdAt).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      className={styles.closeRoom}
                      disabled={closingCode === room.code}
                      onClick={() => void handleCloseRoom(room.code)}
                    >
                      {closingCode === room.code ? "Closing…" : "Close"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>None yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className={styles.stat}>
      <dt>{label}</dt>
      <dd>{value == null ? "—" : value}</dd>
    </div>
  );
}

function shortId(id?: string) {
  if (!id) return "—";
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}

function summarizeUserAgent(ua: string): string {
  if (!ua) return "unknown client";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  return ua.slice(0, 40);
}

function formatTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}
