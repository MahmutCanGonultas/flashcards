import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { primeSpeech } from "../lib/speech";
import { playLocked, playStation } from "../lib/sound";
import type { Lesson, Unit } from "../lib/path";
import { levelTheme, type LevelTheme } from "../lib/levels";
import { parseBack } from "../lib/cardBack";
import Mascot from "./Mascot";
import { CheckIcon, LockIcon } from "./icons";

type LearningPathProps = {
  deckId: string;
  units: Unit[];
};

/**
 * The Kelimece Line.
 *
 * The course drawn as a transit map: one coloured line per level, a station
 * per lesson with its three words written beside it, square stops for the
 * unit's grammar note, dialogue and test, and a transfer badge where one
 * level hands over to the next. Tonton stands on the platform at the
 * station you're at — that's the "you are here" marker.
 *
 * Every row is the same height so the line can be drawn from arithmetic
 * and can never drift away from the stations it joins.
 */
const ROW = 76;
const RAIL_W = 76;
const RAIL_X = RAIL_W / 2;

type Stop =
  | { kind: "lesson"; lesson: Lesson; state: "done" | "current" | "open" | "locked" }
  | { kind: "grammar"; state: "open" | "locked"; title: string }
  | { kind: "dialogue"; state: "open" | "locked"; title: string }
  | {
      kind: "test";
      state: "passed" | "open" | "skippable" | "locked";
      bestScore: number | null;
    };

function stopsFor(unit: Unit): Stop[] {
  const stops: Stop[] = unit.lessons.map((lesson) => ({
    kind: "lesson",
    lesson,
    state: unit.state === "locked" ? "locked" : lesson.state,
  }));
  // Tag-only decks have no unit rows: nothing to read, nothing to pass.
  if (unit.id === null) return stops;

  const tailOpen = unit.state !== "locked" && unit.lessonsDone;
  if (unit.grammar) {
    stops.push({ kind: "grammar", state: tailOpen ? "open" : "locked", title: unit.grammar.title_en });
  }
  if (unit.dialogue) {
    stops.push({ kind: "dialogue", state: tailOpen ? "open" : "locked", title: unit.dialogue.title });
  }
  // An open unit's test can be taken before its lessons: pass it and the
  // unit counts as done, which is how someone who already knows these
  // words moves on without sitting through them.
  stops.push({
    kind: "test",
    state:
      unit.state === "passed"
        ? "passed"
        : tailOpen
          ? "open"
          : unit.state === "open"
            ? "skippable"
            : "locked",
    bestScore: unit.bestScore,
  });
  return stops;
}

/** How the segment of line leading INTO a stop is drawn. */
function toneOf(stop: Stop): "done" | "active" | "locked" {
  switch (stop.kind) {
    case "lesson":
      return stop.state === "done" ? "done" : stop.state === "current" ? "active" : "locked";
    case "test":
      return stop.state === "passed" ? "done" : stop.state === "open" ? "active" : "locked";
    default:
      return stop.state === "open" ? "active" : "locked";
  }
}

