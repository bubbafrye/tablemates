import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "design/tokens.json"), "utf8"));

function toCssName(key) {
  return `--${key.replaceAll("/", "-")}`;
}

function linesFrom(map) {
  return Object.entries(map)
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => `  ${toCssName(key)}: ${value};`);
}

const css = `/* GENERATED from design/tokens.json — do not hand-edit. Run npm run tokens. */
:root {
  /* Figma variables */
${linesFrom(tokens.variables).join("\n")}

  /* Frame-derived values */
${linesFrom(tokens.derived).join("\n")}
}
`;

writeFileSync(join(root, "src/styles/tokens.css"), css);
console.log("Wrote src/styles/tokens.css");
