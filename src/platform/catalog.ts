export type GameDefinition = {
  id: string;
  name: string;
  description: string;
  ready: boolean;
};

const PLACEHOLDER_DESCRIPTION =
  "Game description.  Short text.  Two sentences maximum. Short text.  Two sentences maximum. Short text.  Two sentences maximum. ";

export const catalog: GameDefinition[] = [
  { id: "placeholder-1", name: "Game Name", description: PLACEHOLDER_DESCRIPTION, ready: false },
  { id: "placeholder-2", name: "Game Name", description: PLACEHOLDER_DESCRIPTION, ready: false },
  { id: "placeholder-3", name: "Game Name", description: PLACEHOLDER_DESCRIPTION, ready: false },
  { id: "placeholder-4", name: "Game Name", description: PLACEHOLDER_DESCRIPTION, ready: false },
  { id: "placeholder-5", name: "Game Name", description: PLACEHOLDER_DESCRIPTION, ready: false },
  { id: "placeholder-6", name: "Game Name", description: PLACEHOLDER_DESCRIPTION, ready: false },
];

export function getGame(id: string | null | undefined) {
  if (!id) return undefined;
  return catalog.find((game) => game.id === id);
}
