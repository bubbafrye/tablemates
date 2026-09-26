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
    hero: {
      lg: "/assets/tic-tac-toe/hero-lg.png",
      sm: "/assets/tic-tac-toe/hero-sm.png",
      xs: "/assets/tic-tac-toe/hero-xs.png",
    },
  },
  {
    id: "placeholder-2",
    name: "Game Name",
    description: PLACEHOLDER_DESCRIPTION,
    ready: false,
    hero: PLACEHOLDER_HERO,
  },
  {
    id: "placeholder-3",
    name: "Game Name",
    description: PLACEHOLDER_DESCRIPTION,
    ready: false,
    hero: PLACEHOLDER_HERO,
  },
  {
    id: "placeholder-4",
    name: "Game Name",
    description: PLACEHOLDER_DESCRIPTION,
    ready: false,
    hero: PLACEHOLDER_HERO,
  },
  {
    id: "placeholder-5",
    name: "Game Name",
    description: PLACEHOLDER_DESCRIPTION,
    ready: false,
    hero: PLACEHOLDER_HERO,
  },
  {
    id: "placeholder-6",
    name: "Game Name",
    description: PLACEHOLDER_DESCRIPTION,
    ready: false,
    hero: PLACEHOLDER_HERO,
  },
];

export function getGame(id: string | null | undefined) {
  if (!id) return undefined;
  return catalog.find((game) => game.id === id);
}
