import type { Card } from "../types";
import { hasStarted } from "./path";
import { blankOut } from "./sentence";

/**
 * A study session is a list of steps, built once at mount.
 *
 * A lesson teaches before it tests. The old flow dropped you straight into a
 * multiple-choice question about a word you had never seen, which left
 * guessing as the only option — this is the fix.
 *
 *   meet × N     the new words, one at a time, nothing to answer
 *   listen       hear each one and pair it with its meaning (ungraded contact)
 *   meaning × N  what does it mean? — the graded question
 *   context × N  the same word missing from its own sentence
 *
 * Reviews skip straight to the questions: you have met those words already.
 */

export type QuizFormat = "meaning" | "context";

export type Step =
  | { kind: "meet"; key: string; cardId: number }
  | { kind: "listen"; key: string; cardIds: number[] }
  | {
      kind: "quiz";
      key: string;
      cardId: number;
      format: QuizFormat;
      /**
       * Whether answering this writes to SM-2. Exactly one step per card per
       * session is graded — a second write would silently take a word from
       * interval 1 to interval 6 in a single day.
       */
      graded: boolean;
      /** 0 for the first ask, 1+ for a repeat after getting it wrong. */
      attempt: number;
      /** The other words in this lesson, used to draw a near-miss distractor. */
      mateIds: number[];
    };

/** The sound check needs at least two words to pair against each other. */
const MIN_CARDS_FOR_LISTEN = 2;

function meetStep(card: Card): Step {
  return { kind: "meet", key: `${card.id}:meet`, cardId: card.id };
}

export function quizStep(
  card: Card,
  format: QuizFormat,
  options: { graded: boolean; attempt?: number; mateIds?: number[] },
): Step {
  const attempt = options.attempt ?? 0;
  return {
    kind: "quiz",
    key: `${card.id}:${format}:${attempt}`,
    cardId: card.id,
    format,
    graded: options.graded,
    attempt,
    mateIds: options.mateIds ?? [],
  };
}

/** A sentence exercise is only possible when the word is findable in its sentence. */
export function canAskInContext(card: Card): boolean {
  return Boolean(card.example_sentence && blankOut(card.example_sentence, card.front));
}

export function buildLessonPlan(cards: Card[]): Step[] {
  const ids = cards.map((card) => card.id);
  const matesOf = (card: Card) => ids.filter((id) => id !== card.id);

  const fresh = cards.filter((card) => !hasStarted(card));
  const steps: Step[] = fresh.map(meetStep);

  if (fresh.length >= MIN_CARDS_FOR_LISTEN) {
    steps.push({ kind: "listen", key: "listen", cardIds: fresh.map((card) => card.id) });
  }

  // The meaning round is the graded one. The sentence round follows it as
  // reinforcement, so a word is used before the lesson lets go of it.
  for (const card of cards) {
    steps.push(quizStep(card, "meaning", { graded: true, mateIds: matesOf(card) }));
  }
  for (const card of cards.filter(canAskInContext)) {
    steps.push(quizStep(card, "context", { graded: false, mateIds: matesOf(card) }));
  }

  return steps;
}

/**
 * Reviews and practice. A card that somehow reaches a review without ever
 * having been taught — "+ Add card" creates one that is unstarted and
 * immediately due — gets its meet screen inline, right before its own
 * question, rather than restructuring the session around an accident.
 */
export function buildReviewPlan(cards: Card[]): Step[] {
  return cards.flatMap((card) => {
    const quiz = quizStep(card, "meaning", { graded: true });
    return hasStarted(card) ? [quiz] : [meetStep(card), quiz];
  });
}

/**
 * The repeat for a word just answered wrong.
 *
 * A lesson cannot be finished by getting everything wrong: a missed word comes
 * back until it is answered correctly. The repeat is never graded — SM-2
 * already recorded the lapse, and re-asking a word thirty seconds later would
 * launder that into a success.
 */
export function repeatStep(card: Card, format: QuizFormat, attempt: number): Step {
  const mateIds: number[] = [];
  return quizStep(card, format, { graded: false, attempt: attempt + 1, mateIds });
}
