import type { Card } from "../types";

export type LessonState = "done" | "current" | "locked";

export type Lesson = {
  number: number;
  unitTitle: string;
  cards: Card[];
  state: LessonState;
  /** Words in this lesson that have been studied at least once. */
  learned: number;
  /** Words in this lesson currently due for review. */
  due: number;
};

export type Unit = {
  index: number;
  title: string;
  lessons: Lesson[];
};

/**
 * A card counts as started once it has been through review at all — a failed
 * grade resets `repetitions` to 0 but always leaves an interval behind, so
 * both fields have to be checked.
 */
export const hasStarted = (card: Card): boolean => card.repetitions > 0 || card.interval > 0;

export const isDue = (card: Card): boolean => new Date(card.due_date).getTime() <= Date.now();

/**
 * Turns a deck's cards into path units. Lessons unlock in order — the first
 * lesson with unfinished words is the current one and everything after it is
 * locked — so progress is paced by actually doing the work rather than by the
 * calendar. Returns an empty array for decks that aren't organised as a path.
 */
export function buildPath(cards: Card[]): Unit[] {
  const byLesson = new Map<number, Card[]>();
  for (const card of cards) {
    if (card.lesson === null) continue;
    const group = byLesson.get(card.lesson);
    if (group) group.push(card);
    else byLesson.set(card.lesson, [card]);
  }
  if (byLesson.size === 0) return [];

  const numbers = [...byLesson.keys()].sort((a, b) => a - b);
  const firstUnfinished = numbers.find((n) => !byLesson.get(n)!.every(hasStarted));

  const lessons: Lesson[] = numbers.map((number) => {
    const lessonCards = byLesson.get(number)!;
    const learned = lessonCards.filter(hasStarted).length;
    const state: LessonState =
      learned === lessonCards.length
        ? "done"
        : number === firstUnfinished
          ? "current"
          : "locked";
    return {
      number,
      unitTitle: lessonCards[0].tag ?? "",
      cards: lessonCards,
      state,
      learned,
      due: lessonCards.filter(isDue).length,
    };
  });

  const units: Unit[] = [];
  for (const lesson of lessons) {
    const last = units[units.length - 1];
    if (last && last.title === lesson.unitTitle) last.lessons.push(lesson);
    else units.push({ index: units.length + 1, title: lesson.unitTitle, lessons: [lesson] });
  }
  return units;
}

export type PathStats = {
  totalLessons: number;
  doneLessons: number;
  currentLesson: number | null;
  wordsLearned: number;
  totalWords: number;
  dueNow: number;
};

export function pathStats(units: Unit[]): PathStats {
  const lessons = units.flatMap((u) => u.lessons);
  const cards = lessons.flatMap((l) => l.cards);
  return {
    totalLessons: lessons.length,
    doneLessons: lessons.filter((l) => l.state === "done").length,
    currentLesson: lessons.find((l) => l.state === "current")?.number ?? null,
    wordsLearned: cards.filter(hasStarted).length,
    totalWords: cards.length,
    dueNow: cards.filter(isDue).length,
  };
}
