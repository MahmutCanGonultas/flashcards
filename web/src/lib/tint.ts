import type { CSSProperties } from "react";
import type { Card } from "../types";

/**
 * Every word carries a fourth ink pulled from its photograph. The four
 * live words were picked by eye; a card without a stored tint gets one
 * from a small warm palette, chosen by its spelling so it never changes
 * between renders or devices.
 */
const SEEDED: Record<string, { tint: string; focal: string }> = {
  concern: { tint: "#c4713f", focal: "50% 38%" }, // sunburnt cheek, ochre wall
  approach: { tint: "#5e7a8e", focal: "50% 45%" }, // storm slate, bare metal
  commit: { tint: "#a8232e", focal: "50% 50%" }, // bangle crimson
  consider: { tint: "#2e4a6b", focal: "68% 42%" }, // tournament navy
};

/** Warm inks that all sit well on the paper; none of them is purple. */
const PALETTE = ["#c4713f", "#5e7a8e", "#a8232e", "#2e4a6b", "#7a5c2e", "#3e7a5a", "#8a4b3c", "#4f6b5e", "#b0662a", "#55607a"];

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function tintFor(card: Pick<Card, "front" | "tint">): string {
  if (card.tint) return card.tint;
  const seeded = SEEDED[card.front.trim().toLowerCase()];
  return seeded?.tint ?? PALETTE[hash(card.front.trim().toLowerCase()) % PALETTE.length];
}

export function focalFor(card: Pick<Card, "front" | "focal">): string {
  if (card.focal) return card.focal;
  return SEEDED[card.front.trim().toLowerCase()]?.focal ?? "50% 50%";
}

/** Put on the root of anything that shows a card: the tint utilities read `--tint`. */
export function tintStyle(card: Pick<Card, "front" | "tint">): CSSProperties {
  return { "--tint": tintFor(card) } as CSSProperties;
}
