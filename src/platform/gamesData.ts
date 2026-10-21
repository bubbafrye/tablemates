export const GAME_TYPES = ["puzzle", "arcade", "card"] as const;
export type GameType = (typeof GAME_TYPES)[number];

export type GameFacts = {
  id: string;
  playerCount: string;
  controller: boolean;
  type: GameType | "";
};

function parseBool(value: string) {
  return value.trim().toLowerCase() === "true";
}

function parseType(value: string): GameType | "" {
  const t = value.trim().toLowerCase();
  return GAME_TYPES.includes(t as GameType) ? (t as GameType) : "";
}

/** Parse `public/games-data.csv` (header row + named and unnamed game rows). */
export function parseGamesDataCsv(text: string): GameFacts[] {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const col = (name: string) => headers.indexOf(name);

  const iName = col("game-name");
  const iCount = col("player-count");
  const iController = col("controller");
  const iType = col("type");

  const rows: GameFacts[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = line.split(",");
    const cell = (idx: number) => (idx >= 0 ? (cells[idx] ?? "").trim() : "");
    rows.push({
      id: cell(iName),
      playerCount: cell(iCount),
      controller: parseBool(cell(iController)),
      type: parseType(cell(iType)),
    });
  }
  return rows;
}

function factsById(rows: GameFacts[]): Map<string, GameFacts> {
  const map = new Map<string, GameFacts>();
  for (const row of rows) {
    if (row.id) map.set(row.id, row);
  }
  return map;
}

/** Named CSV row, or the next unnamed placeholder row for catalog ids not in the file. */
export function factsForGame(gameId: string, catalogIds: string[], rows: GameFacts[]) {
  const named = factsById(rows);
  const hit = named.get(gameId);
  if (hit) return hit;
  const unnamed = rows.filter((r) => !r.id);
  const placeholders = catalogIds.filter((id) => !named.has(id));
  const idx = placeholders.indexOf(gameId);
  if (idx < 0) return undefined;
  return unnamed[idx];
}
