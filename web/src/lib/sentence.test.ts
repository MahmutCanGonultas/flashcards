import { describe, expect, it } from "vitest";
import { isFormOf, locateTurkish, splitOnWord } from "./sentence";

describe("locateTurkish", () => {
  it("finds the meaning's stem in its sentence", () => {
    const sentence = "Çay için teşekkürler.";
    const at = locateTurkish(sentence, "teşekkür ederim");
    expect(at && sentence.slice(at.start, at.end)).toBe("teşekkürler");
  });

  it("ignores the notes in brackets, so it never lights up the wrong word", () => {
    const sentence = "On yıllık akşam derslerinin ardından sonunda profesör olma hedefine ulaştı.";
    expect(locateTurkish(sentence, "başarmak, elde etmek (hedef, sonuç — emek vererek)")).toBeNull();
  });

  it("still finds a sense that comes after a note", () => {
    const sentence = "Polis iki yangının bağlantılı olduğunu henüz saptayamadı.";
    const at = locateTurkish(sentence, "(gerçeği, kimliği) ortaya koymak, saptamak");
    expect(at && sentence.slice(at.start, at.end)).toBe("saptayamadı");
  });
});

describe("isFormOf", () => {
  it("recognises the forms English shows a headword in", () => {
    expect(isFormOf("committed", "commit")).toBe(true);
    expect(isFormOf("gave up", "give up")).toBe(true);
    expect(isFormOf("approaches", "approach")).toBe(true);
    expect(isFormOf("commitment", "commit")).toBe(false);
    expect(isFormOf("promise", "commit")).toBe(false);
    expect(isFormOf("give", "give up")).toBe(false);
  });
});

describe("splitOnWord", () => {
  it("splits around an inflected headword", () => {
    expect(splitOnWord("Police have not yet established that.", "establish")).toEqual({
      before: "Police have not yet ",
      match: "established",
      after: " that.",
    });
  });
});
