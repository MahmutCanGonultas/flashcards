import { describe, expect, it } from "vitest";
import type { Topic } from "../content/grammar/types";
import { isRight, mixedQuiz, prepare, rightAnswer, scoreOf, solved, wordsOf } from "./grammarQuiz";

/** A fixed "random" so shuffles are the same every run. */
function seeded(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const topic = (slug: string, n = 4): Topic => ({
  slug,
  level: "beginner",
  title: slug,
  titleTr: slug,
  emoji: "•",
  intro: "",
  sections: [],
  mistakes: [],
  tip: "",
  quiz: Array.from({ length: n }, (_, i) => ({ kind: "choice" as const, prompt: `${slug} ${i} ___`, options: ["am", "is", "are"], answer: 1, explain: "" })),
});

describe("prepare / isRight", () => {
  it("still knows the right option after shuffling", () => {
    const [item] = prepare("to-be", [{ kind: "choice", prompt: "She ___ a doctor.", options: ["am", "is", "are"], answer: 1, explain: "" }], seeded());
    const shownRight = item.order!.indexOf(1);
    expect(isRight(item, { picked: shownRight })).toBe(true);
    expect(isRight(item, { picked: (shownRight + 1) % 3 })).toBe(false);
  });

  it("accepts any listed answer, forgiving case, spacing and a curly apostrophe", () => {
    const [item] = prepare("to-be", [{ kind: "type", prompt: "He ___ at home.", answer: ["isn't", "is not"], explain: "" }]);
    expect(isRight(item, { typed: "  Isn’t " })).toBe(true);
    expect(isRight(item, { typed: "is not" })).toBe(true);
    expect(isRight(item, { typed: "aren't" })).toBe(false);
    expect(isRight(item, { typed: "" })).toBe(false);
  });

  it("builds tiles from the sentence and its distractors, and checks the order", () => {
    const [item] = prepare("to-be", [{ kind: "order", tr: "Ben öğrenciyim.", answer: "I am a student.", extra: ["is"], also: ["I'm a student."], explain: "" }], seeded());
    expect([...item.tiles!].sort()).toEqual(["I", "a", "am", "is", "student"]);
    expect(isRight(item, { built: ["I", "am", "a", "student"] })).toBe(true);
    expect(isRight(item, { built: ["I", "is", "a", "student"] })).toBe(false);
    expect(isRight(item, { built: [] })).toBe(false);
  });
});

describe("words, answers, score", () => {
  it("drops colour marks and the final stop from tiles", () => {
    expect(wordsOf("[She] {is} a doctor.")).toEqual(["She", "is", "a", "doctor"]);
  });

  it("writes the answer into the gap for the voice", () => {
    const q = { kind: "choice" as const, prompt: "[They] ___ friends.", options: ["is", "are"], answer: 1, explain: "" };
    expect(rightAnswer(q)).toBe("are");
    expect(solved(q)).toBe("They are friends.");
    expect(solved({ kind: "choice", prompt: "Hangisi doğru?", options: ["She have a car.", "She has a car."], answer: 1, explain: "" })).toBe("She has a car.");
  });

  it("scores first answers only", () => {
    expect(scoreOf([true, true, false, true])).toBe(75);
    expect(scoreOf([])).toBe(0);
  });
});

describe("mixedQuiz", () => {
  const topics = [topic("a"), topic("b"), topic("c"), topic("d")];

  it("draws only from practised topics once there are two", () => {
    const quiz = mixedQuiz(topics, { b: { best: 40, attempts: 1, updatedAt: "" }, d: { best: 100, attempts: 2, updatedAt: "" } }, 6, seeded());
    expect(quiz).toHaveLength(6);
    expect(new Set(quiz.map((q) => q.topic))).toEqual(new Set(["b", "d"]));
    expect(new Set(quiz.map((q) => q.key)).size).toBe(6);
  });

  it("starts from the top of the list when nothing is practised yet", () => {
    const quiz = mixedQuiz(topics, {}, 5, seeded());
    expect(quiz).toHaveLength(5);
    expect(quiz.every((q) => ["a", "b", "c"].includes(q.topic))).toBe(true);
  });

  it("stops when the questions run out", () => {
    expect(mixedQuiz([topic("a", 2), topic("b", 1)], {}, 10, seeded())).toHaveLength(3);
    expect(mixedQuiz([], {}, 10, seeded())).toEqual([]);
  });
});
