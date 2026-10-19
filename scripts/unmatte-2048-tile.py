#!/usr/bin/env python3
"""Strip near-white matte backgrounds from Figma MCP / flattened PNG exports.

Keeps colored tile body opaque; converts soft grey shadows to black+alpha;
clears flood-filled matte to transparent.
"""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

MATTE = 245
TOL = 2


def unmatte_rgba(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h))
    md = out.load()
    for y in range(h):
        for x in range(w):
            md[x, y] = px[x, y]

    def near_matte(r: int, g: int, b: int) -> bool:
        return abs(r - MATTE) <= TOL and abs(g - MATTE) <= TOL and abs(b - MATTE) <= TOL

    seen = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _a = px[x, y]
            if near_matte(r, g, b):
                q.append((x, y))
                seen[y][x] = True
    for y in range(h):
        for x in (0, w - 1):
            if not seen[y][x]:
                r, g, b, _a = px[x, y]
                if near_matte(r, g, b):
                    q.append((x, y))
                    seen[y][x] = True
    while q:
        x, y = q.popleft()
        md[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]:
                r, g, b, _a = px[nx, ny]
                if near_matte(r, g, b):
                    seen[ny][nx] = True
                    q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if md[x, y][3] == 0:
                continue
            r, g, b, _ = px[x, y]
            if near_matte(r, g, b):
                md[x, y] = (0, 0, 0, 0)
                continue
            chroma = max(r, g, b) - min(r, g, b)
            if chroma > 18:
                md[x, y] = (r, g, b, 255)
                continue
            if max(r, g, b) < MATTE - 2:
                lum = (r + g + b) / 3.0
                alpha = max(0.0, min(1.0, 1.0 - lum / MATTE))
                md[x, y] = (0, 0, 0, 0) if alpha < 0.03 else (0, 0, 0, int(round(alpha * 255)))
                continue
            matte_remain = min(r / MATTE, g / MATTE, b / MATTE)
            a = 1.0 - matte_remain
            if a < 0.04:
                md[x, y] = (0, 0, 0, 0)
            elif a > 0.9:
                md[x, y] = (r, g, b, 255)
            else:

                def uf(c: int) -> int:
                    return max(0, min(255, int(round((c - MATTE * (1 - a)) / a))))

                md[x, y] = (uf(r), uf(g), uf(b), int(round(a * 255)))
    return out


def needs_unmatte(im: Image.Image) -> bool:
    """True if corners look like an opaque light matte (MCP / flattened export)."""
    im = im.convert("RGBA")
    w, h = im.size
    samples = [im.getpixel((0, 0)), im.getpixel((w - 1, 0)), im.getpixel((0, h - 1)), im.getpixel((w - 1, h - 1))]
    for r, g, b, a in samples:
        if a < 250:
            return False
        if not (abs(r - MATTE) <= 12 and abs(g - MATTE) <= 12 and abs(b - MATTE) <= 12):
            # also catch pure white matte
            if not (r >= 240 and g >= 240 and b >= 240):
                return False
    return True


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: unmatte-2048-tile.py <png> [out.png]", file=sys.stderr)
        return 2
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src
    im = Image.open(src)
    if not needs_unmatte(im):
        print(f"skip (already transparent): {src}")
        if dst != src:
            im.convert("RGBA").save(dst, optimize=True)
        return 0
    out = unmatte_rgba(im)
    out.save(dst, optimize=True)
    c = out.getpixel((out.width // 2, out.height // 2))
    print(f"unmatted {src} → {dst} center={c} corner_a={out.getpixel((0,0))[3]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
