import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { isDue } from "../lib/path";
import { byNextReview, isLeech, nextReview } from "../lib/memory";
import { TONE_TEXT } from "../lib/stageStyle";
import { tintStyle } from "../lib/tint";
import StrengthBars from "./StrengthBars";

type WordListProps = {
  deckId: number | string;
  cards: Card[];
  /** Entrance for the first rows, on a page that composes itself. */
  rowStyle?: (index: number) => CSSProperties | undefined;
  rowClassName?: (index: number) => string;
};

/**
 * The contents: every word, one line each — its colour, the word, its
 * meaning, how firmly it's held and when it comes back. The meaning of a
 * word that is waiting stays blurred: reading it here, a minute before the
 * review, would answer the question before it's asked. The word's page
 * (a tap away) still shows everything.
 */
function WordList({ deckId, cards, rowStyle, rowClassName }: WordListProps) {
  return (
    <ul className="divide-y divide-rule">
      {byNextReview(cards).map((card, i) => {
        const { pos, text } = parseBack(card.back);
        const schedule = nextReview(card);
        const waiting = isDue(card);
        return (
          <li key={card.id} className={rowClassName?.(i) ?? ""} style={{ ...tintStyle(card), ...rowStyle?.(i) }}>
            <Link
              to={`/decks/${deckId}/words/${card.id}`}
              viewTransition
              className="-mx-2 grid grid-cols-[3px_1fr_auto] items-center gap-3.5 rounded-xl px-2 py-3 transition-[background-color,transform] duration-100 active:scale-[0.99] active:bg-paper-deep/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
            >
              <span aria-hidden="true" className="h-11 w-[3px] rounded-full tint-bar" />
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-2 text-[17px] font-extrabold leading-tight text-ink">
                  <span className="wrap-break-word" style={{ viewTransitionName: `word-${card.id}` }}>
                    {card.front}
                  </span>
                  {pos && <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-graphite">{posLabel(pos)}</span>}
                  {isLeech(card) && <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gilt-ink">inatçı</span>}
                </p>
                {waiting ? (
                  <p className="mt-0.5 truncate text-[14px] text-graphite">
                    <span aria-hidden="true" className="select-none blur-[5px]">
                      {text}
                    </span>
                    <span className="sr-only">Anlamı tekrardan sonra görünür</span>
                  </p>
                ) : (
                  <p className="mt-0.5 truncate text-[14px] text-graphite">{text}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StrengthBars card={card} />
                <span className={`text-[10px] font-extrabold uppercase tracking-[0.14em] tabular-nums ${TONE_TEXT[schedule.tone]}`}>{schedule.text}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default WordList;
