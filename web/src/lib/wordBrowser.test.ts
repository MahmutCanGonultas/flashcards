import { describe, expect, it } from "vitest";
import { browse, filterCounts, fold, groupCards, matchRanges, matches, sortCards } from "./wordBrowser";
import { makeCard } from "./testCards";

// 23 Sept 2026, 12:00 in the learner's own time zone.
const NOW = new Date(2026, 8, 23, 12, 0).getTime();
const at = (days: number, hours = 0) => new Date(2026, 8, 23 + days, hours).toISOString();

const concern = makeCard({
  id: 1,
  front: "concern",
  back: "(noun) endişe",
  senses: [{ pos: "noun", meaning: "endişe, kaygı", example_en: "Mum's voice was full of concern.", example_tr: "Annemin sesi endişeyle doldu." }],
  collocations: [{ en: "no cause for concern", tr: "endişeye gerek yok" }],
  repetitions: 1,
  interval: 1,
  due_date: at(0, 9),
  created_at: at(-7, 10),
});
const achieve = makeCard({
  id: 2,
  front: "achieve",
  back: "(verb) başarmak",
  senses: [{ pos: "verb", meaning: "başarmak, elde etmek", examples: [{ en: "Frances achieved great exam results.", tr: "Frances sınavlarda harika sonuçlar elde etti." }] }],
  repetitions: 3,
  interval: 30,
  due_date: at(20, 0),
  created_at: at(-1, 10),
});
const trend = makeCard({ id: 3, front: "trend", back: "(noun) eğilim", repetitions: 0, interval: 0, due_date: at(-1, 0), created_at: at(0, 8) });
const approach = makeCard({ id: 4, front: "approach", back: "(verb) yaklaşmak", repetitions: 2, interval: 6, lapses: 3, due_date: at(1, 0), created_at: at(-30, 8) });
const cards = [concern, achieve, trend, approach];

describe("fold / matches", () => {
  it("reads Turkish without its accents, one character for one", () => {
    expect(fold("Eğilim ŞÖYLE İyi çalış")).toBe("egilim soyle iyi calis");
    expect(fold("Eğilim").length).toBe("Eğilim".length);
  });

  it("finds a word by its English, its Turkish, its sentences and its chunks", () => {
    expect(matches(concern, "CONCERN")).toBe(true);
    expect(matches(concern, "endise")).toBe(true);
    expect(matches(concern, "gerek yok")).toBe(true);
    expect(matches(achieve, "harika sonuclar")).toBe(true);
    expect(matches(achieve, "endişe")).toBe(false);
    expect(matches(trend, "")).toBe(true);
  });

  it("marks where the query sits, accents or not", () => {
    expect(matchRanges("endişe, kaygı", "endise")).toEqual([[0, 6]]);
    expect(matchRanges("no cause for concern", "for con")).toEqual([[9, 12], [13, 16]]);
  });
});

describe("filters and order", () => {
  it("counts every filter at once", () => {
    expect(filterCounts(cards, NOW)).toEqual({ all: 4, due: 2, new: 1, learning: 1, young: 1, mature: 1, leech: 1 });
  });

  it("sorts A–Z and newest first", () => {
    expect(sortCards(cards, "az").map((c) => c.front)).toEqual(["achieve", "approach", "concern", "trend"]);
    expect(sortCards(cards, "recent").map((c) => c.front)).toEqual(["trend", "achieve", "concern", "approach"]);
  });

  it("searches inside a filter", () => {
    expect(browse(cards, { query: "e", filter: "due", sort: "az", now: NOW }).map((c) => c.front)).toEqual(["concern", "trend"]);
    expect(browse(cards, { query: "yaklaş", filter: "all", sort: "az", now: NOW }).map((c) => c.front)).toEqual(["approach"]);
  });
});

describe("groupCards", () => {
  it("heads a list in schedule order by when the words come back", () => {
    const groups = groupCards([concern, trend, approach, achieve], "next", NOW);
    expect(groups.map((g) => [g.label, g.cards.map((c) => c.front)])).toEqual([
      ["Şimdi sırada", ["concern", "trend"]],
      ["Yarın", ["approach"]],
      ["Bu ay", ["achieve"]],
    ]);
  });

  it("heads an A–Z list by letter and a newest-first list by when the words came in", () => {
    expect(groupCards(sortCards(cards, "az"), "az", NOW).map((g) => g.label)).toEqual(["A", "C", "T"]);
    expect(groupCards(sortCards(cards, "recent"), "recent", NOW).map((g) => g.label)).toEqual(["Bugün eklenen", "Bu hafta", "Geçen hafta", "Ağustos 2026"]);
  });
});
