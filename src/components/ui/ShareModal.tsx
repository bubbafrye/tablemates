"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { inviteUrl } from "@/platform/codes";
import { withBasePath } from "@/platform/site";
import styles from "./ShareModal.module.css";

type ShareModalProps = {
  code: string;
  gameId?: string;
  onClose: () => void;
};

export function ShareModal({ code, gameId, onClose }: ShareModalProps) {
  const [qr, setQr] = useState("");
  const titleId = useId();
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const url = origin ? inviteUrl(origin, code, gameId) : "";

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 280,
      margin: 0,
      color: { dark: "#241f1a", light: "#ffffff" },
    }).then((data) => {
      if (!cancelled) setQr(data);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function shareLink() {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "tablemates", text: `Room code ${code}`, url });
        return;
      } catch {
        /* user cancelled or share unavailable — fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(`${code}\n${url}`);
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-name="share-modal"
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
        <div className={styles.content} data-name="content">
          <div className={styles.titleWrap} data-name="text-title">
            <h2 id={titleId} className={styles.title}>
              Games are way cooler with friends...
            </h2>
          </div>
          <div className={styles.qr} data-name="qr-code-placehiolder">
            {qr ? <img src={qr} alt="" width={280} height={280} /> : null}
          </div>
          <div className={styles.share} data-name="share">
            <p className={styles.lede}>Get them in the groove!</p>
            <button
              className={styles.shareBtn}
              type="button"
              data-name="Button-primary"
              onClick={shareLink}
            >
              <span>share link</span>
              <img
                src={withBasePath("/assets/tic-tac-toe/icon-share.svg")}
                alt=""
                width={20}
                height={18}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
