import type { CSSProperties } from "react";
import type { Card } from "../types";

/**
 * Every word carries its own colour, so a session reads as a run of
 * different cards rather than one card eight times, and a word is known by
 * its colour as much as by its spelling. A card with a stored tint keeps
 * it; the rest get one from the palette, chosen by spelling so it never
 * changes between renders or devices.
 */

/** Bright colours that still carry large white type: the deeper shade of each family, and a few between them. */
export const PALETTE = ["#58a700", "#1899d6", "#9b5de5", "#d97000", "#ea2b2b", "#e0409a", "#00a38f", "#2b70c9"];

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function tintFor(card: Pick<Card, "front" | "tint">): string {
  if (card.tint) return card.tint;
  const key = card.front.trim().toLowerCase();
  return PALETTE[hash(key) % PALETTE.length];
}

/**
 * Put on the root of anything that shows a card: the tint utilities read
 * these. --tint-deep is the 3D edge under a cover, --tint-soft the wash
 * behind a highlighted word, --tint-ink the shade that small text can use.
 * The same four go out as --c… too, the names every coloured part reads
 * (lib/palette.ts): under a card, "the colour" is the word's own unless a
 * part sets another.
 */
export function tintStyle(card: Pick<Card, "front" | "tint">): CSSProperties {
  const tint = tintFor(card);
  const deep = `color-mix(in oklab, ${tint} 78%, #000)`;
  const soft = `color-mix(in oklab, ${tint} 14%, #fff)`;
  const ink = `color-mix(in oklab, ${tint} 74%, #000)`;
  return {
    "--tint": tint,
    "--tint-deep": deep,
    "--tint-soft": soft,
    "--tint-ink": ink,
    "--c": tint,
    "--c-deep": deep,
    "--c-soft": soft,
    "--c-ink": ink,
  } as CSSProperties;
}
