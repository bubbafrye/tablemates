"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ShareModal } from "@/components/ui/ShareModal";
import { withBasePath } from "@/platform/site";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  roomCode?: string;
};

export function SiteHeader({ roomCode }: SiteHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);

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
      </header>
      {shareOpen && roomCode ? (
        <ShareModal code={roomCode} onClose={() => setShareOpen(false)} />
      ) : null}
    </>
  );
}
