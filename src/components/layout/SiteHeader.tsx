"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Logo } from "@/components/ui/Logo";
import { inviteUrl } from "@/platform/codes";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  roomCode?: string;
};

export function SiteHeader({ roomCode }: SiteHeaderProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [qr, setQr] = useState("");
  const titleId = useId();
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const url = roomCode && origin ? inviteUrl(origin, roomCode) : "";

  useEffect(() => {
    if (!url || !qrOpen) return;
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 196,
      margin: 0,
      color: { dark: "#241f1a", light: "#fffdf8" },
    }).then((data) => {
      if (!cancelled) setQr(data);
    });
    return () => {
      cancelled = true;
    };
  }, [url, qrOpen]);

  useEffect(() => {
    if (!qrOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setQrOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qrOpen]);

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
              onClick={() => setQrOpen(true)}
            >
              <img src="/assets/icon-qr.svg" alt="" width={22} height={22} />
            </button>
          </div>
        ) : null}
      </header>
      {qrOpen ? (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setQrOpen(false)}
        >
          <div
            className={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <p id={titleId} className={styles.modalTitle}>
              Scan to join
            </p>
            <p className={styles.modalCode}>{roomCode}</p>
            {qr ? <img className={styles.modalQr} src={qr} alt="" width={196} height={196} /> : null}
            <button className={styles.modalClose} type="button" onClick={() => setQrOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
