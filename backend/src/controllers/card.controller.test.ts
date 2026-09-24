import { describe, it, expect } from "vitest";
import { practiceSchema, reviewSchema } from "./card.controller.js";

describe("practiceSchema", () => {
  const answer = { quality: 4, kind: "recall", phase: "learn-step" };

  it("takes every ungraded phase", () => {
    for (const phase of ["learn-step", "relearn", "filler", "practice", "exercise", "drill"]) {
      expect(practiceSchema.safeParse({ ...answer, phase }).success).toBe(true);
    }
  });

  it("rejects a phase outside the list, and the graded ones", () => {
    expect(practiceSchema.safeParse({ ...answer, phase: "review" }).success).toBe(false);
    expect(practiceSchema.safeParse({ ...answer, phase: "learn" }).success).toBe(false);
    expect(practiceSchema.safeParse({ ...answer, phase: undefined }).success).toBe(false);
  });

  it("takes only the grades the screens give", () => {
    expect(practiceSchema.safeParse({ ...answer, quality: 2 }).success).toBe(false);
    expect(practiceSchema.safeParse({ ...answer, quality: 5 }).success).toBe(true);
  });

  it("rejects a kind that isn't a plain slug", () => {
    expect(practiceSchema.safeParse({ ...answer, kind: "Recall!" }).success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("still takes an old client's bare grade", () => {
    expect(reviewSchema.safeParse({ quality: 3 }).success).toBe(true);
  });

  it("takes the new fields and rejects unknown values", () => {
    expect(reviewSchema.safeParse({ quality: 4, kind: "reverse", phase: "learn", direction: "rev", thinkMs: 2100 }).success).toBe(true);
    expect(reviewSchema.safeParse({ quality: 4, phase: "exercise" }).success).toBe(false);
    expect(reviewSchema.safeParse({ quality: 4, direction: "up" }).success).toBe(false);
  });

  it("rounds and clamps the think time instead of losing the grade", () => {
    expect(reviewSchema.parse({ quality: 4, thinkMs: 1234.6 }).thinkMs).toBe(1235);
    expect(reviewSchema.parse({ quality: 4, thinkMs: 900_000 }).thinkMs).toBe(600_000);
  });
});
