import { describe, expect, it } from "vitest";
import { cardMinutes, exerciseMinutes, flipOrder, lessonOverBudget, planHref, planView, type DailyPlan } from "./plan";
import { makeCard } from "./testCards";

const plan = (overrides: Partial<DailyPlan> = {}): DailyPlan => ({
  day: "2026-09-24",
  cap: 3,
  newToday: 0,
  reviewsDue: 0,
  shaky: 0,
  paused: null,
  newIds: [],
  queued: 0,
  exercisesToday: 0,
  exercisable: 0,
  tomorrow: { reviews: 0, new: 0 },
  ...overrides,
});

describe("planView", () => {
  // Each state: the plan, then the headline, subline, primary and secondary button it reads as.
  const table: [string, DailyPlan, string, string, string, string][] = [
    [
      "new words and reviews",
      plan({ reviewsDue: 5, newIds: [1280, 1285, 1286], queued: 5, exercisable: 5 }),
      "8 kelime seni bekliyor",
      "3 yeni kelimeyle tanışacaksın, 5 kelimeyi hatırlayacaksın · yaklaşık 5 dk.",
      "Tekrar et · 8 → due",
      "Egzersiz yap → exercises",
    ],
    [
      "new words only (the first day)",
      plan({ newIds: [1280, 1285, 1286], queued: 5, tomorrow: { reviews: 0, new: 3 } }),
      "3 kelime seni bekliyor",
      "3 yeni kelimeyle tanışacaksın · yaklaşık 4 dk.",
      "Tekrar et · 3 → due",
      "Egzersiz yap → exercises",
    ],
    [
      "paused: too many reviews",
      plan({ reviewsDue: 25, paused: "reviews", queued: 4, exercisable: 30 }),
      "25 kelime seni bekliyor",
      "25 kelimeyi hatırlayacaksın · yaklaşık 5 dk.",
      "Tekrar et · 25 → due",
      "Egzersiz yap → exercises",
    ],
    [
      "cards done, exercises open",
      plan({ newToday: 3, queued: 5, exercisable: 3, exercisesToday: 2 }),
      "Kartlar tamam!",
      "Şimdi kelimeleri yazarak pekiştir · yaklaşık 3 dk.",
      "Egzersiz yap → exercises",
      "Kartları çalış → all",
    ],
    [
      "all done",
      plan({ newToday: 3, queued: 5, exercisable: 3, exercisesToday: 6, tomorrow: { reviews: 3, new: 3 } }),
      "Bugünlük tamam!",
      "Yarın 3 tekrar ve 3 yeni kelime var.",
      "Kartları çalış → all",
      "Egzersiz yap → exercises",
    ],
    [
      "personal queue empty",
      plan({ newToday: 0, queued: 0, exercisable: 8, exercisesToday: 7 }),
      "Bugünlük tamam!",
      "Yarın boş; istersen kartlara yine bak.",
      "Kartları çalış → all",
      "Egzersiz yap → exercises",
    ],
  ];

  it.each(table)("reads %s", (_, p, headline, subline, primary, secondary) => {
    const view = planView(p);
    expect(view.headline.text).toBe(headline);
    expect(view.headline.text).toContain(view.headline.accent);
    expect(view.subline).toBe(subline);
    expect(`${view.primary.label} → ${view.primary.mode}`).toBe(primary);
    expect(`${view.secondary.label} → ${view.secondary.mode}`).toBe(secondary);
  });

  it("counts the headline from the plan, not the queue: 3 new words, not 8", () => {
    expect(planView(plan({ newIds: [1, 2, 3], queued: 5 })).count).toBe(3);
  });

  it("says why no new word comes, or how many wait in the queue", () => {
    expect(planView(plan({ reviewsDue: 25, paused: "reviews", queued: 4 })).note).toBe("Bugün yeni kelime yok: önce tekrarları sağlamlaştıralım.");
    expect(planView(plan({ reviewsDue: 4, shaky: 10, paused: "shaky", queued: 4 })).note).toBe("Öğrenmekte olduğun kelimeler birikti; bugün onlara odaklanalım.");
    expect(planView(plan({ newIds: [1, 2, 3], queued: 5 })).note).toBe("Sırada 5 yeni kelime var · her gün en fazla 3'ü gelir.");
    expect(planView(plan({ newIds: [1, 2, 3] })).note).toBeNull();
  });

  it("points to the course only when the own list is out of new words and today has room", () => {
    expect(planView(plan({ reviewsDue: 4, exercisable: 8 })).toCourse).toBe(true);
    expect(planView(plan({ reviewsDue: 4, newToday: 3, exercisable: 8 })).toCourse).toBe(false);
    expect(planView(plan({ newIds: [1] })).toCourse).toBe(false);
    expect(planView(plan({ queued: 2, newToday: 3 })).toCourse).toBe(false);
    expect(planView(plan({ reviewsDue: 25, paused: "reviews" })).toCourse).toBe(false);
  });

  it("ticks the two steps off in the day's order", () => {
    const open = planView(plan({ reviewsDue: 5, newIds: [1, 2, 3], exercisable: 5 })).steps;
    expect(open).toEqual([
      { title: "Kartlar", detail: "3 yeni · 5 tekrar", minutes: 5, done: false },
      { title: "Egzersiz", detail: "kelimeleri yazarak pekiştir", minutes: 5, done: false },
    ]);
    // The first day: today's three words, once met, are what the exercises ask.
    expect(planView(plan({ newIds: [1, 2, 3], queued: 5 })).steps[1]).toEqual({ title: "Egzersiz", detail: "kelimeleri yazarak pekiştir", minutes: 3, done: false });
    expect(planView(plan({ exercisable: 3, exercisesToday: 6 })).steps).toEqual([
      { title: "Kartlar", detail: "tamam", minutes: null, done: true },
      { title: "Egzersiz", detail: "tamam", minutes: null, done: true },
    ]);
    // Six answers, or one per word when fewer are met.
    expect(planView(plan({ exercisable: 2, exercisesToday: 2 })).steps.map((s) => s.done)).toEqual([true, true]);
    expect(planView(plan({ exercisable: 9, exercisesToday: 5 })).steps.map((s) => s.done)).toEqual([true, false]);
    // Nothing met yet: the exercises wait on the cards instead of counting as done.
    expect(planView(plan({ newIds: [1, 2, 3] })).steps.map((s) => s.done)).toEqual([false, false]);
  });

  it("offers the grammar only once both steps are done", () => {
    expect(planView(plan({ exercisable: 3, exercisesToday: 6 })).grammar).toBe(true);
    expect(planView(plan({ exercisable: 3, exercisesToday: 1 })).grammar).toBe(false);
  });

  it("sends a day whose three words went to the course to the course, not round an empty loop", () => {
    // A course lesson before any own word was met: nothing to flip, nothing to exercise.
    const view = planView(plan({ newToday: 3, queued: 8, tomorrow: { reviews: 0, new: 3 } }));
    expect(view.headline.text).toBe("Bugünlük tamam!");
    expect(view.subline).toBe("Bugünün 3 yeni kelimesini kursta öğrendin. Burada yarın 3 yeni kelime var.");
    expect(`${view.primary.label} → ${planHref(49, view.primary.mode)}`).toBe("Kursa git → /kurs");
    expect(`${view.secondary.label} → ${planHref(49, view.secondary.mode)}`).toBe("Gramer → /gramer");
    expect(view.steps.map((s) => [s.detail, s.done])).toEqual([
      ["yarın 3 yeni", true],
      ["yarın", true],
    ]);
    // The next words wait as look-alikes of the last ones: the same way out.
    expect(planView(plan({ newToday: 1, queued: 2, tomorrow: { reviews: 0, new: 2 } })).primary.mode).toBe("course");
    // Once a word is met, the day reads as before.
    expect(planView(plan({ newToday: 3, queued: 5, exercisable: 3 })).primary.mode).toBe("exercises");
  });

  it("drops the empty half of tomorrow", () => {
    expect(planView(plan({ exercisable: 3, exercisesToday: 6, tomorrow: { reviews: 4, new: 0 } })).subline).toBe("Yarın 4 tekrar var.");
    expect(planView(plan({ exercisable: 3, exercisesToday: 6, tomorrow: { reviews: 0, new: 2 } })).subline).toBe("Yarın 2 yeni kelime var.");
  });
});

