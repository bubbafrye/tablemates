export type GameHero = {
  lg: string;
  sm: string;
  xs: string;
};

export type GameDefinition = {
  id: string;
  name: string;
  description: string;
  ready: boolean;
  /** When false, footer Invite is hidden (solo games). */
  multiplayer: boolean;
  hero?: GameHero;
};

const PLACEHOLDER_DESCRIPTION =
  "Game description.  Short text.  Two sentences maximum. Short text.  Two sentences maximum. Short text.  Two sentences maximum. ";

const PLACEHOLDER_HERO: GameHero = {
  lg: "/assets/hero-lg.png",
  sm: "/assets/hero-sm.png",
  xs: "/assets/hero-xs.png",
};

export const catalog: GameDefinition[] = [
  {
    id: "tic-tac-toe",
    name: "Tic-tac-toe",
    description:
      "Classic three-in-a-row. Invite a friend, take turns, and claim the board.",
    ready: true,
    multiplayer: true,
    hero: {
      lg: "/assets/tic-tac-toe/hero-lg.png",
      sm: "/assets/tic-tac-toe/hero-sm.png",
      xs: "/assets/tic-tac-toe/hero-xs.png",
    },
  },
  {
    id: "rakko",
    name: "Rakko",
    description:
      "Arrange your rack low to high. Draw, discard, and race to a rakko — first to 500 wins.",
    ready: true,
    multiplayer: true,
    hero: {
      lg: "/assets/rakko/hero-lg.png",
      sm: "/assets/rakko/hero-sm.png",
      xs: "/assets/rakko/hero-xs.png",
    },
  },
  {
    id: "2048",
    name: "2048",
    description:
      "Slide matching tiles together. Reach 2048 — then keep going for a higher score.",
    ready: true,
    multiplayer: false,
    hero: {
      lg: "/assets/2048/hero-lg.png",
      sm: "/assets/2048/hero-sm.png",
      xs: "/assets/2048/hero-xs.png",
    },
  },
  {
    id: "placeholder-4",
    name: "Game Name",
    description: PLACEHOLDER_DESCRIPTION,
    ready: false,
    multiplayer: true,
    hero: PLACEHOLDER_HERO,
  },
  {
    id: "placeholder-5",
    name: "Game Name",
    description: PLACEHOLDER_DESCRIPTION,
    ready: false,
    multiplayer: true,
    hero: PLACEHOLDER_HERO,
  },
  {
    id: "placeholder-6",
    name: "Game Name",
    description: PLACEHOLDER_DESCRIPTION,
    ready: false,
    multiplayer: true,
    hero: PLACEHOLDER_HERO,
  },
];

export function getGame(id: string | null | undefined) {
  if (!id) return undefined;
  return catalog.find((game) => game.id === id);
}
