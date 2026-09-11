import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { primeSpeech } from "../lib/speech";
import type { Lesson, Unit } from "../lib/path";
import { themeFor } from "../lib/themes";
import { CheckIcon, LockIcon, StarIcon } from "./icons";

type LearningPathProps = {
  deckId: string;
  units: Unit[];
};

/**
 * The serpentine offsets a path node is nudged by, cycled across the whole
 * path so the wave keeps its rhythm across unit boundaries.
 */
const WAVE = [0, 44, 68, 44, 0, -44, -68, -44];

/** Geometry the trail is drawn from. Everything that moves a node lives off-flow. */
const COLUMN_WIDTH = 220;
const NODE = 70;
const GAP = 26;
const PITCH = NODE + GAP;

type Accent = { face: string; slab: string; ring: string; stroke: string };

/**
 * Everything that sits on the trail. A unit is its lessons, then the
 * dialogue that uses their words, then the test that opens the next unit.
 */
type PathItem =
  | { kind: "lesson"; lesson: Lesson; state: "done" | "current" | "locked" }
  | { kind: "dialogue"; state: "open" | "locked" }
  | { kind: "test"; state: "passed" | "open" | "locked"; bestScore: number | null };

function itemsFor(unit: Unit): PathItem[] {
  const items: PathItem[] = unit.lessons.map((lesson) => ({
    kind: "lesson",
    lesson,
    state: unit.state === "locked" ? "locked" : lesson.state,
  }));
  // Tag-only decks have no unit rows, so nothing to talk about and nothing to pass.
  if (unit.id === null) return items;

  const tailOpen = unit.state !== "locked" && unit.lessonsDone;
  if (unit.dialogue) items.push({ kind: "dialogue", state: tailOpen ? "open" : "locked" });
  items.push({
    kind: "test",
    state: unit.state === "passed" ? "passed" : tailOpen ? "open" : "locked",
    bestScore: unit.bestScore,
  });
  return items;
}

/** Trail colour is decided by where a segment leads. */
function trailTone(item: PathItem): "done" | "active" | "locked" {
  if (item.kind === "lesson") {
    return item.state === "done" ? "done" : item.state === "current" ? "active" : "locked";
  }
  if (item.kind === "test") {
    return item.state === "passed" ? "done" : item.state === "open" ? "active" : "locked";
  }
  return item.state === "open" ? "active" : "locked";
}

function NodeShell({
  offset,
  entrance,
  children,
}: {
  offset: number;
  entrance: number;
  children: React.ReactNode;
}) {
  // The offset and the entrance live on different elements: the entrance
  // animates `transform`, and would otherwise wipe the translateX when it ends.
  return (
    <div className="relative h-[70px]" style={{ transform: `translateX(${offset}px)` }}>
      <div
        className="relative flex h-[70px] items-center justify-center animate-[node-in_420ms_ease-out_both]"
        style={{ animationDelay: `${Math.min(entrance, 14) * 45}ms` }}
      >
        {children}
      </div>
    </div>
  );
}

