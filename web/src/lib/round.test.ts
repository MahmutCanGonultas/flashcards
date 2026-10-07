import { describe, expect, it } from "vitest";
import { MAX_NEW_ASKS, answerExtra, answerFree, answerNew, answerReview, buildRound, freshState, nextInterval, placeAfter, posText, whenText, type Step } from "./round";
import type { Card } from "../types";

const card = (id: number, extra: Partial<Card> = {}): Card =>
  ({ id, front: `w${id}`, back: "anlam", repetitions: 0, interval: 0, ease_factor: 2.5, due_date: new Date().toISOString(), ...extra }) as Card;

describe("buildRound", () => {
  it("shows each new word a few reviews apart, reviews around them", () => {
    const steps = buildRound([card(1), card(2)], [card(10), card(11), card(12), card(13)]);
    expect(steps.map((s) => `${s.kind}:${s.cardId}`)).toEqual(["meet:1", "ask:10", "ask:11", "meet:2", "ask:12", "ask:13"]);
  });

  it("with no reviews, the new words are shown one after another", () => {
    expect(buildRound([card(1), card(2), card(3)], []).map((s) => s.cardId)).toEqual([1, 2, 3]);
  });
});

describe("placeAfter", () => {
  const steps: Step[] = [1, 2, 3, 4, 5].map((id) => ({ cardId: id, kind: "ask" }));
  it("puts a card back a few cards on", () => {
    expect(placeAfter(steps, 0, { cardId: 9, kind: "ask" }, 3).map((s) => s.cardId)).toEqual([1, 2, 3, 4, 9, 5]);
  });
  it("puts it at the end when the round is shorter", () => {
    expect(placeAfter(steps, 3, { cardId: 9, kind: "ask" }, 3).map((s) => s.cardId)).toEqual([1, 2, 3, 4, 5, 9]);
  });
});

describe("a new word", () => {
  it("is learned at its second right answer, written once as learned", () => {
    const first = answerNew(freshState(), "knew");
    expect(first.outcome.write).toEqual({ to: "practice", quality: 5, phase: "learn-step" });
    expect(first.outcome.again).not.toBeNull();
    const second = answerNew(first.state, "knew");
    expect(second.state.done).toBe(true);
    expect(second.outcome.write).toEqual({ to: "review", quality: 4, phase: "learn" });
    expect(second.outcome.nextDays).toBe(1);
  });

  it("after a miss needs one more ask, and is written as harder", () => {
    let state = freshState();
    for (const answer of ["knew", "missed"] as const) state = answerNew(state, answer).state;
    expect(state.done).toBe(false);
    const last = answerNew(state, "knew");
    expect(last.outcome.write).toEqual({ to: "review", quality: 3, phase: "learn" });
  });

  it("is let go after six asks and comes back tomorrow", () => {
    let state = freshState();
    let outcome = answerNew(state, "missed").outcome;
    for (let i = 0; i < MAX_NEW_ASKS; i++) ({ state, outcome } = answerNew(state, "missed"));
    expect(state.done).toBe(true);
    expect(outcome.write).toEqual({ to: "review", quality: 1, phase: "learn" });
    expect(outcome.again).toBeNull();
  });
});

describe("a review", () => {
  it("known: written as known, and says when it comes back", () => {
    const outcome = answerReview(card(1, { repetitions: 1, interval: 1 }), "knew");
    expect(outcome.write).toEqual({ to: "review", quality: 5, phase: "review" });
    expect(outcome.nextDays).toBe(3);
    expect(outcome.note).toBe("3 gün sonra tekrar gelecek.");
  });

  it("missed: written as missed, then asked again in the round", () => {
    const outcome = answerReview(card(1, { repetitions: 2, interval: 3 }), "missed");
    expect(outcome.write).toEqual({ to: "review", quality: 1, phase: "review" });
    expect(outcome.again).not.toBeNull();
  });

  it("its extra asks never touch the schedule and stop when it is got", () => {
    expect(answerExtra("knew", 2)).toMatchObject({ again: null, write: { to: "practice", phase: "relearn" }, nextDays: 1 });
    expect(answerExtra("missed", 1).again).not.toBeNull();
    expect(answerExtra("missed", 0).again).toBeNull();
  });
});

describe("serbest", () => {
  it("writes nothing to the schedule; a miss comes back once", () => {
    expect(answerFree("missed", true)).toMatchObject({ write: { to: "practice", phase: "practice" } });
    expect(answerFree("missed", true).again).not.toBeNull();
    expect(answerFree("missed", false).again).toBeNull();
  });
});

describe("nextInterval", () => {
  it("climbs 1, 3, 7, then grows with the ease, as the server does", () => {
    expect(nextInterval({ repetitions: 0, interval: 0, ease_factor: 2.5 })).toBe(1);
    expect(nextInterval({ repetitions: 1, interval: 1, ease_factor: 2.5 })).toBe(3);
    expect(nextInterval({ repetitions: 2, interval: 3, ease_factor: 2.5 })).toBe(7);
    expect(nextInterval({ repetitions: 3, interval: 7, ease_factor: 2.5 })).toBe(18);
  });
});

describe("whenText", () => {
  it("says it in plain Turkish", () => {
    expect(whenText(1)).toBe("Yarın");
    expect(whenText(3)).toBe("3 gün sonra");
    expect(whenText(18)).toBe("3 hafta sonra");
    expect(whenText(60)).toBe("2 ay sonra");
  });
});

describe("posText", () => {
  it("gives the English and the Turkish name", () => {
    expect(posText({ senses: [{ pos: "adjective", meaning: "cömert" }], back: "" })).toBe("adjective · sıfat");
    expect(posText({ senses: null, back: "cömert" })).toBeNull();
  });
});
