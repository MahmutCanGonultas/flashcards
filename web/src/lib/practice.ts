import type { Card } from "../types";
import { isFormOf, splitOnWord } from "./sentence";
import { isDueAt, isLeech, stageOf } from "./memory";
import { hasStarted } from "./path";
import { learnerDay, learnerDayStart } from "./day";
import { chunksOf, linesOf, unlockedTier, type Tier } from "./senses";

/**
 * The practice engine: the cards ("Tekrar et") and, apart from them, the
 * exercises ("Egzersiz").
 *
 * The cards are plain flashcards, and only they move the schedule. At most
 * three new words come in a round. Each is met first (its sentence, a
 * guess, then its core meaning), then asked three times at growing gaps
 * with other cards in between — the last time from the Turkish — and
 * written to the schedule once, at its second right answer (the learning
 * steps: learning.ts). Every other word is flipped: the word on the front
 * and its meaning on the back, or on alternate reviews the other way
 * round, graded by the learner. A miss comes back twice more in the round,
 * its sentence on the front the first time; only the first answer is
 * written to the schedule.
 *
 * The exercises are where a word gets produced, and they never touch the
 * schedule: find it in its sentence (the Turkish open on the day it was
 * met), complete one of its phrases, type it from its Turkish, fill it into
 * the learner's own sentence, or catch it by ear. Only words already met
 * are asked, only in the senses the cards have opened (senses.ts), and a
 * miss comes back as the same question.
 *
 * A typed answer is marked by the app, not by the learner: right (5), the
 * right word in the wrong form (4), a small slip (3), wrong (1).
 */

export type Kind = "meet" | "recall" | "reverse" | "listen" | "produce" | "cloze" | "chunk" | "own" | "write";

/** Kinds answered by typing; the rest are flipped or read. */
export const TYPED_KINDS: ReadonlySet<Kind> = new Set<Kind>(["produce", "cloze", "chunk", "own"]);

export const KIND_LABEL: Record<Kind, string> = {
  meet: "Yeni kelime",
  recall: "Ne demek?",
  reverse: "İngilizcesi ne?",
  listen: "Dinle",
  produce: "İngilizcesi?",
  cloze: "Boşluğu doldur",
  chunk: "Kalıbı tamamla",
  own: "Senin cümlen",
  write: "Kendi cümlen",
};

/** Which way a card is asked: the word to its Turkish, or the Turkish to the word. */
export type Direction = "fwd" | "rev";

/** A sentence (or a chunk) with the word cut out of it. */
export type Gap = {
  before: string;
  /** Exactly what was cut, as the sentence needs it: "committed", not "commit". */
  answer: string;
  after: string;
  /** The Turkish that goes with it, if any. */
  translation: string | null;
};

export type Exercise = {
  /** Unique within the session. */
  key: string;
  cardId: number;
  kind: Kind;
  /** Whether answering writes to the schedule. At most one step per card per session does. */
  graded: boolean;
  /** 0 for the first ask; 1 and up for a repeat after a miss. */
  attempt: number;
  /** A flip's way round; a forward card when unset. */
  direction?: Direction;
  /** A new word's learning step: 1 and 2 forward, 3 the reverse that closes the round. */
  learn?: 1 | 2 | 3;
  /** A missed word asked again in the round. */
  relearn?: boolean;
  /** A word not due, flipped to space out the new ones. Never graded. */
  filler?: boolean;
  /** cloze, chunk and own: where the word goes. */
  gap?: Gap;
  /** cloze: the Turkish shows from the start (early on) rather than behind a tap. */
  openTranslation?: boolean;
  /** A forward flip after a miss: the word's sentence under it on the front. */
  support?: boolean;
  /** Passed once without an answer and put back at the end of the round. */
  skipped?: boolean;
};

function gapIn(text: string, headword: string, translation: string | null): Gap | null {
  const parts = splitOnWord(text, headword);
  return parts ? { before: parts.before, answer: parts.match, after: parts.after, translation } : null;
}

const present = <T,>(value: T | null): value is T => value !== null;

/** The card's sentences, up to `tier`, that the word can be cut out of. */
export const sentenceGaps = (card: Card, tier: Tier): Gap[] => linesOf(card, tier).map((line) => gapIn(line.en, card.front, line.tr)).filter(present);

