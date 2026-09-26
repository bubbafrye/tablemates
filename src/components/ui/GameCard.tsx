"use client";

import type { GameDefinition } from "@/platform/catalog";
import { withBasePath } from "@/platform/site";
import { Button } from "./Button";
import { TextDescription } from "./TextDescription";
import { TextTitle } from "./TextTitle";
import styles from "./GameCard.module.css";

type GameCardProps = {
  game: GameDefinition;
  onLaunch?: (gameId: string) => void;
};

export function GameCard({ game, onLaunch }: GameCardProps) {
  const hero = game.hero ?? {
    lg: "/assets/hero-lg.png",
    sm: "/assets/hero-sm.png",
    xs: "/assets/hero-xs.png",
  };

  return (
    <article className={styles.card} data-name="game-card">
      <div className={styles.content}>
        <button
          className={styles.hero}
          type="button"
          data-name="hero-image"
          aria-label={`Launch ${game.name}`}
          onClick={() => onLaunch?.(game.id)}
        >
          <img
            className={`${styles.image} ${styles.lg}`}
            src={withBasePath(hero.lg)}
            alt=""
            width={380}
            height={225}
          />
          <img
            className={`${styles.image} ${styles.sm}`}
            src={withBasePath(hero.sm)}
            alt=""
            width={336}
            height={196}
          />
          <img
            className={`${styles.image} ${styles.xs}`}
            src={withBasePath(hero.xs)}
            alt=""
            width={246}
            height={143}
          />
        </button>
        <div className={styles.meta}>
          <TextTitle>{game.name}</TextTitle>
          <Button onClick={() => onLaunch?.(game.id)}>Launch</Button>
        </div>
        <TextDescription>{game.description}</TextDescription>
      </div>
    </article>
  );
}
