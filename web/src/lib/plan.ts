import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Card } from "../types";
import { hasStarted } from "./path";
import { learnerDayStart } from "./day";

/**
 * Today's plan on the learner's own words, as the server counts it
 * (backend/src/services/daily.service.ts): the reviews waiting, today's new
 * words (three a learner day at most, the course included), the queue
 * behind them, the exercises done, and what tomorrow holds. The home screen
 * reads its headline, its two steps and its buttons from here, never from
 * the raw card list: a word in the queue isn't waiting yet.
 */

/** What every deck's plan says: the day's budget of new words, shared by all decks. A course lesson is gated on it. */
export type DayBudget = { day: string; cap: number; newToday: number };

export type DailyPlan = DayBudget & {
  /** Words already met and due now, all of them (a round takes thirty). */
  reviewsDue: number;
  /** Words from an earlier day still on their first rung. */
  shaky: number;
  /** Why no new word comes today, if none does. */
  paused: "reviews" | "shaky" | null;
  /** Today's new words, in the order they are met. */
  newIds: number[];
  /** Words never met that aren't today's. */
  queued: number;
  /** Exercise answers given today. */
  exercisesToday: number;
  /** Words already met: what the exercises can ask. */
  exercisable: number;
  tomorrow: { reviews: number; new: number };
};

/**
 * The personal deck's plan. Fresh whenever the app comes back to the front
 * (React Query's focus manager listens to visibilitychange, so reopening
 * the PWA counts), and refreshed when a round is left (Flashcards' Session).
 */
export function usePlan(deck: { id: number | string } | undefined) {
  return useQuery({
    queryKey: ["plan", String(deck?.id ?? "")],
    queryFn: () => api.get<DailyPlan>(`/decks/${deck!.id}/plan`),
    enabled: Boolean(deck),
    refetchOnWindowFocus: true,
  });
}

/**
 * A course deck's share of the plan: how many new words today already has.
 * Never refetched behind a lesson's back (a flip mid-lesson would close it);
 * a finished lesson invalidates it (Study).
 */
export function useDayBudget(deckId: number | string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["plan", String(deckId ?? "")],
    queryFn: () => api.get<DayBudget>(`/decks/${deckId}/plan`),
    enabled: enabled && deckId !== undefined && deckId !== "",
    refetchOnReconnect: false,
  });
}

/**
 * Whether a course lesson would take today past the new-word budget: its
 * words not met yet, on top of the ones already met today. A lesson with
 * nothing new in it is never held back; its reviews are the course's own.
 */
export function lessonOverBudget(budget: DayBudget | undefined, cards: Card[]): boolean {
  if (!budget) return false;
  const fresh = cards.filter((card) => !hasStarted(card)).length;
  return fresh > 0 && budget.newToday + fresh > budget.cap;
}

/* --------------------------------------------------------- the minutes -- */

/** A round of cards: a review about 12 s, a new word with its three asks about 80 s. */
export const cardMinutes = (reviews: number, fresh: number): number => Math.ceil((reviews * 12 + fresh * 80) / 60);

/** The exercises: two asks a word, ten at most, about 25 s each, five minutes at most. */
export const exerciseMinutes = (exercisable: number): number => Math.min(5, Math.ceil((Math.min(10, 2 * exercisable) * 25) / 60));

/** Exercise answers after which the day's second step counts as done. */
export const EXERCISES_FOR_THE_DAY = 6;

/* ------------------------------------------------------------ the view -- */

/**
 * Where a home-screen button goes: the day's round, the exercises, all the
 * met words flipped — or, on a day with nothing on the own words, the
 * course or the grammar.
 */
export type PlanMode = "due" | "exercises" | "all" | "course" | "grammar";

export type PlanButton = { label: string; mode: PlanMode };

export type PlanStep = { title: string; detail: string; /** Rough minutes left; null once done. */ minutes: number | null; done: boolean };

export type PlanView = {
  /** Words waiting on the cards today: reviews and new words. */
  count: number;
  /** The headline, and the part of it set in colour. */
  headline: { text: string; accent: string; tone: "berry" | "grass" };
  subline: string;
  /** A line under the covers: why no new word comes, or how many wait in the queue. */
  note: string | null;
  /** The learner's own list has no new word left while today still has room: the course has more. */
  toCourse: boolean;
  primary: PlanButton & { tone: "grass" | "ocean" };
  secondary: PlanButton;
  /** Everything done: a quiet way on to the grammar. */
  grammar: boolean;
  steps: [PlanStep, PlanStep];
};

const joinParts = (parts: (string | null)[]) => parts.filter(Boolean).join(" · ");

/**
 * The home screen's reading of the plan. Three states, in the day's order:
 * cards open (the green button starts the round), cards done and exercises
 * open (the green button goes to the exercises), and both done (the cards
 * can still be flipped, the schedule doesn't move). A fourth for a day with
 * nothing on the own words at all, none of them met yet: the course.
 */