/** The chunks it lives in ("commit a crime"), up to `tier`, cut the same way, their Turkish as the cue. */
export const chunkGaps = (card: Card, tier: Tier): Gap[] => chunksOf(card, tier).map((chunk) => gapIn(chunk.en, card.front, chunk.tr)).filter(present);

/** The learner's own sentence, if they wrote one and the word can be found in it. */
export const ownGap = (card: Card): Gap | null => (card.my_sentence ? gapIn(card.my_sentence, card.front, null) : null);

/** Rotates the question from one review to the next, stable within a day. */
function rotate<T>(options: T[], card: Card, day: number, salt = 0): T {
  const seed = card.id * 7 + card.repetitions * 13 + (card.lapses ?? 0) * 5 + day + salt;
  return options[((seed % options.length) + options.length) % options.length];
}

type Shape = Omit<Exercise, "key" | "cardId" | "graded" | "attempt">;

/* ------------------------------------------------------------ the cards -- */

/**
 * The way round a word is asked on its review: the Turkish to the word on
 * every other success (the second, the fourth…), the word to its Turkish
 * otherwise. Zorlandım keeps the count, so the same way comes again; a
 * miss sets it back to one, so the word is asked forward next.
 */
export const directionOf = (card: Pick<Card, "repetitions">): Direction => (card.repetitions >= 2 && card.repetitions % 2 === 0 ? "rev" : "fwd");

const flipKind = (direction: Direction): Kind => (direction === "rev" ? "reverse" : "recall");

/**
 * A word on the cards, the way round directionOf says. Not yet learned the
 * day it was met, or missed again and again, its sentence comes along on
 * the front to help.
 */
export function cardFor(card: Card, graded: boolean): Exercise {
  const direction = directionOf(card);
  const step: Exercise = { key: `${card.id}:0`, cardId: card.id, kind: flipKind(direction), graded, attempt: 0, direction };
  return (stageOf(card) === "learning" && card.repetitions === 0) || isLeech(card) ? { ...step, support: true } : step;
}

/** Meeting a new word: never graded. */
export const meetStep = (card: Pick<Card, "id">): Exercise => ({ key: `${card.id}:meet`, cardId: card.id, kind: "meet", graded: false, attempt: 0 });

/**
 * A new word's learning step `k`: forward the first two times, from the
 * Turkish the third. Never graded: the word is written to the schedule once,
 * by learning.ts. `again` makes the key of a step asked more than once unique.
 */
export function learnStep(cardId: number, k: 1 | 2 | 3, { attempt = 0, again, support }: { attempt?: number; again?: number; support?: boolean } = {}): Exercise {
  const direction: Direction = k === 3 ? "rev" : "fwd";
  const step: Exercise = {
    key: again === undefined ? `${cardId}:learn${k}` : `${cardId}:learn${k}:again${again}`,
    cardId,
    kind: flipKind(direction),
    graded: false,
    attempt,
    direction,
    learn: k,
  };
  return support ? { ...step, support } : step;
}

/** A word that isn't due, flipped between a new word's steps so they aren't asked back to back. */
const fillerOf = (card: Card): Exercise => {
  const direction = directionOf(card);
  return { key: `${card.id}:filler`, cardId: card.id, kind: flipKind(direction), graded: false, attempt: 0, direction, filler: true };
};

/** New words in one round of cards; the server sends no more than this in a day either. */
export const NEW_PER_ROUND = 3;
/** Other cards between a new word's meeting and its first ask. */
export const LEARN_GAP_1 = 3;
/** Other cards between its first ask and its second. */
export const LEARN_GAP_2 = 5;
/** Words not due that may be flipped to keep the gaps: only when nothing else is left. */
export const MAX_FILLERS = 4;

export type SessionMode = "due" | "all";

