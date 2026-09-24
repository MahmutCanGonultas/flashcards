import { Link } from "react-router-dom";
import type { Card, Deck, UnitRecord } from "../types";
import { buildPath, pathStats } from "../lib/path";
import { lessonOverBudget, useDayBudget } from "../lib/plan";
import { themeFor } from "../lib/themes";
import Button from "./Button";
import LinkButton from "./LinkButton";
import Skeleton from "./Skeleton";

type CourseHubProps = {
  deck: Deck;
  cards: Card[] | undefined;
  units: UnitRecord[] | undefined;
};

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

/**
 * The course half of the home screen: which unit you're in, what's next,
 * and the three doors — lesson, grammar note, dialogue. Where the path
 * page is the whole map, this is the "you are here" sign: one sheet on
 * the page with the unit's ink down its left edge.
 */
function CourseHub({ deck, cards, units }: CourseHubProps) {
  // New words are three a day across the course and the own words alike.
  const budget = useDayBudget(deck.id).data;

  if (!cards || !units) {
    return (
      <section className="rounded-[28px] bg-paper-lift p-5 ring-1 ring-rule shadow-print">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-3 h-8 w-56 rounded-full" />
        <Skeleton className="mt-3 h-5 w-40 rounded-full" />
        <Skeleton className="mt-5 h-12 w-full rounded-2xl" />
      </section>
    );
  }

  const path = buildPath(cards, units);
  const stats = pathStats(path);
  const current = path.find((unit) => unit.lessons.some((lesson) => lesson.state === "current"));
  const lesson = current?.lessons.find((l) => l.state === "current");
  const unit = current ?? path.find((u) => u.state !== "passed") ?? path[path.length - 1];
  const theme = themeFor(unit?.index ?? 0);
  const done = unit ? unit.lessons.filter((l) => l.state === "done").length : 0;
  const waits = lesson ? lessonOverBudget(budget, lesson.cards) : false;

  return (
    <section
      aria-labelledby="course-heading"
      className="relative overflow-hidden rounded-[28px] bg-paper-lift p-5 ring-1 ring-rule shadow-print"
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${theme.bar}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <p className={`truncate ${KICKER}`}>{deck.name}</p>
          {unit && (
            <>
              <p className={`mt-1 flex items-center gap-2 ${KICKER}`}>
                Ünite {unit.index}
                {unit.level && <span className="rounded-md bg-paper-deep px-1.5 py-0.5">{unit.level}</span>}
              </p>
              <h2 id="course-heading" className="mt-0.5 text-2xl font-extrabold tracking-tight text-ink">
                {unit.title}
              </h2>
              {unit.titleTr && <p className="text-[15px] font-bold text-graphite">{unit.titleTr}</p>}
            </>
          )}
        </div>
        {unit && (
          <div className="flex shrink-0 flex-col items-end">
            <span className="rounded-full bg-paper-deep px-2.5 py-1 text-xs font-extrabold tabular-nums text-ink">
              {done}/{unit.lessons.length} ders
            </span>
            <span className="mt-1.5 flex gap-1" aria-hidden="true">
              {unit.lessons.map((l) => (
                <span key={l.number} className={`h-1.5 w-4 rounded-full ${l.state === "done" ? "bg-grass" : l.state === "current" ? "bg-grass/40" : "bg-rule"}`} />
              ))}
            </span>
          </div>
        )}
      </div>

      {lesson ? (
        <div className="mt-4 rounded-2xl bg-paper-deep/60 p-3 pl-4 ring-1 ring-rule">
          <p className={KICKER}>Sıradaki ders · {lesson.number}</p>
          <p className="mt-0.5 text-[17px] font-extrabold leading-snug text-ink">
            {lesson.cards.map((c) => c.front).join(" · ")}
          </p>
        </div>
      ) : (
        unit && (
          <p className="mt-4 text-sm font-semibold text-graphite">
            {unit.lessonsDone && unit.state !== "passed" ? "Dersler bitti — ünite testi seni bekliyor. 🎯" : "Yol haritasına bak, sıradaki durağı seç."}
          </p>
        )
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {lesson && waits ? (
          <Button variant="ink" disabled className="text-center">
            Bugünün {budget?.cap ?? 3} yeni kelimesi tamam · Ders {lesson.number} yarın
          </Button>
        ) : lesson ? (
          <LinkButton to={`/decks/${deck.id}/study?lesson=${lesson.number}`} variant="ink">
            {lesson.learned > 0 ? "Derse devam et" : "Derse başla"}
          </LinkButton>
        ) : unit?.lessonsDone && unit.state !== "passed" && unit.id !== null ? (
          <LinkButton to={`/decks/${deck.id}/units/${unit.id}/test`} variant="ink">Ünite testi</LinkButton>
        ) : (
          <LinkButton to={`/decks/${deck.id}`} variant="ink">Yol haritası</LinkButton>
        )}
        {unit?.grammar && unit.id !== null && (
          <LinkButton to={`/decks/${deck.id}/units/${unit.id}/grammar`} variant="outline">
            Gramer notu
          </LinkButton>
        )}
        {unit?.dialogue && unit.id !== null && (
          <LinkButton to={`/decks/${deck.id}/units/${unit.id}/dialogue`} variant="outline">
            Diyalog
          </LinkButton>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-graphite">
        <span>Ders {stats.currentLesson ?? stats.totalLessons}/{stats.totalLessons}</span>
        <span>{stats.wordsKnown} kelime öğrenildi · {stats.totalWords}</span>
        {stats.dueNow > 0 && (
          <Link to={`/decks/${deck.id}/study`} className="font-extrabold text-accent underline decoration-accent underline-offset-2">
            {stats.dueNow} tekrar
          </Link>
        )}
        <Link to={`/decks/${deck.id}`} className="ml-auto font-extrabold text-ink underline decoration-ink underline-offset-2">
          Yol haritası →
        </Link>
      </div>
    </section>
  );
}

export default CourseHub;
