import type { Card } from "../types";
import type { PathStats, Unit } from "./path";
import { wordTier } from "./path";
import { parseBack } from "./cardBack";

/**
 * What Tonton says on the home screens. Every pick that looks random is
 * keyed off the day, so a line doesn't change under the learner between
 * one render and the next.
 */

const dayIndex = () => Math.floor(Date.now() / 86_400_000);

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late? One quick lesson, then sleep. 🌙";
  if (hour < 12) return "Good morning! ☀️ Fresh head, new words.";
  if (hour < 18) return "Good afternoon! 👋 Got fifteen minutes?";
  return "Good evening! 🌙 A few words before bed?";
}

const TIPS = [
  "Three words a day is a thousand a year. 🐢",
  "Say every word out loud — your ears learn too. 👂",
  "Wrong answers teach the most. Guess anyway. 💪",
  "A word you've missed twice is a word you'll never forget. 🧠",
  "Come back tomorrow: that's when a word decides to stay. 📅",
  "Read the example sentence twice. That's where the word lives. 📖",
  "Tap any word to hear it. Then say it back. 🔊",
  "Stuck on a word? Its memory aid is one tap away. 💡",
];

const tip = () => TIPS[dayIndex() % TIPS.length];

/** One word the learner has actually kept, brought back for a second. */
function recall(cards: Card[]): string | null {
  const known = cards.filter((card) => wordTier(card) === "known");
  if (known.length === 0) return null;
  const card = known[dayIndex() % known.length];
  const back = parseBack(card.back);
  return `Remember "${card.front}"? ${back.text}${back.emoji ? ` ${back.emoji}` : ""}`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The deck list: a hello, what's due, the streak, a word from memory, a tip. */
export function homeLines({
  cards,
  due,
  streak,
}: {
  cards: Card[];
  due: number;
  streak: number;
}): string[] {
  const lines = [greeting()];
  if (due > 0) lines.push(`${plural(due, "word is", "words are")} waiting for you. Reviews first? 🔁`);
  else if (cards.length > 0) lines.push("Nothing to review right now — a new lesson? ✨");
  if (streak > 1) lines.push(`${streak} days in a row! 🔥 Keep it going.`);
  else if (streak === 1) lines.push("Day one of a streak. Tomorrow makes it two. 🔥");
  const remembered = recall(cards);
  if (remembered) lines.push(remembered);
  lines.push(tip());
  return lines;
}

/** Above the path: where you are on the line and what's open. */
export function pathLines(stats: PathStats, units: Unit[], isFresh: boolean): string[] {
  const lessons = units.flatMap((unit) => unit.lessons);
  const cards = lessons.flatMap((lesson) => lesson.cards);
  const lines: string[] = [];

  if (isFresh) lines.push("New here? Take the level test — or just start at Lesson 1. 🎯");
  if (stats.dueNow > 0) lines.push(`${plural(stats.dueNow, "word is", "words are")} due. Reviews first? 🔁`);
  if (stats.testReady) lines.push(`Unit ${stats.testReady.index} is done — its test is open! 🎯`);
  const current = lessons.find((lesson) => lesson.state === "current");
  if (current) {
    lines.push(
      `${current.learned > 0 ? "Carry on at" : "Next stop:"} ${current.cards.map((card) => card.front).join(" · ")} 🚉`,
    );
  }
  if (stats.wordsKnown > 0) lines.push(`${plural(stats.wordsKnown, "word is", "words are")} truly yours now. 🏅`);
  const remembered = recall(cards);
  if (remembered) lines.push(remembered);
  lines.push(tip());
  return lines;
}
