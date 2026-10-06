import { describe, expect, it } from "vitest";
import { lookBack, lookBackHref, testHref, themeOf, weekOf, wordsOfWeek } from "./programme";
import { makeCard } from "./testCards";

const card = (id: number, week: number | null, extra: Parameters<typeof makeCard>[0] extends infer T ? Partial<T> : never = {}) =>
  makeCard({ id, front: `w${id}`, tag: week === null ? null : `Hafta ${week} · Para`, ...extra });

describe("weeks", () => {
  it("reads the week and the theme from the tag", () => {
    expect(weekOf(card(1, 3))).toBe(3);
    expect(themeOf(card(1, 3))).toBe("Para");
    expect(weekOf(card(1, null))).toBeNull();
    expect(weekOf(makeCard({ id: 2, front: "x", tag: "Food" }))).toBeNull();
  });

  it("lists a week's words in their order", () => {
    const cards = [card(5, 2), card(3, 2), card(4, 1)];
    expect(wordsOfWeek(cards, 2).map((c) => c.id)).toEqual([3, 5]);
  });
});

describe("lookBack", () => {
  const met = { repetitions: 3, interval: 7 };
  it("takes earlier weeks' words, the ones not seen for the longest first", () => {
    const cards = [
      card(1, 1, { ...met, reviewed_at: "2026-09-20T10:00:00Z" }),
      card(2, 1, { ...met, reviewed_at: "2026-09-01T10:00:00Z" }),
      card(3, 2, { ...met, reviewed_at: "2026-09-10T10:00:00Z" }),
      card(4, 3, { ...met, reviewed_at: "2026-08-01T10:00:00Z" }), // this week: not a look back
      card(5, 1), // never met
    ];
    expect(lookBack(cards, 3).map((c) => c.id)).toEqual([2, 3, 1]);
    expect(lookBack(cards, 3, 2).map((c) => c.id)).toEqual([2, 3]);
    expect(lookBack(cards, 1)).toEqual([]);
  });
});

describe("links", () => {
  it("points a round at the chosen words only", () => {
    expect(testHref(49, [1, 2])).toBe("/decks/49/flashcards?mode=exercises&focus=1,2&only=1&test=1");
    expect(lookBackHref(49, [3])).toBe("/decks/49/flashcards?mode=all&focus=3&only=1");
  });
});
