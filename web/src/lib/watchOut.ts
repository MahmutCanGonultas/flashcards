/**
 * A card's one trap, written as "✗ wrong → ✓ right. Why…" (the why may
 * also come first). Split so the page can set the wrong sentence in red,
 * the right one in green and the reason under them. Text without the marks
 * is all reason.
 */
export type WatchOut = { wrong: string | null; right: string | null; note: string };

const PAIR = /✗\s*(.+?)\s*→\s*✓\s*(.+?)([.?!])(?=\s|$)/s;

export function parseWatchOut(text: string): WatchOut {
  const match = text.match(PAIR);
  if (!match || match.index === undefined) return { wrong: null, right: null, note: text.trim() };
  const [whole, wrong, right, stop] = match;
  const before = text
    .slice(0, match.index)
    .trim()
    .replace(/[:：]\s*$/, "");
  const after = text.slice(match.index + whole.length).trim();
  return {
    wrong: wrong.trim(),
    // A full stop ends the example; a question or exclamation mark is part of it.
    right: stop === "." ? right.trim() : `${right.trim()}${stop}`,
    note: [before && /[.!?]$/.test(before) ? before : before ? `${before}.` : "", after].filter(Boolean).join(" "),
  };
}
