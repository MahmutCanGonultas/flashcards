import { describe, expect, it } from "vitest";
import { forecast, isLeech, nextReview, stageCounts, stageOf, strengthOf } from "./memory";
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

  it("says now, or new, for a word that is waiting", () => {
    expect(nextReview(card(at(0, 9)), NOW)).toEqual({ text: "Şimdi", tone: "due" });
    expect(nextReview(card(at(0, 9), { repetitions: 0, interval: 0 }), NOW)).toEqual({ text: "Yeni", tone: "due" });
  });

  it("counts minutes for a miss coming back, and calendar days after that", () => {
    expect(nextReview(card(at(0, 12, 10)), NOW)).toEqual({ text: "10 dk sonra", tone: "soon" });
    expect(nextReview(card(at(0, 20)), NOW)).toEqual({ text: "Bugün", tone: "soon" });
    expect(nextReview(card(at(1, 0)), NOW)).toEqual({ text: "Yarın", tone: "soon" });
    expect(nextReview(card(at(6, 0)), NOW)).toEqual({ text: "6 gün sonra", tone: "later" });
    expect(nextReview(card(at(62, 0)), NOW)).toEqual({ text: "2 ay sonra", tone: "later" });
  });
});

describe("stageCounts / forecast", () => {
  const cards = [
    makeCard({ id: 1, front: "a", due_date: at(-2, 9) }),
    makeCard({ id: 2, front: "b", repetitions: 1, interval: 1, due_date: at(0, 12, 10) }),
    makeCard({ id: 3, front: "c", repetitions: 2, interval: 6, due_date: at(1, 0) }),
    makeCard({ id: 4, front: "d", repetitions: 5, interval: 30, due_date: at(6, 0) }),
    makeCard({ id: 5, front: "e", repetitions: 5, interval: 60, due_date: at(40, 0) }),
  ];

  it("counts words per stage", () => {
    expect(stageCounts(cards)).toEqual({ new: 1, learning: 1, young: 1, mature: 2 });
  });

  it("folds everything overdue into today and leaves out what is beyond the week", () => {
    const week = forecast(cards, 7, NOW);
    expect(week.map((d) => d.count)).toEqual([2, 1, 0, 0, 0, 0, 1]);
    expect(week[0]).toMatchObject({ label: "Bugün", today: true });
    expect(week[1].label).toBe("Yarın");
    expect(week[2].label).toBe("Cum");
  });
});
