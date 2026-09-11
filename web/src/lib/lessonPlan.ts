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
 *   meet × N       the new words, one at a time, nothing to answer
 *   listen         hear each one and pair it with its meaning (ungraded contact)
 *   meaning × N    what does it mean? — the graded question
 *   two more rounds, chosen by level and varied lesson to lesson:
 *     context      the word missing from its own sentence
 *     listen       hear it, pick the spelling
 *     reverse      Turkish shown, pick the English
 *     type         Turkish shown, write the English
 *
 * Reviews skip straight to the questions: you have met those words already.
 */

export type QuizFormat = "meaning" | "context" | "listen" | "reverse" | "type";

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

/**
 * Which extra rounds a level draws from, in a fixed order. Two are picked per
 * lesson by walking this list from the lesson number, so consecutive lessons
 * get different pairs and no level ever feels like the same drill twice.
 * Production (typing) only appears from B2, where the words are worth it.
 */
const ROUNDS_BY_LEVEL: Record<string, Exclude<QuizFormat, "meaning">[]> = {
  A1: ["context", "listen"],
  A2: ["context", "listen", "reverse"],
  B1: ["context", "reverse", "listen"],
  B2: ["reverse", "type", "context", "listen"],
  C1: ["type", "reverse", "context"],
};
const DEFAULT_ROUNDS = ROUNDS_BY_LEVEL.A2;

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

/** Rounds a card can take: context needs a usable sentence, the rest always work. */
function supports(card: Card, format: QuizFormat): boolean {
  return format === "context" ? canAskInContext(card) : true;
}

export function extraRoundsFor(level: string | null, lessonNumber: number): QuizFormat[] {
  const pool = ROUNDS_BY_LEVEL[level ?? ""] ?? DEFAULT_ROUNDS;
  const first = pool[lessonNumber % pool.length];
  const second = pool[(lessonNumber + 1) % pool.length];
  return first === second ? [first] : [first, second];
}

export function buildLessonPlan(
  cards: Card[],
  level: string | null = null,
  lessonNumber = 0,
): Step[] {
  const ids = cards.map((card) => card.id);
  const matesOf = (card: Card) => ids.filter((id) => id !== card.id);

  const fresh = cards.filter((card) => !hasStarted(card));
  const steps: Step[] = fresh.map(meetStep);

  if (fresh.length >= MIN_CARDS_FOR_LISTEN) {
    steps.push({ kind: "listen", key: "listen", cardIds: fresh.map((card) => card.id) });
  }

  // The meaning round is the graded one. What follows is reinforcement in
  // other directions, so a word is heard, used and produced before the lesson
  // lets go of it.
  for (const card of cards) {
    steps.push(quizStep(card, "meaning", { graded: true, mateIds: matesOf(card) }));
  }
  for (const format of extraRoundsFor(level, lessonNumber)) {
    for (const card of cards.filter((card) => supports(card, format))) {
      steps.push(quizStep(card, format, { graded: false, mateIds: matesOf(card) }));
    }
  }

  return steps;
}

/**
 * Reviews and practice. A card that somehow reaches a review without ever
 * having been taught — "+ Add card" creates one that is unstarted and
 * immediately due — gets its meet screen inline, right before its own
 * question, rather than restructuring the session around an accident.
 *
 * Reviews rotate their format so a word isn't always met from the same side:
 * mostly meaning, every third time the reverse, every fourth by ear.
 */
export function buildReviewPlan(cards: Card[]): Step[] {
  return cards.flatMap((card, index) => {
    const format: QuizFormat =
      card.repetitions >= 2 && index % 4 === 3
        ? "listen"
        : card.repetitions >= 1 && index % 3 === 2
          ? "reverse"
          : "meaning";
    const quiz = quizStep(card, format, { graded: true });
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
  return quizStep(card, format, { graded: false, attempt: attempt + 1, mateIds: [] });
}
