"use client";

import { useRouter } from "next/navigation";
import { JoinField } from "@/components/ui/JoinField";
import { sessionPath } from "@/platform/codes";
import styles from "./Hero.module.css";

export function Hero() {
  const router = useRouter();

  return (
    <section className={styles.section} data-name="Introduction">
      <div className={styles.header}>
        <h1 className={styles.title}>Pick a game. Bring your people.</h1>
        <p className={styles.lede}>
          Choose a game and start a new round, or join an existing game by entering its code.
        </p>
        <div className={styles.body}>
          <JoinField
            variant="join"
            onSubmit={(value) => router.push(sessionPath(value))}
          />
        </div>
      </div>
    </section>
  );
}
