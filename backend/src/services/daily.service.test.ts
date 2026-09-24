import { describe, it, expect } from "vitest";
import {
  type IntroducedWord,
  type PlanCard,
  introductionDay,
  newWordAllowed,
  pickNewWords,
  planCounts,
  planFrom,
  posOf,
  pushLine,
  repeatedLearnWrite,
} from "./daily.service.js";

// The eight words of the 24 September reset, with their real ids and the
// part of speech of their core sense.
const RESET_WORDS = [
  [1280, "consider", "verb"],
  [1281, "commit", "verb"],
  [1282, "approach", "verb"],
  [1283, "concern", "noun"],
  [1284, "establish", "verb"],
  [1285, "available", "adjective"],
  [1286, "trend", "noun"],
  [1287, "achieve", "verb"],
] as const;

const word = (id: number, front: string, pos: string, extra: Partial<PlanCard> = {}): PlanCard => ({
  id,
  front,
  back: `(${pos}) …`,
  senses: [{ pos, tier: 1 }],
  repetitions: 0,
  interval: 0,
  due_date: "2026-09-24T13:40:00Z",
  introduced_on: null,
  ...extra,
});

const resetDeck = () => RESET_WORDS.map(([id, front, pos]) => word(id, front, pos));

const previousDay = (day: string) => new Date(Date.parse(day) - 86_400_000).toISOString().slice(0, 10);

/** What the introduced-words query returns: every card introduced on `day` or the day before. */
const introducedAround = (cards: PlanCard[], day: string): IntroducedWord[] =>
  cards.filter((card) => card.introduced_on === day || card.introduced_on === previousDay(day));

/** Evening sessions, one a day; each writes the day's new words as a first answer would. */
const eveningOf = (day: string) => new Date(`${day}T20:10:00Z`);

const fronts = (cards: { front: string }[]) => cards.map((card) => card.front);

describe("pickNewWords on the eight reset words", () => {
  it("brings them 3, 3 and 2, never two look-alikes on neighbouring days", () => {
    let cards = resetDeck();
    const picks: string[][] = [];
    for (const day of ["2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"]) {
      const plan = planFrom({ day, now: eveningOf(day), cards, introduced: introducedAround(cards, day) });
      picks.push(fronts(plan.fresh));
      const written = new Set(plan.newIds);
      cards = cards.map((card) =>
        written.has(card.id)
          ? { ...card, repetitions: 1, interval: 1, introduced_on: day, due_date: new Date(Date.parse(`${day}T01:00:00Z`) + 86_400_000) }
          : card,
      );
    }
    expect(picks).toEqual([
      ["consider", "available", "trend"],
      ["commit", "approach", "establish"],
      ["concern", "achieve"],
      [],
    ]);
  });

  it("picks the same word again after a session that was killed before writing it", () => {
    const day = "2026-09-24";
    const cards = resetDeck().map((card) =>
      card.front === "consider" || card.front === "available" ? { ...card, repetitions: 1, interval: 1, introduced_on: day, due_date: "2026-09-25T01:00:00Z" } : card,
    );
    const plan = planFrom({ day, now: eveningOf(day), cards, introduced: introducedAround(cards, day) });
    expect(plan.newToday).toBe(2);
    expect(fronts(plan.fresh)).toEqual(["trend"]);
    expect(plan.queued).toBe(5);
  });

  it("falls back to the back's (pos) for plain course cards", () => {
    expect(posOf({ back: "(noun) gömlek 👔", senses: null })).toBe("noun");
    expect(posOf({ back: "(verb) x", senses: [{ pos: "noun" }, { pos: "Verb", tier: 1 }] })).toBe("verb");
    expect(posOf({ back: "gömlek", senses: null })).toBeNull();
  });

  it("takes a second word of the same part of speech only when nothing else fits", () => {
    const candidates = [word(1, "run", "verb"), word(2, "walk", "verb"), word(3, "table", "noun")];
    expect(fronts(pickNewWords(candidates, [], [], 3))).toEqual(["run", "walk", "table"]);
    expect(fronts(pickNewWords(candidates, [], [], 2))).toEqual(["run", "table"]);
  });
});

