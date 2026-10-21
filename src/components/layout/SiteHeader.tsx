"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ShareModal } from "@/components/ui/ShareModal";
import { loadGamesData } from "@/platform/gamesData";
import { withBasePath } from "@/platform/site";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  roomCode?: string;
  gameId?: string;
  /** When set, overrides CSV `fullscreen`. */
  fullscreen?: boolean;
};

function nativeFullscreenElement() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function requestNativeFullscreen(el: HTMLElement) {
  const node = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  const req = el.requestFullscreen?.bind(el) ?? node.webkitRequestFullscreen?.bind(el);
  return req ? Promise.resolve(req()) : Promise.reject(new Error("fullscreen unsupported"));
}

export function SiteHeader({ roomCode, gameId, fullscreen: fullscreenProp }: SiteHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [csvFullscreen, setCsvFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (fullscreenProp != null) {
      setCsvFullscreen(fullscreenProp);
      return;
    }
    if (!gameId) {
      setCsvFullscreen(false);
      return;
    }
    void loadGamesData().then((rows) => {
      setCsvFullscreen(Boolean(rows.find((row) => row.id === gameId)?.fullscreen));
    });
  }, [gameId, fullscreenProp]);

  useEffect(() => {
    function syncFromNative() {
      const native = Boolean(nativeFullscreenElement());
      if (!native) document.documentElement.removeAttribute("data-app-fullscreen");
      setIsFullscreen(native || document.documentElement.hasAttribute("data-app-fullscreen"));
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!document.documentElement.hasAttribute("data-app-fullscreen")) return;
      if (nativeFullscreenElement()) return;
      event.preventDefault();
      document.documentElement.removeAttribute("data-app-fullscreen");
      setIsFullscreen(false);
    }
    document.addEventListener("fullscreenchange", syncFromNative);
    document.addEventListener("webkitfullscreenchange", syncFromNative);
    window.addEventListener("keydown", onKey);
    const iframe = document.querySelector("iframe");
    try {
      iframe?.contentDocument?.addEventListener("keydown", onKey);
    } catch {
      /* iframe not ready or opaque */
    }
    return () => {
      document.removeEventListener("fullscreenchange", syncFromNative);
      document.removeEventListener("webkitfullscreenchange", syncFromNative);
      window.removeEventListener("keydown", onKey);
      try {
        iframe?.contentDocument?.removeEventListener("keydown", onKey);
      } catch {
        /* ignore */
      }
    };
  }, [isFullscreen]);

  const showExpand = csvFullscreen && !isFullscreen;

  function enterFullscreen() {
    document.documentElement.setAttribute("data-app-fullscreen", "");
    setIsFullscreen(true);
    void requestNativeFullscreen(document.documentElement).catch(() => {
      /* No Fullscreen API — header already hidden. Escape exits via keydown. */
    });
  }

  if (isFullscreen) return null;

  return (
    <>
      <header className={styles.header} data-name="header">
        <Link className={styles.brand} href="/" aria-label="tablemates home">
          <Logo />
          <span className={styles.wordmark} data-name="logo">
            <span className={styles.table}>table</span>
            <span className={styles.mates}>mates</span>
          </span>
        </Link>
        {roomCode ? (
          <div className={styles.roomCode} data-name="room-code">
            <div className={styles.roomText} data-name="text">
              <span className={styles.roomLabel}>Room code:</span>
              <span className={styles.roomValue}>{roomCode}</span>
            </div>
            <button
              className={styles.qrBtn}
              type="button"
              data-name="qr-btn"
              aria-label="Show room QR code"
              onClick={() => setShareOpen(true)}
            >
              <img src={withBasePath("/assets/icon-qr.svg")} alt="" width={22} height={22} />
            </button>
          </div>
        ) : null}
        {showExpand ? (
          <button
            className={styles.expand}
            type="button"
            data-name="expand"
            data-node-id="332:54613"
            aria-label="Enter fullscreen"
            onClick={enterFullscreen}
          >
            <img
              src={withBasePath("/assets/icon-expand.svg")}
              alt=""
              width={15}
              height={15}
            />
          </button>
        ) : null}
      </header>
      {shareOpen && roomCode ? (
        <ShareModal code={roomCode} gameId={gameId} onClose={() => setShareOpen(false)} />
      ) : null}
    </>
  );
}
