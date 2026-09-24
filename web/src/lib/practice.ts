import type { Card } from "../types";
import { isFormOf, splitOnWord } from "./sentence";
import { isDueAt, stageOf } from "./memory";

/**
 * The practice engine: the cards ("Tekrar et") and, apart from them, the
 * exercises ("Egzersiz").
 *
 * The cards are plain flashcards, and only they move the schedule. A new
 * word is met first (the word in a sentence, a guess, then the meaning)
 * and asked a few cards later; every other word is the word on the front
 * and its meaning on the back, graded by the learner. A miss comes back a
 * few cards later until it's got; only the first answer of the session is
 * written to the schedule.
 *
 * The exercises are where a word gets produced, and they never touch the
 * schedule: find it in its sentence (the Turkish open while the word is
 * new), complete one of its phrases, type it from its Turkish, fill it into
 * the learner's own sentence, or catch it by ear. Which one depends on how
 * well the word is held (stages: memory.ts), and a miss comes back as the
 * same question.
 *
 * A typed answer is marked by the app, not by the learner: right (5), the
 * right word in the wrong form (4), a small slip (3), wrong (1).
 */

export type Kind = "meet" | "recall" | "listen" | "produce" | "cloze" | "chunk" | "own" | "write";

/** Kinds answered by typing; the rest are flipped or read. */
export const TYPED_KINDS: ReadonlySet<Kind> = new Set<Kind>(["produce", "cloze", "chunk", "own"]);

export const KIND_LABEL: Record<Kind, string> = {
  meet: "Yeni kelime",
  recall: "Ne demek?",
  listen: "Dinle",
  produce: "İngilizcesi?",
  cloze: "Boşluğu doldur",
  chunk: "Kalıbı tamamla",
  own: "Senin cümlen",
  write: "Kendi cümlen",
};

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
  /** cloze, chunk and own: where the word goes. */
  gap?: Gap;
  /** cloze: the Turkish shows from the start (early on) rather than behind a tap. */
  openTranslation?: boolean;
  /** recall after a miss: the word's sentence under its meaning. */
  support?: boolean;
  /** Passed once without an answer and put back at the end of the round. */
  skipped?: boolean;
};

export type Line = { en: string; tr: string | null };

/**
 * Every English sentence a card carries, with its Turkish: each sense's
 * main sentence first, then the card's own, then the senses' extra ones —
 * so the first line is always the one the word's page leads with, and the
 * rest give the cloze more to rotate through.
 */
export function sentencesOf(card: Card): Line[] {
  const seen = new Set<string>();
  const lines: Line[] = [];
  const add = (en?: string | null, tr?: string | null) => {
    const text = en?.trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    lines.push({ en: text, tr: tr?.trim() || null });
  };
  for (const sense of card.senses ?? []) add(sense.example_en, sense.example_tr);
  add(card.example_sentence, card.example_tr);
  add(card.example2, card.example2_tr);
  for (const sense of card.senses ?? []) for (const extra of sense.examples ?? []) add(extra.en, extra.tr);
  return lines;
}

function gapIn(text: string, headword: string, translation: string | null): Gap | null {
  const parts = splitOnWord(text, headword);
  return parts ? { before: parts.before, answer: parts.match, after: parts.after, translation } : null;
}

const present = <T,>(value: T | null): value is T => value !== null;

/** The card's sentences that the word can be cut out of. */
export const sentenceGaps = (card: Card): Gap[] => sentencesOf(card).map((line) => gapIn(line.en, card.front, line.tr)).filter(present);

/** The chunks it lives in ("commit a crime"), cut the same way, their Turkish as the cue. */
export const chunkGaps = (card: Card): Gap[] =>
  (card.collocations ?? []).map((chunk) => gapIn(chunk.en, card.front, chunk.tr)).filter(present);

/** The learner's own sentence, if they wrote one and the word can be found in it. */
export const ownGap = (card: Card): Gap | null => (card.my_sentence ? gapIn(card.my_sentence, card.front, null) : null);

