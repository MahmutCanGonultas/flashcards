import type { Card } from "../types";
import { hasStarted } from "./path";
import { EXERCISE_LIMIT, TWO_EACH_BELOW } from "./practice";

/**
 * What a finished round says: its title, one line on how it went, the words
 * worth another go before tomorrow, and where the big button goes. After
 * the day's cards that is the exercises, aimed at the weak words: the
 * cards say when a word comes back, the exercises are where it gets used
 * in the days between.
 */

export type RoundMode = "due" | "all" | "drill" | "exercises";

/** A card's first answer in the round (a new word's: its one write), and what the schedule made of it. */
export type RoundResult = { grade: 1 | 3 | 4 | 5; graded: boolean; before: Card; after: Card | null; failed?: boolean };

/** About 25 s an exercise. */
const EXERCISE_SECONDS = 25;

/** Asks in a round of exercises over `words` met words: two each below five words, ten at most. */
export const exerciseSteps = (words: number): number => (words < TWO_EACH_BELOW ? 2 * words : Math.min(EXERCISE_LIMIT, words));

/**
 * The line under a finished round of cards: the new words learned, then how
 * the reviews went — each part only when there was one.
 */
export function roundLine(cards: Card[], results: Record<number, RoundResult>): string {
  const fresh = new Set(cards.filter((c) => !hasStarted(c)).map((c) => c.id));
  const firsts = Object.values(results);
  const reviews = firsts.filter((r) => !fresh.has(r.before.id));
  const learned = firsts.filter((r) => fresh.has(r.before.id) && r.grade >= 3).length;
  const missed = (list: RoundResult[]) => list.filter((r) => r.grade === 1).length;
  const missedLine = (n: number) => `${n} kelime kaçtı. Burada yeniden sordum; yarın yine gelecek.`;
  const parts: string[] = [];
  if (learned > 0) parts.push(`${learned} yeni kelime öğrendin; yarın yine soracağım.`);
  if (reviews.length > 0) {
    parts.push(
      missed(reviews) > 0
        ? missedLine(missed(reviews))
        : reviews.every((r) => r.grade >= 4)
          ? "Hepsini bildin. Bunlar artık daha seyrek gelecek."
          : "Bildin ama zorlandıkların var; onları biraz daha sık getireceğim.",
    );
  }
  return parts.length > 0 ? parts.join(" ") : missedLine(missed(firsts));
}

/**
 * The words worth another go today, in the round's order: a review missed
 * or hard at its first answer, a new word that needed a second try or
 * didn't hold. Ungraded answers (a filler, a flip) don't count.
 */
export const weakWords = (cards: Card[], results: Record<number, RoundResult>): Card[] =>
  cards.filter((card) => {
    const result = results[card.id];
    return result !== undefined && result.graded && result.grade <= 3;
  });

export type SummaryView = {
  title: string;
  line: string;
  /** Shown under "Biraz daha çalışalım", each with its meaning and "yarın yine". */
  weak: Card[];
  primary: { label: string; to: string };
  /** "Sonra": home, when the primary button hands off to the exercises. */
  secondary: { label: string; to: string } | null;
};

export function summaryView({
  cards,
  results,
  mode,
  deckId,
  exitTo,
  skipped = new Set(),
  typed = { n: 0, right: 0 },
  pool = 0,
}: {
  cards: Card[];
  results: Record<number, RoundResult>;
  mode: RoundMode;
  deckId: number | string;
  /** Where "Devam" goes when there is no hand-off. */
  exitTo: string;
  skipped?: ReadonlySet<number>;
  /** The exercises' typed first tries, and how many were right. */
  typed?: { n: number; right: number };
  /** Words met by the end of the round: what the exercises can ask. */
  pool?: number;
}): SummaryView {
  const firsts = Object.values(results);
  // Passed and never answered: nothing was written, so they are still waiting.
  const passed = cards.filter((c) => skipped.has(c.id) && !results[c.id]).length;
  const practice = firsts.length > 0 && firsts.every((r) => !r.graded);
  const answered =
    firsts.length === 0
      ? "Bu tur hiçbirini işaretlemedin; takvime dokunmadım."
      : mode === "exercises"
        ? typed.n > 0
          ? `Yazarak ${typed.right}/${typed.n} doğru. Egzersiz kelimeyi kullanmayı öğretir; ne zaman soracağımı kartlar belirler.`
          : "Güzel iş! Egzersizler takvime dokunmaz; ne zaman soracağımı kartlar belirler."
        : practice
          ? "Güzel alıştırma. Takvime dokunmadım; asıl tekrar sırası gelince."
          : roundLine(cards, results);
  const line = passed > 0 && firsts.length > 0 ? `${answered} Geçtiğin ${passed} kelime sırada bekliyor.` : passed > 0 ? `${answered} Geçtiğin kelimeler sırada bekliyor.` : answered;
  const title = mode === "drill" ? "Alıştırma bitti!" : mode === "exercises" ? "Egzersiz bitti!" : "Oturum tamam!";
  const done = { title, line, weak: [], primary: { label: "Devam", to: exitTo }, secondary: null };

  if (mode !== "due" || firsts.length === 0 || pool === 0) return done;

  // The day's cards are done: the exercises next, starting with the weak words, else today's new ones.
  const weak = weakWords(cards, results);
  const today = cards.filter((card) => !hasStarted(card) && results[card.id]?.graded);
  const focus = (weak.length > 0 ? weak : today).map((card) => card.id);
  const minutes = Math.max(1, Math.ceil((exerciseSteps(pool) * EXERCISE_SECONDS) / 60));
  return {
    title,
    line,
    weak,
    primary: {
      label: `Egzersizle pekiştir · ~${minutes} dk`,
      to: `/decks/${deckId}/flashcards?mode=exercises${focus.length > 0 ? `&focus=${focus.join(",")}` : ""}`,
    },
    secondary: { label: "Sonra", to: "/kartlar" },
  };
}
