import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { primeSpeech } from "../lib/speech";
import { playLocked, playStation } from "../lib/sound";
import type { Lesson, Unit } from "../lib/path";
import { levelTheme } from "../lib/levels";
import { themeFor, type DeckTheme } from "../lib/themes";
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
 * The course drawn as a transit map, printed: one hairline rail down the
 * left, a station per lesson with its three words written beside it, square
 * stops for the unit's grammar note, dialogue and test, and a transfer
 * badge where one level hands over to the next. The rail is ink where
 * you've been and tan where you haven't; Tonton peeks out beside the
 * station you're at — that's the "you are here" marker. Each unit carries
 * one warm ink of its own, used only on its sign's tile.
 *
 * Every row is the same height so the line can be drawn from arithmetic
 * and can never drift away from the stations it joins.
 */
const ROW = 76;
const RAIL_W = 76;
const RAIL_X = RAIL_W / 2;

/** Stations rise in one after another on the first paint only, not on every tab switch. */
let composed = false;
const ENTRANCE_CAP = 8;

type Stop =
  | {
      kind: "lesson";
      lesson: Lesson;
      state: "done" | "current" | "open" | "locked";
    }
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
    stops.push({
      kind: "grammar",
      state: tailOpen ? "open" : "locked",
      title: unit.grammar.title_en,
    });
  }
  if (unit.dialogue) {
    stops.push({
      kind: "dialogue",
      state: tailOpen ? "open" : "locked",
      title: unit.dialogue.title,
    });
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
      return stop.state === "done"
        ? "done"
        : stop.state === "current"
          ? "active"
          : "locked";
    case "test":
      return stop.state === "passed"
        ? "done"
        : stop.state === "open"
          ? "active"
          : "locked";
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

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

/**
 * The rail itself, one unit's worth. A hairline: solid ink where you've
 * been, ink dashes into the station you're at, tan on to what's still
 * closed. Nothing on it moves.
 */
function Line({ stops }: { stops: Stop[] }) {
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
        const shared = {
          x1: RAIL_X,
          x2: RAIL_X,
          y1,
          y2,
          strokeWidth: 3,
          strokeLinecap: "round" as const,
        };
        if (tone === "done") return <line key={i} {...shared} stroke="var(--color-grass)" />;
        if (tone === "active") {
          return <line key={i} {...shared} stroke="var(--color-grass)" strokeDasharray="1 9" />;
        }
        return <line key={i} {...shared} stroke="var(--color-rule)" />;
      })}
    </svg>
  );
}

/** Every row is a pressable strip with the rail on the left and its sign on the right. */
const rowClasses = (shaking: boolean) =>
  `group grid w-full grid-cols-[76px_1fr] items-center rounded-2xl text-left transition-transform duration-100 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30 ${
    shaking ? "animate-[shake_400ms_ease-in-out]" : ""
  }`;

