import { describe, expect, it } from "vitest";
import { byNextReview, forecast, isLeech, nextReview, stageCounts, stageOf, strengthOf } from "./memory";
import { makeCard } from "./testCards";

// 23 Sept 2026, 12:00 in the learner's own time zone.
const NOW = new Date(2026, 8, 23, 12, 0).getTime();
const at = (days: number, hours = 0, minutes = 0) => new Date(2026, 8, 23 + days, hours, minutes).toISOString();

describe("stageOf / strengthOf", () => {
  it("walks a word from new to mature", () => {
    expect(stageOf({ repetitions: 0, interval: 0 })).toBe("new");
    expect(stageOf({ repetitions: 0, interval: 1 })).toBe("learning");
    expect(stageOf({ repetitions: 1, interval: 1 })).toBe("learning");
    expect(stageOf({ repetitions: 2, interval: 6 })).toBe("young");
    expect(stageOf({ repetitions: 4, interval: 21 })).toBe("mature");
    expect([0, 1, 2, 3, 4].map((i) => strengthOf([{ repetitions: 0, interval: 0 }, { repetitions: 1, interval: 1 }, { repetitions: 2, interval: 6 }, { repetitions: 3, interval: 15 }, { repetitions: 5, interval: 40 }][i]))).toEqual([0, 1, 2, 3, 4]);
  });

  it("calls a word missed three times a leech", () => {
    expect(isLeech({ lapses: 2 })).toBe(false);
    expect(isLeech({ lapses: 3 })).toBe(true);
    expect(isLeech({})).toBe(false);
  });
});

describe("nextReview", () => {
  const card = (due: string, extra = {}) => makeCard({ id: 1, front: "concern", due_date: due, repetitions: 1, interval: 1, ...extra });

  it("says now for a word that is waiting", () => {
    expect(nextReview(card(at(0, 9)), NOW)).toEqual({ text: "Şimdi", tone: "due" });
  });

  it("puts a word never met in the queue, whatever its date", () => {
    expect(nextReview(card(at(0, 9), { repetitions: 0, interval: 0 }), NOW)).toEqual({ text: "Sırada", tone: "soon" });
    expect(nextReview(card(at(3, 9), { repetitions: 0, interval: 0 }), NOW)).toEqual({ text: "Sırada", tone: "soon" });
  });

  it("counts minutes for a miss coming back, and learner days after that", () => {
    expect(nextReview(card(at(0, 12, 10)), NOW)).toEqual({ text: "10 dk sonra", tone: "soon" });
    expect(nextReview(card(at(0, 20)), NOW)).toEqual({ text: "Bugün", tone: "soon" });
    // Before 04:00 is still the evening's day.
    expect(nextReview(card(at(1, 2)), NOW)).toEqual({ text: "Bugün", tone: "soon" });
    expect(nextReview(card(at(1, 4)), NOW)).toEqual({ text: "Yarın", tone: "soon" });
    expect(nextReview(card(at(6, 4)), NOW)).toEqual({ text: "6 gün sonra", tone: "later" });
    expect(nextReview(card(at(62, 4)), NOW)).toEqual({ text: "2 ay sonra", tone: "later" });
  });

  it("at 00:30 calls a word due at 04:00 that morning tomorrow's", () => {
    const halfPastMidnight = new Date(2026, 8, 25, 0, 30).getTime();
    expect(nextReview(card(new Date(2026, 8, 25, 4, 0).toISOString()), halfPastMidnight)).toEqual({ text: "Yarın", tone: "soon" });
  });
});

describe("byNextReview", () => {
  it("puts the waiting words first, the queue next in id order, then the rest by when they come back", () => {
    const cards = [
      makeCard({ id: 1, front: "later", repetitions: 2, interval: 3, due_date: at(3, 4) }),
      makeCard({ id: 2, front: "queued-b", due_date: at(-3, 9) }),
      makeCard({ id: 3, front: "due", repetitions: 1, interval: 1, due_date: at(0, 4) }),
      makeCard({ id: 4, front: "soon", repetitions: 1, interval: 1, due_date: at(1, 4) }),
      makeCard({ id: 5, front: "queued-a", due_date: at(-5, 9) }),
    ];
    expect(byNextReview(cards, NOW).map((c) => c.id)).toEqual([3, 2, 5, 4, 1]);
  });
});

describe("stageCounts / forecast", () => {
  const cards = [
    makeCard({ id: 1, front: "a", due_date: at(-2, 9) }),
    makeCard({ id: 2, front: "b", repetitions: 1, interval: 1, due_date: at(0, 12, 10) }),
    makeCard({ id: 3, front: "c", repetitions: 2, interval: 6, due_date: at(1, 4) }),
    makeCard({ id: 4, front: "d", repetitions: 5, interval: 30, due_date: at(6, 4) }),
    makeCard({ id: 5, front: "e", repetitions: 5, interval: 60, due_date: at(40, 4) }),
    makeCard({ id: 6, front: "f", repetitions: 1, interval: 1, due_date: at(-1, 4) }),
  ];

  it("counts words per stage", () => {
    expect(stageCounts(cards)).toEqual({ new: 1, learning: 2, young: 1, mature: 2 });
  });

  it("folds everything overdue into today, leaves out the queue and what is beyond the week", () => {
    const week = forecast(cards, 7, NOW);
    expect(week.map((d) => d.count)).toEqual([2, 1, 0, 0, 0, 0, 1]);
    expect(week[0]).toMatchObject({ label: "Bugün", today: true });
    expect(week[1].label).toBe("Yarın");
    expect(week[2].label).toBe("Cum");
  });

  it("adds today's new words to today's bar", () => {
    expect(forecast(cards, 7, NOW, 3)[0].count).toBe(5);
  });

  it("counts a word due at 01:00 as the evening's, and names the days after it from the learner day", () => {
    const late = new Date(2026, 8, 24, 0, 30).getTime();
    const week = forecast([makeCard({ id: 7, front: "g", repetitions: 1, interval: 1, due_date: new Date(2026, 8, 24, 1, 0).toISOString() })], 7, late);
    expect(week[0].count).toBe(1);
    expect(week[2].label).toBe("Cum");
  });
});
