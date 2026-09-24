import { LEARN_GAP_1, LEARN_GAP_2, learnStep, placeLater, repeatOf, type Exercise } from "./practice";

/**
 * What happens after an answer on the cards, within the round.
 *
 * A new word is asked up to three times in the round it is met (its
 * learning steps: practice.ts buildSession), none of them graded. At its
 * second right answer — normally the second ask — it is written to the
 * schedule once, as learned: back tomorrow. A miss sends the same ask back
 * a few cards later, its sentence on the front, and the word needs two
 * right answers again from there. A word asked six times without two right
 * answers is let go for the day; when the round ends it is written as not
 * yet learned, and tomorrow it is an ordinary review with its sentence to
 * help. A word only met is written nothing: it is met again next time.
 *
 * A review that is missed comes back twice more in the round: with its
 * sentence first, then without, until it has been got twice running.
 */

export { LEARN_GAP_1, LEARN_GAP_2 };
/** Cards between a miss and its second chance. */
export const RETRY_GAP = 3;
/** Asks a new word gets in its first round, the meeting not counted. */
export const MAX_ASKS_NEW = 6;
/** Cards between a repeat got right and the last one without help. */
export const RELEARN_GAP = 5;
/** Extra asks a missed review gets in a round. */
export const MAX_EXTRAS = 4;

/** One new word in its first round. */
export type LearnState = { asks: number; correct: number; misses: number; written: boolean };

export const freshLearning = (): LearnState => ({ asks: 0, correct: 0, misses: 0, written: false });

export type LearnOutcome = {
  plan: Exercise[];
  state: LearnState;
  /** The one write to the schedule, at the second right answer: 4 without a miss before it, 3 with. */
  write: 3 | 4 | null;
};

const laterSteps = (plan: Exercise[], index: number, cardId: number, k?: 1 | 2 | 3) =>
  plan.some((s, i) => i > index && s.cardId === cardId && s.learn !== undefined && (k === undefined || s.learn === k));

/**
 * A new word's forward ask put back in the round: `gap` cards on, but not
 * as the round's last card while another could still follow it — the
 * reverse ask that closes the word needs a place after it.
 */
function placeForward(plan: Exercise[], index: number, step: Exercise, gap: number): Exercise[] {
  const next = placeLater(plan, index, step, gap);
  if (next[next.length - 1] !== step || plan.length - index < 3) return next;
  const sooner = placeLater(plan, index, step, plan.length - index - 2);
  return sooner === plan ? next : sooner;
}

/**
 * After an answer on a learning step. Bildim and Zorlandım both count as
 * right; the reverse ask at the end is practice, so a miss there brings one
 * more reverse ask and nothing else.
 */
export function afterLearnAnswer(plan: Exercise[], index: number, step: Exercise, grade: 1 | 3 | 4 | 5, state: LearnState = freshLearning()): LearnOutcome {
  const k = step.learn ?? 1;
  const asks = state.asks + 1;
  const room = asks < MAX_ASKS_NEW;

  if (grade >= 3) {
    const correct = state.correct + 1;
    const write = correct === 2 && !state.written ? (state.misses === 0 ? 4 : 3) : null;
    let next = plan;
    if (room && correct < 2 && !laterSteps(plan, index, step.cardId)) {
      // Right once, and nothing more asked of it: the second ask, a few cards on.
      next = placeForward(plan, index, learnStep(step.cardId, 2, { again: asks }), LEARN_GAP_2);
    } else if (room && correct >= 2 && k !== 3 && !laterSteps(plan, index, step.cardId, 3)) {
      // Learned, but the reverse ask went with the miss: it closes the round again.
      next = placeLater(plan, index, learnStep(step.cardId, 3, { again: asks }), plan.length);
    }
    return { plan: next, state: { asks, correct, misses: state.misses, written: state.written || write !== null }, write };
  }

  const misses = state.misses + 1;
  if (k === 3) {
    const next = room && step.attempt === 0 ? placeLater(plan, index, learnStep(step.cardId, 3, { attempt: 1, again: asks, support: true }), RETRY_GAP) : plan;
    return { plan: next, state: { ...state, asks, misses }, write: null };
  }
  // Missed: what was still to come for it goes, and the same ask comes back with its sentence.
  let next = plan.filter((s, i) => i <= index || s.cardId !== step.cardId || s.learn === undefined);
  if (room) next = placeForward(next, index, learnStep(step.cardId, k, { attempt: step.attempt + 1, again: asks, support: true }), RETRY_GAP);
  return { plan: next, state: { ...state, asks, misses }, write: null };
}

/**
 * The new words to write as not learned yet when the round ends or is
 * left: asked at least once, never written. Each is taken once — `written`
 * holds every word already sent, and the ones returned are added to it.
 */
export function takeUnwritten(states: ReadonlyMap<number, LearnState>, written: Set<number>): number[] {
  const ids: number[] = [];
  for (const [id, state] of states) {
    if (state.asks === 0 || state.written || written.has(id)) continue;
    written.add(id);
    ids.push(id);
  }
  return ids;
}

/** A reviewed word in the round: extra asks so far, and right answers running since its last miss. */
export type Tally = { extras: number; streak: number };

/**
 * After an answer on a review (or a flip that isn't graded): a miss comes
 * back three cards later with its sentence to help; got right there, once
 * more five cards later without it; the word leaves once it has been got
 * twice running. A missed repeat starts the count again. Four extra asks at
 * most, and never straight after itself: then it waits for tomorrow, when
 * it is due anyway.
 */
export function afterReviewAnswer(plan: Exercise[], index: number, step: Exercise, grade: 1 | 3 | 4 | 5, tally: Tally = { extras: 0, streak: 0 }): { plan: Exercise[]; tally: Tally } {
  const again = (support: boolean, gap: number, streak: number) => {
    if (tally.extras >= MAX_EXTRAS) return { plan, tally: { ...tally, streak } };
    const next = placeLater(plan, index, repeatOf(step, tally.extras + 1, support), gap);
    return { plan: next, tally: { extras: tally.extras + (next === plan ? 0 : 1), streak } };
  };
  if (grade === 1) return again(true, RETRY_GAP, 0);
  // Known at the first ask: nothing more to do.
  if (step.attempt === 0) return { plan, tally };
  const streak = tally.streak + 1;
  if (streak >= 2) return { plan, tally: { ...tally, streak } };
  return again(false, RELEARN_GAP, streak);
}
