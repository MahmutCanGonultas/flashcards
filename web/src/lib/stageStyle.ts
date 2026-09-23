import type { Stage } from "./memory";

/**
 * Each stage's colour, as full class strings (Tailwind reads them as
 * written): grey for new, orange while it's being learned, blue while it
 * settles, green once it holds.
 */
export const STAGE_BG: Record<Stage, string> = {
  new: "bg-hare",
  learning: "bg-tangerine",
  young: "bg-ocean",
  mature: "bg-grass",
};

export const STAGE_TEXT: Record<Stage, string> = {
  new: "text-graphite",
  learning: "text-tangerine-ink",
  young: "text-ocean-ink",
  mature: "text-grass-ink",
};

/** A stage as a pill: a soft wash with its ink. */
export const STAGE_PILL: Record<Stage, string> = {
  new: "bg-paper-deep text-graphite",
  learning: "bg-tangerine-soft text-tangerine-ink",
  young: "bg-ocean-soft text-ocean-ink",
  mature: "bg-grass-soft text-grass-ink",
};

/** The schedule label's ink: now, soon, later. */
export const TONE_TEXT = { due: "text-berry-ink", soon: "text-tangerine-ink", later: "text-grass-ink" } as const;
export const TONE_PILL = {
  due: "bg-berry-soft text-berry-ink",
  soon: "bg-tangerine-soft text-tangerine-ink",
  later: "bg-grass-soft text-grass-ink",
} as const;
