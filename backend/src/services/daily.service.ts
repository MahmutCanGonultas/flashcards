import type { Pool } from "pg";
import { dayStart, learnerDay } from "./day.service.js";

/**
 * The learner's day on their own words: which reviews are waiting, which new
 * words are met today, and how much is left for tomorrow.
 *
 * New words are rationed. At most three a learner day, counted over every
 * deck (a course lesson uses the same budget), none at all while reviews or
 * shaky words have piled up, and never two look-alikes side by side. A word
 * counts as introduced once its first answer is written to the schedule
 * (reviewCard stamps introduced_on); reading the plan never writes, and the
 * picker is deterministic, so a round that was met but never written is
 * simply offered again.
 */

/** New words per learner day, the course included. */
export const NEW_PER_DAY = 3;
/** Reviews in one round, oldest due first; the rest wait for the next round. */
export const REVIEW_LIMIT = 30;
/** More reviews than this waiting: no new word today. */
export const PAUSE_IF_REVIEWS_DUE = 20;
/** More than this many words still shaky (first rung, from an earlier day): no new word today. */
export const PAUSE_IF_SHAKY = 9;

type Sense = { pos?: string | null; tier?: number | null };

/** The columns the plan reads. Rows from `SELECT *` carry these and more. */
export type PlanCard = {
  id: number;
  front: string;
  back: string;
  senses?: Sense[] | null;
  repetitions: number;
  interval: number;
  due_date: Date | string | null;
  /** 'YYYY-MM-DD' (see db.ts), or null until the first scheduled answer. */
  introduced_on: string | null;
};

/** A word introduced today or yesterday, in any of the learner's decks. */
export type IntroducedWord = Pick<PlanCard, "id" | "front" | "back" | "senses" | "introduced_on">;

export type PlanCounts = {
  day: string;
  cap: number;
  newToday: number;
  reviewsDue: number;
  shaky: number;
  paused: "reviews" | "shaky" | null;
  newIds: number[];
  queued: number;
  exercisesToday: number;
  exercisable: number;
  tomorrow: { reviews: number; new: number };
};

export type DailyPlan<T extends PlanCard = PlanCard> = PlanCounts & { reviews: T[]; fresh: T[] };

/** Answered at least once on the schedule (a word written as "not yet" has interval 1). */
export const isStarted = (card: { repetitions: number; interval: number }) => card.repetitions > 0 || card.interval > 0;

/** The part of speech of the word's core sense: "verb", "noun"… */
export function posOf(card: Pick<PlanCard, "back" | "senses">): string | null {
  const senses = card.senses ?? [];
  const pos = senses.find((sense) => sense?.tier === 1)?.pos ?? senses[0]?.pos ?? card.back.match(/^\s*\(([^)]+)\)/)?.[1];
  return pos ? pos.trim().toLowerCase() : null;
}

/** consider and concern share "con": close enough to be confused on the same day. */
export const prefixOf = (card: Pick<PlanCard, "front">) => card.front.toLowerCase().replace(/[^a-z]/g, "").slice(0, 3);

/**
 * Today's new words, in id order. Pass 1 skips a word that starts like one
 * met today or yesterday (or already picked), and a part of speech today
 * already has; pass 2 drops the part-of-speech rule. There is no pass 3: a
 * look-alike waits a day or two rather than landing next to its partner.
 */
export function pickNewWords<T extends Pick<PlanCard, "id" | "front" | "back" | "senses">>(
  candidates: T[],
  today: Pick<PlanCard, "back" | "senses">[],
  recent: Pick<PlanCard, "front">[],
  slots: number,
): T[] {
  const picked: T[] = [];
  const lookAlike = (card: T) => [...recent, ...picked].some((word) => prefixOf(word) === prefixOf(card));
  const posTaken = (card: T) => {
    const pos = posOf(card);
    return pos !== null && [...today, ...picked].some((word) => posOf(word) === pos);
  };
  for (const byPos of [true, false]) {
    for (const card of candidates) {
      if (picked.length >= slots) break;
      if (picked.includes(card) || lookAlike(card) || (byPos && posTaken(card))) continue;
      picked.push(card);
    }
  }
  return picked.sort((a, b) => a.id - b.id);
}

/**
 * Whether a scheduled answer may be written: a word that was never started
 * and never introduced opens a new slot, and today's slots may be used up.
 */
export const newWordAllowed = (started: boolean, introducedOn: string | null, newToday: number) =>
  started || introducedOn !== null || newToday < NEW_PER_DAY;

/**
 * A new word's learning write that comes in again once the word is already
 * written today (a retry after a lost response). Applied twice, it would
 * count as the word's first review and skip a rung; it is answered as it
 * stands instead. On a later day 'learn' on a started card is a review.
 */
export const repeatedLearnWrite = (phase: string | undefined, started: boolean, introducedOn: string | null, day: string) =>
  phase === "learn" && started && introducedOn === day;

/**
 * The day a scheduled answer stamps as the word's introduction: today for a
 * word never started. A word already started without a stamp was answered
 * on an older build of the API; it keeps the day of its first answer, so
 * its next review doesn't take one of that day's new-word slots.
 */
export const introductionDay = (started: boolean, firstAnswerAt: Date | string | null, now: Date): string =>
  learnerDay(started && firstAnswerAt ? new Date(firstAnswerAt) : now);

const time = (value: Date | string | null) => (value === null ? Number.POSITIVE_INFINITY : new Date(value).getTime());

