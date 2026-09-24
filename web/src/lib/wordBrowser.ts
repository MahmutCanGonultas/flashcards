import type { Card } from "../types";
import { parseBack } from "./cardBack";
import { byNextReview, isDueAt, isLeech, stageOf, type Stage } from "./memory";
import { hasStarted } from "./path";
import { learnerDayStart } from "./day";

/**
 * The word list, built to hold hundreds of words: a search over everything
 * a card says (English or Turkish, with or without the accents), a filter
 * per stage, three orders, and headings that break a long list into parts.
 */

export type Filter = "all" | "due" | Stage | "leech";
export type Sort = "next" | "az" | "recent";

export const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "due", label: "Sırası gelen" },
  { key: "new", label: "Yeni" },
  { key: "learning", label: "Öğreniyor" },
  { key: "young", label: "Pekişiyor" },
  { key: "mature", label: "Kalıcı" },
  { key: "leech", label: "İnatçı" },
];

export const SORTS: { key: Sort; label: string }[] = [
  { key: "next", label: "Sıradaki" },
  { key: "az", label: "A–Z" },
  { key: "recent", label: "Yeni eklenen" },
];

/* ------------------------------------------------------------ search -- */

const TURKISH: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ç: "c", Ç: "c", ö: "o", Ö: "o", ü: "u", Ü: "u" };

/** One character as the search sees it: lower case, no accent, Turkish letters on their Latin twins. Always one character. */
function foldChar(ch: string): string {
  const turkish = TURKISH[ch];
  if (turkish) return turkish;
  const bare = ch.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  return bare.length === 1 ? bare : ch.toLowerCase().charAt(0) || ch;
}

/** A whole string folded character by character, so positions in it are positions in the original. */
export function fold(text: string): string {
  return Array.from(text, foldChar).join("");
}

/** Everything a card says, in one string to search: the word, its meanings, sentences, chunks, family and the learner's own sentence. */
export function searchText(card: Card): string {
  const parts: (string | null | undefined)[] = [card.front, parseBack(card.back).text, card.example_sentence, card.example_tr, card.example2, card.example2_tr, card.my_sentence];
  for (const sense of card.senses ?? []) {
    parts.push(sense.meaning, sense.definition, sense.pattern, sense.example_en, sense.example_tr);
    for (const example of sense.examples ?? []) parts.push(example.en, example.tr);
  }
  for (const chunk of card.collocations ?? []) parts.push(chunk.en, chunk.tr);
  for (const word of card.related ?? []) parts.push(word.word, word.meaning);
  return fold(parts.filter(Boolean).join(" \n "));
}

const words = (query: string): string[] => fold(query).split(/\s+/).filter(Boolean);

/** Every word of the query appears somewhere in the card. */
export function matches(card: Card, query: string): boolean {
  const wanted = words(query);
  if (wanted.length === 0) return true;
  const haystack = searchText(card);
  return wanted.every((w) => haystack.includes(w));
}

/** Where the query's words sit in a line of text, as [start, end) ranges, merged and in order. */
export function matchRanges(text: string, query: string): [number, number][] {
  const folded = fold(text);
  const ranges: [number, number][] = [];
  for (const w of words(query)) {
    let at = folded.indexOf(w);
    while (at !== -1) {
      ranges.push([at, at + w.length]);
      at = folded.indexOf(w, at + w.length);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

/** "yaklaşmak (yer ya da zaman olarak)" → "yaklaşmak": a row shows the bare meaning; the note waits for the tap. */
export function coreMeaning(meaning: string): string {
  return meaning.replace(/\s*\([^()]*\)\s*$/, "").trim() || meaning;
}

/* ------------------------------------------------------------ filters -- */

export function passes(card: Card, filter: Filter, now = Date.now()): boolean {
  switch (filter) {
    case "all":
      return true;
    case "due":
      // Words already met and waiting; the queue comes three a day, by the plan.
      return hasStarted(card) && isDueAt(card, now);
    case "leech":
      return isLeech(card);
    default:
      return stageOf(card) === filter;
  }
}

export function filterCounts(cards: Card[], now = Date.now()): Record<Filter, number> {
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, 0])) as Record<Filter, number>;
  for (const card of cards) for (const f of FILTERS) if (passes(card, f.key, now)) counts[f.key] += 1;
  return counts;
}

/* -------------------------------------------------------------- order -- */

export function sortCards(cards: Card[], sort: Sort, now = Date.now()): Card[] {
  if (sort === "next") return byNextReview(cards, now);
  if (sort === "az") return [...cards].sort((a, b) => a.front.localeCompare(b.front, "en", { sensitivity: "base" }) || a.id - b.id);
  return [...cards].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id);
}

/* ------------------------------------------------------------- groups -- */

export type Group = { key: string; label: string; cards: Card[] };

const DAY = 86_400_000;
/** Whole learner days between two moments (they turn at 04:00, lib/day.ts), as the cards count them. */
const daysBetween = (from: number, to: number) => Math.round((learnerDayStart(to) - learnerDayStart(from)) / DAY);

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** Which heading a card goes under in the given order. */
export function groupOf(card: Card, sort: Sort, now = Date.now()): { key: string; label: string } {
  if (sort === "az") {
    const letter = fold(card.front.trim().charAt(0)).toUpperCase();
    return /[A-Z]/.test(letter) ? { key: letter, label: letter } : { key: "#", label: "#" };
  }
  if (sort === "recent") {
    const added = new Date(card.created_at).getTime();
    const ago = daysBetween(added, now);
    if (ago <= 0) return { key: "today", label: "Bugün eklenen" };
    if (ago < 7) return { key: "week", label: "Bu hafta" };
    if (ago < 14) return { key: "lastweek", label: "Geçen hafta" };
    const d = new Date(added);
    return { key: `m${d.getFullYear()}-${d.getMonth()}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
  }
  if (!hasStarted(card)) return { key: "queue", label: "Tanışmayı bekleyenler" };
  if (isDueAt(card, now)) return { key: "now", label: "Şimdi sırada" };
  const days = daysBetween(now, new Date(card.due_date).getTime());
  if (days <= 0) return { key: "today", label: "Bugün, biraz sonra" };
  if (days === 1) return { key: "tomorrow", label: "Yarın" };
  if (days < 7) return { key: "week", label: "Bu hafta" };
  if (days < 30) return { key: "month", label: "Bu ay" };
  return { key: "later", label: "Daha sonra" };
}

/** Consecutive runs of the same heading, in the order the cards come. */
export function groupCards(cards: Card[], sort: Sort, now = Date.now()): Group[] {
  const groups: Group[] = [];
  for (const card of cards) {
    const { key, label } = groupOf(card, sort, now);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.cards.push(card);
    else groups.push({ key, label, cards: [card] });
  }
  return groups;
}

/** The whole pipeline: search, filter, order. Grouping comes after the page is cut. */
export function browse(cards: Card[], { query, filter, sort, now = Date.now() }: { query: string; filter: Filter; sort: Sort; now?: number }): Card[] {
  return sortCards(
    cards.filter((card) => passes(card, filter, now) && matches(card, query)),
    sort,
    now,
  );
}
