import { describe, expect, it } from "vitest";
import { exerciseSteps, summaryView, weakWords, type RoundResult } from "./summary";
import { makeCard } from "./testCards";
import type { Card } from "../types";

const review = (id: number, front: string) => makeCard({ id, front, repetitions: 2, interval: 3, due_date: "2026-09-24T01:00:00.000Z" });
const fresh = (id: number, front: string) => makeCard({ id, front });
const result = (before: Card, grade: RoundResult["grade"], graded = true): RoundResult => ({ grade, graded, before, after: null });
const results = (...list: RoundResult[]) => Object.fromEntries(list.map((r) => [r.before.id, r]));

const achieve = review(1, "achieve");
const approach = review(2, "approach");
const trend = review(3, "trend");
const consider = fresh(1280, "consider");
const available = fresh(1285, "available");
const commit = fresh(1286, "commit");

describe("summaryView", () => {
  const base = { deckId: 49, exitTo: "/kartlar" };

  it("all known: the line says so, nothing to shore up, the exercises next", () => {
    const view = summaryView({ ...base, cards: [achieve, approach], results: results(result(achieve, 5), result(approach, 4)), mode: "due", pool: 8 });
    expect(view.title).toBe("Oturum tamam!");
    expect(view.line).toBe("Hepsini bildin. Bunlar artık daha seyrek gelecek.");
    expect(view.weak).toEqual([]);
    expect(view.primary).toEqual({ label: "Egzersizle pekiştir · ~4 dk", to: "/decks/49/flashcards?mode=exercises" });
    expect(view.secondary).toEqual({ label: "Sonra", to: "/kartlar" });
  });

  it("some missed: the missed and hard ones are named and the exercises start with them", () => {
    const view = summaryView({
      ...base,
      cards: [achieve, approach, trend],
      results: results(result(achieve, 1), result(approach, 5), result(trend, 3)),
      mode: "due",
      pool: 8,
    });
    expect(view.line).toBe("1 kelime kaçtı. Burada yeniden sordum; yarın yine gelecek.");
    expect(view.weak.map((c) => c.front)).toEqual(["achieve", "trend"]);
    expect(view.primary.to).toBe("/decks/49/flashcards?mode=exercises&focus=1,3");
  });

  it("new words only: learned words are today's focus; one that didn't hold is weak", () => {
    const allHeld = summaryView({
      ...base,
      cards: [consider, available, commit],
      results: results(result(consider, 4), result(available, 4), result(commit, 4)),
      mode: "due",
      pool: 3,
    });
    expect(allHeld.line).toBe("3 yeni kelime öğrendin; yarın yine soracağım.");
    expect(allHeld.weak).toEqual([]);
    // Three words, two asks each, 25 s an ask.
    expect(allHeld.primary).toEqual({ label: "Egzersizle pekiştir · ~3 dk", to: "/decks/49/flashcards?mode=exercises&focus=1280,1285,1286" });

    // commit was never got twice (written as not learned); available was only met.
    const one = summaryView({ ...base, cards: [consider, available, commit], results: results(result(consider, 3), result(commit, 1)), mode: "due", pool: 2 });
    expect(one.weak.map((c) => c.front)).toEqual(["consider", "commit"]);
    expect(one.primary.to).toBe("/decks/49/flashcards?mode=exercises&focus=1280,1286");
  });

  it("an exercise round: the typed score, and back home", () => {
    const view = summaryView({
      ...base,
      cards: [achieve, approach],
      results: results(result(achieve, 5, false), result(approach, 1, false)),
      mode: "exercises",
      typed: { n: 2, right: 1 },
      pool: 8,
    });
    expect(view.title).toBe("Egzersiz bitti!");
    expect(view.line).toBe("Yazarak 1/2 doğru. Egzersiz kelimeyi kullanmayı öğretir; ne zaman soracağımı kartlar belirler.");
    expect(view.weak).toEqual([]);
    expect(view.primary).toEqual({ label: "Devam", to: "/kartlar" });
    expect(view.secondary).toBeNull();
  });

  it("hands nothing off when nothing was answered or nothing is met yet", () => {
    expect(summaryView({ ...base, cards: [consider], results: {}, mode: "due", pool: 0 }).primary.label).toBe("Devam");
    expect(summaryView({ ...base, cards: [achieve], results: {}, mode: "due", pool: 5 }).line).toBe("Bu tur hiçbirini işaretlemedin; takvime dokunmadım.");
    expect(summaryView({ ...base, cards: [achieve], results: results(result(achieve, 5)), mode: "all", pool: 5 }).primary.label).toBe("Devam");
  });

  it("names the passed words", () => {
    const view = summaryView({ ...base, cards: [achieve, approach], results: results(result(achieve, 5)), skipped: new Set([2]), mode: "due", pool: 8 });
    expect(view.line).toBe("Hepsini bildin. Bunlar artık daha seyrek gelecek. Geçtiğin 1 kelime sırada bekliyor.");
  });
});

describe("weakWords / exerciseSteps", () => {
  it("leaves out ungraded answers", () => {
    expect(weakWords([achieve, approach], results(result(achieve, 1, false), result(approach, 3)))).toEqual([approach]);
  });

  it("asks two each below five words, ten at most", () => {
    expect([1, 3, 4, 5, 9, 12].map(exerciseSteps)).toEqual([2, 6, 8, 5, 9, 10]);
  });
});
