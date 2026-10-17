"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { withBasePath } from "@/platform/site";
import styles from "./Card.module.css";

/** Matches `_rakko` xsm CSS `@media (max-width: 899px)`. */
function useXsmViewport() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(max-width: 899px)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(max-width: 899px)").matches,
    () => false,
  );
}

type CardProps = {
  value?: number;
  face?: "front" | "back";
  /** Figma card-base artboard (rack) vs raw front-sm/back-sm face (piles). */
  frame?: "base" | "face";
  /** Figma card-base: default-sm or default-lg. Ignored when frame="face". */
  size?: "sm" | "lg";
  selected?: boolean;
  stacked?: boolean;
  /** Cream face with no value — stack under-cards. */
  blank?: boolean;
  /** Per-card slot lip. Rack only — piles use one shared slot in front. */
  slot?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

/** Figma card / card-base: cream + Anton value, or PNG card-back. */
export function Card({
  value = 1,
  face = "front",
  frame = "base",
  size = "sm",
  selected = false,
  stacked = false,
  blank = false,
  slot = true,
  style,
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
}: CardProps) {
  const [hovered, setHovered] = useState(false);
  const xsm = useXsmViewport();
  const teeth =
    face === "front" && !blank ? Math.max(1, Math.min(60, value)) : 0;
  const interactive = Boolean(onClick);
  const label = ariaLabel ?? (face === "back" ? "Card back" : `Card ${value}`);
  const backSrc = withBasePath("/assets/rakko/card-back.png");
  /* Tooth X uses --rakko-tooth-step (sm/xsm via rakkoBreakpoints.css). */
  const toothStyle = {
    ["--tooth-i" as string]: teeth,
    zIndex: teeth,
  } satisfies CSSProperties;

  if (frame === "face") {
    /* Figma front-sm / front-xsm — pile faces under group mask. */
    return (
      <div
        className={styles.faceOnly}
        style={style}
        data-name={face === "back" ? "back-sm" : "front-sm"}
        data-face={face}
        data-interactive={interactive ? "true" : undefined}
        data-selected={selected ? "true" : undefined}
      >
        {interactive ? (
          <button
            type="button"
            className={styles.faceOnlyBounds}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            data-name="bounds"
          />
        ) : null}
        <span className={styles.faceOnlyPlate} data-name="cardbase" aria-hidden={interactive || undefined}>
          {face === "back" ? (
            <img
              className={styles.backArtFace}
              src={backSrc}
              alt=""
              width={241}
              height={77}
              aria-hidden
              data-name="card-back"
            />
          ) : teeth > 0 ? (
            <span className={styles.cascadeFace} aria-hidden>
              <span className={styles.tooth} style={toothStyle}>
                <span className={styles.toothStroke} aria-hidden>
                  {value}
                </span>
                <span className={styles.toothFill}>{value}</span>
              </span>
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  /* Figma selected-sm / selected-lg — also used for hover on selectable rack cards. */
  const lifted = selected || (hovered && interactive && !disabled);
  const className = [
    styles.card,
    size === "lg" ? styles.lg : styles.sm,
    lifted ? styles.selected : "",
    stacked ? styles.stacked : "",
  ]
    .filter(Boolean)
    .join(" ");
  const slotSmSrc = withBasePath(
    size === "sm" ? "/assets/rakko/slot-sm.svg" : "/assets/rakko/slot.svg",
  );
  const slotXsmSrc = withBasePath("/assets/rakko/slot-xsm.svg");
  const maskSrc = withBasePath(
    size === "sm"
      ? xsm
        ? "/assets/rakko/card-mask-xsm.svg"
        : "/assets/rakko/card-mask-sm.svg"
      : "/assets/rakko/card-mask.svg",
  );
  const faceMaskStyle = {
    WebkitMaskImage: `url("${maskSrc}")`,
    maskImage: `url("${maskSrc}")`,
  } satisfies CSSProperties;

  /* Lift above stacked neighbors while tilted (inline zIndex from Rack). */
  const baseZ =
    typeof style?.zIndex === "number"
      ? style.zIndex
      : typeof style?.zIndex === "string"
        ? Number.parseInt(style.zIndex, 10) || 0
        : 0;
  const mergedStyle: CSSProperties = {
    ...style,
    ...(lifted ? { zIndex: baseZ + 100 } : null),
  };

  return (
    <div
      className={className}
      style={mergedStyle}
      data-name="card-base"
      data-face={face}
      data-size={size}
      data-interactive={interactive ? "true" : undefined}
      data-selected={lifted ? "true" : undefined}
    >
      {interactive ? (
        <button
          type="button"
          className={styles.bounds}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={selected || undefined}
          data-name="bounds"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        />
      ) : null}
      {/*
        Mask stays axis-aligned (Figma card-slot mask); face tilts inside.
        mask-image via withBasePath for GitHub Pages subpath.
      */}
      <span className={styles.faceClip} style={faceMaskStyle} data-name="card-slot">
        <span className={styles.faceShadow} aria-hidden data-name="face-shadow" />
        <span
          className={styles.face}
          data-name="card"
          aria-hidden={interactive || undefined}
        >
          {face === "back" ? (
            <img
              className={styles.backArt}
              src={backSrc}
              alt=""
              width={size === "sm" ? 241 : 365}
              height={size === "sm" ? 77 : 117}
              aria-hidden
              data-name="card-back"
            />
          ) : teeth > 0 ? (
            <span className={styles.cascade} aria-hidden>
              <span className={styles.tooth} style={toothStyle}>
                <span className={styles.toothStroke} aria-hidden>
                  {value}
                </span>
                <span className={styles.toothFill}>{value}</span>
              </span>
            </span>
          ) : null}
        </span>
      </span>
      {slot ? (
        <>
          <img
            className={`${styles.slot} ${styles.slotSm}`}
            src={slotSmSrc}
            alt=""
            width={size === "sm" ? 249 : 364}
            height={size === "sm" ? 5 : 8}
            aria-hidden
            data-name="slot"
          />
          {size === "sm" ? (
            <img
              className={`${styles.slot} ${styles.slotXsm}`}
              src={slotXsmSrc}
              alt=""
              width={162}
              height={5}
              aria-hidden
              data-name="slot"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
