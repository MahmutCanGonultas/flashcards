import type { Card, Sense } from "../types";
import { parseBack } from "./cardBack";
import { isLeech } from "./memory";
import { coreMeaning } from "./wordBrowser";

/**
 * One core meaning per word. A word with five senses asked all at once is
 * five words at once; so the cards teach, show and grade the core sense
 * only (tier 1), the second sense joins once the word holds (tier 2, from
 * the third success on, never for a leech), and everything else stays on
 * the word's page (tier 3), where the learner can read it whenever they
 * like.
 *
 * Older cards and the course carry no tiers: their first sense is the core
 * one and the rest are tier 2; a chunk without a sense is the core one when
 * it comes first.
 */

export type Tier = 1 | 2 | 3;

/** A sentence with its Turkish, and the gloss its Turkish counterpart is looked for by. */
export type Line = { en: string; tr: string | null; gloss: string };

export type Chunk = { en: string; tr: string };

export const tierOf = (sense: Sense, index: number): Tier => sense.tier ?? (index === 0 ? 1 : 2);

/** The sense the cards teach: the first tier-1 one. */
export function coreSense(card: Pick<Card, "senses">): Sense | null {
  const senses = card.senses ?? [];
  return senses.find((sense, i) => tierOf(sense, i) === 1) ?? senses[0] ?? null;
}

/** What a sense says on a card's face: its gloss, or its meaning without the note. */
export const glossOf = (sense: Sense): string => sense.gloss?.trim() || coreMeaning(sense.meaning);

/** The one meaning a card shows big, and grades by. */
export function coreGloss(card: Pick<Card, "senses" | "back">): string {
  const core = coreSense(card);
  return core ? glossOf(core) : parseBack(card.back).text;
}

/** The core sense's part of speech, or the card's own. */
export const corePos = (card: Pick<Card, "senses" | "back">): string | null => coreSense(card)?.pos ?? parseBack(card.back).pos;

/** How far the cards and exercises go into a word: the second sense opens once it holds. */
export const unlockedTier = (card: Pick<Card, "repetitions" | "lapses">): Tier => (card.repetitions >= 3 && !isLeech(card) ? 2 : 1);

/** The second sense's gloss, once the word has earned it; null before. */
export function secondGloss(card: Card): string | null {
  if (unlockedTier(card) < 2) return null;
  const second = (card.senses ?? []).find((sense, i) => tierOf(sense, i) === 2);
  return second ? glossOf(second) : null;
}

/**
 * The sentences of the senses up to `tier`: the anchor (the core sense's
 * own sentence) first, then the rest of tier 1, then tier 2. A rich card's
 * lines are its senses'; a plain card's are its own two.
 */
export function linesOf(card: Card, tier: Tier): Line[] {
  const seen = new Set<string>();
  const lines: Line[] = [];
  const add = (en: string | null | undefined, tr: string | null | undefined, gloss: string) => {
    const text = en?.trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    lines.push({ en: text, tr: tr?.trim() || null, gloss });
  };
  const senses = card.senses ?? [];
  const core = coreSense(card);
  if (core) {
    add(core.example_en, core.example_tr, glossOf(core));
    for (let t = 1; t <= tier; t++) {
      senses.forEach((sense, i) => {
        if (tierOf(sense, i) !== t) return;
        add(sense.example_en, sense.example_tr, glossOf(sense));
        for (const extra of sense.examples ?? []) add(extra.en, extra.tr, glossOf(sense));
      });
    }
    if (lines.length > 0) return lines;
  }
  const gloss = coreGloss(card);
  add(card.example_sentence, card.example_tr, gloss);
  add(card.example2, card.example2_tr, gloss);
  return lines;
}

/** The chunks of the senses up to `tier`, in the card's order. */
export function chunksOf(card: Pick<Card, "senses" | "collocations">, tier: Tier): Chunk[] {
  const senses = card.senses ?? [];
  const tierAt = (sense: number | undefined, index: number): Tier => {
    if (sense === undefined) return index === 0 ? 1 : 2;
    return senses[sense] ? tierOf(senses[sense], sense) : sense === 0 ? 1 : 2;
  };
  return (card.collocations ?? []).filter((chunk, i) => tierAt(chunk.sense, i) <= tier).map(({ en, tr }) => ({ en, tr }));
}

/** The sentence a word is met in, and asked by until it holds. */
export const anchorOf = (card: Card): Line | null => linesOf(card, 1)[0] ?? null;

/** The chunk a word is met with. */
export const coreChunk = (card: Card): Chunk | null => chunksOf(card, 1)[0] ?? null;

/**
 * The sentence on the back of a card: the anchor — the one the word was met
 * in — until the third success, then one of the core sense's sentences by
 * the day, so a word that holds is seen at work in more than one place.
 */
export function backLine(card: Card, day: number): Line | null {
  const anchor = anchorOf(card);
  if (!anchor || card.repetitions < 3) return anchor;
  const lines = linesOf(card, 1);
  return lines[((day % lines.length) + lines.length) % lines.length];
}