/**
 * A round of cards, built once when it starts.
 *
 * With no new word it is the reviews in the order they fell due. With new
 * words (three at most): one review first to warm up, the new words met one
 * after another, then every place goes to the first learning step whose gap
 * has passed — three other cards after the meeting, five after the first
 * ask — or else to the next review; with no review left, to a word that
 * isn't due (a filler), and with none of those, the step that has waited
 * longest comes forward, never straight after its own word. A second ask
 * that could only come straight after the first is left out. The reverse
 * asks close the round, in the order the words were met.
 *
 *   0 reviews, 3 new:  M_A M_B M_C A1 B1 C1 A2 B2 C2 A3r B3r C3r
 *   3 reviews, 3 new:  r1 M_A M_B M_C r2 A1 B1 C1 r3 A2 B2 C2 A3r B3r C3r
 *
 * "all" is going through the cards whenever you like: only words already
 * met, and only the ones that are actually due are graded.
 */
export function buildSession(
  cards: Card[],
  { mode, now = Date.now(), fillers = [] }: { mode: SessionMode; now?: number; fillers?: Card[] },
): Exercise[] {
  if (mode === "all") return cards.filter(hasStarted).map((card) => cardFor(card, isDueAt(card, now)));

  const reviews = cards.filter(hasStarted).map((card) => cardFor(card, true));
  const fresh = cards
    .filter((card) => !hasStarted(card))
    .slice(0, NEW_PER_ROUND)
    .sort((a, b) => a.id - b.id);
  if (fresh.length === 0) return reviews;

  const inRound = new Set(cards.map((card) => card.id));
  const spare = fillers
    .filter((card) => hasStarted(card) && !isDueAt(card, now) && !inRound.has(card.id))
    .sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date) || a.id - b.id)
    .slice(0, MAX_FILLERS)
    .map(fillerOf);

  const plan: Exercise[] = [];
  if (reviews.length > 0) plan.push(reviews.shift()!);
  // Each new word's next step, and the place from which its gap has passed.
  type Waiting = { step: Exercise; slot: number };
  const waiting: Waiting[] = [];
  for (const card of fresh) {
    waiting.push({ step: learnStep(card.id, 1), slot: plan.length + LEARN_GAP_1 + 1 });
    plan.push(meetStep(card));
  }
  const bySlot = (a: Waiting, b: Waiting) => a.slot - b.slot;

  while (waiting.length > 0 || reviews.length > 0) {
    const at = plan.length;
    let next = waiting.filter((w) => w.slot <= at).sort(bySlot)[0];
    if (!next) {
      if (reviews.length > 0) {
        plan.push(reviews.shift()!);
        continue;
      }
      if (spare.length > 0) {
        plan.push(spare.shift()!);
        continue;
      }
      const early = [...waiting].sort(bySlot);
      next = early.find((w) => w.step.cardId !== plan[at - 1]?.cardId) ?? early[0];
      if (next.step.cardId === plan[at - 1]?.cardId && next.step.learn === 2) {
        waiting.splice(waiting.indexOf(next), 1);
        continue;
      }
    }
    waiting.splice(waiting.indexOf(next), 1);
    plan.push(next.step);
    if (next.step.learn === 1) waiting.push({ step: learnStep(next.step.cardId, 2), slot: at + LEARN_GAP_2 + 1 });
  }
  for (const card of fresh) plan.push(learnStep(card.id, 3));
  return plan;
}

/**
 * Where a step goes back in: `gap` cards later, or last if the round ends
 * sooner — but never next to a card of its own word, where the answer
 * would still be on the screen. Such a step is dropped.
 */
export function placeLater(plan: Exercise[], index: number, step: Exercise, gap: number): Exercise[] {
  const at = Math.min(plan.length, index + 1 + gap);
  if (plan[at - 1]?.cardId === step.cardId || plan[at]?.cardId === step.cardId) return plan;
  return [...plan.slice(0, at), step, ...plan.slice(at)];
}

/**
 * A missed word asked again, the same way round and never graded: the first
 * time with its sentence on the front to help, then once without.
 */
export function repeatOf(step: Exercise, attempt: number, support: boolean): Exercise {
  const direction = step.direction ?? "fwd";
  return { key: `${step.cardId}:again:${attempt}`, cardId: step.cardId, kind: flipKind(direction), graded: false, attempt, direction, relearn: true, support };
}

/** What the card's label says: where a new word is in its three asks, or that it is back. */
export function labelFor(step: Exercise): string {
  if (step.attempt > 0) return "Bir daha";
  if (step.learn === 3) return `${KIND_LABEL.reverse} · 3/3`;
  if (step.learn) return `Yeni · ${step.learn}/3`;
  return KIND_LABEL[step.kind];
}