/** A lesson station: the marker on the line, then the words that live there. */
function LessonRow({
  stop,
  justDone,
  arriving,
  onOpen,
  onBlocked,
  shaking,
}: {
  stop: Extract<Stop, { kind: "lesson" }>;
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
  // The station's sign is one of its words' pictures.
  const stationEmoji =
    lesson.cards.map((card) => parseBack(card.back).emoji).find(Boolean) ?? "✦";

  return (
    <button
      type="button"
      onClick={locked ? onBlocked : onOpen}
      aria-label={
        locked
          ? `Ders ${lesson.number}, kilitli`
          : `Ders ${lesson.number}: ${words.join(", ")}${done ? ", tamamlandı" : ""}`
      }
      className={rowClasses(shaking)}
      style={{ height: ROW }}
    >
      {/* The station marker: one circle on the rail, its ring saying how things stand. */}
      <div className="relative flex h-full items-center justify-center">
        <span
          className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-paper-lift text-xl ring-2 ${
            done
              ? "ring-grass"
              : current
                ? "ring-[3px] ring-grass bg-grass-soft"
                : locked
                  ? "ring-rule opacity-60 grayscale"
                  : "ring-rule"
          } ${justDone ? "animate-[node-done-pop_600ms_cubic-bezier(0.34,1.56,0.64,1)_1]" : ""}`}
        >
          {justDone && (
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-grass animate-[burst-ring_700ms_ease-out_forwards]"
            />
          )}
          <span aria-hidden="true" className="relative">
            {stationEmoji}
          </span>
          {done && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-grass text-white ring-2 ring-white">
              <CheckIcon className="h-3 w-3" />
            </span>
          )}
        </span>
        {current && (
          // Tonton on the platform, peeking out from behind the station.
          <div
            aria-hidden="true"
            className={`absolute bottom-0.5 left-0.5 ${
              arriving ? "animate-[tt-arrive_700ms_cubic-bezier(0.34,1.2,0.64,1)_650ms_both]" : ""
            }`}
          >
            <Mascot mood="idle" size={40} className="animate-[peek_2.6s_ease-in-out_infinite]" />
          </div>
        )}
      </div>

      {/* The sign: which lesson, and what's taught there. */}
      <div
        className={`min-w-0 pr-3 transition-transform group-active:translate-x-0.5 ${locked ? "opacity-60" : ""}`}
      >
        <p className={`flex items-center gap-2 ${KICKER}`}>
          Ders {lesson.number}
          {lesson.due > 0 && !locked && !current && (
            <span className="rounded-full bg-gilt/15 px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-gilt-ink">
              {lesson.due} tekrar
            </span>
          )}
          {state === "open" && (
            <span className="rounded-full bg-paper-deep px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-graphite">
              isteğe bağlı
            </span>
          )}
        </p>
        {/* Station names are on the map even where the line is closed —
            knowing what's coming is half the reason to keep going. */}
        <p
          className={`mt-0.5 truncate font-extrabold leading-snug ${
            locked ? "text-[15px] text-graphite" : current ? "text-[17px] text-ink" : "text-[15px] text-ink"
          }`}
        >
          {words.join(" · ")}
        </p>
        {current && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-grass px-3.5 pb-2 pt-1.5 text-[12px] font-black uppercase tracking-[0.1em] text-white shadow-button">
            {lesson.learned > 0 ? "Devam et" : "Buradan başla"} →
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
  onOpen,
  onBlocked,
  shaking,
  extra,
}: {
  icon: string;
  label: string;
  title: string;
  state: "open" | "locked" | "passed" | "skippable";
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
      aria-label={`${label}: ${title}${locked ? ", kilitli" : passed ? ", geçildi" : skippable ? ", bu üniteyi atla" : ""}`}
      className={rowClasses(shaking)}
      style={{ height: ROW }}
    >
      <div className="relative flex h-full items-center justify-center">
        <span
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
            passed
              ? "bg-paper-deep ring-2 ring-moss"
              : state === "open"
                ? "bg-grass-soft ring-[3px] ring-grass"
                : skippable
                  ? "bg-paper-lift ring-2 ring-gilt/70"
                  : "bg-paper-deep opacity-60 grayscale"
          }`}
        >
          <span aria-hidden="true">{passed ? "🏆" : icon}</span>
        </span>
      </div>
      <div
        className={`min-w-0 pr-3 transition-transform group-active:translate-x-0.5 ${locked ? "opacity-60" : ""}`}
      >
        <p className={KICKER}>{label}</p>
        <p
          className={`mt-0.5 truncate text-[15px] font-extrabold leading-snug ${locked ? "text-graphite" : "text-ink"}`}
        >
          {title}
        </p>
        {extra && <p className="mt-0.5 text-[11px] font-bold text-moss">{extra}</p>}
        {skippable && (
          <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-ink ring-1 ring-rule">
            Bu üniteyi atla →
          </span>
        )}
      </div>
    </button>
  );
}

