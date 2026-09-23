import type { Question, Topic } from "../content/grammar/types";
import type { GrammarProgress } from "./grammar";
import { normalizeAnswer } from "./practice";
import { plain } from "./rich";

/**
 * A grammar quiz, Duolingo-style: pick one, type the gap, or build the
 * sentence from tiles. Options and tiles are shuffled once when the quiz
 * is built; a miss comes back at the end; the score is first answers only.
 */

export type QuizItem = {
  key: string;
  /** The topic the question came from (a mixed quiz draws on several). */
  topic: string;
  question: Question;
  /** choice: the option indices in the order shown. */
  order?: number[];
  /** order: the tiles in the order shown. */
  tiles?: string[];
  /** A second go at a question missed earlier in this quiz. */
  retry?: boolean;
};

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A sentence's words as tiles: the final full stop or question mark isn't a tile. */
export function wordsOf(sentence: string): string[] {
  return plain(sentence)
    .trim()
    .replace(/[.?!]+$/, "")
    .split(/\s+/)
    .filter(Boolean);
}

export function prepare(topic: string, questions: Question[], random: () => number = Math.random): QuizItem[] {
  return questions.map((question, i) => {
    const item: QuizItem = { key: `${topic}:${i}`, topic, question };
    if (question.kind === "choice") item.order = shuffle(question.options.map((_, n) => n), random);
    if (question.kind === "order") item.tiles = shuffle([...wordsOf(question.answer), ...(question.extra ?? [])], random);
    return item;
  });
}

const same = (a: string, b: string) => normalizeAnswer(plain(a)) === normalizeAnswer(plain(b));

/** Whether an answer is right: an option's position as shown, the typed text, or the tiles in order. */
export function isRight(item: QuizItem, answer: { picked?: number; typed?: string; built?: string[] }): boolean {
  const q = item.question;
  if (q.kind === "choice") return answer.picked !== undefined && (item.order ?? q.options.map((_, i) => i))[answer.picked] === q.answer;
  if (q.kind === "type") return answer.typed !== undefined && answer.typed.trim() !== "" && q.answer.some((a) => same(answer.typed!, a));
  const built = (answer.built ?? []).join(" ");
  return built.trim() !== "" && [q.answer, ...(q.also ?? [])].some((a) => same(built, a));
}

/** The right answer, to show after a miss. */
export function rightAnswer(question: Question): string {
  if (question.kind === "choice") return question.options[question.answer];
  if (question.kind === "type") return question.answer[0];
  return question.answer;
}

/**
 * The finished sentence: the prompt with the answer written into its gap,
 * or just the answer when the prompt is a question without one. Shown
 * after a miss and read aloud after every check.
 */
export function solved(question: Question): string {
  if (question.kind === "order") return plain(question.answer);
  if (!/_{2,}/.test(question.prompt)) return plain(rightAnswer(question));
  return plain(question.prompt.replace(/_{2,}/, rightAnswer(question)));
}

/** First answers right, out of the quiz's questions, as 0–100. */
export function scoreOf(firstAnswers: boolean[]): number {
  if (firstAnswers.length === 0) return 0;
  return Math.round((100 * firstAnswers.filter(Boolean).length) / firstAnswers.length);
}

/**
 * A mixed round: `count` questions from the topics already practised, more
 * from the ones with the lowest best score. With fewer than two practised,
 * the first topics of the list make up the rest.
 */
export function mixedQuiz(topics: Topic[], progress: GrammarProgress, count = 10, random: () => number = Math.random): QuizItem[] {
  const practised = topics.filter((t) => progress[t.slug]);
  const pool = practised.length >= 2 ? practised : [...practised, ...topics.filter((t) => !progress[t.slug]).slice(0, Math.max(0, 3 - practised.length))];
  if (pool.length === 0) return [];
  // The weaker a topic, the more tickets it gets in the draw.
  const weighted = shuffle(
    pool.flatMap((t) => Array.from({ length: 1 + Math.round((100 - (progress[t.slug]?.best ?? 0)) / 34) }, () => t)),
    random,
  );
  const decks = new Map(pool.map((t) => [t.slug, shuffle(prepare(t.slug, t.quiz, random), random)]));
  const picked: QuizItem[] = [];
  for (let round = 0; picked.length < count && round < count * 4; round++) {
    const topic = weighted[round % weighted.length];
    const next = decks.get(topic.slug)?.shift();
    if (next) picked.push({ ...next, key: `mix:${next.key}` });
    if ([...decks.values()].every((d) => d.length === 0)) break;
  }
  return picked;
}
