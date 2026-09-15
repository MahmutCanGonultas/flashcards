import { Link } from "react-router-dom";
import type { Card, Deck, UnitRecord } from "../types";
import { buildPath, pathStats } from "../lib/path";
import { levelTheme } from "../lib/levels";
import LinkButton from "./LinkButton";
import Skeleton from "./Skeleton";

type CourseHubProps = {
  deck: Deck;
  cards: Card[] | undefined;
  units: UnitRecord[] | undefined;
};

/**
 * The course half of the home screen: which unit you're in, what's next,
 * and the three doors — lesson, grammar note, dialogue. Where the path
 * page is the whole map, this is the "you are here" sign.
 */
function CourseHub({ deck, cards, units }: CourseHubProps) {
  if (!cards || !units) {
    return (
      <section className="rounded-3xl bg-white p-5 ring-2 ring-stone-100">
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
  const theme = levelTheme(unit?.level ?? null);
  const done = unit ? unit.lessons.filter((l) => l.state === "done").length : 0;

  return (
    <section
      aria-labelledby="course-heading"
      className="relative overflow-hidden rounded-3xl bg-white p-5 ring-2 ring-stone-100 shadow-[0_8px_24px_-16px_rgba(28,25,23,0.35)]"
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${theme.fill}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-extrabold uppercase tracking-widest text-stone-400">{deck.name}</p>
          {unit && (
            <>
              <p className={`mt-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest ${theme.text}`}>
                Ünite {unit.index}
                {unit.level && <span className={`rounded-md px-1.5 py-0.5 ${theme.soft}`}>{unit.level}</span>}
              </p>
              <h2 id="course-heading" className="mt-0.5 text-2xl font-extrabold tracking-tight text-stone-800">
                {unit.title}
                {unit.titleTr && <span className="font-bold text-stone-400"> ({unit.titleTr})</span>}
              </h2>
            </>
          )}
        </div>
        {unit && (
          <div className="flex shrink-0 flex-col items-end">
            <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ${theme.soft} ${theme.text}`}>
              {done}/{unit.lessons.length} ders
            </span>
            <span className="mt-1 flex gap-1" aria-hidden="true">
              {unit.lessons.map((l) => (
                <span key={l.number} className={`h-1.5 w-4 rounded-full ${l.state === "done" ? theme.fill : l.state === "current" ? "bg-stone-800" : "bg-stone-200"}`} />
              ))}
            </span>
          </div>
        )}
      </div>

      {lesson ? (
        <div className="mt-4 rounded-2xl bg-stone-50 p-3 pl-4 ring-1 ring-stone-200">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">Sıradaki ders · {lesson.number}</p>
          <p className={`mt-0.5 text-[17px] font-extrabold leading-snug ${theme.text}`}>
            {lesson.cards.map((c) => c.front).join(" · ")}
          </p>
        </div>
      ) : (
        unit && (
          <p className="mt-4 text-sm font-semibold text-stone-500">
            {unit.lessonsDone && unit.state !== "passed" ? "Dersler bitti — ünite testi seni bekliyor. 🎯" : "Yol haritasına bak, sıradaki durağı seç."}
          </p>
        )
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {lesson ? (
          <LinkButton to={`/decks/${deck.id}/study?lesson=${lesson.number}`}>
            {lesson.learned > 0 ? "▶ Derse devam et" : "▶ Derse başla"}
          </LinkButton>
        ) : unit?.lessonsDone && unit.state !== "passed" && unit.id !== null ? (
          <LinkButton to={`/decks/${deck.id}/units/${unit.id}/test`}>🎯 Ünite testi</LinkButton>
        ) : (
          <LinkButton to={`/decks/${deck.id}`}>🗺️ Yol haritası</LinkButton>
        )}
        {unit?.grammar && unit.id !== null && (
          <LinkButton to={`/decks/${deck.id}/units/${unit.id}/grammar`} variant="secondary">
            📝 Gramer notu
          </LinkButton>
        )}
        {unit?.dialogue && unit.id !== null && (
          <LinkButton to={`/decks/${deck.id}/units/${unit.id}/dialogue`} variant="secondary">
            💬 Diyalog
          </LinkButton>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-stone-400">
        <span>Ders {stats.currentLesson ?? stats.totalLessons}/{stats.totalLessons}</span>
        <span>{stats.wordsKnown} kelime öğrenildi · {stats.totalWords}</span>
        {stats.dueNow > 0 && (
          <Link to={`/decks/${deck.id}/study`} className="font-extrabold text-violet-600 hover:underline">
            🔁 {stats.dueNow} tekrar
          </Link>
        )}
        <Link to={`/decks/${deck.id}`} className="ml-auto font-extrabold text-stone-500 hover:underline">
          Yol haritası →
        </Link>
      </div>
    </section>
  );
}

export default CourseHub;
