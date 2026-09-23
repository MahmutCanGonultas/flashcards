import type { CSSProperties } from "react";

/**
 * The bright families (index.css) for things that take a colour by
 * position — a word's senses, its chunks, a grammar table — so a page can
 * hand each one its own. `familyStyle` sets four variables that classes
 * read as `bg-(--c)`, `bg-(--c-soft)`, `text-(--c-ink)`, `border-(--c)`.
 */
export type Family = "ocean" | "grass" | "tangerine" | "plum" | "rose" | "teal" | "berry" | "sunny";

export const FAMILIES: Record<Family, { base: string; deep: string; soft: string; ink: string }> = {
  ocean: { base: "#1cb0f6", deep: "#1899d6", soft: "#ddf4ff", ink: "#0b6fa4" },
  grass: { base: "#58cc02", deep: "#58a700", soft: "#d7ffb8", ink: "#3f7d00" },
  tangerine: { base: "#ff9600", deep: "#e07c00", soft: "#ffefd9", ink: "#b25c00" },
  plum: { base: "#ce82ff", deep: "#a568cc", soft: "#f5e6ff", ink: "#8a3fc7" },
  rose: { base: "#ff86d0", deep: "#e0409a", soft: "#ffe3f3", ink: "#b0246f" },
  teal: { base: "#1fc7b0", deep: "#00a38f", soft: "#d5f7f2", ink: "#00735f" },
  berry: { base: "#ff4b4b", deep: "#ea2b2b", soft: "#ffdfe0", ink: "#c81e1e" },
  sunny: { base: "#ffc800", deep: "#e5a500", soft: "#fff5cc", ink: "#8a6200" },
};

/** The order senses and chunks take their colours in: no two neighbours alike, purple only now and then. */
export const ROTATION: Family[] = ["ocean", "grass", "tangerine", "rose", "teal", "plum", "berry", "sunny"];

export const familyAt = (index: number): Family => ROTATION[((index % ROTATION.length) + ROTATION.length) % ROTATION.length];

export function familyStyle(family: Family): CSSProperties {
  const f = FAMILIES[family];
  return { "--c": f.base, "--c-deep": f.deep, "--c-soft": f.soft, "--c-ink": f.ink } as CSSProperties;
}

/** A part of speech gets the same colour everywhere: a verb is always green, a noun always blue. */
const POS_FAMILY: Record<string, Family> = {
  verb: "grass",
  noun: "ocean",
  adjective: "tangerine",
  adverb: "rose",
  preposition: "teal",
  conjunction: "teal",
  "phrasal verb": "grass",
};
export const posFamily = (pos: string | null | undefined): Family => POS_FAMILY[(pos ?? "").trim().toLowerCase()] ?? "plum";