/**
 * The line under a flip card: say the answer aloud before turning it —
 * a guess only thought is easy to call right afterwards — then the standard
 * each grade is held to. Flipped too fast three times running, it asks for
 * a moment first; it never stops anyone.
 */
export function captionFor({ kind, attempt, flipped, support = false, rushed = false }: { kind: Kind; attempt: number; flipped: boolean; support?: boolean; rushed?: boolean }): string {
  if (flipped) return kind === "reverse" ? "Kelime çevirmeden geldiyse Bildim; -ing, -s farkı sorun değil." : "Büyük yazan anlam çevirmeden geldiyse: Bildim.";
  if (rushed) return "Acele yok: önce sesli söyle, sonra çevir.";
  if (kind === "reverse") return "İngilizcesini sesli söyle, sonra çevir.";
  if (support) return "Cümle yardım etsin: anlamını sesli söyle, sonra çevir.";
  if (attempt > 0) return "Bir daha: sesli söyle, sonra çevir.";
  if (kind === "listen") return "Dinle, anlamını sesli söyle, sonra çevir.";
  return "Türkçesini sesli söyle, sonra çevir.";
}

/* -------------------------------------------------------- the exercises -- */

/** Met on the learner day of `now`. */
const introducedToday = (card: Card, now: number) => card.introduced_on === learnerDay(now);

/**
 * The ways a word can be exercised: always in the senses its cards have
 * opened. Met today, it is found in its sentence with the Turkish open, or
 * in its core chunk; learning from an earlier day, it is also produced from
 * its Turkish; once it holds, its own sentence and its sound join in.
 */
function exerciseOptions(card: Card, { day, speech, now }: { day: number; speech: boolean; now: number }): Shape[] {
  const tier = unlockedTier(card);
  const sentences = sentenceGaps(card, tier);
  const sentence = sentences.length > 0 ? rotate(sentences, card, day, 1) : null;
  const chunks = chunkGaps(card, tier);
  const chunk = chunks.length > 0 ? rotate(chunks, card, day, 2) : null;
  const own = ownGap(card);
  const options: Shape[] = [];

  if (introducedToday(card, now)) {
    if (sentence) options.push({ kind: "cloze", gap: sentence, openTranslation: true });
    if (chunks[0]) options.push({ kind: "chunk", gap: chunks[0] });
    return options.length > 0 ? options : [{ kind: "produce" }];
  }
  options.push({ kind: "produce" });
  if (sentence) options.push({ kind: "cloze", gap: sentence });
  if (chunk) options.push({ kind: "chunk", gap: chunk });
  if (stageOf(card) === "young" || stageOf(card) === "mature") {
    if (own) options.push({ kind: "own", gap: own });
    if (speech) options.push({ kind: "listen" });
  }
  return options;
}

type ExerciseContext = { day: number; speech: boolean; now?: number };

/** A word's exercise: never graded, never a flip of the card itself. */
export function exerciseFor(card: Card, { day, speech, now = Date.now() }: ExerciseContext): Exercise {
  return { key: `${card.id}:ex`, cardId: card.id, graded: false, attempt: 0, ...rotate(exerciseOptions(card, { day, speech, now }), card, day) };
}

/** A second exercise for the same word, of another kind; null when the word has only one. */
function secondExerciseFor(card: Card, first: Kind, { day, speech, now = Date.now() }: ExerciseContext): Exercise | null {
  const options = exerciseOptions(card, { day, speech, now }).filter((option) => option.kind !== first);
  return options.length > 0 ? { key: `${card.id}:ex2`, cardId: card.id, graded: false, attempt: 0, ...rotate(options, card, day, 3) } : null;
}

/** Words in one round of exercises. */
export const EXERCISE_LIMIT = 10;
/** Fewer words than this and each is asked twice, two different ways. */
export const TWO_EACH_BELOW = 5;

/**
 * The order words are exercised in: the ones asked for (the summary's weak
 * words) first; then the days between reviews, where a word is still fresh
 * but not on the cards today; then today's new words; then the rest not
 * seen today, longest unseen first; the words already on the cards today
 * after those. A word due now and not yet asked on the cards comes last of
 * all: an exercise would show its answer minutes before its graded review.
 */
