"use client";

import { useState } from "react";
import { JoinField } from "@/components/ui/JoinField";
import { registerEmail } from "@/platform/identity";
import styles from "./RegisterCta.module.css";

export function RegisterCta() {
  const [registered, setRegistered] = useState(false);

  return (
    <section className={styles.section} data-name="register">
      <div className={styles.header}>
        <div className={styles.copy}>
          <h2 className={styles.title}>Someone&apos;s got to kick things off...</h2>
          <p className={`${styles.lede} ${styles.ledeBeside}`}>
            To get a private room, I&apos;ll need an email to tie things to.  Use a real one, and you
            can revisit old lobbies you&apos;ve started and maintain leaderboards. Don&apos;t worry, I
            won&apos;t sell or spam you.{" "}
          </p>
        </div>
        <div className={styles.body}>
          <JoinField
            variant="register"
            disabled={registered}
            onSubmit={(email) => {
              registerEmail(email);
              setRegistered(true);
            }}
          />
        </div>
      </div>
      <div className={styles.subtext}>
        <p className={styles.lede}>
          To get a private room, I&apos;ll need an email to tie things to.  Use a real one, and you can
          revisit old lobbies you&apos;ve started and maintain leaderboards. Don&apos;t worry, I won&apos;t
          sell or spam you.{" "}
        </p>
      </div>
    </section>
  );
}
