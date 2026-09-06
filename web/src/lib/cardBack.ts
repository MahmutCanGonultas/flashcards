/**
 * Cards written as "(pos) meaning emoji" (the convention used by the seeded
 * vocabulary decks) get their part-of-speech and emoji pulled out so they can
 * be shown as their own tag/icon instead of buried in the sentence. A card
 * that doesn't follow the convention just renders as plain text — nothing
 * here is required.
 */
export type ParsedBack = {
  pos: string | null;
  text: string;
  emoji: string | null;
};

const POS_PATTERN = /^\(([^)]+)\)\s*/;
// ️ (variation selector) and ‍ (ZWJ) let multi-codepoint emoji
// like "\u{1F62E}‍\u{1F4A8}" match as one cluster, not split mid-emoji.
const TRAILING_EMOJI_PATTERN = /\s*[\p{Extended_Pictographic}️‍]+\s*$/u;

export function parseBack(back: string): ParsedBack {
  let rest = back;
  let pos: string | null = null;

  const posMatch = rest.match(POS_PATTERN);
  if (posMatch) {
    pos = posMatch[1];
    rest = rest.slice(posMatch[0].length);
  }

  let emoji: string | null = null;
  const emojiMatch = rest.match(TRAILING_EMOJI_PATTERN);
  if (emojiMatch && emojiMatch.index !== undefined) {
    emoji = emojiMatch[0].trim();
    rest = rest.slice(0, emojiMatch.index);
  }

  return { pos, text: rest.trim(), emoji };
}
