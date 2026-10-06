import type { Recall } from "./types";
import { RECALL_BASE } from "./recallBase";
import { RECALL_INTERMEDIATE } from "./intermediate";

/**
 * Each topic's "Hatırla" card, keyed by slug: the few rules worth keeping in
 * mind and the examples that show them, for a look between other things.
 */
export const RECALL: Record<string, Recall> = { ...RECALL_BASE, ...RECALL_INTERMEDIATE };
