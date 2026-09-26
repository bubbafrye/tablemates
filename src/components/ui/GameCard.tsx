"use client";

import type { GameDefinition } from "@/platform/catalog";
import { Button } from "./Button";
import { TextDescription } from "./TextDescription";
import { TextTitle } from "./TextTitle";
import styles from "./GameCard.module.css";

type GameCardProps = {
  game: GameDefinition;
  onLaunch?: (gameId: string) => void;
};

export function GameCard({ game, onLaunch }: GameCardProps) {
  return (
    <article className={styles.card} data-name="game-card">
      <div className={styles.content}>
        <div className={styles.hero} data-name="hero-image">
          <img
            className={`${styles.image} ${styles.lg}`}
            src="/assets/hero-lg.png"
            alt=""
            width={380}
            height={225}
          />
          <img
            className={`${styles.image} ${styles.sm}`}
            src="/assets/hero-sm.png"
            alt=""
            width={336}
            height={196}
          />
          <img
            className={`${styles.image} ${styles.xs}`}
            src="/assets/hero-xs.png"
            alt=""
            width={246}
            height={143}
          />
        </div>
        <div className={styles.meta}>
          <TextTitle>{game.name}</TextTitle>
          <Button onClick={() => onLaunch?.(game.id)}>Launch</Button>
        </div>
        <TextDescription>{game.description}</TextDescription>
      </div>
    </article>
  );
}
