import { Link } from "react-router-dom";
import type { CSSProperties, ReactNode } from "react";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { STAGE_LABEL, isLeech, nextReview, stageOf } from "../lib/memory";
import { STAGE_PILL, TONE_TEXT } from "../lib/stageStyle";
import { tintStyle } from "../lib/tint";
import StrengthBars from "./StrengthBars";

type WordListProps = {
  deckId: number | string;
  /** Shown in the order given; the caller sorts. */
  cards: Card[];
  /** Entrance for the first rows, on a page that composes itself. */
  rowStyle?: (index: number) => CSSProperties | undefined;
  rowClassName?: (index: number) => string;
  /** Marks the part of the word or meaning that matched a search. */
  mark?: (text: string) => ReactNode;
};

/**
 * One word per row: its colour as a tile with its initial, the word and
 * its meaning, where it stands in memory and when it comes back. The whole
 * row opens the word's page.
 */
export function WordRow({ deckId, card, mark = (t) => t }: { deckId: number | string; card: Card; mark?: (text: string) => ReactNode }) {
  const { pos, text } = parseBack(card.back);
  const meaning = card.senses?.length ? card.senses.map((s) => s.meaning).join(" · ") : text;
  const firstPos = pos ?? card.senses?.[0]?.pos ?? null;
  const schedule = nextReview(card);
  const stage = stageOf(card);
  return (
    <Link
      to={`/decks/${deckId}/words/${card.id}`}
      viewTransition
      style={tintStyle(card)}
      className="group -mx-2 grid grid-cols-[44px_1fr_auto] items-center gap-3.5 rounded-2xl px-2 py-2.5 transition-[background-color,transform] duration-100 hover:bg-paper-deep active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
    >
      <span
        aria-hidden="true"
        className="grid h-11 w-11 place-items-center rounded-[14px] tint-ground text-[20px] font-black uppercase text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.18)]"
      >
        {card.front.charAt(0)}
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 text-[17px] font-black leading-tight text-ink">
          <span className="wrap-break-word" style={{ viewTransitionName: `word-${card.id}` }}>
            {mark(card.front)}
          </span>
          {firstPos && <span className="text-[11px] font-extrabold lowercase tint-text">{posLabel(firstPos)}</span>}
          {isLeech(card) && <span className="rounded-full bg-sunny-soft px-2 py-px text-[10px] font-black uppercase tracking-[0.08em] text-sunny-ink">inatçı</span>}
        </p>
        <p className="mt-0.5 truncate text-[14px] font-semibold text-graphite">{mark(meaning)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-black ${STAGE_PILL[stage]}`}>
          <StrengthBars card={card} />
          {STAGE_LABEL[stage]}
        </span>
        <span className={`text-[11px] font-extrabold tabular-nums ${TONE_TEXT[schedule.tone]}`}>{schedule.text}</span>
      </div>
    </Link>
  );
}

function WordList({ deckId, cards, rowStyle, rowClassName, mark }: WordListProps) {
  return (
    <ul className="divide-y-2 divide-paper-deep">
      {cards.map((card, i) => (
        <li key={card.id} className={rowClassName?.(i) ?? ""} style={rowStyle?.(i)}>
          <WordRow deckId={deckId} card={card} mark={mark} />
        </li>
      ))}
    </ul>
  );
}

export default WordList;