describe("minutes and addresses", () => {
  it("rounds a round of cards and the exercises up to whole minutes", () => {
    expect(cardMinutes(0, 3)).toBe(4);
    expect(cardMinutes(5, 3)).toBe(5);
    expect(cardMinutes(30, 0)).toBe(6);
    expect(exerciseMinutes(3)).toBe(3);
    expect(exerciseMinutes(40)).toBe(5);
    expect(exerciseMinutes(0)).toBe(0);
  });

  it("builds each button's address", () => {
    expect(planHref(49, "due")).toBe("/decks/49/flashcards");
    expect(planHref(49, "exercises")).toBe("/decks/49/flashcards?mode=exercises");
    expect(planHref("49", "all")).toBe("/decks/49/flashcards?mode=all");
    expect(planHref(49, "course")).toBe("/kurs");
    expect(planHref(49, "grammar")).toBe("/gramer");
  });
});

describe("lessonOverBudget", () => {
  const fresh = (id: number) => makeCard({ id, front: `w${id}` });
  const met = (id: number) => makeCard({ id, front: `w${id}`, repetitions: 1, interval: 1 });
  const budget = (newToday: number) => ({ day: "2026-09-24", cap: 3, newToday });

  it("holds a lesson back when its new words would take the day past three", () => {
    expect(lessonOverBudget(budget(0), [fresh(1), fresh(2), fresh(3)])).toBe(false);
    expect(lessonOverBudget(budget(1), [fresh(1), fresh(2), fresh(3)])).toBe(true);
    expect(lessonOverBudget(budget(3), [fresh(1)])).toBe(true);
  });

  it("lets a half-done lesson finish, and never holds back one with nothing new", () => {
    expect(lessonOverBudget(budget(2), [met(1), met(2), fresh(3)])).toBe(false);
    expect(lessonOverBudget(budget(8), [met(1), met(2), met(3)])).toBe(false);
    expect(lessonOverBudget(undefined, [fresh(1), fresh(2), fresh(3), fresh(4)])).toBe(false);
  });
});

