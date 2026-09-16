import { describe, it, expect } from "vitest";
import { calculateSrs } from "./srs.service.js";

describe("calculateSrs", () => {
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
});
