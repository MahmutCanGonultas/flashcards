import { Link } from "react-router-dom";
import type { Deck } from "../types";
import type { DeckTheme } from "../lib/themes";
import { ArrowRightIcon, CardStackArt, CardsIcon } from "./icons";
import Skeleton from "./Skeleton";

export type DeckStats = {
  total: number;
  due: number;
  /** How many of `due` have never been reviewed vs. are coming back for a repeat. */
  newDue: number;
  reviewDue: number;
  /** Set only for decks organised as a learning path. */
  path?: {
    lessonsDone: number;
    /** The lesson the path points at; null once every lesson is done. */
    currentLesson: number | null;
    totalLessons: number;
    wordsLearned: number;
    totalWords: number;
  };
};

/** Makes the split between brand-new words and spaced-repetition reviews visible. */
function dueLabel({ newDue, reviewDue }: DeckStats): string {
  if (newDue > 0 && reviewDue > 0) return `${newDue} yeni · ${reviewDue} tekrar`;
  if (newDue > 0) return `${newDue} yeni`;
  return `${reviewDue} tekrar`;
}

type DeckCardProps = {
  deck: Deck;
  theme: DeckTheme;
  /** Undefined while the deck's cards are still being counted. */
  stats?: DeckStats;
};

/** One deck as a sheet on the page: the theme's ink on the small tile and the due badge, nowhere else. */
function DeckCard({ deck, theme, stats }: DeckCardProps) {
  const isPersonal = deck.kind === "personal";
  const cardLabel =
    stats === undefined
      ? null
      : stats.total === 0
        ? isPersonal
          ? "Henüz kelime yok — ilkini ekle"
          : "Henüz kart yok"
        : isPersonal
          ? `${stats.total} kelime`
          : `${stats.total} kart`;

  return (
    <Link
      to={`/decks/${deck.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-[28px] p-5 ring-1 ${theme.ring} ${theme.deckSurface} ${theme.shadow} ${theme.hoverShadow} transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30`}
    >
      <CardStackArt
        className={`pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rotate-[-6deg] ${theme.soft} transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.icon} shadow-button`}
        >
          {isPersonal ? (
            <span aria-hidden="true" className="text-2xl">
              ✍️
            </span>
          ) : (
            <CardsIcon className="h-6 w-6 text-paper-lift" />
          )}
        </div>

        {stats === undefined ? (
          <Skeleton className="h-6 w-20 rounded-full" />
        ) : stats.due > 0 ? (
          <span
            className={`shrink-0 rounded-full ${theme.badge} px-2.5 py-1 text-xs font-extrabold`}
          >
            {dueLabel(stats)}
          </span>
        ) : stats.total > 0 ? (
          <span className="shrink-0 rounded-full bg-paper-deep px-2.5 py-1 text-xs font-bold text-graphite">
            Hepsi tamam
          </span>
        ) : null}
      </div>

      <h3 className="relative mt-4 break-words text-lg font-extrabold leading-snug text-ink">
        {deck.name}
      </h3>

      <div className="relative mt-1">
        {cardLabel === null ? (
          <Skeleton className="h-4 w-24 rounded-full" />
        ) : stats?.path ? (
          <>
            <p className="text-sm font-bold text-graphite">
              Ders {stats.path.currentLesson ?? stats.path.totalLessons}/{stats.path.totalLessons}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rule">
              <div
                className={`h-full rounded-full ${stats.path.wordsLearned > 0 ? "bg-grass" : ""} transition-[width] duration-500`}
                style={{
                  width: `${Math.round((stats.path.wordsLearned / Math.max(stats.path.totalWords, 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs font-medium text-graphite">
              {stats.path.wordsLearned}/{stats.path.totalWords} kelime öğrenildi
            </p>
          </>
        ) : (
          <p className="text-sm font-medium text-graphite">{cardLabel}</p>
        )}
      </div>

      <div className="relative mt-5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink">
        Çalış
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default DeckCard;