/** The plan from rows already read: the personal deck's cards (any order) and the recently introduced words. */
export function planFrom<T extends PlanCard>({
  day,
  now,
  cards,
  introduced,
  exercisesToday = 0,
}: {
  day: string;
  now: Date;
  cards: T[];
  introduced: IntroducedWord[];
  exercisesToday?: number;
}): DailyPlan<T> {
  const byId = [...cards].sort((a, b) => a.id - b.id);
  const started = byId.filter(isStarted);
  const due = started
    .filter((card) => time(card.due_date) <= now.getTime())
    .sort((a, b) => time(a.due_date) - time(b.due_date) || a.id - b.id);
  const shaky = started.filter((card) => card.repetitions <= 1 && card.introduced_on !== null && card.introduced_on < day).length;
  const todays = introduced.filter((word) => word.introduced_on === day);
  const newToday = todays.length;
  const paused = due.length > PAUSE_IF_REVIEWS_DUE ? "reviews" : shaky > PAUSE_IF_SHAKY ? "shaky" : null;
  const slots = paused ? 0 : Math.max(0, NEW_PER_DAY - newToday);
  const candidates = byId.filter((card) => card.repetitions === 0 && card.interval === 0);
  const fresh = pickNewWords(candidates, todays, introduced, slots);
  const queued = candidates.length - fresh.length;
  const tomorrowStart = dayStart(day, 2).getTime();
  return {
    day,
    cap: NEW_PER_DAY,
    newToday,
    reviewsDue: due.length,
    shaky,
    paused,
    newIds: fresh.map((card) => card.id),
    queued,
    exercisesToday,
    exercisable: started.length,
    tomorrow: {
      reviews: started.filter((card) => time(card.due_date) < tomorrowStart).length,
      new: Math.min(NEW_PER_DAY, queued),
    },
    reviews: due.slice(0, REVIEW_LIMIT),
    fresh,
  };
}

/** The plan without its cards, as the API and the reminders show it. */
export function planCounts({ reviews: _reviews, fresh: _fresh, ...counts }: DailyPlan<PlanCard>): PlanCounts {
  return counts;
}

type Db = Pick<Pool, "query">;

/** Words this user introduced on a learner day, in every deck. */
export async function newWordsOn(db: Db, userId: number, day: string): Promise<number> {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM cards c JOIN decks d ON d.id = c.deck_id
     WHERE d.user_id = $1 AND c.introduced_on = $2::date`,
    [userId, day],
  );
  return rows[0]?.n ?? 0;
}

/**
 * Today's plan for the personal deck. Read-only. The caller has checked that
 * the deck is this user's.
 */
export async function dailyPlan(db: Db, userId: number, personalDeckId: number, now: Date = new Date()) {
  const day = learnerDay(now);
  const [cards, introduced, exercises] = await Promise.all([
    db.query(`SELECT * FROM cards WHERE deck_id = $1 ORDER BY id`, [personalDeckId]),
    db.query(
      `SELECT c.id, c.front, c.back, c.senses, c.introduced_on
       FROM cards c JOIN decks d ON d.id = c.deck_id
       WHERE d.user_id = $1 AND c.introduced_on BETWEEN $2::date - 1 AND $2::date`,
      [userId, day],
    ),
    // Exercise answers today: the plan's second step is done after a few.
    db.query(
      `SELECT count(*)::int AS n FROM review_log r JOIN cards c ON c.id = r.card_id
       WHERE r.user_id = $1 AND c.deck_id = $2 AND NOT r.scheduled AND r.phase = 'exercise' AND r.created_at >= $3`,
      [userId, personalDeckId, dayStart(day, 0)],
    ),
  ]);
  return planFrom<PlanCard>({
    day,
    now,
    cards: cards.rows,
    introduced: introduced.rows,
    exercisesToday: exercises.rows[0]?.n ?? 0,
  });
}

/** Rough minutes for a round: a review about 12 s, a new word with its steps about 80 s. */
export const planMinutes = (reviews: number, fresh: number) => Math.ceil((reviews * 12 + fresh * 80) / 60);

/**
 * The evening reminder, or null when there is nothing worth a buzz. Own
 * words first (the plan's reviews and today's new words), then the course's
 * reviews, then a nudge towards exercises on a day with no cards at all.
 */
export function pushLine({
  deckId,
  plan,
  course,
  exercisesToday,
  started,
}: {
  deckId: number | null;
  plan: Pick<PlanCounts, "reviewsDue" | "newIds"> | null;
  course: number;
  exercisesToday: number;
  started: number;
}): { body: string; url: string } | null {
  const reviews = plan?.reviewsDue ?? 0;
  const fresh = plan?.newIds.length ?? 0;
  const minutes = planMinutes(reviews, fresh);
  if (deckId !== null && (reviews > 0 || fresh > 0)) {
    const url = `/decks/${deckId}/flashcards`;
    if (fresh > 0 && reviews > 0) return { body: `Bugün ${fresh} yeni kelime ve ${reviews} tekrar seni bekliyor · yaklaşık ${minutes} dk. 🃏`, url };
    if (reviews > 0) return { body: `Bugün ${reviews} kelime seni soruyor · yaklaşık ${minutes} dk. 🔁`, url };
    return { body: `Bugün ${fresh} yeni kelimeyle tanışacaksın · yaklaşık ${minutes} dk. 🌱`, url };
  }
  if (course > 0) return { body: `Kursta ${course} tekrar seni bekliyor. 📚`, url: "/kurs" };
  if (deckId !== null && started > 0 && exercisesToday === 0) {
    return { body: "Bugün kart yok. 5 dakikalık bir egzersiz? ✍️", url: `/decks/${deckId}/flashcards?mode=exercises` };
  }
  return null;
}
