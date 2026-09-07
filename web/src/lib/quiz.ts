import type { Card } from "../types";
import { parseBack } from "./cardBack";

export type QuizOption = {
  text: string;
  emoji: string | null;
  isCorrect: boolean;
};

/** Need the card itself plus at least 3 others to draw distinct distractors from. */
const MIN_DECK_SIZE_FOR_QUIZ = 4;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Builds 4 multiple-choice options for `card` (1 correct + 3 distractors
 * drawn from other cards in the same deck), in random order. Returns null
 * when the deck is too small, or too repetitive, to draw 3 distinct
 * distractors from — callers should fall back to a plain reveal in that case.
 */
export function buildQuizOptions(card: Card, deckCards: Card[]): QuizOption[] | null {
  if (deckCards.length < MIN_DECK_SIZE_FOR_QUIZ) return null;

  const correct = parseBack(card.back);
  const seenText = new Set([correct.text]);
  const distractors: QuizOption[] = [];

  const pool = shuffle(deckCards.filter((c) => c.id !== card.id));
  for (const other of pool) {
    const parsed = parseBack(other.back);
    if (seenText.has(parsed.text)) continue;
    seenText.add(parsed.text);
    distractors.push({ text: parsed.text, emoji: parsed.emoji, isCorrect: false });
    if (distractors.length === 3) break;
  }

  if (distractors.length < 3) return null;

  return shuffle([...distractors, { text: correct.text, emoji: correct.emoji, isCorrect: true }]);
}
