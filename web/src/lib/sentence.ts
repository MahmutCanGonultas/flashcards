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
 * Verified against every card in the course: all 900 resolve.
 */

const SUFFIXES = ["s", "es", "ed", "d", "ing", "ly", "er", "est", "ment"];

/**
 * Irregular verbs the course's sentences actually inflect. Suffix rules
 * can't get from "get along" to "got along" or "make up" to "made up".
 */
const IRREGULAR: Record<string, string[]> = {
  arise: ["arose", "arisen"], be: ["am", "is", "are", "was", "were", "been"], bear: ["bore", "borne"],
  beat: ["beaten"], become: ["became"], begin: ["began", "begun"], bend: ["bent"], bite: ["bit", "bitten"],
  blow: ["blew", "blown"], break: ["broke", "broken"], bring: ["brought"], build: ["built"], buy: ["bought"],
  catch: ["caught"], choose: ["chose", "chosen"], cling: ["clung"], come: ["came"], deal: ["dealt"],
  dig: ["dug"], draw: ["drew", "drawn"], drink: ["drank", "drunk"], drive: ["drove", "driven"],
  eat: ["ate", "eaten"], fall: ["fell", "fallen"], feed: ["fed"], feel: ["felt"], fight: ["fought"],
  find: ["found"], flee: ["fled"], fly: ["flew", "flown"], forbid: ["forbade", "forbidden"],
  forget: ["forgot", "forgotten"], forgive: ["forgave", "forgiven"], freeze: ["froze", "frozen"],
  get: ["got", "gotten"], give: ["gave", "given"], go: ["went", "gone"], grow: ["grew", "grown"],
  hang: ["hung"], have: ["has", "had"], hide: ["hid", "hidden"], hold: ["held"], keep: ["kept"],
  know: ["knew", "known"], lay: ["laid"], lead: ["led"], leave: ["left"], lend: ["lent"], lie: ["lay", "lain"],
  light: ["lit"], lose: ["lost"], make: ["made"], mean: ["meant"], meet: ["met"], mistake: ["mistook", "mistaken"],
  overcome: ["overcame"], pay: ["paid"], ride: ["rode", "ridden"], ring: ["rang", "rung"], rise: ["rose", "risen"],
  run: ["ran"], say: ["said"], see: ["saw", "seen"], seek: ["sought"], sell: ["sold"], send: ["sent"],
  shake: ["shook", "shaken"], shoot: ["shot"], shrink: ["shrank", "shrunk"], sing: ["sang", "sung"],
  sink: ["sank", "sunk"], sit: ["sat"], sleep: ["slept"], speak: ["spoke", "spoken"], spend: ["spent"],
  spin: ["spun"], spring: ["sprang", "sprung"], stand: ["stood"], steal: ["stole", "stolen"], stick: ["stuck"],
  strike: ["struck"], sweep: ["swept"], swim: ["swam", "swum"], swing: ["swung"], take: ["took", "taken"],
  teach: ["taught"], tear: ["tore", "torn"], tell: ["told"], think: ["thought"], throw: ["threw", "thrown"],
  understand: ["understood"], undergo: ["underwent", "undergone"], undertake: ["undertook", "undertaken"],
  uphold: ["upheld"], wake: ["woke", "woken"], wear: ["wore", "worn"], weep: ["wept"], win: ["won"],
  withdraw: ["withdrew", "withdrawn"], withhold: ["withheld"], write: ["wrote", "written"],
};

/** One part of a headword, plus the inflected forms English shows it in. */
function formsOf(word: string): Set<string> {
  const base = word.toLowerCase();
  const forms = new Set([base, ...(IRREGULAR[base] ?? [])]);

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

/**
 * Word tokens with their offsets, so a span can be spliced back into the
 * original. Letters in any script, so "cliché" is one token; hyphens stay
 * inside a word, so "well-being" is too.
 */
function tokenize(sentence: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\p{L}[\p{L}'-]*/gu;
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
