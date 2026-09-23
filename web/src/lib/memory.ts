import type { Card } from "../types";
import { hasStarted, isDue } from "./path";

/**
 * How firmly a word is held, in four stages the learner can see:
 *
 *   new        never asked yet
 *   learning   asked, but not yet recalled again on a later day
 *   young      recalled across days; the gaps are still under three weeks
 *   mature     the schedule has pushed it three weeks or more out
 *
 * The stage decides how a word is asked (practice.ts) — recognised while
 * it is learning, produced once it holds — and how it is drawn: four bars,
 * lit up to its strength.
 */
export type Stage = "new" | "learning" | "young" | "mature";

export const STAGES: Stage[] = ["new", "learning", "young", "mature"];
export const STAGE_LABEL: Record<Stage, string> = {
  new: "Yeni",
  learning: "Öğreniyor",
  young: "Pekişiyor",
  mature: "Kalıcı",
};

/** From this gap on a word counts as held for good. */
export const MATURE_DAYS = 21;
/** Missed this many times, a word is a leech: it gets a sentence and extra support. */
export const LEECH_LAPSES = 3;

export function stageOf(card: Pick<Card, "repetitions" | "interval">): Stage {
  if (!hasStarted(card as Card)) return "new";
  if (card.repetitions <= 1) return "learning";
  return card.interval >= MATURE_DAYS ? "mature" : "young";
}

/** Bars lit, out of four. */
export function strengthOf(card: Pick<Card, "repetitions" | "interval">): number {
  const stage = stageOf(card);
  if (stage === "new") return 0;
  if (stage === "learning") return 1;
  if (stage === "young") return card.interval >= 7 ? 3 : 2;
  return 4;
}

export const isLeech = (card: Pick<Card, "lapses">): boolean => (card.lapses ?? 0) >= LEECH_LAPSES;

const DAY = 86_400_000;
const startOfDay = (t: number): number => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
/** Whole calendar days from `now` to `t`: tomorrow is 1 whatever the hour. */
const daysUntil = (t: number, now: number): number => Math.round((startOfDay(t) - startOfDay(now)) / DAY);

export type Tone = "due" | "soon" | "later";

/** Waiting at `now`; the same test as path.ts's isDue, with the clock passed in. */
export const isDueAt = (card: Pick<Card, "due_date">, now = Date.now()): boolean => new Date(card.due_date).getTime() <= now;

/** When the word comes back, in words, with the ink that means now / soon / later. */
export function nextReview(card: Card, now = Date.now()): { text: string; tone: Tone } {
  if (isDueAt(card, now)) return { text: hasStarted(card) ? "Şimdi" : "Yeni", tone: "due" };
  const due = new Date(card.due_date).getTime();
  const minutes = Math.ceil((due - now) / 60_000);
  if (minutes < 60) return { text: `${minutes} dk sonra`, tone: "soon" };
  const days = daysUntil(due, now);
  if (days <= 0) return { text: "Bugün", tone: "soon" };
  if (days === 1) return { text: "Yarın", tone: "soon" };
  if (days < 30) return { text: `${days} gün sonra`, tone: "later" };
  const months = Math.round(days / 30);
  return { text: months <= 1 ? "1 ay sonra" : `${months} ay sonra`, tone: "later" };
}

/** Waiting words first, then in the order they come back. */
export function byNextReview(cards: Card[]): Card[] {
  return [...cards].sort(
    (a, b) => Number(isDue(b)) - Number(isDue(a)) || new Date(a.due_date).getTime() - new Date(b.due_date).getTime() || b.id - a.id,
  );
}

export function stageCounts(cards: Card[]): Record<Stage, number> {
  const counts: Record<Stage, number> = { new: 0, learning: 0, young: 0, mature: 0 };
  for (const card of cards) counts[stageOf(card)] += 1;
  return counts;
}

const WEEKDAY = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export type ForecastDay = { label: string; count: number; today: boolean };

/**
 * How many words come back on each of the next `days` days. Today holds
 * everything already waiting as well, so the first bar is the day's work.
 */
export function forecast(cards: Card[], days = 7, now = Date.now()): ForecastDay[] {
  const counts = Array.from({ length: days }, () => 0);
  for (const card of cards) {
    const offset = Math.max(0, daysUntil(new Date(card.due_date).getTime(), now));
    if (offset < days) counts[offset] += 1;
  }
  return counts.map((count, i) => ({
    label: i === 0 ? "Bugün" : i === 1 ? "Yarın" : WEEKDAY[new Date(startOfDay(now) + i * DAY + 12 * 3_600_000).getDay()],
    count,
    today: i === 0,
  }));
}
