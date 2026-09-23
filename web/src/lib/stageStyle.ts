import type { Stage } from "./memory";

/**
 * Each stage's ink, as full class strings (Tailwind reads them as written):
 * a neutral for new, gilt while it's being learned, moss once it holds.
 */
export const STAGE_BG: Record<Stage, string> = {
  new: "bg-graphite/40",
  learning: "bg-gilt",
  young: "bg-moss/60",
  mature: "bg-moss",
};

export const STAGE_TEXT: Record<Stage, string> = {
  new: "text-graphite",
  learning: "text-gilt-ink",
  young: "text-moss",
  mature: "text-moss",
};

/** The schedule label's ink: now, soon, later. */
export const TONE_TEXT = { due: "text-accent", soon: "text-gilt-ink", later: "text-moss" } as const;
