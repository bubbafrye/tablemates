/**
 * Export 2048 tile variants from Figma as PNGs when the tile component set changes.
 *
 * Detection: SHA-256 of the Figma nodes payload for the tile component set.
 * If it matches public/assets/2048/tiles/manifest.json → no-op.
 *
 * Auth: FIGMA_ACCESS_TOKEN (or FIGMA_TOKEN) in env / .env.local.
 * Without a token: skip (exit 0) so CI can build from committed assets.
 *
 * Usage:
 *   npm run export:2048-tiles
 *   npm run export:2048-tiles -- --force
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/assets/2048/tiles");
const manifestPath = join(outDir, "manifest.json");

const FILE_KEY = "tE15PVyJVeYZ6XP0d0xfMc";
const COMPONENT_SET_ID = "213:154683";
const SCALE = 2;

/** Fallback if the component set children cannot be listed. */
const FALLBACK_VARIANTS = [
  ["2", "213:154651"],
  ["4", "213:154866"],
  ["8", "213:154854"],
  ["16", "213:154872"],
  ["32", "213:154860"],
  ["64", "213:154878"],
  ["128", "216:2"],
  ["256", "216:8"],
  ["512", "216:14"],
  ["1024", "216:20"],
  ["2048", "216:38"],
  ["4096", "216:32"],
  ["8192", "216:26"],
  ["16384", "216:44"],
];

function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function token() {
  return process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
}

async function figma(path) {
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { "X-Figma-Token": token() },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Figma ${path} → ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

function stableHash(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function pngSize(buf) {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
    return null;
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

function parseVariantName(name) {
  const m = String(name).match(/tile-(\d+)/i);
  return m ? m[1] : null;
}

function readManifest() {
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

/** Strip opaque light mattes left by some Figma export paths (MCP / flatten). */
function unmatteIfNeeded(filePath) {
  const script = join(root, "scripts/unmatte-2048-tile.py");
  if (!existsSync(script)) return;
  const result = spawnSync("python3", [script, filePath], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    console.warn(
      `  unmatte warn ${filePath}: ${(result.stderr || result.stdout || "").trim()}`,
    );
    return;
  }
  const msg = (result.stdout || "").trim();
  if (msg) console.log(`  ${msg}`);
}

async function main() {
  loadDotEnv();
  const force = process.argv.includes("--force");
  const tok = token();

  if (!tok) {
    console.log(
      "export-2048-tiles: no FIGMA_ACCESS_TOKEN — skipping (using committed assets).",
    );
    process.exit(0);
  }

  console.log("export-2048-tiles: fetching tile component set…");
  const nodes = await figma(
    `/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(COMPONENT_SET_ID)}`,
  );
  const doc = nodes.nodes?.[COMPONENT_SET_ID]?.document;
  if (!doc) {
    throw new Error(`Component set ${COMPONENT_SET_ID} not found in file.`);
  }

  const sourceHash = stableHash(doc);
  const prev = readManifest();
  if (!force && prev?.sourceHash === sourceHash) {
    console.log("export-2048-tiles: sourceHash unchanged — skip export.");
    process.exit(0);
  }
  if (force) console.log("export-2048-tiles: --force, re-exporting.");
  else if (prev) console.log("export-2048-tiles: sourceHash changed — exporting.");
  else console.log("export-2048-tiles: no manifest — exporting.");

  let variants = (doc.children ?? [])
    .map((c) => {
      const value = parseVariantName(c.name);
      return value ? { value, nodeId: c.id, name: c.name } : null;
    })
    .filter(Boolean);

  if (variants.length === 0) {
    variants = FALLBACK_VARIANTS.map(([value, nodeId]) => ({
      value,
      nodeId,
      name: `tile-${value}`,
    }));
  }

  const ids = variants.map((v) => v.nodeId).join(",");
  const images = await figma(
    `/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=${SCALE}`,
  );
  if (images.err) throw new Error(String(images.err));

  mkdirSync(outDir, { recursive: true });

  const tileMeta = {};
  let frame = prev?.frame ?? {
    cellWidth: 100,
    cellHeight: 109,
    imgWidth: 115,
    imgHeight: 124,
    offsetX: -7.5,
    offsetY: -3.5,
  };

  for (const v of variants) {
    const url = images.images?.[v.nodeId];
    if (!url) {
      console.warn(`  missing image URL for tile-${v.value} (${v.nodeId})`);
      continue;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download tile-${v.value} failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const file = `${v.value}.png`;
    const filePath = join(outDir, file);
    writeFileSync(filePath, buf);
    /* Figma REST usually ships alpha; MCP/flattened exports can matte #F5F5F5. */
    unmatteIfNeeded(filePath);
    const size = pngSize(readFileSync(filePath));
    tileMeta[v.value] = {
      nodeId: v.nodeId,
      file,
      pixelWidth: size?.width ?? null,
      pixelHeight: size?.height ?? null,
    };
    console.log(
      `  wrote ${file}${size ? ` (${size.width}×${size.height}px @${SCALE}x)` : ""}`,
    );

    /* Derive CSS frame from first successful export @2x → 1x CSS px. */
    if (size && v.value === variants[0]?.value) {
      const imgWidth = size.width / SCALE;
      const imgHeight = size.height / SCALE;
      frame = {
        cellWidth: 100,
        cellHeight: 109,
        imgWidth,
        imgHeight,
        offsetX: -((imgWidth - 100) / 2),
        offsetY: -((imgHeight - 109) / 2),
      };
    }
  }

  const manifest = {
    fileKey: FILE_KEY,
    componentSetId: COMPONENT_SET_ID,
    scale: SCALE,
    sourceHash,
    exportedAt: new Date().toISOString(),
    frame,
    tiles: tileMeta,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`export-2048-tiles: wrote ${manifestPath}`);

  const artTs = `/* GENERATED by scripts/export-2048-tiles.mjs — do not hand-edit. */
export const TILE_ART = {
  cellWidth: ${frame.cellWidth},
  cellHeight: ${frame.cellHeight},
  imgWidth: ${frame.imgWidth},
  imgHeight: ${frame.imgHeight},
  offsetX: ${frame.offsetX},
  offsetY: ${frame.offsetY},
} as const;
`;
  const artPath = join(root, "_2048/tileArt.generated.ts");
  writeFileSync(artPath, artTs);
  console.log(`export-2048-tiles: wrote ${artPath}`);
}

main().catch((err) => {
  console.error("export-2048-tiles: failed:", err.message || err);
  process.exit(1);
});
