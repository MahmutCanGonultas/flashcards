import { learnerDay } from "./day";

/**
 * Which of today's pieces of work are done, for the ones the server doesn't
 * count: the reading, the translation, the week's test, the look back and
 * the grammar reminder. Kept on this device for the learner day only; with
 * no storage (private mode) nothing is ticked, and nothing breaks.
 */
export type DoneTask = "reading" | "translation" | "test" | "lookback" | "grammar";

const keyFor = (day: string) => `kelimece:done:${day}`;

export function doneToday(day = learnerDay()): ReadonlySet<DoneTask> {
  try {
    const raw = localStorage.getItem(keyFor(day));
    return new Set(raw ? (JSON.parse(raw) as DoneTask[]) : []);
  } catch {
    return new Set();
  }
}

export function markDone(task: DoneTask, day = learnerDay()): void {
  try {
    const done = new Set(doneToday(day));
    done.add(task);
    localStorage.setItem(keyFor(day), JSON.stringify([...done]));
  } catch {
    /* not kept */
  }
}
