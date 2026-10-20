"use client";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { withBasePath } from "@/platform/site";
import styles from "./SpaceRocksGame.module.css";

/**
 * Vendored from hurstfrye.com/asteroids (Figma catalog id `space-rocks`).
 * Local 1–2 player canvas game — no Party Session.
 */
export function SpaceRocksGame() {
  return (
    <div className={styles.page} data-name="space-rocks">
      <SiteHeader />
      <iframe
        className={styles.frame}
        src={withBasePath("/games/space-rocks/index.html")}
        title="Space Rocks"
        allow="gamepad; fullscreen; autoplay"
      />
    </div>
  );
}