/** The most common emoji across a unit's words, as the unit's sign. */
function unitEmoji(unit: Unit): string {
  const counts = new Map<string, number>();
  for (const lesson of unit.lessons) {
    for (const card of lesson.cards) {
      const emoji = parseBack(card.back).emoji;
      if (emoji) counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
    }
  }
  let best = "📘";
  let bestCount = 0;
  for (const [emoji, count] of counts) {
    if (count > bestCount) {
      best = emoji;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The line itself, one unit's worth. Solid where you've been, flowing
 * dashes into the station you're at, faint dots on to what's still closed.
 */
function Line({ stops, theme }: { stops: Stop[]; theme: LevelTheme }) {
  const height = stops.length * ROW;
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0"
      width={RAIL_W}
      height={height}
      viewBox={`0 0 ${RAIL_W} ${height}`}
      fill="none"
    >
      {stops.slice(1).map((to, i) => {
        const y1 = ROW / 2 + i * ROW;
        const y2 = y1 + ROW;
        const tone = toneOf(to);
        const shared = { x1: RAIL_X, x2: RAIL_X, y1, y2, strokeWidth: 7, strokeLinecap: "round" as const };
        if (tone === "done") return <line key={i} {...shared} className={theme.stroke} />;
        if (tone === "active") {
          return (
            <line
              key={i}
              {...shared}
              className={`${theme.stroke} animate-[trail-flow_900ms_linear_infinite]`}
              strokeDasharray="10 12"
              opacity="0.8"
            />
          );
        }
        return <line key={i} {...shared} className="stroke-stone-200" strokeDasharray="3 12" />;
      })}
    </svg>
  );
}

/** A lesson station: the marker on the line, then the words that live there. */
function LessonRow({
  stop,
  theme,
  justDone,
  arriving,
  onOpen,
  onBlocked,
  shaking,
}: {
  stop: Extract<Stop, { kind: "lesson" }>;
  theme: LevelTheme;
  justDone: boolean;
  /** Tonton walks in from the station above: the learner just finished it. */
  arriving: boolean;
  onOpen: () => void;
  onBlocked: () => void;
  shaking: boolean;
}) {
  const { lesson, state } = stop;
  const words = lesson.cards.map((card) => card.front);
  const locked = state === "locked";
  const current = state === "current";
  const done = state === "done";

  return (
    <button
      type="button"
      onClick={locked ? onBlocked : onOpen}
      aria-label={
        locked
          ? `Lesson ${lesson.number}, locked`
          : `Lesson ${lesson.number}: ${words.join(", ")}${done ? ", completed" : ""}`
      }
      className={`group grid w-full grid-cols-[76px_1fr] items-center rounded-2xl text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${
        current ? "bg-white/70" : "active:bg-white/60"
      } ${shaking ? "animate-[shake_400ms_ease-in-out]" : ""}`}
      style={{ height: ROW }}
    >
      {/* The station marker. */}
      <div className="relative flex h-full items-center justify-center">
        {current ? (
          <div
            className={`relative ${arriving ? "animate-[tt-arrive_700ms_cubic-bezier(0.34,1.2,0.64,1)_650ms_both]" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`absolute -inset-2 rounded-full ${theme.soft} animate-[tt-breathe_2.4s_ease-in-out_infinite]`}
            />
            <span
              aria-hidden="true"
              className={`absolute -inset-1 animate-ping rounded-full ${theme.fill} opacity-20`}
            />
            <Mascot mood="idle" size={54} className="relative animate-[peek_2.6s_ease-in-out_infinite]" />
          </div>
        ) : done ? (
          <span
            className={`relative flex h-8 w-8 items-center justify-center rounded-full ${theme.fill} text-white ring-4 ring-[#FDF9F3] ${
              justDone ? "animate-[node-done-pop_600ms_cubic-bezier(0.34,1.56,0.64,1)_1]" : ""
            }`}
          >
            {justDone && (
              <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full ${theme.fill} animate-[burst-ring_700ms_ease-out_forwards]`}
              />
            )}
            <CheckIcon className="relative h-4 w-4" />
          </span>
        ) : state === "open" ? (
          <span className={`h-7 w-7 rounded-full border-[3px] border-dashed bg-white ring-4 ring-[#FDF9F3] ${theme.border}`} />
        ) : (
          <span className="h-4 w-4 rounded-full bg-stone-300 ring-4 ring-[#FDF9F3]" />
        )}
      </div>

      {/* The sign: which lesson, and what's taught there. */}
      <div className={`min-w-0 pr-3 transition-transform group-active:translate-x-0.5 ${locked ? "opacity-60" : ""}`}>
        <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
          Lesson {lesson.number}
          {lesson.due > 0 && !locked && !current && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-amber-700">
              {lesson.due} to review
            </span>
          )}
          {state === "open" && (
            <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-stone-500">
              optional
            </span>
          )}
        </p>
        {/* Station names are on the map even where the line is closed —
            knowing what's coming is half the reason to keep going. */}
        <p
          className={`mt-0.5 truncate text-[15px] leading-snug ${
            locked ? "font-bold text-stone-400" : current ? "font-extrabold text-stone-800" : `font-extrabold ${theme.text}`
          }`}
        >
          {words.join(" · ")}
        </p>
        {current && (
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${theme.badge} px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm animate-[bob_1.6s_ease-in-out_infinite]`}
          >
            {lesson.learned > 0 ? "Carry on" : "Start here"} →
          </span>
        )}
      </div>
    </button>
  );
}

/** A square stop: grammar, dialogue or the test. */
function StopRow({
  icon,
  label,
  title,
  state,
  theme,
  onOpen,
  onBlocked,
  shaking,
  extra,
}: {
  icon: string;
  label: string;
  title: string;
  state: "open" | "locked" | "passed" | "skippable";
  theme: LevelTheme;
  onOpen: () => void;
  onBlocked: () => void;
  shaking: boolean;
  extra?: string;
}) {
  const locked = state === "locked";
  const passed = state === "passed";
  const skippable = state === "skippable";
  return (
    <button
      type="button"
      onClick={locked ? onBlocked : onOpen}
      aria-label={`${label}: ${title}${locked ? ", locked" : passed ? ", passed" : skippable ? ", test out of this unit" : ""}`}
      className={`group grid w-full grid-cols-[76px_1fr] items-center rounded-2xl text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${
        state === "open" ? "bg-white/70" : "active:bg-white/60"
      } ${shaking ? "animate-[shake_400ms_ease-in-out]" : ""}`}
      style={{ height: ROW }}
    >
      <div className="relative flex h-full items-center justify-center">
        {state === "open" && (
          <span aria-hidden="true" className={`absolute h-11 w-11 animate-ping rounded-xl ${theme.fill} opacity-20`} />
        )}
        <span
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-xl ring-4 ring-[#FDF9F3] ${
            passed
              ? "bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_2px_0_0_var(--color-amber-600)]"
              : state === "open"
                ? `bg-white shadow-[0_2px_0_0_var(--color-stone-200)] outline outline-2 -outline-offset-2 ${theme.outline}`
                : skippable
                  ? "bg-amber-50 outline outline-2 outline-dashed -outline-offset-2 outline-amber-400"
                  : "bg-stone-100 grayscale opacity-70"
          }`}
        >
          <span aria-hidden="true">{passed ? "🏆" : icon}</span>
        </span>
      </div>
      <div className={`min-w-0 pr-3 transition-transform group-active:translate-x-0.5 ${locked ? "opacity-60" : ""}`}>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">{label}</p>
        <p className={`mt-0.5 truncate text-[15px] font-extrabold leading-snug ${locked ? "text-stone-400" : "text-stone-800"}`}>
          {title}
        </p>
        {extra && <p className="mt-0.5 text-[11px] font-bold text-amber-700">{extra}</p>}
        {skippable && (
          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 ring-1 ring-amber-200">
            Test out of this unit →
          </span>
        )}
      </div>
    </button>
  );
}