/** The transfer badge where one level's line hands over to the next. */
function Transfer({ level, reached }: { level: string; reached: boolean }) {
  const { name, story } = levelTheme(level);
  return (
    <div className="my-6 flex items-center gap-3 px-1">
      <span className="h-px flex-1 bg-rule" />
      <div className="flex items-center gap-3 rounded-full bg-paper-lift py-2 pl-2 pr-5 ring-1 ring-rule shadow-print">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${
            reached ? "bg-grass text-white" : "bg-paper-deep text-graphite"
          }`}
        >
          {level}
        </span>
        <span className="text-left leading-tight">
          <span className={`block text-xs font-extrabold uppercase tracking-[0.18em] ${reached ? "text-ink" : "text-graphite"}`}>
            {name}
          </span>
          <span className="block text-[11px] font-semibold text-graphite">{story}</span>
        </span>
      </div>
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}

/** The unit's station sign: its tile in the unit's own ink, the title, and how far along it is. */
function UnitSign({ unit, theme }: { unit: Unit; theme: DeckTheme }) {
  const locked = unit.state === "locked";
  const doneCount = unit.lessons.filter((l) => l.state === "done").length;
  return (
    <div className="sticky top-16 z-[5] mb-1 flex items-center gap-3 overflow-hidden rounded-2xl bg-paper-lift p-3 pr-4 ring-1 ring-rule shadow-print">
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[26px] ${
          locked ? "bg-paper-deep grayscale" : theme.icon
        }`}
      >
        {unitEmoji(unit)}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-2 ${KICKER}`}>
          Ünite {unit.index}
          {unit.level && (
            <span className="rounded-md bg-paper-deep px-1.5 py-0.5 text-[10px] text-graphite">{unit.level}</span>
          )}
        </p>
        <h2
          className={`line-clamp-2 text-base font-extrabold leading-tight tracking-tight ${locked ? "text-graphite" : "text-ink"}`}
        >
          {unit.title}
          {unit.titleTr && <span className="font-bold text-graphite"> ({unit.titleTr})</span>}
        </h2>
        {!locked && unit.state !== "passed" && (
          <span aria-hidden="true" className="mt-1.5 flex gap-1">
            {unit.lessons.map((lesson) => (
              <span
                key={lesson.number}
                className={`h-1.5 w-5 rounded-full ${lesson.state === "done" ? "bg-grass" : "bg-rule"}`}
              />
            ))}
          </span>
        )}
      </div>
      {locked ? (
        <LockIcon className="h-5 w-5 shrink-0 text-graphite/60" />
      ) : unit.state === "passed" ? (
        <span aria-label="Ünite geçildi" className="shrink-0 text-xl">
          🏆
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-paper-deep px-2.5 py-1 text-xs font-extrabold tabular-nums text-ink">
          {doneCount}/{unit.lessons.length}
        </span>
      )}
    </div>
  );
}

function LearningPath({ deckId, units }: LearningPathProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Set by the lesson screen on the way back, so the station can celebrate once.
  const justCompleted =
    (location.state as { completedLesson?: number } | null)?.completedLesson ??
    null;
  const [shaking, setShaking] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  // Decided once per mount: the first time the map is drawn it composes in;
  // from then on (every tab switch) it is simply there.
  const [entering] = useState(() => !composed);
  useEffect(() => {
    composed = true;
  }, []);

  const rows = units.map((unit) => ({ unit, stops: stopsFor(unit) }));
  const allStops = rows.flatMap((row) => row.stops);
  const currentIndex = allStops.findIndex(
    (s) => s.kind === "lesson" && s.state === "current",
  );
  const everythingDone = units.length > 0 && units.every((u) => u.lessonsDone);
  const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0);

  // Land on the current station once the learner is far enough down the
  // line that scrolling there by hand would be a chore.
  useEffect(() => {
    if (currentIndex > 6)
      currentRef.current?.scrollIntoView({ block: "center" });
  }, [currentIndex]);

  // Tapping a locked stop: the stop shakes and Tonton pops up to say why.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const shake = (key: string, kind: "lesson" | "grammar" | "dialogue" | "test") => {
    playLocked();
    setShaking(key);
    window.setTimeout(() => setShaking(null), 420);
    setToast(
      kind === "lesson"
        ? "Her seferinde bir durak — önce üstteki dersi bitir! 🔒"
        : kind === "test"
          ? "Bu ünitenin dersleri bitince test açılır. 🎯"
          : "Bu ünitenin derslerini bitir, burası açılır. ✨",
    );
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current ?? undefined), []);

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
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-4">
          <div className="flex items-end gap-2 rounded-2xl border-l-2 border-tonton bg-paper-lift p-2 pr-4 ring-1 ring-rule shadow-bubble animate-bubble-in">
            <Mascot mood="sad" size={44} className="shrink-0" />
            <p className="pb-1 text-sm font-bold text-ink">{toast}</p>
          </div>
        </div>
      )}
      {rows.map(({ unit, stops }, unitIndex) => {
        const theme = themeFor(unit.index);
        const previous = units[unitIndex - 1];
        const startsLevel =
          unit.level !== null && unit.level !== (previous?.level ?? null);

        return (
          <section key={unit.index} className="mb-5">
            {startsLevel && unit.level && (
              <Transfer level={unit.level} reached={unit.state !== "locked"} />
            )}

            <UnitSign unit={unit} theme={theme} />

            <div className="relative">
              <Line stops={stops} />
              {stops.map((stop, i) => {
                const key =
                  stop.kind === "lesson"
                    ? `lesson-${stop.lesson.number}`
                    : `${stop.kind}-${unit.index}`;
                const above = stops[i - 1];
                const arriving =
                  justCompleted !== null &&
                  above?.kind === "lesson" &&
                  above.lesson.number === justCompleted;
                const order = entrance++;
                const isCurrent =
                  stop.kind === "lesson" && stop.state === "current";

                let row: React.ReactNode;
                if (stop.kind === "lesson") {
                  row = (
                    <LessonRow
                      stop={stop}
                      justDone={justCompleted === stop.lesson.number}
                      arriving={arriving}
                      onOpen={() =>
                        open(
                          `/decks/${deckId}/study?lesson=${stop.lesson.number}`,
                        )
                      }
                      onBlocked={() => shake(key, "lesson")}
                      shaking={shaking === key}
                    />
                  );
                } else if (stop.kind === "grammar") {
                  row = (
                    <StopRow
                      icon="📝"
                      label="Gramer notu"
                      title={stop.title}
                      state={stop.state}
                      onOpen={() =>
                        open(`/decks/${deckId}/units/${unit.id}/grammar`)
                      }
                      onBlocked={() => shake(key, "grammar")}
                      shaking={shaking === key}
                    />
                  );
                } else if (stop.kind === "dialogue") {
                  row = (
                    <StopRow
                      icon="💬"
                      label="Diyalog"
                      title={stop.title}
                      state={stop.state}
                      onOpen={() =>
                        open(`/decks/${deckId}/units/${unit.id}/dialogue`)
                      }
                      onBlocked={() => shake(key, "dialogue")}
                      shaking={shaking === key}
                    />
                  );
                } else {
                  row = (
                    <StopRow
                      icon="🎯"
                      label="Ünite testi"
                      title={
                        stop.state === "passed"
                          ? "Geçildi"
                          : stop.state === "skippable"
                            ? "Bu kelimeleri biliyor musun? Atla"
                            : "15 soru · geçme notu %80"
                      }
                      state={stop.state}
                      extra={
                        stop.state === "passed" && stop.bestScore !== null
                          ? `En iyi %${stop.bestScore}`
                          : undefined
                      }
                      onOpen={() =>
                        open(
                          `/decks/${deckId}/units/${unit.id}/test${stop.state === "skippable" ? "?skip=1" : ""}`,
                        )
                      }
                      onBlocked={() => shake(key, "test")}
                      shaking={shaking === key}
                    />
                  );
                }

                // Only the first few stations get a delay; the rest of a
                // sixty-unit line arrives with the last of them.
                const animated = entering && order < ENTRANCE_CAP;
                return (
                  <div
                    key={key}
                    ref={isCurrent ? currentRef : undefined}
                    className={`relative scroll-mt-40 ${animated ? "animate-rise-in" : ""}`}
                    style={animated ? { animationDelay: `${order * 40}ms` } : undefined}
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
        <div
          className="mt-6 grid grid-cols-[76px_1fr] items-center pb-6"
          style={{ height: ROW }}
        >
          <div className="flex justify-center">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-paper-lift text-xl ring-2 ${
                everythingDone ? "ring-moss" : "ring-rule"
              }`}
              aria-hidden="true"
            >
              {everythingDone ? "🏆" : "🏁"}
            </span>
          </div>
          <p className={KICKER}>
            {everythingDone
              ? "Hattın sonu · kurs tamamlandı"
              : `Hattın sonu · ${totalLessons} ders`}
          </p>
        </div>
      )}
    </div>
  );
}

export default LearningPath;