describe("flipOrder", () => {
  // 24 Sept 2026, 21:00 local; the learner day began at 04:00.
  const NOW = new Date(2026, 8, 24, 21, 0).getTime();
  const at = (days: number, hours = 0) => new Date(2026, 8, 24 + days, hours).toISOString();

  it("takes met words only: not answered today first by due date, then today's by when", () => {
    const cards = [
      makeCard({ id: 1, front: "queued", due_date: at(-3, 9) }),
      makeCard({ id: 2, front: "today-late", repetitions: 1, interval: 1, reviewed_at: at(0, 20), due_date: at(1, 4) }),
      makeCard({ id: 3, front: "later", repetitions: 2, interval: 3, reviewed_at: at(-2, 20), due_date: at(1, 4) }),
      makeCard({ id: 4, front: "soon", repetitions: 1, interval: 1, reviewed_at: at(-1, 20), due_date: at(0, 4) }),
      makeCard({ id: 5, front: "today-early", repetitions: 1, interval: 1, reviewed_at: at(0, 9), due_date: at(1, 4) }),
      // Answered at 01:00: still the evening before's.
      makeCard({ id: 6, front: "last-night", repetitions: 1, interval: 1, reviewed_at: at(0, 1), due_date: at(2, 4) }),
    ];
    expect(flipOrder(cards, { now: NOW }).map((c) => c.front)).toEqual(["soon", "later", "last-night", "today-early", "today-late"]);
  });

  it("stops at the limit", () => {
    const cards = Array.from({ length: 25 }, (_, i) => makeCard({ id: i + 1, front: `w${i}`, repetitions: 1, interval: 1, due_date: at(1, 4) }));
    expect(flipOrder(cards, { now: NOW })).toHaveLength(20);
  });
});
