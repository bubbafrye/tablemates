"use client";

import { useState, type CSSProperties } from "react";
import { withBasePath } from "@/platform/site";
import styles from "./Card.module.css";

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

/** Cascade step: 5px on lg face (~355); scale with sm face width (235). */
const STEP_LG = 5;
const STEP_SM = (5 * 235) / 350;

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
  const teeth =
    face === "front" && !blank ? Math.max(1, Math.min(60, value)) : 0;
  const interactive = Boolean(onClick);
  const step = size === "sm" || frame === "face" ? STEP_SM : STEP_LG;
  const label = ariaLabel ?? (face === "back" ? "Card back" : `Card ${value}`);
  const backSrc = withBasePath("/assets/rakko/card-back.png");

  if (frame === "face") {
    /* Figma front-sm / back-sm — used inside draw-discard-pile under a group mask. */
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
              <span
                className={styles.tooth}
                style={{ left: `${(teeth - 1) * step}px`, zIndex: teeth }}
              >
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
  const slotSrc = withBasePath(
    size === "sm" ? "/assets/rakko/slot-sm.svg" : "/assets/rakko/slot.svg",
  );
  const maskSrc = withBasePath(
    size === "sm"
      ? "/assets/rakko/card-mask-sm.svg"
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
              <span
                className={styles.tooth}
                style={{ left: `${(teeth - 1) * step}px`, zIndex: teeth }}
              >
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
        <img
          className={styles.slot}
          src={slotSrc}
          alt=""
          width={size === "sm" ? 249 : 364}
          height={size === "sm" ? 5 : 8}
          aria-hidden
          data-name="slot"
        />
      ) : null}
    </div>
  );
}
