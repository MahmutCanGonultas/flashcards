import { describe, expect, it } from "vitest";
import { PROMPT_KEY, dismissPrompt, promptDismissed } from "./reminderPrompt";

const NOW = new Date(2026, 8, 24, 23, 10).getTime();
const DAY = 86_400_000;

/** A storage that outlives the page, the way localStorage survives a reload. */
function memoryStore() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

const throwing = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("the reminder prompt's dismissal", () => {
  it("asks when nothing is stored", () => {
    expect(promptDismissed(NOW, memoryStore())).toBe(false);
  });

  it("stays quiet for a week after 'Şimdi değil', across a reload", () => {
    const store = memoryStore();
    dismissPrompt(NOW, store);
    expect(store.getItem(PROMPT_KEY)).toBe(String(NOW));
    // A reload reads the same storage afresh.
    expect(promptDismissed(NOW + 1_000, store)).toBe(true);
    expect(promptDismissed(NOW + 6 * DAY, store)).toBe(true);
    expect(promptDismissed(NOW + 7 * DAY, store)).toBe(false);
  });

  it("ignores a storage that throws, and simply asks", () => {
    expect(() => dismissPrompt(NOW, throwing)).not.toThrow();
    expect(promptDismissed(NOW, throwing)).toBe(false);
    expect(promptDismissed(NOW, null)).toBe(false);
  });

  it("reads a stored value it can't make sense of as never dismissed", () => {
    const store = memoryStore();
    store.setItem(PROMPT_KEY, "soon");
    expect(promptDismissed(NOW, store)).toBe(false);
  });
});
