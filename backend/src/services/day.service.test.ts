import { describe, it, expect } from "vitest";
import { dayStart, learnerDay } from "./day.service.js";

describe("learnerDay", () => {
  it("is the local date in the evening", () => {
    // 23:10 in Istanbul.
    expect(learnerDay(new Date("2026-09-24T20:10:00Z"))).toBe("2026-09-24");
  });

  it("still belongs to the evening before just after midnight", () => {
    // 00:40 on the 25th in Istanbul.
    expect(learnerDay(new Date("2026-09-24T21:40:00Z"))).toBe("2026-09-24");
  });

  it("turns over at 04:00 local", () => {
    expect(learnerDay(new Date("2026-09-25T00:59:00Z"))).toBe("2026-09-24");
    expect(learnerDay(new Date("2026-09-25T01:01:00Z"))).toBe("2026-09-25");
  });
});

describe("dayStart", () => {
  it("is 04:00 local of the day after", () => {
    expect(dayStart("2026-09-24", 1).toISOString()).toBe("2026-09-25T01:00:00.000Z");
  });

  it("counts from the day itself and across a month", () => {
    expect(dayStart("2026-09-24").toISOString()).toBe("2026-09-24T01:00:00.000Z");
    expect(dayStart("2026-09-30", 2).toISOString()).toBe("2026-10-02T01:00:00.000Z");
  });

  it("starts the learner day it names", () => {
    const start = dayStart("2026-09-24", 1);
    expect(learnerDay(start)).toBe("2026-09-25");
    expect(learnerDay(new Date(start.getTime() - 1000))).toBe("2026-09-24");
  });
});