/** The transfer badge where one level's line hands over to the next. */
function Transfer({ level, reached }: { level: string; reached: boolean }) {
  const theme = levelTheme(level);
  return (
    <div className="my-6 flex items-center gap-3 px-1">
      <span className={`h-1 flex-1 rounded-full ${reached ? theme.fill : "bg-stone-200"} ${reached ? "opacity-50" : ""}`} />
      <div
        className={`flex items-center gap-3 rounded-full py-2 pl-3 pr-5 ring-2 ${
          reached
            ? `bg-gradient-to-r ${theme.badge} text-white ring-white/70 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.35)]`
            : "bg-white text-stone-400 ring-stone-200"
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${
            reached ? "bg-white/25" : "bg-stone-100"
          }`}
        >
          {level}
        </span>
        <span className="text-left leading-tight">
          <span className="block text-xs font-extrabold uppercase tracking-widest">{theme.name}</span>
          <span className={`block text-[11px] font-semibold ${reached ? "text-white/80" : "text-stone-400"}`}>
            {theme.nameTr}
          </span>
        </span>
      </div>
      <span className={`h-1 flex-1 rounded-full ${reached ? theme.fill : "bg-stone-200"} ${reached ? "opacity-50" : ""}`} />
    </div>
  );
}

function LearningPath({ deckId, units }: LearningPathProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Set by the lesson screen on the way back, so the station can celebrate once.
  const justCompleted =
    (location.state as { completedLesson?: number } | null)?.completedLesson ?? null;
  const [shaking, setShaking] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  const rows = units.map((unit) => ({ unit, stops: stopsFor(unit) }));
  const allStops = rows.flatMap((row) => row.stops);
  const currentIndex = allStops.findIndex((s) => s.kind === "lesson" && s.state === "current");
  const everythingDone = units.length > 0 && units.every((u) => u.lessonsDone);
  const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0);

  // Land on the current station once the learner is far enough down the
  // line that scrolling there by hand would be a chore.
  useEffect(() => {
    if (currentIndex > 6) currentRef.current?.scrollIntoView({ block: "center" });
  }, [currentIndex]);

  const shake = (key: string) => {
    playLocked();
    setShaking(key);
    window.setTimeout(() => setShaking(null), 420);
  };

  const open = (to: string) => {
    // Inside the tap, before the route changes: iOS only unlocks speech
    // from a user gesture.
    primeSpeech();
    playStation();
    navigate(to);
  };

  // Stations arrive one after another on first paint; the stagger is
  // counted across units so it reads as one line lighting up.
  let entrance = 0;

  return (
    <div className="pb-4">
      {rows.map(({ unit, stops }, unitIndex) => {
        const theme = levelTheme(unit.level);
        const previous = units[unitIndex - 1];
        const startsLevel = unit.level !== null && unit.level !== (previous?.level ?? null);
        const locked = unit.state === "locked";
        const doneCount = unit.lessons.filter((l) => l.state === "done").length;

        return (
          <section key={unit.index} className="mb-4">
            {startsLevel && unit.level && <Transfer level={unit.level} reached={!locked} />}

            {/* The unit's station sign. */}
            <div
              className={`sticky top-16 z-[5] mb-2 flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3 pr-4 ring-1 ring-stone-200 ${
                locked ? "" : "shadow-[0_8px_20px_-14px_rgba(28,25,23,0.45)]"
              }`}
            >
              <span className={`h-12 w-1.5 shrink-0 rounded-full ${locked ? "bg-stone-200" : theme.fill}`} />
              <span
                aria-hidden="true"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl ${
                  locked ? "bg-stone-100 grayscale" : theme.soft
                }`}
              >
                {unitEmoji(unit)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                  Unit {unit.index}
                  {unit.level && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        locked ? "bg-stone-100 text-stone-400" : `${theme.soft} ${theme.text}`
                      }`}
                    >
                      {unit.level}
                    </span>
                  )}
                </p>
                <h2 className={`truncate text-base font-extrabold tracking-tight ${locked ? "text-stone-400" : "text-stone-800"}`}>
                  {unit.title}
                  {unit.titleTr && (
                    <span className={`font-bold ${locked ? "text-stone-300" : "text-stone-400"}`}> ({unit.titleTr})</span>
                  )}
                </h2>
              </div>
              {locked ? (
                <LockIcon className="h-5 w-5 shrink-0 text-stone-300" />
              ) : unit.state === "passed" ? (
                <span aria-label="Unit passed" className="shrink-0 text-xl">
                  🏆
                </span>
              ) : (
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ${theme.soft} ${theme.text}`}>
                  {doneCount}/{unit.lessons.length}
                </span>
              )}
            </div>

            <div className="relative">
              <Line stops={stops} theme={theme} />
              {stops.map((stop, i) => {
                const key =
                  stop.kind === "lesson" ? `lesson-${stop.lesson.number}` : `${stop.kind}-${unit.index}`;
                const above = stops[i - 1];
                const arriving =
                  justCompleted !== null && above?.kind === "lesson" && above.lesson.number === justCompleted;
                const delay = Math.min(entrance++, 16) * 40;
                const isCurrent = stop.kind === "lesson" && stop.state === "current";

                let row: React.ReactNode;
                if (stop.kind === "lesson") {
                  row = (
                    <LessonRow
                      stop={stop}
                      theme={theme}
                      justDone={justCompleted === stop.lesson.number}
                      arriving={arriving}
                      onOpen={() => open(`/decks/${deckId}/study?lesson=${stop.lesson.number}`)}
                      onBlocked={() => shake(key)}
                      shaking={shaking === key}
                    />
                  );
                } else if (stop.kind === "grammar") {
                  row = (
                    <StopRow
                      icon="📝"
                      label="Grammar note"
                      title={stop.title}
                      state={stop.state}
                      theme={theme}
                      onOpen={() => open(`/decks/${deckId}/units/${unit.id}/grammar`)}
                      onBlocked={() => shake(key)}
                      shaking={shaking === key}
                    />
                  );
                } else if (stop.kind === "dialogue") {
                  row = (
                    <StopRow
                      icon="💬"
                      label="Dialogue"
                      title={stop.title}
                      state={stop.state}
                      theme={theme}
                      onOpen={() => open(`/decks/${deckId}/units/${unit.id}/dialogue`)}
                      onBlocked={() => shake(key)}
                      shaking={shaking === key}
                    />
                  );
                } else {
                  row = (
                    <StopRow
                      icon="🎯"
                      label="Unit test"
                      title={
                        stop.state === "passed"
                          ? "Passed"
                          : stop.state === "skippable"
                            ? "Know these words? Skip ahead"
                            : "15 questions · 80% to pass"
                      }
                      state={stop.state}
                      theme={theme}
                      extra={stop.state === "passed" && stop.bestScore !== null ? `Best ${stop.bestScore}%` : undefined}
                      onOpen={() =>
                        open(
                          `/decks/${deckId}/units/${unit.id}/test${stop.state === "skippable" ? "?skip=1" : ""}`,
                        )
                      }
                      onBlocked={() => shake(key)}
                      shaking={shaking === key}
                    />
                  );
                }

                return (
                  <div
                    key={key}
                    ref={isCurrent ? currentRef : undefined}
                    className="relative scroll-mt-40 animate-[node-in_360ms_ease-out_both]"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    {row}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* The terminus, so the line visibly goes somewhere. */}
      {units.length > 0 && (
        <div className="mt-6 grid grid-cols-[76px_1fr] items-center pb-6" style={{ height: ROW }}>
          <div className="flex justify-center">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ring-4 ring-[#FDF9F3] ${
                everythingDone
                  ? "bg-amber-400 shadow-[0_3px_0_0_var(--color-amber-600)]"
                  : "bg-stone-100 outline outline-2 outline-dashed -outline-offset-2 outline-stone-300"
              }`}
              aria-hidden="true"
            >
              {everythingDone ? "🏆" : "🏁"}
            </span>
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
            {everythingDone ? "End of the line · course complete" : `End of the line · ${totalLessons} lessons`}
          </p>
        </div>
      )}
    </div>
  );
}

export default LearningPath;
