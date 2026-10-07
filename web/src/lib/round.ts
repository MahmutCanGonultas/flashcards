import type { Card, ReviewQuality } from "../types";
import { corePos } from "./senses";
import { posLabel } from "./cardBack";

/**
 * A round of cards, kept simple: the word on the front, its meaning and
 * part of speech on the back, and two answers, Biliyorum and Bilmiyorum.
 *
 * - A new word (the day's plan brings at most three) is first shown with
 *   its meaning, then asked twice later in the round. At its second right
 *   answer it is written to the schedule once: back tomorrow. A miss asks
 *   it once more; after six asks it is let go and comes back tomorrow.
 * - A word due for review is asked once and that answer is written. A
 *   miss brings it back later in the round (up to twice, until it is got
 *   right), without touching the schedule again.
 * - "Serbest" goes through words already met; nothing is written.
 *
 * Every answer says when the word comes back, so the learner always knows.
 */

export type Answer = "knew" | "missed";

/** One card in the round: a new word being shown, or a word being asked. */
export type Step = { cardId: number; kind: "meet" | "ask" };

/** Words asked in one round at most, so a round stays a few minutes. */
export const REVIEW_LIMIT = 30;
export const FREE_LIMIT = 20;
/** Cards between showing a new word and asking it, and between its two asks. */
export const FIRST_GAP = 3;
export const SECOND_GAP = 4;
/** Cards between a miss and its next ask. */
export const RETRY_GAP = 3;
/** Asks a new word gets before it is let go for the day. */
export const MAX_NEW_ASKS = 6;
/** Extra asks a missed review gets in the round. */
export const MAX_EXTRAS = 2;

/** The schedule's steps for the learner's words (backend srs.service.ts, 'gentle'): 1, 3, 7 days, then the gap × ease. */
export const LADDER = [1, 3, 7];

/**
 * The round: the new words shown first, a couple of reviews apart, the
 * reviews in between and after. The asks of each new word are put in as
 * the round goes (`placeAfter`).
 */
export function buildRound(fresh: Card[], reviews: Card[]): Step[] {
  const steps: Step[] = reviews.map((card) => ({ cardId: card.id, kind: "ask" }));
  fresh.forEach((card, i) => {
    steps.splice(Math.min(i * 3, steps.length), 0, { cardId: card.id, kind: "meet" });
  });
  return steps;
}

/** `step` put back `gap` cards after `index`, or at the end if the round is shorter. */
export function placeAfter(steps: Step[], index: number, step: Step, gap: number): Step[] {
  const at = Math.min(index + 1 + gap, steps.length);
  return [...steps.slice(0, at), step, ...steps.slice(at)];
}

/** What a new word has been through this round. */
export type NewState = { asks: number; right: number; missed: boolean; done: boolean };
export const freshState = (): NewState => ({ asks: 0, right: 0, missed: false, done: false });

/** A write to the server: the schedule (`review`), or an answer it doesn't count (`practice`). */
export type Write =
  | { to: "review"; quality: ReviewQuality; phase: "learn" | "review" }
  | { to: "practice"; quality: ReviewQuality; phase: "learn-step" | "relearn" | "practice" };

export type Outcome = {
  /** Put this card back in the round, this many cards on. */
  again: number | null;
  write: Write;
  /** When the word comes back, in days from today; null while it is still being asked this round. */
  nextDays: number | null;
  /** The line under the card: what just happened and what comes next. */
  note: string;
};

const quality = (answer: Answer): ReviewQuality => (answer === "knew" ? 5 : 1);

/** A new word answered. Two right answers and it is learned; a miss costs one more ask. */
export function answerNew(state: NewState, answer: Answer): { state: NewState; outcome: Outcome } {
  const asks = state.asks + 1;
  const right = state.right + (answer === "knew" ? 1 : 0);
  const missed = state.missed || answer === "missed";
  if (right >= 2) {
    return {
      state: { asks, right, missed, done: true },
      outcome: { again: null, write: { to: "review", quality: missed ? 3 : 4, phase: "learn" }, nextDays: 1, note: "Öğrendin! Yarın tekrar gelecek." },
    };
  }
  if (asks >= MAX_NEW_ASKS) {
    return {
      state: { asks, right, missed, done: true },
      outcome: { again: null, write: { to: "review", quality: 1, phase: "learn" }, nextDays: 1, note: "Bugünlük bu kadar. Yarın baştan sorarım." },
    };
  }
  return {
    state: { asks, right, missed, done: false },
    outcome: {
      again: answer === "knew" ? SECOND_GAP : RETRY_GAP,
      write: { to: "practice", quality: quality(answer), phase: "learn-step" },
      nextDays: null,
      note: answer === "knew" ? "Güzel! Birazdan bir kez daha soracağım." : "Birazdan tekrar soracağım.",
    },
  };
}

/** A review's first answer, the one written to the schedule. */
export function answerReview(card: Pick<Card, "repetitions" | "interval" | "ease_factor">, answer: Answer): Outcome {
  if (answer === "knew") {
    const days = nextInterval(card);
    return { again: null, write: { to: "review", quality: 5, phase: "review" }, nextDays: days, note: `${whenText(days)} tekrar gelecek.` };
  }
  return { again: RETRY_GAP, write: { to: "review", quality: 1, phase: "review" }, nextDays: null, note: "Birazdan tekrar soracağım. Yarın da gelecek." };
}

/** A missed review asked again: practice only, the schedule already has its answer (back tomorrow). */
export function answerExtra(answer: Answer, extrasLeft: number): Outcome {
  const again = answer === "missed" && extrasLeft > 0 ? RETRY_GAP : null;
  return {
    again,
    write: { to: "practice", quality: quality(answer), phase: "relearn" },
    nextDays: again === null ? 1 : null,
    note: answer === "knew" ? "Tamam! Yarın tekrar gelecek." : again !== null ? "Bir kez daha gelecek." : "Yarın tekrar gelecek.",
  };
}

/** Serbest: nothing is written to the schedule; a miss comes back once. */
export function answerFree(answer: Answer, firstMiss: boolean): Outcome {
  return {
    again: answer === "missed" && firstMiss ? RETRY_GAP : null,
    write: { to: "practice", quality: quality(answer), phase: "practice" },
    nextDays: null,
    note: answer === "knew" ? "Bildin." : "Birazdan bir kez daha gelecek.",
  };
}

/** Days until a word answered Biliyorum comes back: the next step of 1, 3, 7, then the gap × ease. */
export function nextInterval(card: Pick<Card, "repetitions" | "interval" | "ease_factor">): number {
  const reps = card.repetitions + 1;
  if (reps <= LADDER.length) return Math.max(LADDER[reps - 1], card.interval + 1);
  return Math.max(card.interval + 1, Math.round(card.interval * card.ease_factor));
}

/** "yarın", "3 gün sonra", "2 hafta sonra", "2 ay sonra". */
export function whenText(days: number): string {
  if (days <= 0) return "Bugün";
  if (days === 1) return "Yarın";
  if (days < 14) return `${days} gün sonra`;
  if (days < 45) return `${Math.round(days / 7)} hafta sonra`;
  return `${Math.round(days / 30)} ay sonra`;
}

/** The part of speech as the card shows it: "adjective · sıfat", or just one when they are the same. */
export function posText(card: Pick<Card, "senses" | "back">): string | null {
  const pos = corePos(card);
  if (!pos) return null;
  const tr = posLabel(pos);
  return tr && tr.toLowerCase() !== pos.toLowerCase() ? `${pos} · ${tr}` : pos;
}

/** A new order every round: the same order every day would teach the order, not the words. */
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
