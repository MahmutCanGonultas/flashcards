import type { Card, Dialogue, UnitRecord } from "../types";

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

export type UnitState = "locked" | "open" | "passed";

export type Unit = {
  /** 1-based position along the path. */
  index: number;
  /** The units row, when the deck has one; null for decks grouped by tag only. */
  id: number | null;
  title: string;
  level: string | null;
  dialogue: Dialogue | null;
  lessons: Lesson[];
  state: UnitState;
  /** Every lesson done — the dialogue and the test are open from here. */
  lessonsDone: boolean;
  bestScore: number | null;
};

/**
 * A card counts as started once it has been through review at all — a failed
 * grade resets `repetitions` to 0 but always leaves an interval behind, so
 * both fields have to be checked.
 */
export const hasStarted = (card: Card): boolean => card.repetitions > 0 || card.interval > 0;

export const isDue = (card: Card): boolean => new Date(card.due_date).getTime() <= Date.now();

type Bucket = {
  id: number | null;
  title: string;
  level: string | null;
  dialogue: Dialogue | null;
  record: UnitRecord | null;
  cards: Card[];
};

/**
 * Cards grouped into units. With unit records the grouping is by `unit_id`
 * in path order; without them (a deck that was never given units) it falls
 * back to consecutive runs of the same tag.
 */
function bucketCards(cards: Card[], records: UnitRecord[]): Bucket[] {
  const pathCards = cards.filter((card) => card.lesson !== null);

  if (records.length > 0 && pathCards.some((card) => card.unit_id !== null)) {
    const buckets = [...records]
      .sort((a, b) => a.position - b.position)
      .map<Bucket>((record) => ({
        id: record.id,
        title: record.title,
        level: record.level,
        dialogue: record.dialogue,
        record,
        cards: [],
      }));
    const byId = new Map(buckets.map((bucket) => [bucket.id, bucket]));
    for (const card of pathCards) {
      byId.get(card.unit_id)?.cards.push(card);
    }
    return buckets.filter((bucket) => bucket.cards.length > 0);
  }

  const sorted = [...pathCards].sort((a, b) => a.lesson! - b.lesson!);
  const buckets: Bucket[] = [];
  for (const card of sorted) {
    const title = card.tag ?? "";
    const last = buckets[buckets.length - 1];
    if (last && last.title === title) last.cards.push(card);
    else buckets.push({ id: null, title, level: null, dialogue: null, record: null, cards: [card] });
  }
  return buckets;
}

/**
 * Turns a deck's cards into the path.
 *
 * Two gates, one inside the other. Lessons unlock in order — the first lesson
 * with unfinished words is the current one and everything after it is locked.
 * Units unlock by passing the previous unit's test; a unit the learner had
 * already started before tests existed stays open, so nothing they earned is
 * taken away.
 */
export function buildPath(cards: Card[], units: UnitRecord[] = []): Unit[] {
  const buckets = bucketCards(cards, units);
  if (buckets.length === 0) return [];

  // Unit gates first, since a lesson can't be current inside a locked unit.
  const unitStates: UnitState[] = [];
  buckets.forEach((bucket, i) => {
    const passed = bucket.record?.passed ?? false;
    const previousPassed = i === 0 || unitStates[i - 1] === "passed";
    const grandfathered = bucket.cards.some(hasStarted);
    // Tag-only decks have no tests, so every unit is simply open.
    const open = bucket.record === null || previousPassed || grandfathered;
    unitStates.push(passed ? "passed" : open ? "open" : "locked");
  });

  let currentFound = false;
  const result: Unit[] = buckets.map((bucket, i) => {
    const byLesson = new Map<number, Card[]>();
    for (const card of bucket.cards) {
      const group = byLesson.get(card.lesson!);
      if (group) group.push(card);
      else byLesson.set(card.lesson!, [card]);
    }
    const unitOpen = unitStates[i] !== "locked";

    const lessons: Lesson[] = [...byLesson.keys()]
      .sort((a, b) => a - b)
      .map((number) => {
        const lessonCards = byLesson.get(number)!;
        const learned = lessonCards.filter(hasStarted).length;
        let state: LessonState = "locked";
        if (learned === lessonCards.length) state = "done";
        else if (unitOpen && !currentFound) {
          state = "current";
          currentFound = true;
        }
        return {
          number,
          unitTitle: bucket.title,
          cards: lessonCards,
          state,
          learned,
          due: lessonCards.filter(isDue).length,
        };
      });

    return {
      index: i + 1,
      id: bucket.id,
      title: bucket.title,
      level: bucket.level,
      dialogue: bucket.dialogue,
      lessons,
      state: unitStates[i],
      lessonsDone: lessons.every((lesson) => lesson.state === "done"),
      bestScore: bucket.record?.best_score ?? null,
    };
  });

  return result;
}

export type PathStats = {
  totalLessons: number;
  doneLessons: number;
  currentLesson: number | null;
  wordsLearned: number;
  totalWords: number;
  dueNow: number;
  /** The unit whose test is the next gate, if its lessons are all done. */
  testReady: Unit | null;
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
    testReady:
      units.find((u) => u.id !== null && u.state === "open" && u.lessonsDone) ?? null,
  };
}
