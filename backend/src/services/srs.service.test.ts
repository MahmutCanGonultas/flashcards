import { describe, it, expect } from "vitest";
import { addsLapse, calculateSrs } from "./srs.service.js";

describe("classic", () => {
  it("bilemediğinde (not < 3) sıfırlar ve on dakika sonraya atar", () => {
    const before = Date.now();
    const result = calculateSrs({
      repetitions: 5,
      interval: 30,
      easeFactor: 2.5,
      quality: 2,
    });
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    const minutesAhead = (result.dueDate.getTime() - before) / 60_000;
    expect(minutesAhead).toBeGreaterThan(9);
    expect(minutesAhead).toBeLessThan(11);
  });

  it("bildiğinde yarının başına atar (İstanbul saatiyle), on dakikaya değil", () => {
    const result = calculateSrs({ repetitions: 0, interval: 0, easeFactor: 2.5, quality: 4 });
    // Yarın 00:00 İstanbul = bugün 21:00 UTC (yaz/kış fark etmez, +03:00).
    const now = Date.now();
    expect(result.dueDate.getTime()).toBeGreaterThan(now);
    expect(result.dueDate.getTime() - now).toBeLessThanOrEqual(24 * 3_600_000);
    expect(result.dueDate.getUTCHours()).toBe(21);
    expect(result.dueDate.getUTCMinutes()).toBe(0);
  });

  it("ilk doğru bilişte interval 1 olur", () => {
    const result = calculateSrs({
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      quality: 4,
    });
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("ikinci doğru bilişte interval 6 olur", () => {
    const result = calculateSrs({
      repetitions: 1,
      interval: 1,
      easeFactor: 2.5,
      quality: 4,
    });
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it("üçüncü doğru bilişte interval = eski × ease olur", () => {
    const result = calculateSrs({
      repetitions: 2,
      interval: 6,
      easeFactor: 2.5,
      quality: 4,
    });
    expect(result.interval).toBe(15); // 6 × 2.5
  });

  it("easeFactor 1.3'ün altına inmez", () => {
    const result = calculateSrs({
      repetitions: 5,
      interval: 30,
      easeFactor: 1.3,
      quality: 3,
    });
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("dueDate gelecekte bir tarih döndürür", () => {
    const result = calculateSrs({
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      quality: 5,
    });
    expect(result.dueDate.getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it("bilemediği her tekrar unutma sayılır", () => {
    expect(calculateSrs({ repetitions: 1, interval: 1, easeFactor: 2.5, quality: 1 }).lapse).toBe(true);
    expect(calculateSrs({ repetitions: 1, interval: 1, easeFactor: 2.5, quality: 3 }).lapse).toBe(false);
  });
});

describe("addsLapse", () => {
  it("never counts a new word's first write, even under 'classic' (the rollback)", () => {
    const notYet = calculateSrs({ repetitions: 0, interval: 0, easeFactor: 2.5, quality: 1, phase: "learn" });
    expect(notYet.lapse).toBe(true);
    expect(addsLapse(notYet, "learn", false)).toBe(false);
  });

  it("counts a real lapse, and 'learn' on a started word is a review", () => {
    const missed = calculateSrs({ repetitions: 3, interval: 15, easeFactor: 2.5, quality: 1 });
    expect(addsLapse(missed, "review", true)).toBe(true);
    expect(addsLapse(missed, undefined, true)).toBe(true);
    expect(addsLapse(missed, "learn", true)).toBe(true);
    expect(addsLapse({ lapse: false }, "review", true)).toBe(false);
  });
});

describe("gentle", () => {
  // 23:10 in Istanbul on 24 September: the learner day is the 24th.
  const now = new Date("2026-09-24T20:10:00Z");
  const run = (
    repetitions: number,
    interval: number,
    quality: number,
    extra: { easeFactor?: number; phase?: "learn" | "review"; direction?: "fwd" | "rev"; at?: Date } = {},
  ) =>
    calculateSrs(
      { repetitions, interval, easeFactor: extra.easeFactor ?? 2.5, quality, phase: extra.phase, direction: extra.direction },
      { policy: "gentle", now: extra.at ?? now },
    );

  it("learn on a new word: remembered gives the first rung, due tomorrow at 04:00", () => {
    const result = run(0, 0, 4, { phase: "learn" });
    expect([result.repetitions, result.interval]).toEqual([1, 1]);
    expect(result.easeFactor).toBe(2.5);
    expect(result.lapse).toBe(false);
    expect(result.dueDate.toISOString()).toBe("2026-09-25T01:00:00.000Z");
  });

  it("learn on a new word: not remembered starts again tomorrow, no lapse", () => {
    const result = run(0, 0, 1, { phase: "learn" });
    expect([result.repetitions, result.interval]).toEqual([0, 1]);
    expect(result.easeFactor).toBe(2.5);
    expect(result.lapse).toBe(false);
  });

  it("Bildim climbs the ladder 1, 3, 7, then multiplies", () => {
    expect(pick(run(1, 1, 5))).toEqual([2, 3, 2.5]);
    expect(pick(run(2, 3, 5))).toEqual([3, 7, 2.5]);
    expect(pick(run(3, 7, 5))).toEqual([4, 18, 2.6]);
    expect(pick(run(3, 7, 4))).toEqual([4, 18, 2.5]);
  });

  it("Zorlandım holds the rung and stretches the gap a little", () => {
    expect(pick(run(1, 1, 3))).toEqual([1, 2, 2.35]);
    expect(pick(run(3, 7, 3)).slice(0, 2)).toEqual([3, 8]);
    expect(pick(run(0, 1, 3)).slice(0, 2)).toEqual([1, 2]);
    expect(run(4, 18, 3).interval).toBe(22);
  });

  it("a forward miss on a settled word is a lapse", () => {
    const result = run(4, 18, 1, { direction: "fwd" });
    expect(pick(result)).toEqual([1, 1, 2.3]);
    expect(result.lapse).toBe(true);
    expect(result.dueDate.toISOString()).toBe("2026-09-25T01:00:00.000Z");
  });

  it("a forward miss on the first rung is no lapse and keeps the ease", () => {
    const result = run(1, 1, 1, { direction: "fwd" });
    expect(pick(result)).toEqual([1, 1, 2.5]);
    expect(result.lapse).toBe(false);
  });

  it("a reverse miss is no lapse, only a lower ease", () => {
    const result = run(2, 3, 1, { direction: "rev" });
    expect(pick(result)).toEqual([1, 1, 2.35]);
    expect(result.lapse).toBe(false);
  });

  it("a miss on a word written as not remembered stays at 0/1", () => {
    const result = run(0, 1, 1);
    expect(pick(result)).toEqual([0, 1, 2.5]);
    expect(result.lapse).toBe(false);
  });

  it("a legacy 2/6 card joins the ladder", () => {
    expect(pick(run(2, 6, 4)).slice(0, 2)).toEqual([3, 7]);
  });

  it("'learn' on a started card counts as a review", () => {
    expect(pick(run(1, 1, 4, { phase: "learn" }))).toEqual(pick(run(1, 1, 4)));
    expect(run(2, 3, 1, { phase: "learn" }).interval).toBe(1);
  });

  it("the due date follows the learner day, not midnight", () => {
    // 00:40 in Istanbul still belongs to the 24th.
    expect(run(0, 0, 4, { phase: "learn", at: new Date("2026-09-24T21:40:00Z") }).dueDate.toISOString()).toBe(
      "2026-09-25T01:00:00.000Z",
    );
    // 05:00 on the 25th is the 25th.
    expect(run(0, 0, 4, { phase: "learn", at: new Date("2026-09-25T02:00:00Z") }).dueDate.toISOString()).toBe(
      "2026-09-26T01:00:00.000Z",
    );
  });

  it("the ease never goes below 1.3", () => {
    expect(run(1, 1, 3, { easeFactor: 1.35 }).easeFactor).toBe(1.3);
    expect(run(5, 20, 1, { easeFactor: 1.4 }).easeFactor).toBe(1.3);
  });
});

function pick(result: { repetitions: number; interval: number; easeFactor: number }) {
  return [result.repetitions, result.interval, result.easeFactor];
}
