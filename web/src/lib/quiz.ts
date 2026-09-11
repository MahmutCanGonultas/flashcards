import type { Card } from "../types";
import { parseBack } from "./cardBack";
import { hasStarted } from "./path";

export type QuizOption = {
  text: string;
  emoji: string | null;
  isCorrect: boolean;
};

type BuildOptions = {
  /** Words taught alongside this one — the same lesson, or the whole unit for a test. */
  mates?: Card[];
  /**
   * How many distractors may come from `mates`. A lesson keeps this at one so
   * three words taught together aren't a coin flip on day one; a unit test
   * raises it, because telling this unit's words apart is exactly the test.
   */
  mateLimit?: number;
  /**
   * Total options to offer, including the correct one. Defaults to 4; a word
   * being asked again after a miss narrows to 2, so the repeat always ends.
   */
  maxOptions?: number;
};

const DEFAULT_MAX_OPTIONS = 4;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Distractors are drawn in tiers, best first:
 *
 *   1. one word from the same lesson — near enough to be a real choice
 *   2. up to two already-learned words of the same part of speech
 *   3. any already-learned word
 *   4. anything left in the deck
 *
 * Only ONE lesson-mate, deliberately. A lesson is three words taught together
 * and they are often close in meaning; offering all three as options turns the
 * question into a coin flip on the day they are introduced.
 *
 * Preferring already-learned words above unseen ones matters too — every
 * distractor is read, and reading the gloss of a word you haven't met yet
 * teaches it out of order, badly.
 */
function pickDistractors(
  card: Card,
  deckCards: Card[],
  mates: Card[],
  mateLimit: number,
  wanted: number,
  glossOf: (card: Card) => string,
  toOption: (card: Card) => QuizOption,
): QuizOption[] {
  const taken = new Set([glossOf(card)]);
  const used = new Set([card.id]);
  const chosen: QuizOption[] = [];

  const take = (candidates: Card[], limit: number) => {
    for (const other of shuffle(candidates)) {
      if (chosen.length >= wanted || limit <= 0) return;
      if (used.has(other.id)) continue;
      const gloss = glossOf(other);
      if (taken.has(gloss)) continue;
      taken.add(gloss);
      used.add(other.id);
      chosen.push(toOption(other));
      limit--;
    }
  };

  const pos = parseBack(card.back).pos;
  const rest = deckCards.filter((other) => other.id !== card.id);
  const started = rest.filter(hasStarted);

  take(mates, mateLimit);
  take(
    started.filter((other) => pos !== null && parseBack(other.back).pos === pos),
    2,
  );
  take(started, wanted);
  take(rest, wanted);

  return chosen;
}

/**
 * Options are the Turkish meanings: "what does this English word mean?"
 *
 * Returns 2–4 options rather than always 4 — a tiny deck should still get a
 * real question. Returns null only when there is nothing at all to contrast
 * against, and the caller must then say so rather than showing one option.
 */
export function buildQuizOptions(
  card: Card,
  deckCards: Card[],
  options: BuildOptions = {},
): QuizOption[] | null {
  const glossOf = (c: Card) => parseBack(c.back).text;
  const toOption = (c: Card): QuizOption => {
    const parsed = parseBack(c.back);
    return { text: parsed.text, emoji: parsed.emoji, isCorrect: false };
  };

  const distractors = pickDistractors(
    card,
    deckCards,
    options.mates ?? [],
    options.mateLimit ?? 1,
    (options.maxOptions ?? DEFAULT_MAX_OPTIONS) - 1,
    glossOf,
    toOption,
  );
  if (distractors.length === 0) return null;

  const correct = parseBack(card.back);
  return shuffle([
    ...distractors,
    { text: correct.text, emoji: correct.emoji, isCorrect: true },
  ]);
}

/**
 * Options are the English words themselves — for "which word did you hear?"
 * and "which word is missing from this sentence?".
 *
 * Carries no emoji on purpose: the emoji encodes the meaning, and showing it
 * next to the English word would let you answer by matching pictures instead
 * of by hearing or reading.
 */
export function buildWordOptions(
  card: Card,
  deckCards: Card[],
  options: BuildOptions = {},
): QuizOption[] | null {
  const glossOf = (c: Card) => c.front.toLowerCase();
  const toOption = (c: Card): QuizOption => ({
    text: c.front,
    emoji: null,
    isCorrect: false,
  });

  // Words of a similar length make a fairer choice than "however" against
  // "up", so the deck is narrowed before the tiers pick from it.
  const nearest = [...deckCards].sort(
    (a, b) =>
      Math.abs(a.front.length - card.front.length) -
      Math.abs(b.front.length - card.front.length),
  );

  const distractors = pickDistractors(
    card,
    nearest.slice(0, 24),
    options.mates ?? [],
    options.mateLimit ?? 1,
    (options.maxOptions ?? DEFAULT_MAX_OPTIONS) - 1,
    glossOf,
    toOption,
  );
  if (distractors.length === 0) return null;

  return shuffle([...distractors, { text: card.front, emoji: null, isCorrect: true }]);
}
