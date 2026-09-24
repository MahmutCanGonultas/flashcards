import { describe, it, expect } from "vitest";
import { type LogRow, statsFrom } from "./stats.service.js";

const row = (quality: number, extra: Partial<LogRow> = {}): LogRow => ({ quality, kind: "recall", phase: "review", scheduled: true, ...extra });

describe("statsFrom", () => {
  it("splits graded reviews by grade and keeps 'remembered' for old clients", () => {
    const stats = statsFrom([row(5), row(4), row(3), row(1), row(0, { kind: null, phase: null })]);
    expect(stats).toMatchObject({ reviews: 5, knew: 2, hard: 1, missed: 2, remembered: 3 });
  });

  it("leaves practice out of the reviews and counts typed exercises apart", () => {
    const stats = statsFrom([
      row(4),
      row(5, { scheduled: false, phase: "learn-step" }),
      row(1, { scheduled: false, phase: "relearn" }),
      row(5, { scheduled: false, phase: "exercise", kind: "produce" }),
      row(4, { scheduled: false, phase: "exercise", kind: "cloze" }),
      row(3, { scheduled: false, phase: "exercise", kind: "chunk" }),
      row(1, { scheduled: false, phase: "exercise", kind: "own" }),
      row(5, { scheduled: false, phase: "exercise", kind: "listen" }),
      row(5, { scheduled: false, phase: "drill", kind: "cloze" }),
    ]);
    expect(stats).toEqual({ reviews: 1, knew: 1, hard: 0, missed: 0, remembered: 1, typed: 4, typedRight: 2 });
  });

  it("counts neither a new word's learning write nor an exercise retry", () => {
    // The first day: three words met and written, no review yet; one exercise missed, then right with the Turkish open.
    const stats = statsFrom([
      row(4, { kind: "learn", phase: "learn" }),
      row(3, { kind: "learn", phase: "learn" }),
      row(1, { kind: "learn", phase: "learn" }),
      row(1, { scheduled: false, phase: "exercise", kind: "cloze" }),
      row(5, { scheduled: false, phase: "exercise", kind: "cloze-retry" }),
    ]);
    expect(stats).toEqual({ reviews: 0, knew: 0, hard: 0, missed: 0, remembered: 0, typed: 1, typedRight: 0 });
  });

  it("is all zeros for a quiet week", () => {
    expect(statsFrom([])).toEqual({ reviews: 0, knew: 0, hard: 0, missed: 0, remembered: 0, typed: 0, typedRight: 0 });
  });
});
