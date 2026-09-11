/**
 * Finding a headword inside its own example sentence.
 *
 * Two screens need this and they must agree: the teaching screen underlines
 * the word where it appears, and the fill-in-the-blank exercise cuts the same
 * span out. If they disagreed, the exercise would blank one word and the
 * lesson would have underlined another.
 *
 * A plain indexOf is not enough. The sentence almost always inflects the word
 * ("support" -> "supports"), and some headwords are phrases ("give up",
 * "look forward to") that a single-word search misses entirely.
 *
 * Verified against all 150 cards of the seeded deck: every one resolves.
 */

const SUFFIXES = ["s", "es", "ed", "d", "ing", "ly", "er", "est", "ment"];

/** One part of a headword, plus the inflected forms English shows it in. */
function formsOf(word: string): Set<string> {
  const base = word.toLowerCase();
  const forms = new Set([base]);

  // "have" -> "having" drops the e; "stop" -> "stopped" doubles the consonant.
  for (const stem of [base, base.replace(/e$/, ""), base + base.slice(-1)]) {
    for (const suffix of SUFFIXES) forms.add(stem + suffix);
  }

  // "carry" -> "carries" / "carried" / "carrier" / "carriest".
  if (base.endsWith("y")) {
    const stem = base.slice(0, -1);
    for (const suffix of ["ies", "ied", "ier", "iest"]) forms.add(stem + suffix);
  }

  return forms;
}

type Token = { word: string; start: number; end: number };

/** Word tokens with their offsets, so a span can be spliced back into the original. */
function tokenize(sentence: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /[A-Za-z']+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sentence)) !== null) {
    tokens.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}

/** Character range of the headword inside the sentence, or null if it isn't there. */
export function locateWord(
  sentence: string,
  headword: string,
): { start: number; end: number } | null {
  const tokens = tokenize(sentence);
  const parts = headword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || tokens.length < parts.length) return null;

  const partForms = parts.map(formsOf);

  for (let i = 0; i + parts.length <= tokens.length; i++) {
    const matches = partForms.every((forms, offset) =>
      forms.has(tokens[i + offset].word.toLowerCase()),
    );
    if (matches) {
      return { start: tokens[i].start, end: tokens[i + parts.length - 1].end };
    }
  }

  return null;
}

/**
 * Splits the sentence around the headword so the middle piece can be styled.
 * Returns null when the word isn't found — render the sentence plain rather
 * than highlighting the wrong span.
 */
export function splitOnWord(
  sentence: string,
  headword: string,
): { before: string; match: string; after: string } | null {
  const at = locateWord(sentence, headword);
  if (!at) return null;
  return {
    before: sentence.slice(0, at.start),
    match: sentence.slice(at.start, at.end),
    after: sentence.slice(at.end),
  };
}

export const BLANK = "______";

export type BlankedSentence = {
  /** The sentence with the word replaced by BLANK. */
  text: string;
  /** Exactly what was removed, as it appeared — "supports", not "support". */
  answer: string;
};

/**
 * "My family always supports my decisions."
 *   -> "My family always ______ my decisions."
 *
 * Returns null when the word isn't in its sentence; the caller should then
 * skip the fill-in-the-blank step for that card.
 */
export function blankOut(sentence: string, headword: string): BlankedSentence | null {
  const at = locateWord(sentence, headword);
  if (!at) return null;
  return {
    text: sentence.slice(0, at.start) + BLANK + sentence.slice(at.end),
    answer: sentence.slice(at.start, at.end),
  };
}
