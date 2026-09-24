/** One review_log row, as the week's numbers read it. */
export type LogRow = { quality: number; kind: string | null; phase: string | null; scheduled: boolean };

export type WeekStats = {
  /** Graded reviews: the answers that moved a card's schedule. */
  reviews: number;
  knew: number;
  hard: number;
  missed: number;
  /** knew + hard, for clients that still show "%X hatırladın". */
  remembered: number;
  /** Exercises where the word was typed, and how many of them were right. */
  typed: number;
  typedRight: number;
};

/** The exercise kinds where the learner types the word. */
const TYPED_KINDS = new Set(["produce", "cloze", "chunk", "own"]);

/**
 * A week of answers in numbers. Only scheduled rows are reviews: learning
 * steps, repeats and exercises never touched the card, so they don't count
 * as remembering it; nor does a new word's one learning write, made the day
 * it was met, before any review. Typed exercises are counted apart, first
 * tries only (a retry is logged as "cloze-retry"…); right means Bildim.
 */
export function statsFrom(rows: LogRow[]): WeekStats {
  const graded = rows.filter((row) => row.scheduled && row.phase !== "learn");
  const typed = rows.filter((row) => !row.scheduled && row.phase === "exercise" && row.kind !== null && TYPED_KINDS.has(row.kind));
  return {
    reviews: graded.length,
    knew: graded.filter((row) => row.quality >= 4).length,
    hard: graded.filter((row) => row.quality === 3).length,
    missed: graded.filter((row) => row.quality < 3).length,
    remembered: graded.filter((row) => row.quality >= 3).length,
    typed: typed.length,
    typedRight: typed.filter((row) => row.quality >= 4).length,
  };
}
