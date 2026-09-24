import { describe, expect, it } from "vitest";
import { MAX_ASKS_NEW, MAX_EXTRAS, afterLearnAnswer, afterReviewAnswer, freshLearning, takeUnwritten, type LearnState } from "./learning";
import { buildSession, cardFor, learnStep, meetStep, type Exercise } from "./practice";
import { makeCard } from "./testCards";

const NOW = Date.parse("2026-09-23T09:00:00.000Z");
const due = "2026-09-23T06:00:00.000Z";
const review = (id: number) => cardFor(makeCard({ id, front: `known${id}`, repetitions: 3, interval: 7, due_date: due }), true);
const reviews = (from: number, n: number) => Array.from({ length: n }, (_, i) => review(from + i));
const ids = (plan: Exercise[]) => plan.map((s) => s.key);

/** Answers the step at `index`, as the session does, and returns what came of it. */
function answer(plan: Exercise[], index: number, grade: 1 | 3 | 4 | 5, state?: LearnState) {
  return afterLearnAnswer(plan, index, plan[index], grade, state);
}

describe("afterLearnAnswer", () => {
  // A: M_A r1 r2 r3 A1 r4..r9 A2 r10 r11 A3r, then six more reviews — room for the gaps to show.
  const A = 1;
  const base = [meetStep({ id: A }), ...reviews(201, 3), learnStep(A, 1), ...reviews(204, 6), learnStep(A, 2), ...reviews(210, 2), learnStep(A, 3)];
  const plan = [...base, ...reviews(212, 6)];
  const at = (p: Exercise[], key: string) => p.findIndex((s) => s.key === key);

  it("writes a word once, with a 4, at its second right answer", () => {
    const first = answer(plan, 4, 5);
    expect(first.write).toBeNull();
    expect(first.plan).toBe(plan);
    const second = answer(plan, 11, 4, first.state);
    expect(second.write).toBe(4);
    expect(second.state).toMatchObject({ asks: 2, correct: 2, misses: 0, written: true });
    const third = answer(plan, 14, 5, second.state);
    expect(third.write).toBeNull();
  });

  it("after a miss: the same ask with its sentence three cards on, the second ask five after that, a 3, and the reverse last", () => {
    const missed = answer(plan, 4, 1);
    // what was still to come for the word is gone; the retry sits three cards on
    expect(missed.plan.filter((s) => s.cardId === A).map((s) => s.key)).toEqual(["1:meet", "1:learn1", "1:learn1:again1"]);
    const retryAt = at(missed.plan, "1:learn1:again1");
    expect(retryAt).toBe(8);
    expect(missed.plan[retryAt]).toMatchObject({ learn: 1, attempt: 1, support: true, graded: false });

    const got = answer(missed.plan, retryAt, 3, missed.state);
    expect(got.write).toBeNull();
    const secondAt = at(got.plan, "1:learn2:again2");
    expect(secondAt).toBe(retryAt + 6);
    expect(got.plan[secondAt]).toMatchObject({ learn: 2, attempt: 0 });

    const learned = answer(got.plan, secondAt, 5, got.state);
    expect(learned.write).toBe(3);
    expect(learned.plan[learned.plan.length - 1]).toMatchObject({ cardId: A, learn: 3, kind: "reverse" });
  });

  it("writes at the reverse ask when the second ask had no room (r1 M_A r2 A1 A3r)", () => {
    const round = buildSession(
      [makeCard({ id: 201, front: "a", repetitions: 3, interval: 7, due_date: due }), makeCard({ id: 202, front: "b", repetitions: 3, interval: 7, due_date: due }), makeCard({ id: 101, front: "word", due_date: due })],
      { mode: "due", now: NOW },
    );
    expect(ids(round)).toEqual(["201:0", "101:meet", "202:0", "101:learn1", "101:learn3"]);
    const first = answer(round, 3, 5);
    expect(first.write).toBeNull();
    expect(first.plan).toBe(round);
    const last = answer(round, 4, 5, first.state);
    expect(last.write).toBe(4);
  });

  it("keeps the reverse ask for a word missed once on the first day (M_A M_B M_C A1 B1 C1 A2 B2 C2 A3r B3r C3r)", () => {
    const words = [1280, 1285, 1286].map((id) => makeCard({ id, front: `w${id}`, due_date: due }));
    let round = buildSession(words, { mode: "due", now: NOW });
    const states = new Map<number, LearnState>();
    // Every word right at every ask, except available's first ask.
    for (let i = 0; i < round.length; i++) {
      const step = round[i];
      if (!step.learn) continue;
      const grade = step.key === "1285:learn1" ? 1 : 5;
      const outcome = afterLearnAnswer(round, i, step, grade, states.get(step.cardId));
      states.set(step.cardId, outcome.state);
      round = outcome.plan;
    }
    const available = round.filter((s) => s.cardId === 1285).map((s) => s.key);
    expect(available).toContain("1285:learn3:again3");
    expect(states.get(1285)).toMatchObject({ correct: 3, misses: 1, written: true });
    // Never twice in a row.
    expect(round.every((s, i) => i === 0 || s.cardId !== round[i - 1].cardId)).toBe(true);
  });

  it("stops asking after six asks without two right, and the word is written as not learned when the round ends", () => {
    let p = plan;
    let state = freshLearning();
    let index = 4;
    for (let ask = 1; ask <= MAX_ASKS_NEW; ask++) {
      const outcome = answer(p, index, 1, state);
      expect(outcome.write).toBeNull();
      p = outcome.plan;
      state = outcome.state;
      const nextAt = p.findIndex((s, i) => i > index && s.cardId === A);
      if (ask < MAX_ASKS_NEW) expect(nextAt).toBeGreaterThan(index);
      else expect(nextAt).toBe(-1);
      index = nextAt;
    }
    expect(state).toMatchObject({ asks: 6, correct: 0, misses: 6, written: false });
    expect(takeUnwritten(new Map([[A, state]]), new Set())).toEqual([A]);
  });

  it("gives a missed reverse ask exactly one more, and never writes for it", () => {
    const first = answer(base, 4, 5);
    const second = answer(base, 11, 5, first.state);
    const missed = answer(base, 14, 1, second.state);
    expect(missed.write).toBeNull();
    // the reverse ask was the last card: back three on would be straight after itself, so none
    expect(missed.plan).toBe(base);

    // with room after it, one reverse retry comes, and missing that brings nothing more
    const once = answer(plan, 14, 1, second.state);
    const againAt = once.plan.findIndex((s) => s.key === "1:learn3:again3");
    expect(once.plan[againAt]).toMatchObject({ kind: "reverse", attempt: 1 });
    const twice = answer(once.plan, againAt, 1, once.state);
    expect(twice.plan).toBe(once.plan);
    expect(twice.write).toBeNull();
    expect(takeUnwritten(new Map([[A, twice.state]]), new Set())).toEqual([]);
  });
});

