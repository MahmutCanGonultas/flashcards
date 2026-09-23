import type { CSSProperties } from "react";
import type { Card } from "../types";

/**
 * Every word carries its own colour, so a session reads as a run of
 * different cards rather than one card eight times, and a word is known by
 * its colour as much as by its spelling. A card with a stored tint keeps
 * it; the rest get one from a small palette of inks, chosen by spelling so
 * it never changes between renders or devices.
 */
const SEEDED: Record<string, string> = {
  concern: "#c4713f",
  approach: "#5e7a8e",
  commit: "#a8232e",
  consider: "#2e4a6b",
};

/** Inks that all read on the paper and carry white type once deepened; none of them is purple. */
const PALETTE = ["#c4713f", "#5e7a8e", "#a8232e", "#2e4a6b", "#7a5c2e", "#3e7a5a", "#8a4b3c", "#4f6b5e", "#b0662a", "#55607a"];

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function tintFor(card: Pick<Card, "front" | "tint">): string {
  if (card.tint) return card.tint;
  const key = card.front.trim().toLowerCase();
  return SEEDED[key] ?? PALETTE[hash(key) % PALETTE.length];
}

/** Put on the root of anything that shows a card: the tint utilities read `--tint`. */
export function tintStyle(card: Pick<Card, "front" | "tint">): CSSProperties {
  return { "--tint": tintFor(card) } as CSSProperties;
}
