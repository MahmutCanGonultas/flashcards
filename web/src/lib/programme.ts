import type { Card } from "../types";
import { hasStarted } from "./path";

/**
 * The word programme: about 500 words, ten a week, each week a theme. A
 * card belongs to week N when its tag reads "Hafta N · Theme" (the importer
 * writes it). The server meets the new words 3, 3, 2, 2 from Monday
 * (daily.service.ts); this file is what the week looks like to the learner:
 * which day does what, which words are this week's, and which older ones
 * Sunday's look back takes.
 */

/** "Hafta 3 · Para" → 3; a word of the learner's own has no week. */
export const weekOf = (card: Pick<Card, "tag">): number | null => {
  const match = card.tag?.match(/^Hafta (\d+)/);
  return match ? Number(match[1]) : null;
};

/** "Hafta 3 · Para" → "Para". */
export const themeOf = (card: Pick<Card, "tag">): string | null => card.tag?.match(/^Hafta \d+\s*·\s*(.+)$/)?.[1]?.trim() ?? null;

/** The words of one programme week, in the order they come. */
export const wordsOfWeek = (cards: Card[], week: number): Card[] => cards.filter((card) => weekOf(card) === week).sort((a, b) => a.id - b.id);

export type DayTask = "new" | "reading" | "translation" | "test";

/** What each day of the week is for, Monday first. Cards and exercises are every day. */
export const WEEK_DAYS: { short: string; task: DayTask; label: string }[] = [
  { short: "Pzt", task: "new", label: "3 yeni kelime" },
  { short: "Sal", task: "new", label: "3 yeni kelime" },
  { short: "Çar", task: "new", label: "2 yeni kelime" },
  { short: "Per", task: "new", label: "2 yeni kelime" },
  { short: "Cum", task: "reading", label: "Okuma" },
  { short: "Cmt", task: "translation", label: "Çeviri" },
  { short: "Paz", task: "test", label: "Test ve büyük tekrar" },
];

/** Words in Sunday's look back. */
export const LOOK_BACK = 20;

/**
 * Sunday's look back: words from earlier weeks, the ones not seen for the
 * longest first, so a word from three weeks ago (or three months) still
 * comes round between its own reviews.
 */
export function lookBack(cards: Card[], week: number, limit = LOOK_BACK): Card[] {
  const seen = (card: Card) => (card.reviewed_at ? new Date(card.reviewed_at).getTime() : 0);
  return cards
    .filter((card) => hasStarted(card) && (weekOf(card) ?? Number.POSITIVE_INFINITY) < week)
    .sort((a, b) => seen(a) - seen(b) || a.id - b.id)
    .slice(0, limit);
}

/** Links to a round over chosen words only: the week's test (typed from Turkish) or a look back (flip cards). */
export const testHref = (deckId: number | string, ids: number[]) => `/decks/${deckId}/flashcards?mode=exercises&focus=${ids.join(",")}&only=1&test=1`;
export const lookBackHref = (deckId: number | string, ids: number[]) => `/decks/${deckId}/flashcards?mode=all&focus=${ids.join(",")}&only=1`;