describe("takeUnwritten", () => {
  it("writes nothing for a word that was only met", () => {
    expect(takeUnwritten(new Map([[1, freshLearning()]]), new Set())).toEqual([]);
  });

  it("takes each word once: the summary and then leaving write it a single time", () => {
    const asked = new Map<number, LearnState>([
      [1, { asks: 2, correct: 1, misses: 1, written: false }],
      [2, { asks: 2, correct: 2, misses: 0, written: true }],
    ]);
    const written = new Set<number>();
    expect(takeUnwritten(asked, written)).toEqual([1]);
    expect(takeUnwritten(asked, written)).toEqual([]);
  });
});

describe("afterReviewAnswer", () => {
  const plan = reviews(201, 12);

  it("brings a miss back three cards later with its sentence", () => {
    const { plan: next, tally } = afterReviewAnswer(plan, 0, plan[0], 1);
    expect(next[4]).toMatchObject({ cardId: 201, support: true, graded: false, relearn: true, attempt: 1 });
    expect(tally).toEqual({ extras: 1, streak: 0 });
  });

  it("asks once more without help after a right repeat, then lets it go", () => {
    const missed = afterReviewAnswer(plan, 0, plan[0], 1);
    const right = afterReviewAnswer(missed.plan, 4, missed.plan[4], 5, missed.tally);
    expect(right.plan[10]).toMatchObject({ cardId: 201, support: false, attempt: 2 });
    const again = afterReviewAnswer(right.plan, 10, right.plan[10], 3, right.tally);
    expect(again.plan).toBe(right.plan);
  });

  it("starts over after a missed repeat", () => {
    const missed = afterReviewAnswer(plan, 0, plan[0], 1);
    const missedAgain = afterReviewAnswer(missed.plan, 4, missed.plan[4], 1, missed.tally);
    expect(missedAgain.plan[8]).toMatchObject({ cardId: 201, support: true, attempt: 2 });
  });

  it("never asks a word more than four extra times", () => {
    let p = [...plan, ...reviews(301, 20)];
    let tally = { extras: 0, streak: 0 };
    let index = 0;
    for (let i = 0; i < 8; i++) {
      const outcome = afterReviewAnswer(p, index, p[index], 1, tally);
      p = outcome.plan;
      tally = outcome.tally;
      const nextAt = p.findIndex((s, j) => j > index && s.cardId === 201);
      if (nextAt === -1) break;
      index = nextAt;
    }
    expect(p.filter((s) => s.cardId === 201)).toHaveLength(1 + MAX_EXTRAS);
  });

  it("adds nothing for a miss on the last card", () => {
    expect(afterReviewAnswer(plan, plan.length - 1, plan[plan.length - 1], 1).plan).toBe(plan);
  });

  it("does nothing for a word known at the first ask", () => {
    expect(afterReviewAnswer(plan, 0, plan[0], 5).plan).toBe(plan);
  });
});