export function exerciseOrder(cards: Card[], { now = Date.now(), focusIds = [] }: { now?: number; focusIds?: number[] } = {}): Card[] {
  const dayStart = learnerDayStart(now);
  const soon = learnerDayStart(now, 4);
  const seen = (card: Card) => (card.reviewed_at ? Date.parse(card.reviewed_at) : 0);
  const bucketOf = (card: Card): number => {
    if (focusIds.includes(card.id)) return 0;
    const answeredToday = seen(card) >= dayStart;
    if (!answeredToday && isDueAt(card, now)) return 5;
    const stage = stageOf(card);
    if (!answeredToday && (stage === "learning" || stage === "young") && Date.parse(card.due_date) < soon) return 1;
    if (introducedToday(card, now)) return 2;
    return answeredToday ? 4 : 3;
  };
  const within = (bucket: number, a: Card, b: Card): number => {
    if (bucket === 0) return focusIds.indexOf(a.id) - focusIds.indexOf(b.id);
    if (bucket === 1) return Date.parse(a.due_date) - Date.parse(b.due_date);
    if (bucket === 2) return 0;
    return seen(a) - seen(b);
  };
  return cards
    .map((card) => ({ card, bucket: bucketOf(card) }))
    .sort((a, b) => a.bucket - b.bucket || within(a.bucket, a.card, b.card) || a.card.id - b.card.id)
    .map(({ card }) => card);
}

/**
 * A round of exercises: only words already met on the cards, ten at most,
 * in exerciseOrder. With only a few words each comes twice, a different
 * way the second time, all the first asks before the second ones. The
 * question changes from one round to the next, so doing it twice in a day
 * isn't a rerun.
 */
export function buildExercises(cards: Card[], { speech, now = Date.now(), focusIds = [] }: { speech: boolean; now?: number; focusIds?: number[] }): Exercise[] {
  const round = Math.floor(now / 60_000);
  const words = exerciseOrder(cards.filter(hasStarted), { now, focusIds }).slice(0, EXERCISE_LIMIT);
  const context = { day: round, speech, now };
  const firsts = words.map((card) => exerciseFor(card, context));
  if (words.length >= TWO_EACH_BELOW) return firsts;
  return [...firsts, ...words.map((card, i) => secondExerciseFor(card, firsts[i].kind, context)).filter(present)];
}

/**
 * Drilling one word from its page: every way of asking it that its content
 * allows, in the senses the cards have opened, none of them graded — the
 * schedule only counts the real reviews.
 */
export function buildDrill(card: Card): Exercise[] {
  const base = { cardId: card.id, graded: false, attempt: 0 };
  const tier = unlockedTier(card);
  const sentences = sentenceGaps(card, tier);
  const chunk = chunkGaps(card, tier)[0];
  const own = ownGap(card);
  const steps: Exercise[] = [];
  if (sentences[0]) steps.push({ ...base, key: `${card.id}:drill:cloze0`, kind: "cloze", gap: sentences[0], openTranslation: true });
  steps.push({ ...base, key: `${card.id}:drill:produce`, kind: "produce" });
  if (chunk) steps.push({ ...base, key: `${card.id}:drill:chunk`, kind: "chunk", gap: chunk });
  if (sentences[1]) steps.push({ ...base, key: `${card.id}:drill:cloze1`, kind: "cloze", gap: sentences[1] });
  if (own) steps.push({ ...base, key: `${card.id}:drill:own`, kind: "own", gap: own });
  return steps.slice(0, 4);
}

/**
 * A missed exercise, asked again a few steps later: the same question, the
 * Turkish open this time. Once only: missed twice, the answer has been shown
 * twice and the round moves on, so a hard word can't hold it forever.
 */
export function retryOf(step: Exercise): Exercise | null {
  if (step.attempt >= 1) return null;
  return { ...step, key: `${step.key}:again`, attempt: step.attempt + 1, graded: false, skipped: false, openTranslation: true };
}

/** The pause after a right answer in the exercises, to write a sentence of your own with the word. */
export function writeStep(card: Card): Exercise {
  return { key: `${card.id}:write`, cardId: card.id, kind: "write", graded: false, attempt: 0 };
}

