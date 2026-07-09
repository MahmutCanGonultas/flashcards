import { Link } from "react-router-dom";
import type { Deck } from "../types";
import type { DeckTheme } from "../lib/themes";
import { ArrowRightIcon, CardStackArt, CardsIcon } from "./icons";
import Skeleton from "./Skeleton";

export type DeckStats = {
  total: number;
  due: number;
};

type DeckCardProps = {
  deck: Deck;
  theme: DeckTheme;
  /** Undefined while the deck's cards are still being counted. */
  stats?: DeckStats;
};

function DeckCard({ deck, theme, stats }: DeckCardProps) {
  const cardLabel =
    stats === undefined
      ? null
      : stats.total === 0
        ? "No cards yet"
        : `${stats.total} ${stats.total === 1 ? "card" : "cards"}`;

  return (
    <Link
      to={`/decks/${deck.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-3xl p-5 ring-2 ${theme.ring} ${theme.deckSurface} ${theme.shadow} ${theme.hoverShadow} transition-all duration-150 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300`}
    >
      <CardStackArt
        className={`pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rotate-[-6deg] ${theme.soft} opacity-30 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.icon} shadow-md ring-1 ring-white/30`}
        >
          <CardsIcon className="h-6 w-6 text-white" />
        </div>

        {stats === undefined ? (
          <Skeleton className="h-6 w-20 rounded-full" />
        ) : stats.due > 0 ? (
          <span
            className={`shrink-0 rounded-full ${theme.badge} px-2.5 py-1 text-xs font-extrabold text-white shadow-sm`}
          >
            {stats.due} due
          </span>
        ) : stats.total > 0 ? (
          <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-stone-500 ring-1 ring-stone-900/5">
            Caught up
          </span>
        ) : null}
      </div>

      <h3 className="relative mt-4 text-lg font-extrabold leading-snug text-stone-800 break-words">
        {deck.name}
      </h3>

      <div className="relative mt-1 h-5">
        {cardLabel === null ? (
          <Skeleton className="h-4 w-24 rounded-full" />
        ) : (
          <p className="text-sm font-medium text-stone-500">{cardLabel}</p>
        )}
      </div>

      <div
        className={`relative mt-5 flex items-center gap-1.5 text-sm font-extrabold ${theme.text}`}
      >
        Study
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default DeckCard;