function LessonNode({
  lesson,
  state,
  accent,
  onOpen,
  onBlocked,
  isBlockedShaking,
}: {
  lesson: Lesson;
  state: "done" | "current" | "locked";
  accent: Accent;
  onOpen: () => void;
  onBlocked: () => void;
  isBlockedShaking: boolean;
}) {
  const locked = state === "locked";
  const current = state === "current";
  const done = state === "done";

  return (
    <>
      {/* Off-flow, so the node grid stays regular and the trail lines up. */}
      {current && (
        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 animate-[bob_1.4s_ease-in-out_infinite] whitespace-nowrap rounded-2xl bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-violet-600 shadow-[0_3px_0_0_var(--color-stone-200)] ring-2 ring-stone-100">
          Start
        </div>
      )}

      <button
        type="button"
        onClick={locked ? onBlocked : onOpen}
        aria-label={
          locked
            ? `Lesson ${lesson.number}, locked`
            : `Lesson ${lesson.number}, ${done ? "completed" : "start"}`
        }
        className={`relative flex items-center justify-center rounded-full transition-transform duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${
          current ? "h-[76px] w-[76px]" : "h-[70px] w-[70px]"
        } ${
          locked
            ? `bg-stone-200 text-stone-400 shadow-[0_4px_0_0_var(--color-stone-300)] ${isBlockedShaking ? "animate-[shake_400ms_ease-in-out]" : ""}`
            : `${accent.face} text-white ${accent.slab} hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none`
        }`}
      >
        {current && (
          <span
            aria-hidden="true"
            className={`absolute -inset-1.5 animate-ping rounded-full ${accent.ring} opacity-60`}
          />
        )}
        {!locked && (
          <span
            aria-hidden="true"
            className="absolute inset-[3px] rounded-full bg-gradient-to-b from-white/30 to-transparent"
          />
        )}
        <span className="relative">
          {locked ? (
            <LockIcon className="h-7 w-7" />
          ) : done ? (
            <CheckIcon className="h-8 w-8" />
          ) : (
            <StarIcon className="h-8 w-8" />
          )}
        </span>
        {lesson.due > 0 && !locked && !current && (
          <span
            aria-label={`${lesson.due} words to review`}
            className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-extrabold text-white ring-2 ring-[#FDF9F3]"
          >
            {lesson.due}
          </span>
        )}
      </button>

      {/* Half-finished lesson: one dot per word already met. */}
      {current && lesson.learned > 0 && (
        <span
          aria-label={`${lesson.learned} of ${lesson.cards.length} words started`}
          className="pointer-events-none absolute -bottom-3 left-1/2 flex -translate-x-1/2 gap-1"
        >
          {lesson.cards.map((card, index) => (
            <span
              key={card.id}
              className={`h-1.5 w-1.5 rounded-full ${index < lesson.learned ? "bg-violet-500" : "bg-stone-300"}`}
            />
          ))}
        </span>
      )}
    </>
  );
}

/** The conversation at the end of a unit. Open once its lessons are done. */
function DialogueNode({
  state,
  onOpen,
  onBlocked,
  isBlockedShaking,
}: {
  state: "open" | "locked";
  onOpen: () => void;
  onBlocked: () => void;
  isBlockedShaking: boolean;
}) {
  const locked = state === "locked";
  return (
    <button
      type="button"
      onClick={locked ? onBlocked : onOpen}
      aria-label={locked ? "Dialogue, locked" : "Read the dialogue"}
      className={`relative flex h-[70px] w-[70px] items-center justify-center rounded-3xl text-3xl transition-transform duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${
        locked
          ? `bg-stone-100 text-stone-300 ring-2 ring-dashed ring-stone-300 ${isBlockedShaking ? "animate-[shake_400ms_ease-in-out]" : ""}`
          : "bg-white text-violet-600 shadow-[0_4px_0_0_var(--color-violet-200)] ring-2 ring-violet-200 hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none"
      }`}
    >
      <span aria-hidden="true" className={locked ? "grayscale" : ""}>
        💬
      </span>
    </button>
  );
}

/** The gate. Amber while it's waiting to be taken, gold once it's been passed. */
function TestNode({
  state,
  bestScore,
  onOpen,
  onBlocked,
  isBlockedShaking,
}: {
  state: "passed" | "open" | "locked";
  bestScore: number | null;
  onOpen: () => void;
  onBlocked: () => void;
  isBlockedShaking: boolean;
}) {
  const locked = state === "locked";
  const passed = state === "passed";
  return (
    <>
      {state === "open" && (
        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 animate-[bob_1.4s_ease-in-out_infinite] whitespace-nowrap rounded-2xl bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-600 shadow-[0_3px_0_0_var(--color-stone-200)] ring-2 ring-stone-100">
          Unit test
        </div>
      )}
      <button
        type="button"
        onClick={locked ? onBlocked : onOpen}
        aria-label={
          locked ? "Unit test, locked" : passed ? "Unit test, passed" : "Take the unit test"
        }
        className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-full text-3xl transition-transform duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${
          locked
            ? `bg-stone-200 text-stone-400 shadow-[0_4px_0_0_var(--color-stone-300)] ${isBlockedShaking ? "animate-[shake_400ms_ease-in-out]" : ""}`
            : passed
              ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-[0_4px_0_0_var(--color-amber-600)] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none"
              : "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_4px_0_0_var(--color-orange-700)] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none"
        }`}
      >
        {state === "open" && (
          <span
            aria-hidden="true"
            className="absolute -inset-1.5 animate-ping rounded-full bg-amber-300 opacity-60"
          />
        )}
        {!locked && (
          <span
            aria-hidden="true"
            className="absolute inset-[3px] rounded-full bg-gradient-to-b from-white/30 to-transparent"
          />
        )}
        <span className="relative" aria-hidden="true">
          {locked ? <LockIcon className="h-7 w-7" /> : passed ? "🏆" : "🎯"}
        </span>
        {passed && bestScore !== null && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-amber-700 ring-1 ring-amber-200">
            {bestScore}%
          </span>
        )}
      </button>
    </>
  );
}

/**
 * The line that joins a unit's nodes into one trail. Drawn from the same
 * numbers that place the nodes, so it can't drift out from under them.
 * Each segment is coloured by where it leads: solid to something finished,
 * flowing dashes to what's open now, faint dashes to what's still locked.
 */
function Trail({
  items,
  offsets,
  accent,
}: {
  items: PathItem[];
  offsets: number[];
  accent: Accent;
}) {
  const height = items.length * NODE + (items.length - 1) * GAP;
  const centerX = COLUMN_WIDTH / 2;
  const at = (index: number) => ({ x: centerX + offsets[index], y: NODE / 2 + index * PITCH });

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width={COLUMN_WIDTH}
      height={height}
      viewBox={`0 0 ${COLUMN_WIDTH} ${height}`}
      fill="none"
    >
      {items.slice(1).map((to, i) => {
        const a = at(i);
        const b = at(i + 1);
        const bend = PITCH / 2;
        const d = `M ${a.x} ${a.y} C ${a.x} ${a.y + bend}, ${b.x} ${b.y - bend}, ${b.x} ${b.y}`;
        const tone = trailTone(to);
        const stroke = to.kind === "test" ? "stroke-amber-400" : accent.stroke;

        if (tone === "done") {
          return <path key={i} d={d} className={stroke} strokeWidth="8" strokeLinecap="round" />;
        }
        if (tone === "active") {
          return (
            <path
              key={i}
              d={d}
              className={`${stroke} animate-[trail-flow_900ms_linear_infinite]`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="14 14"
              opacity="0.75"
            />
          );
        }
        return (
          <path
            key={i}
            d={d}
            className="stroke-stone-200"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="4 16"
          />
        );
      })}
    </svg>
  );
}

function LearningPath({ deckId, units }: LearningPathProps) {
  const navigate = useNavigate();
  const [shaking, setShaking] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  const unitItems = units.map((unit) => ({ unit, items: itemsFor(unit) }));
  const allItems = unitItems.flatMap(({ items }) => items);
  const currentIndexInPath = allItems.findIndex(
    (item) => item.kind === "lesson" && item.state === "current",
  );
  const everythingDone = units.length > 0 && units.every((u) => u.lessonsDone);

  // Jump to where the learner actually is — but only once they're deep enough
  // in that scrolling there is a chore, so early on they still land on the
  // stats and the review button above the path.
  useEffect(() => {
    if (currentIndexInPath > 5) currentRef.current?.scrollIntoView({ block: "center" });
  }, [currentIndexInPath]);

  const shake = (key: string) => {
    setShaking(key);
    window.setTimeout(() => setShaking(null), 420);
  };

  const open = (to: string) => {
    // Inside the tap, before the route changes: iOS only unlocks speech
    // from a user gesture.
    primeSpeech();
    navigate(to);
  };

  // Offsets are assigned across the whole path up front, so the wave keeps its
  // rhythm through unit boundaries instead of restarting inside each section.
  const placed: {
    unit: Unit;
    items: PathItem[];
    offsets: number[];
    entrances: number[];
  }[] = [];
  let running = 0;
  for (const { unit, items } of unitItems) {
    const base = running;
    placed.push({
      unit,
      items,
      offsets: items.map((_, i) => WAVE[(base + i) % WAVE.length]),
      entrances: items.map((_, i) => base + i),
    });
    running += items.length;
  }

  return (
    <div className="pb-4">
      {placed.map(({ unit, items, offsets, entrances }) => {
        const theme = themeFor(unit.index - 1);
        const accent: Accent = {
          face: theme.icon,
          slab: theme.shadow,
          ring: theme.bar,
          stroke: theme.stroke,
        };
        const unitLocked = unit.state === "locked";
        const doneCount = unit.lessons.filter((l) => l.state === "done").length;

        return (
          <section key={unit.index} className="mb-2">
            <header
              className={`sticky top-16 z-[5] mx-auto mb-12 mt-8 flex max-w-md items-center justify-between gap-3 rounded-2xl px-5 py-3 ${
                unitLocked
                  ? "bg-stone-200 text-stone-500 shadow-[0_5px_0_0_var(--color-stone-300)]"
                  : `${theme.icon} text-white ${theme.shadow}`
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest ${
                    unitLocked ? "text-stone-400" : "text-white/80"
                  }`}
                >
                  Unit {unit.index}
                  {unit.level && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        unitLocked ? "bg-stone-300 text-stone-500" : "bg-white/20"
                      }`}
                    >
                      {unit.level}
                    </span>
                  )}
                </p>
                <h2 className="truncate text-lg font-extrabold tracking-tight">{unit.title}</h2>
              </div>
              {unitLocked ? (
                <LockIcon className="h-5 w-5 shrink-0 text-stone-400" />
              ) : unit.state === "passed" ? (
                <span aria-label="Unit passed" className="shrink-0 text-xl">
                  🏆
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-extrabold tabular-nums">
                  {doneCount}/{unit.lessons.length}
                </span>
              )}
            </header>

            <div
              className="relative mx-auto flex flex-col"
              style={{ width: COLUMN_WIDTH, gap: GAP }}
            >
              <Trail items={items} offsets={offsets} accent={accent} />
              {items.map((item, i) => {
                const key =
                  item.kind === "lesson"
                    ? `lesson-${item.lesson.number}`
                    : `${item.kind}-${unit.index}`;
                const node =
                  item.kind === "lesson" ? (
                    <LessonNode
                      lesson={item.lesson}
                      state={item.state}
                      accent={accent}
                      onOpen={() => open(`/decks/${deckId}/study?lesson=${item.lesson.number}`)}
                      onBlocked={() => shake(key)}
                      isBlockedShaking={shaking === key}
                    />
                  ) : item.kind === "dialogue" ? (
                    <DialogueNode
                      state={item.state}
                      onOpen={() => open(`/decks/${deckId}/units/${unit.id}/dialogue`)}
                      onBlocked={() => shake(key)}
                      isBlockedShaking={shaking === key}
                    />
                  ) : (
                    <TestNode
                      state={item.state}
                      bestScore={item.bestScore}
                      onOpen={() => open(`/decks/${deckId}/units/${unit.id}/test`)}
                      onBlocked={() => shake(key)}
                      isBlockedShaking={shaking === key}
                    />
                  );

                const isCurrent = item.kind === "lesson" && item.state === "current";
                return (
                  <div
                    key={key}
                    ref={isCurrent ? currentRef : undefined}
                    className="scroll-mt-32"
                  >
                    <NodeShell offset={offsets[i]} entrance={entrances[i]}>
                      {node}
                    </NodeShell>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* The end of the road, so the path visibly goes somewhere. */}
      {units.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-2 pb-6">
          <div
            className={`flex h-[76px] w-[76px] items-center justify-center rounded-full text-3xl ${
              everythingDone
                ? "bg-amber-400 shadow-[0_4px_0_0_var(--color-amber-600)]"
                : "bg-stone-100 ring-2 ring-dashed ring-stone-300"
            }`}
            aria-hidden="true"
          >
            {everythingDone ? "🏆" : "🏁"}
          </div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
            {everythingDone
              ? "Course complete"
              : `${units.reduce((n, u) => n + u.lessons.length, 0)} lessons · ${units.length} units`}
          </p>
        </div>
      )}
    </div>
  );
}

export default LearningPath;
