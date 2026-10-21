import type { GameFacts } from "@/platform/gamesData";
import { Pill } from "./Pill";
import styles from "./GameData.module.css";

type GameDataProps = {
  facts?: GameFacts;
};

/**
 * Figma `game-data` (`327:53964`) — player-count, controller, type-*.
 * Cells from `public/games-data.csv`.
 */
export function GameData({ facts }: GameDataProps) {
  if (!facts) return null;
  const showCount = Boolean(facts.playerCount);
  const showController = facts.controller;
  const showType = Boolean(facts.type);
  if (!showCount && !showController && !showType) return null;

  return (
    <div className={styles.row} data-name="game-data" data-node-id="327:53964">
      {showCount ? (
        <Pill kind="player-count" label={facts.playerCount} />
      ) : null}
      {showController ? <Pill kind="controller" /> : null}
      {showType ? <Pill kind={`type-${facts.type}`} /> : null}
    </div>
  );
}
