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
  const { playerCount, controller, type } = facts;
  if (!playerCount && !controller && !type) return null;

  return (
    <div className={styles.row} data-name="game-data" data-node-id="327:53964">
      {playerCount ? (
        <Pill kind="player-count" label={playerCount} />
      ) : null}
      {controller ? <Pill kind="controller" /> : null}
      {type ? <Pill kind={`type-${type}`} /> : null}
    </div>
  );
}