export function planView(plan: DailyPlan): PlanView {
  const fresh = plan.newIds.length;
  const reviews = plan.reviewsDue;
  const count = reviews + fresh;
  const minutes = cardMinutes(reviews, fresh);
  // Today's new words can be exercised once they are met: count them in before the round.
  const exercise = exerciseMinutes(plan.exercisable + fresh);
  const cardsDone = count === 0;
  // Nothing met yet means nothing to exercise: that step waits on the cards.
  const exercisesDone = plan.exercisable === 0 ? cardsDone : plan.exercisesToday >= Math.min(EXERCISES_FOR_THE_DAY, plan.exercisable);

  const steps: [PlanStep, PlanStep] = [
    {
      title: "Kartlar",
      detail: cardsDone ? "tamam" : joinParts([fresh > 0 ? `${fresh} yeni` : null, reviews > 0 ? `${reviews} tekrar` : null]),
      minutes: cardsDone ? null : minutes,
      done: cardsDone,
    },
    { title: "Egzersiz", detail: exercisesDone ? "tamam" : "kelimeleri yazarak pekiştir", minutes: exercisesDone ? null : exercise, done: exercisesDone },
  ];

  const note =
    plan.paused === "reviews"
      ? "Bugün yeni kelime yok: önce tekrarları sağlamlaştıralım."
      : plan.paused === "shaky"
        ? "Öğrenmekte olduğun kelimeler birikti; bugün onlara odaklanalım."
        : plan.queued > 0
          ? `Sırada ${plan.queued} yeni kelime var · her gün en fazla 3'ü gelir.`
          : null;
  const toCourse = !plan.paused && fresh === 0 && plan.queued === 0 && plan.newToday < plan.cap;
  const base = { count, note, toCourse, steps };

  if (!cardsDone) {
    const meet = fresh > 0 ? `${fresh} yeni kelimeyle tanışacaksın` : null;
    const recall = reviews > 0 ? `${reviews} kelimeyi hatırlayacaksın` : null;
    return {
      ...base,
      headline: { text: `${count} kelime seni bekliyor`, accent: `${count} kelime`, tone: "berry" },
      subline: `${[meet, recall].filter(Boolean).join(", ")} · yaklaşık ${minutes} dk.`,
      primary: { label: `Tekrar et · ${count}`, mode: "due", tone: "grass" },
      secondary: { label: "Egzersiz yap", mode: "exercises" },
      grammar: false,
    };
  }
  if (plan.exercisable === 0) {
    // Nothing met on the own words yet, and none of them today: the day's new
    // words went to a course lesson, or the next ones look too much like the
    // last few. Every door here would open on an empty round: the course and
    // the grammar instead, and tomorrow's words.
    const soon = plan.tomorrow.new;
    return {
      ...base,
      steps: [
        { title: "Kartlar", detail: soon > 0 ? `yarın ${soon} yeni` : "yarın", minutes: null, done: true },
        { title: "Egzersiz", detail: "yarın", minutes: null, done: true },
      ],
      headline: { text: "Bugünlük tamam!", accent: "tamam!", tone: "grass" },
      subline:
        plan.newToday >= plan.cap
          ? `Bugünün ${plan.cap} yeni kelimesini kursta öğrendin.${soon > 0 ? ` Burada yarın ${soon} yeni kelime var.` : ""}`
          : "Sıradaki kelimeler yeni tanıştıklarına çok benziyor; karışmasınlar diye bir iki gün bekliyorlar.",
      primary: { label: "Kursa git", mode: "course", tone: "ocean" },
      secondary: { label: "Gramer", mode: "grammar" },
      grammar: false,
    };
  }
  if (!exercisesDone) {
    return {
      ...base,
      headline: { text: "Kartlar tamam!", accent: "tamam!", tone: "grass" },
      subline: `Şimdi kelimeleri yazarak pekiştir · yaklaşık ${exercise} dk.`,
      primary: { label: "Egzersiz yap", mode: "exercises", tone: "grass" },
      secondary: { label: "Kartları çalış", mode: "all" },
      grammar: false,
    };
  }
  const tomorrow = [plan.tomorrow.reviews > 0 ? `${plan.tomorrow.reviews} tekrar` : null, plan.tomorrow.new > 0 ? `${plan.tomorrow.new} yeni kelime` : null].filter(Boolean);
  return {
    ...base,
    headline: { text: "Bugünlük tamam!", accent: "tamam!", tone: "grass" },
    subline: tomorrow.length > 0 ? `Yarın ${tomorrow.join(" ve ")} var.` : "Yarın boş; istersen kartlara yine bak.",
    primary: { label: "Kartları çalış", mode: "all", tone: "ocean" },
    secondary: { label: "Egzersiz yap", mode: "exercises" },
    grammar: true,
  };
}

/** The address of a plan button on the personal deck. */
export const planHref = (deckId: number | string, mode: PlanMode): string =>
  mode === "course" ? "/kurs" : mode === "grammar" ? "/gramer" : `/decks/${deckId}/flashcards${mode === "due" ? "" : `?mode=${mode}`}`;

/* ------------------------------------------------ flipping the met ones -- */

/** Words in one round of going through the cards when nothing is due. */
export const FLIP_LIMIT = 20;

/**
 * "Kartları çalış": the words already met, never the queue (a new word is
 * met on the day's round, three a day). First the ones not answered this
 * learner day, soonest due first; then today's, the longest ago first.
 */
export function flipOrder(cards: Card[], { now = Date.now(), limit = FLIP_LIMIT }: { now?: number; limit?: number } = {}): Card[] {
  const start = learnerDayStart(now);
  const seen = (card: Card) => (card.reviewed_at ? Date.parse(card.reviewed_at) : 0);
  const met = cards.filter(hasStarted);
  const earlier = met.filter((card) => seen(card) < start).sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date) || a.id - b.id);
  const today = met.filter((card) => seen(card) >= start).sort((a, b) => seen(a) - seen(b) || a.id - b.id);
  return [...earlier, ...today].slice(0, limit);
}