describe("planFrom", () => {
  const day = "2026-09-26";
  const now = eveningOf(day);
  const due = (id: number, extra: Partial<PlanCard> = {}) =>
    word(id, `w${id}`, "noun", { repetitions: 3, interval: 7, introduced_on: "2026-09-01", due_date: "2026-09-26T01:00:00Z", ...extra });
  const shakyWord = (id: number) => word(id, `s${id}`, "noun", { repetitions: 1, interval: 1, introduced_on: "2026-09-25", due_date: "2026-09-27T01:00:00Z" });
  const plan = (cards: PlanCard[], introduced: IntroducedWord[] = []) => planFrom({ day, now, cards, introduced });

  it("pauses new words with more than 20 reviews waiting", () => {
    const reviews = Array.from({ length: 21 }, (_, i) => due(i + 1));
    expect(plan([...reviews, ...resetDeck()]).paused).toBe("reviews");
    expect(plan([...reviews, ...resetDeck()]).newIds).toEqual([]);
    expect(plan([...reviews.slice(1), ...resetDeck()]).paused).toBeNull();
    expect(plan([...reviews.slice(1), ...resetDeck()]).newIds).toHaveLength(3);
  });

  it("pauses new words with more than 9 shaky words from earlier days", () => {
    const shaky = Array.from({ length: 10 }, (_, i) => shakyWord(i + 1));
    const result = plan([...shaky, ...resetDeck()]);
    expect(result.shaky).toBe(10);
    expect(result.paused).toBe("shaky");
    expect(result.newIds).toEqual([]);
    expect(result.queued).toBe(8);
    expect(plan([...shaky.slice(1), ...resetDeck()]).paused).toBeNull();
  });

  it("doesn't count today's words as shaky", () => {
    const today = Array.from({ length: 10 }, (_, i) => ({ ...shakyWord(i + 1), introduced_on: day }));
    expect(plan(today).shaky).toBe(0);
  });

  it("shares the budget with the course: a lesson that introduced 3 words leaves no slot", () => {
    const lesson = [
      { id: 900, front: "shirt", back: "(noun) gömlek 👔", senses: null, introduced_on: day },
      { id: 901, front: "trousers", back: "(noun) pantolon 👖", senses: null, introduced_on: day },
      { id: 902, front: "shoes", back: "(noun) ayakkabı 👟", senses: null, introduced_on: day },
    ];
    const result = plan(resetDeck(), lesson);
    expect(result.newToday).toBe(3);
    expect(result.newIds).toEqual([]);
    expect(result.paused).toBeNull();
    expect(result.queued).toBe(8);
    expect(result.tomorrow.new).toBe(3);
  });

  it("serves at most 30 reviews, oldest due first", () => {
    const reviews = Array.from({ length: 35 }, (_, i) => due(100 - i, { due_date: new Date(Date.parse("2026-09-20T01:00:00Z") + (i % 5) * 3_600_000) }));
    const result = plan(reviews);
    expect(result.reviewsDue).toBe(35);
    expect(result.reviews).toHaveLength(30);
    const order = result.reviews.map((card) => [new Date(card.due_date!).getTime(), card.id]);
    expect(order).toEqual([...order].sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  });

  it("counts tomorrow's reviews and new words, and what can be exercised", () => {
    const cards = [
      due(1),
      due(2, { due_date: "2026-09-27T01:00:00Z" }),
      due(3, { due_date: "2026-09-27T23:00:00Z" }),
      due(4, { due_date: "2026-09-28T01:00:00Z" }),
      ...resetDeck(),
    ];
    const result = plan(cards);
    expect(result.reviewsDue).toBe(1);
    expect(result.tomorrow).toEqual({ reviews: 3, new: 3 });
    expect(result.exercisable).toBe(4);
    expect(result.queued).toBe(5);
  });

  it("leaves the cards out of the counts", () => {
    const counts = planCounts(plan(resetDeck()));
    expect(counts).not.toHaveProperty("reviews");
    expect(counts).not.toHaveProperty("fresh");
    expect(counts.newIds).toEqual([1280, 1285, 1286]);
  });
});

describe("newWordAllowed", () => {
  it("refuses a never-started, never-introduced word once 3 are in today", () => {
    expect(newWordAllowed(false, null, 3)).toBe(false);
    expect(newWordAllowed(false, null, 2)).toBe(true);
  });

  it("always allows a started or already introduced word", () => {
    expect(newWordAllowed(true, null, 5)).toBe(true);
    expect(newWordAllowed(false, "2026-09-24", 3)).toBe(true);
  });
});

describe("repeatedLearnWrite", () => {
  it("catches a learning write sent again for a word already written today", () => {
    expect(repeatedLearnWrite("learn", true, "2026-09-24", "2026-09-24")).toBe(true);
  });

  it("lets the first write through, and 'learn' on a later day counts as a review", () => {
    expect(repeatedLearnWrite("learn", false, null, "2026-09-24")).toBe(false);
    expect(repeatedLearnWrite("learn", true, "2026-09-23", "2026-09-24")).toBe(false);
    expect(repeatedLearnWrite("review", true, "2026-09-24", "2026-09-24")).toBe(false);
    expect(repeatedLearnWrite(undefined, true, "2026-09-24", "2026-09-24")).toBe(false);
  });
});

describe("introductionDay", () => {
  const now = new Date("2026-09-25T18:00:00Z");

  it("stamps today on a word's first write", () => {
    expect(introductionDay(false, null, now)).toBe("2026-09-25");
  });

  it("stamps a word started on an older build with the day of its first answer, not today", () => {
    // Studied at 23:10 Istanbul on the 24th, before the stamp existed.
    expect(introductionDay(true, new Date("2026-09-24T20:10:00Z"), now)).toBe("2026-09-24");
    expect(introductionDay(true, "2026-09-24T20:10:00.000Z", now)).toBe("2026-09-24");
    expect(introductionDay(true, null, now)).toBe("2026-09-25");
  });
});

describe("pushLine", () => {
  const base = { deckId: 49, course: 0, exercisesToday: 0, started: 8 };

  it("names new words and reviews", () => {
    expect(pushLine({ ...base, plan: { reviewsDue: 5, newIds: [1, 2, 3] } })).toEqual({
      body: "Bugün 3 yeni kelime ve 5 tekrar seni bekliyor · yaklaşık 5 dk. 🃏",
      url: "/decks/49/flashcards",
    });
  });

  it("names reviews alone", () => {
    expect(pushLine({ ...base, plan: { reviewsDue: 10, newIds: [] } })).toEqual({
      body: "Bugün 10 kelime seni soruyor · yaklaşık 2 dk. 🔁",
      url: "/decks/49/flashcards",
    });
  });

  it("names new words alone", () => {
    expect(pushLine({ ...base, plan: { reviewsDue: 0, newIds: [1, 2] } })).toEqual({
      body: "Bugün 2 yeni kelimeyle tanışacaksın · yaklaşık 3 dk. 🌱",
      url: "/decks/49/flashcards",
    });
  });

  it("points at the course when only the course is waiting", () => {
    expect(pushLine({ ...base, course: 4, plan: { reviewsDue: 0, newIds: [] } })).toEqual({
      body: "Kursta 4 tekrar seni bekliyor. 📚",
      url: "/kurs",
    });
    expect(pushLine({ deckId: null, plan: null, course: 4, exercisesToday: 0, started: 0 })?.url).toBe("/kurs");
  });

  it("suggests exercises on a day without cards", () => {
    expect(pushLine({ ...base, plan: { reviewsDue: 0, newIds: [] } })).toEqual({
      body: "Bugün kart yok. 5 dakikalık bir egzersiz? ✍️",
      url: "/decks/49/flashcards?mode=exercises",
    });
  });

  it("stays silent when there is nothing to do", () => {
    const empty = { reviewsDue: 0, newIds: [] };
    expect(pushLine({ ...base, plan: empty, exercisesToday: 6 })).toBeNull();
    expect(pushLine({ ...base, plan: empty, started: 0 })).toBeNull();
    expect(pushLine({ deckId: null, plan: null, course: 0, exercisesToday: 0, started: 0 })).toBeNull();
  });
});