/**
 * Whether a word just got right in the exercises is worth a sentence of the
 * learner's own: met on an earlier day (a sentence needs more than a first
 * meeting behind it) and none written yet.
 */
export const wantsOwnSentence = (card: Card, now = Date.now()): boolean => card.repetitions >= 1 && !introducedToday(card, now) && !card.my_sentence;

/**
 * Passing a card without answering it ("Geç"): it goes to the end of the
 * round once, so it's still asked today. Passed a second time — or passed
 * as the round's last card — it leaves unanswered and simply stays due.
 */
export function skipStep(plan: Exercise[], index: number): Exercise[] {
  const step = plan[index];
  if (!step || step.skipped || index >= plan.length - 1) return plan;
  return [...plan, { ...step, key: `${step.key}:skip`, skipped: true }];
}

/** Where a step goes in: `gap` steps later, or last if the session ends sooner. */
export function insertLater<T>(plan: T[], index: number, step: T, gap = 3): T[] {
  const at = Math.min(plan.length, index + 1 + gap);
  return [...plan.slice(0, at), step, ...plan.slice(at)];
}

/**
 * Where a missed exercise goes back in: `gap` steps later, or last — but
 * never next to another ask of the same word, whose answer the feedback has
 * just shown. It moves on a step at a time; with no room after, back towards
 * the miss (never straight after it); with no room at all it goes last. The
 * retry is always kept.
 */
export function placeApart(plan: Exercise[], index: number, step: Exercise, gap = 3): Exercise[] {
  const apart = (at: number) => plan[at - 1]?.cardId !== step.cardId && plan[at]?.cardId !== step.cardId;
  const from = Math.min(plan.length, index + 1 + gap);
  let at = from;
  while (at <= plan.length && !apart(at)) at++;
  if (at > plan.length) {
    at = from - 1;
    while (at > index && !apart(at)) at--;
    if (at <= index) at = plan.length;
  }
  return [...plan.slice(0, at), step, ...plan.slice(at)];
}

/* --------------------------------------------------------- the marking -- */

/**
 * What counts as the same answer: case, accents, curly apostrophes, stray
 * punctuation and spacing are all forgiven, and a Turkish keyboard's ı is an i.
 */
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[-‐-—_/]+/g, " ")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Edits between two strings, a swap of neighbours counting as one (optimal string alignment). */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Slips forgiven: none in a short word, one in a middling one, two in a long one. */
export const allowedSlips = (length: number): number => (length <= 4 ? 0 : length <= 8 ? 1 : 2);

export type Verdict = {
  grade: 1 | 3 | 4 | 5;
  /** right · the right word in another form · a small slip · wrong */
  tone: "right" | "form" | "slip" | "wrong";
};

/**
 * Marks a typed answer against what the gap (or the word) needs.
 * A hint caps the mark at 3: the word came back, but not on its own.
 */
export function checkAnswer(typed: string, expected: string, headword: string, { hinted = false } = {}): Verdict {
  const answer = normalizeAnswer(typed);
  const want = normalizeAnswer(expected);
  const word = normalizeAnswer(headword);
  let verdict: Verdict;
  if (!answer) verdict = { grade: 1, tone: "wrong" };
  else if (answer === want) verdict = { grade: 5, tone: "right" };
  else if (answer === word || isFormOf(answer, headword)) verdict = { grade: 4, tone: "form" };
  else if (editDistance(answer, want) <= allowedSlips(want.length) || editDistance(answer, word) <= allowedSlips(word.length)) verdict = { grade: 3, tone: "slip" };
  else verdict = { grade: 1, tone: "wrong" };
  if (hinted && verdict.grade > 3) return { ...verdict, grade: 3 };
  return verdict;
}

/**
 * The shape of the answer before anything is typed: a dot per letter, the
 * spaces kept, and the first `reveal` letters shown once a hint is taken.
 */
export function letterPattern(answer: string, reveal = 0): string {
  let shown = 0;
  return Array.from(answer)
    .map((ch) => {
      if (!/\p{L}/u.test(ch)) return ch;
      shown += 1;
      return shown <= reveal ? ch : "•";
    })
    .join("");
}

/** What a typed exercise wants: the form its gap needs, or the word itself. */
export const expectedAnswer = (exercise: Exercise, card: Card): string => exercise.gap?.answer ?? card.front;
