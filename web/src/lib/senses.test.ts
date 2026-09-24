import { describe, expect, it } from "vitest";
import { anchorOf, backLine, chunksOf, coreChunk, coreGloss, corePos, coreSense, glossOf, linesOf, secondGloss, tierOf, unlockedTier } from "./senses";
import { consider, makeCard } from "./testCards";

// An older card: senses with no tiers, chunks with no sense, sentences on the card itself too.
const old = makeCard({
  id: 7,
  front: "achieve",
  back: "(verb) başarmak",
  example_sentence: "Frances achieves great exam results.",
  senses: [
    {
      pos: "verb",
      meaning: "başarmak (hedef, sonuç)",
      example_en: "She always achieves her goals.",
      example_tr: "Hedeflerine hep ulaşır.",
      examples: [{ en: "I'm going to achieve my goal this year.", tr: null }],
    },
    { pos: "verb", meaning: "elde etmek", example_en: "Our team is achieving good results.", example_tr: null },
  ],
  collocations: [
    { en: "achieve a goal", tr: "bir hedefe ulaşmak" },
    { en: "achieve success", tr: "başarı elde etmek" },
  ],
});

describe("tiers", () => {
  it("fall back on older cards: the first sense is the core one, the rest tier 2", () => {
    expect(old.senses!.map((s, i) => tierOf(s, i))).toEqual([1, 2]);
    expect(coreSense(old)).toBe(old.senses![0]);
    expect(chunksOf(old, 1).map((c) => c.en)).toEqual(["achieve a goal"]);
    expect(chunksOf(old, 2).map((c) => c.en)).toEqual(["achieve a goal", "achieve success"]);
  });

  it("follow the card's own tiers when it has them", () => {
    const card = consider();
    expect(card.senses!.map((s, i) => tierOf(s, i))).toEqual([1, 2, 3]);
    expect(coreSense({ senses: [card.senses![1], card.senses![0]] })).toBe(card.senses![0]);
  });
});

describe("glosses", () => {
  it("shows the gloss, or the meaning without its note", () => {
    expect(glossOf(consider().senses![0])).toBe("(yapmayı) düşünmek");
    expect(glossOf(old.senses![0])).toBe("başarmak");
    expect(coreGloss(consider())).toBe("(yapmayı) düşünmek");
    expect(coreGloss(old)).toBe("başarmak");
  });

  it("reads a plain card's back", () => {
    expect(coreGloss(makeCard({ id: 1, front: "tree", back: "(noun) ağaç 🌳" }))).toBe("ağaç");
    expect(corePos(makeCard({ id: 1, front: "tree", back: "(noun) ağaç 🌳" }))).toBe("noun");
  });
});

describe("unlockedTier", () => {
  it("opens the second sense at the third success, never for a leech", () => {
    expect([0, 1, 2].map((repetitions) => unlockedTier({ repetitions, lapses: 0 }))).toEqual([1, 1, 1]);
    expect(unlockedTier({ repetitions: 3, lapses: 0 })).toBe(2);
    expect(unlockedTier({ repetitions: 5, lapses: 3 })).toBe(1);
  });

  it("names the second sense only once it is open", () => {
    expect(secondGloss(consider({ repetitions: 2, interval: 3 }))).toBeNull();
    expect(secondGloss(consider({ repetitions: 3, interval: 7 }))).toBe("… olarak görmek");
  });
});

describe("linesOf", () => {
  it("starts with the anchor and keeps tier 1 to itself", () => {
    const lines = linesOf(consider(), 1);
    expect(lines.map((l) => l.en)).toEqual(["We're considering moving to Izmir next year.", "I'm considering a new job in Izmir."]);
    expect(lines.every((l) => l.gloss === "(yapmayı) düşünmek")).toBe(true);
  });

  it("adds tier 2 after tier 1, and never tier 3", () => {
    const lines = linesOf(consider(), 2).map((l) => l.en);
    expect(lines.slice(0, 2)).toEqual(["We're considering moving to Izmir next year.", "I'm considering a new job in Izmir."]);
    expect(lines).toContain("I consider Ali a good friend.");
    expect(lines).not.toContain("Consider the traffic, and leave home early.");
  });

  it("leaves a rich card's own flat sentences out, and keeps a plain card's", () => {
    expect(linesOf(old, 2).map((l) => l.en)).not.toContain("Frances achieves great exam results.");
    const plain = makeCard({ id: 2, front: "tree", back: "(noun) ağaç", example_sentence: "There is a tree in our garden.", example_tr: "Bahçemizde bir ağaç var." });
    expect(linesOf(plain, 1)).toEqual([{ en: "There is a tree in our garden.", tr: "Bahçemizde bir ağaç var.", gloss: "ağaç" }]);
  });
});

describe("chunksOf", () => {
  it("files each chunk under its sense", () => {
    expect(chunksOf(consider(), 1)).toEqual([{ en: "consider moving", tr: "taşınmayı düşünmek" }]);
    expect(chunksOf(consider(), 2).map((c) => c.en)).toEqual(["consider moving", "consider an offer"]);
    expect(chunksOf(consider(), 3)).toHaveLength(3);
    expect(coreChunk(consider())?.en).toBe("consider moving");
  });
});

describe("backLine", () => {
  it("is the sentence the word was met in until the third success", () => {
    for (const repetitions of [0, 1, 2]) {
      for (const day of [0, 1, 2, 3]) expect(backLine(consider({ repetitions, interval: repetitions }), day)).toEqual(anchorOf(consider()));
    }
  });

  it("then moves between the core sense's sentences by the day", () => {
    const held = consider({ repetitions: 3, interval: 7 });
    const shown = new Set([0, 1, 2, 3].map((day) => backLine(held, day)?.en));
    expect([...shown].sort()).toEqual(["I'm considering a new job in Izmir.", "We're considering moving to Izmir next year."]);
  });
});
