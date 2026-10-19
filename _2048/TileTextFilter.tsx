/**
 * SoT tile-text (`243:24502`) — CSS text-shadow cannot do INNER_SHADOW.
 *
 * Figma applies effects on the full glyph silhouette, then the fill at 40%.
 * Browsers bake `color: rgba(0,0,0,0.4)` into SourceAlpha, which weakens
 * both shadows. Labels use opaque `#000`; this filter rebuilds fill + effects.
 *
 * Mount once (GameTray); labels use `filter: url(#tm-2048-tile-text)`.
 */
export const TILE_TEXT_FILTER_ID = "tm-2048-tile-text";

export function TileTextFilterDefs() {
  return (
    <svg
      aria-hidden
      width={0}
      height={0}
      style={{ position: "absolute", overflow: "hidden" }}
    >
      <defs>
        <filter
          id={TILE_TEXT_FILTER_ID}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
          primitiveUnits="userSpaceOnUse"
        >
          {/* DROP_SHADOW: white 0.6 @ (0.5, 0.5) r0 — behind glyph */}
          <feOffset in="SourceAlpha" dx={0.5} dy={0.5} result="dropOff" />
          <feFlood
            floodColor="rgb(255,255,255)"
            floodOpacity={0.6}
            result="dropColor"
          />
          <feComposite
            in="dropColor"
            in2="dropOff"
            operator="in"
            result="drop"
          />

          {/* Fill: black @ 40% clipped to glyph */}
          <feFlood
            floodColor="rgb(0,0,0)"
            floodOpacity={0.4}
            result="fillColor"
          />
          <feComposite
            in="fillColor"
            in2="SourceAlpha"
            operator="in"
            result="fill"
          />

          {/* INNER_SHADOW: black 0.75 @ (2, 2) r4 — on full silhouette */}
          <feOffset in="SourceAlpha" dx={2} dy={2} result="inOff" />
          {/* Figma radius 4 ≈ SVG stdDeviation 2 */}
          <feGaussianBlur in="inOff" stdDeviation={2} result="inBlur" />
          <feComposite
            in="SourceAlpha"
            in2="inBlur"
            operator="out"
            result="inMask"
          />
          <feFlood
            floodColor="rgb(0,0,0)"
            floodOpacity={0.75}
            result="inColor"
          />
          <feComposite
            in="inColor"
            in2="inMask"
            operator="in"
            result="insetRaw"
          />
          <feComposite
            in="insetRaw"
            in2="SourceAlpha"
            operator="in"
            result="inset"
          />

          {/* Layer: drop → fill → inset */}
          <feComposite in="fill" in2="drop" operator="over" result="body" />
          <feComposite in="inset" in2="body" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}
