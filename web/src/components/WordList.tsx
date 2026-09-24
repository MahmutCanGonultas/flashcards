import { useState } from "react";
import { Link } from "react-router-dom";
import type { CSSProperties, ReactNode } from "react";
import type { Card } from "../types";
import { parseBack } from "../lib/cardBack";
import { STAGE_LABEL, isLeech, nextReview, stageOf } from "../lib/memory";
import { STAGE_PILL, TONE_PILL } from "../lib/stageStyle";
import { tintStyle } from "../lib/tint";
import { familyAt, familyStyle } from "../lib/palette";
import { sentencesOf } from "../lib/practice";
import { coreMeaning, matchRanges } from "../lib/wordBrowser";
import { primeSpeech } from "../lib/speech";
import StrengthBars from "./StrengthBars";
import SpeakButton from "./SpeakButton";
import { ExampleBubble } from "./WordCardBack";
import { ChevronDownIcon } from "./icons";
import MeaningText from "./MeaningText";

type WordListProps = {
  deckId: number | string;
  /** Shown in the order given; the caller sorts. */
  cards: Card[];
  /** Entrance for the first rows, on a page that composes itself. */
  rowStyle?: (index: number) => CSSProperties | undefined;
  rowClassName?: (index: number) => string;
  /** Marks the part of the word or meaning that matched a search. */
  mark?: (text: string) => ReactNode;
  /** The search, so a row shows the meaning that matched it. */
  query?: string;
};

/** Each sense's meaning, or the short gloss of a plain card. */
function meaningsOf(card: Card): string[] {
  if (card.senses?.length) return card.senses.map((s) => s.meaning);
  return [parseBack(card.back).text];
}

/**
 * Opened under a row: every meaning in its sense's colour (when there is
 * more than one), one sentence, where the word stands, and the ways on —
 * hear it, drill it, its page.
 */
function WordPeek({ deckId, card }: { deckId: number | string; card: Card }) {
  const meanings = meaningsOf(card);
  const sentence = sentencesOf(card)[0] ?? null;
  const stage = stageOf(card);
  const next = nextReview(card);
  const lapses = card.lapses ?? 0;
  return (
    <div className="animate-rise-in pb-4 pl-[58px] pr-1">
      {meanings.length > 1 && (
        <ol className="mb-3 space-y-1.5">
          {meanings.map((m, i) => (
            <li key={i} style={familyStyle(familyAt(i))} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-(--c) text-[11px] font-black text-white">{i + 1}</span>
              <span className="text-[16px] font-extrabold leading-snug text-ink">
                <MeaningText text={m} />
              </span>
            </li>
          ))}
        </ol>
      )}
      {sentence && (
        <div className="mb-3">
          <ExampleBubble en={sentence.en} tr={sentence.tr} headword={card.front} meaning={meanings[0] ?? ""} size="sm" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-black">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${STAGE_PILL[stage]}`}>
          <StrengthBars card={card} />
          {STAGE_LABEL[stage]}
        </span>
        <span className={`rounded-full px-2.5 py-1 ${TONE_PILL[next.tone]}`}>{stage === "new" ? "İlk tanışma sırada" : next.text === "Şimdi" ? "Şimdi sırada" : next.text}</span>
        {lapses > 0 && <span className={`rounded-full px-2.5 py-1 ${isLeech(card) ? "bg-sunny-soft text-sunny-ink" : "bg-paper-deep text-graphite"}`}>{isLeech(card) ? `İnatçı · ${lapses} kez kaçtı` : `${lapses} kez kaçtı`}</span>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <SpeakButton text={card.front} size="sm" />
        <Link
          to={`/decks/${deckId}/flashcards?card=${card.id}`}
          onClick={primeSpeech}
          className="flex min-h-10 items-center rounded-xl bg-grass px-3.5 text-[12px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d face"
        >
          Çalış
        </Link>
        <Link
          to={`/decks/${deckId}/words/${card.id}`}
          viewTransition
          className="flex min-h-10 items-center rounded-xl border-2 border-rule bg-white px-3.5 text-[12px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press"
        >
          Kelime sayfası →
        </Link>
      </div>
    </div>
  );
}

/**
 * One word per row: its colour as a tile with its initial, the word, and
 * under it just its meaning. A tap opens the rest right there.
 */
export function WordRow({ deckId, card, mark = (t) => t, query = "" }: { deckId: number | string; card: Card; mark?: (text: string) => ReactNode; query?: string }) {
  const [open, setOpen] = useState(false);
  const meanings = meaningsOf(card);
  // Searching shows the meaning that matched, whole; otherwise the first, bare.
  const matched = query.trim() ? meanings.find((m) => matchRanges(m, query).length > 0) : undefined;
  const more = meanings.length - 1;
  // Opened, the numbered list below says it all; a single meaning shows here with its note.
  const shown = open ? (more > 0 ? null : meanings[0]) : (matched ?? coreMeaning(meanings[0]));
  return (
    <div style={tintStyle(card)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-mx-2 grid w-[calc(100%+1rem)] grid-cols-[44px_1fr_auto] items-center gap-3.5 rounded-2xl px-2 py-2.5 text-left transition-[background-color,transform] duration-100 hover:bg-paper-deep active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
      >
        <span
          aria-hidden="true"
          className="grid h-11 w-11 place-items-center rounded-[14px] tint-ground text-[20px] font-black uppercase text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.18)]"
        >
          {card.front.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block wrap-break-word text-[18px] font-black leading-tight text-ink" style={{ viewTransitionName: `word-${card.id}` }}>
            {mark(card.front)}
          </span>
          {shown !== null && (
            <span className="mt-0.5 block text-[15px] font-semibold leading-snug text-graphite">
              {mark(shown)}
              {more > 0 && !open && <span className="ml-1.5 whitespace-nowrap text-[12px] font-extrabold text-hare">+{more} anlam</span>}
            </span>
          )}
        </span>
        <ChevronDownIcon className={`h-5 w-5 text-hare transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <WordPeek deckId={deckId} card={card} />}
    </div>
  );
}

function WordList({ deckId, cards, rowStyle, rowClassName, mark, query }: WordListProps) {
  return (
    <ul className="divide-y-2 divide-paper-deep">
      {cards.map((card, i) => (
        <li key={card.id} className={rowClassName?.(i) ?? ""} style={rowStyle?.(i)}>
          <WordRow deckId={deckId} card={card} mark={mark} query={query} />
        </li>
      ))}
    </ul>
  );
}

export default WordList;
