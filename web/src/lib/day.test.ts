import { describe, expect, it } from "vitest";
import { dayStart, learnerDay, learnerDayNumber, learnerDayStart } from "./day";

// Every date here is built in the device's own zone, so the tests hold wherever they run.
const local = (day: number, hour: number, minute = 0) => new Date(2026, 8, day, hour, minute).getTime();

describe("learnerDay", () => {
  it("turns over at 04:00, not at midnight", () => {
    expect(learnerDay(local(24, 23, 10))).toBe("2026-09-24");
    // 00:30 on the 25th still belongs to the evening of the 24th
    expect(learnerDay(local(25, 0, 30))).toBe("2026-09-24");
    expect(learnerDay(local(25, 3, 59))).toBe("2026-09-24");
    expect(learnerDay(local(25, 4, 0))).toBe("2026-09-25");
  });

  it("crosses a month boundary", () => {
    expect(learnerDay(new Date(2026, 9, 1, 1, 0).getTime())).toBe("2026-09-30");
  });
});

describe("learnerDayStart / dayStart", () => {
  it("starts the day at 04:00 local, and the next ones a day apart", () => {
    expect(learnerDayStart(local(24, 23, 10))).toBe(local(24, 4));
    expect(learnerDayStart(local(25, 0, 30))).toBe(local(24, 4));
    expect(learnerDayStart(local(24, 23, 10), 1)).toBe(local(25, 4));
    expect(dayStart("2026-09-24", 1)).toBe(local(25, 4));
    expect(dayStart("2026-09-30", 1)).toBe(new Date(2026, 9, 1, 4).getTime());
  });
});

describe("learnerDayNumber", () => {
  it("is the same all learner day and one more the next", () => {
    expect(learnerDayNumber(local(25, 0, 30))).toBe(learnerDayNumber(local(24, 9)));
    expect(learnerDayNumber(local(25, 4))).toBe(learnerDayNumber(local(24, 9)) + 1);
  });
});
