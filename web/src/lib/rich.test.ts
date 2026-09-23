import { describe, expect, it } from "vitest";
import { plain, richTokens } from "./rich";

describe("richTokens / plain", () => {
  it("reads every kind of mark and the text between them", () => {
    expect(richTokens("[I] {am} <at home>, **not** ~~is~~.")).toEqual([
      { kind: "partner", text: "I" },
      { kind: "text", text: " " },
      { kind: "focus", text: "am" },
      { kind: "text", text: " " },
      { kind: "extra", text: "at home" },
      { kind: "text", text: ", " },
      { kind: "bold", text: "not" },
      { kind: "text", text: " " },
      { kind: "wrong", text: "is" },
      { kind: "text", text: "." },
    ]);
  });

  it("strips the marks for the voice and for checking", () => {
    expect(plain("[She] {doesn't} like <Mondays>.")).toBe("She doesn't like Mondays.");
    expect(plain("No marks here.")).toBe("No marks here.");
  });
});