/** Local calendar day number, so a word gets the same question all day. */
export function dayNumber(now = Date.now()): number {
  const d = new Date(now);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

/** Rotates the question from one review to the next, stable within a day. */
function rotate<T>(options: T[], card: Card, day: number, salt = 0): T {
  const seed = card.id * 7 + card.repetitions * 13 + (card.lapses ?? 0) * 5 + day + salt;
  return options[((seed % options.length) + options.length) % options.length];
}

type Shape = Omit<Exercise, "key" | "cardId" | "graded" | "attempt">;

/**
 * A word on the cards: the word, then its meaning. Missed last time, its
 * sentence comes along on the back to help.
 */
export function cardFor(card: Card, graded: boolean): Exercise {
  const step: Exercise = { key: `${card.id}:0`, cardId: card.id, kind: "recall", graded, attempt: 0 };
  return stageOf(card) === "learning" && card.repetitions === 0 ? { ...step, support: true } : step;
}

/**
 * A word's exercise: the easy ways in while it's new, producing it once it
 * holds. Never graded, never a flip of the card itself.
 */
export function exerciseFor(card: Card, { day, speech }: { day: number; speech: boolean }): Exercise {
  const base = { key: `${card.id}:ex`, cardId: card.id, graded: false, attempt: 0 };
  const sentences = sentenceGaps(card);
  const sentence = sentences.length > 0 ? rotate(sentences, card, day, 1) : null;
  const chunks = chunkGaps(card);
  const chunk = chunks.length > 0 ? rotate(chunks, card, day, 2) : null;
  const own = ownGap(card);
  const stage = stageOf(card);

  let options: Shape[];
  if (stage === "new" || stage === "learning") {
    // Still new to it: find it in a sentence with the Turkish open, or in one of its phrases.
    options = [];
    if (sentence) options.push({ kind: "cloze", gap: sentence, openTranslation: true });
    if (chunk) options.push({ kind: "chunk", gap: chunk });
    if (options.length === 0) options.push({ kind: "produce" });
  } else {
    options = [{ kind: "produce" }];
    if (sentence) options.push({ kind: "cloze", gap: sentence });
    if (chunk) options.push({ kind: "chunk", gap: chunk });
    if (stage === "mature") {
      if (own) options.push({ kind: "own", gap: own });
      if (speech) options.push({ kind: "listen" });
    }
  }
  return { ...base, ...rotate(options, card, day) };
}

export type SessionMode = "due" | "all";

/**
 * A round of cards, built once when it starts.
 *
 * One word already known goes first, to warm up. New words then come in
 * threes: met one after another, then asked one by one with a review in
 * between where there is one — close enough to still be there, far enough
 * that the answer isn't simply on the screen a second ago. Everything else
 * follows in the order it fell due.
 *
 * "all" is looking through the cards whenever you like: only words that
 * are actually due are graded.
 */
export function buildSession(cards: Card[], { mode, now = Date.now() }: { mode: SessionMode; now?: number }): Exercise[] {
  const graded = (card: Card) => mode === "due" || isDueAt(card, now);
  const fresh = cards.filter((card) => stageOf(card) === "new");
  const reviews = cards.filter((card) => stageOf(card) !== "new").map((card) => cardFor(card, graded(card)));

  const steps: Exercise[] = [];
  if (reviews.length > 0) steps.push(reviews.shift()!);
  for (let i = 0; i < fresh.length; i += 3) {
    const group = fresh.slice(i, i + 3);
    for (const card of group) steps.push({ key: `${card.id}:meet`, cardId: card.id, kind: "meet", graded: false, attempt: 0 });
    for (const card of group) {
      if (reviews.length > 0) steps.push(reviews.shift()!);
      steps.push({ key: `${card.id}:check`, cardId: card.id, kind: "recall", graded: graded(card), attempt: 0 });
    }
  }
  steps.push(...reviews);
  return steps;
}

/** Words in one round of exercises. */
export const EXERCISE_LIMIT = 12;

/**
 * A round of exercises: each word once, in the order given, the words
 * already met first and brand-new ones after them. The question changes
 * from one round to the next, so doing it twice in a day isn't a rerun.
 */
export function buildExercises(cards: Card[], { speech, now = Date.now() }: { speech: boolean; now?: number }): Exercise[] {
  const round = Math.floor(now / 60_000);
  const met = cards.filter((card) => stageOf(card) !== "new");
  const fresh = cards.filter((card) => stageOf(card) === "new");
  return [...met, ...fresh].slice(0, EXERCISE_LIMIT).map((card) => exerciseFor(card, { day: round, speech }));
}

/**
 * Drilling one word from its page: every way of asking it that its content
 * allows, none of them graded — the schedule only counts the real reviews.
 */
export function buildDrill(card: Card): Exercise[] {
  const base = { cardId: card.id, graded: false, attempt: 0 };
  const sentences = sentenceGaps(card);
  const chunk = chunkGaps(card)[0];
  const own = ownGap(card);
  const steps: Exercise[] = [];
  if (sentences[0]) steps.push({ ...base, key: `${card.id}:drill:cloze0`, kind: "cloze", gap: sentences[0], openTranslation: true });
  steps.push({ ...base, key: `${card.id}:drill:produce`, kind: "produce" });
  if (chunk) steps.push({ ...base, key: `${card.id}:drill:chunk`, kind: "chunk", gap: chunk });
  if (sentences[1]) steps.push({ ...base, key: `${card.id}:drill:cloze1`, kind: "cloze", gap: sentences[1] });
  if (own) steps.push({ ...base, key: `${card.id}:drill:own`, kind: "own", gap: own });
  return steps.slice(0, 4);
}

/** A missed word, asked again: recognised this time, with its sentence to help. Never graded. */
export function repeatOf(card: Card, attempt: number): Exercise {
  return { key: `${card.id}:again:${attempt}`, cardId: card.id, kind: "recall", graded: false, attempt, support: true };
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
 * Passing a card without answering it ("Geç"): it goes to the end of the
 * round once, so it's still asked today. Passed a second time — or passed
 * as the round's last card — it leaves unanswered and simply stays due.
 */
export function skipStep(plan: Exercise[], index: number): Exercise[] {
  const step = plan[index];
  if (!step || step.skipped || index >= plan.length - 1) return plan;
  return [...plan, { ...step, key: `${step.key}:skip`, skipped: true }];
}

/** Where a step goes back in: `gap` steps later, or last if the session ends sooner. */
export function insertLater<T>(plan: T[], index: number, step: T, gap = 3): T[] {
  const at = Math.min(plan.length, index + 1 + gap);
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
