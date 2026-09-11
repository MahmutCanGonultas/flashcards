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
 * The serpentine offsets a lesson node is nudged by, cycled across the whole
 * path so the wave keeps its rhythm across unit boundaries.
 */
const WAVE = [0, 44, 68, 44, 0, -44, -68, -44];

/** Geometry the trail is drawn from. Everything that moves a node lives off-flow. */
const COLUMN_WIDTH = 220;
const NODE = 70;
const GAP = 26;
const PITCH = NODE + GAP;

type Accent = { face: string; slab: string; ring: string; stroke: string };

function LessonNode({
  lesson,
  offset,
  accent,
  entrance,
  onOpen,
  onBlocked,
  isBlockedShaking,
}: {
  lesson: Lesson;
  offset: number;
  accent: Accent;
  /** Position along the whole path, for the staggered arrival on first paint. */
  entrance: number;
  onOpen: () => void;
  onBlocked: () => void;
  isBlockedShaking: boolean;
}) {
  const locked = lesson.state === "locked";
  const current = lesson.state === "current";
  const done = lesson.state === "done";

  // The offset and the entrance live on different elements: the entrance
  // animates `transform`, and would otherwise wipe the translateX when it ends.
  return (
    <div
      className="relative h-[70px]"
      style={{ transform: `translateX(${offset}px)` }}
    >
      <div
        className="relative flex h-[70px] items-center justify-center animate-[node-in_420ms_ease-out_both]"
        style={{ animationDelay: `${Math.min(entrance, 14) * 45}ms` }}
      >
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
          {/* A soft top highlight gives the disc a little volume. */}
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
          {/* Words from this lesson waiting for review, pinned to the node's
              own corner so it never collides with the bubble on the node below. */}
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

      </div>
    </div>
  );
}

/**
 * The line that joins a unit's nodes into one trail. Drawn from the same
 * numbers that place the nodes, so it can't drift out from under them.
 * Each segment is coloured by where it leads: solid to a finished lesson,
 * flowing dashes to the one in progress, faint dashes to the locked ones.
 */
function Trail({
  lessons,
  offsets,
  accent,
}: {
  lessons: Lesson[];
  offsets: number[];
  accent: Accent;
}) {
  const height = lessons.length * NODE + (lessons.length - 1) * GAP;
  const centerX = COLUMN_WIDTH / 2;
  const at = (index: number) => ({
    x: centerX + offsets[index],
    y: NODE / 2 + index * PITCH,
  });

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width={COLUMN_WIDTH}
      height={height}
      viewBox={`0 0 ${COLUMN_WIDTH} ${height}`}
      fill="none"
    >
      {lessons.slice(1).map((to, i) => {
        const a = at(i);
        const b = at(i + 1);
        const bend = PITCH / 2;
        const d = `M ${a.x} ${a.y} C ${a.x} ${a.y + bend}, ${b.x} ${b.y - bend}, ${b.x} ${b.y}`;

        if (to.state === "done") {
          return (
            <path
              key={to.number}
              d={d}
              className={accent.stroke}
              strokeWidth="8"
              strokeLinecap="round"
            />
          );
        }
        if (to.state === "current") {
          return (
            <path
              key={to.number}
              d={d}
              className={`${accent.stroke} animate-[trail-flow_900ms_linear_infinite]`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="14 14"
              opacity="0.75"
            />
          );
        }
        return (
          <path
            key={to.number}
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
  const [shakingLesson, setShakingLesson] = useState<number | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  const allLessons = units.flatMap((unit) => unit.lessons);
  const currentIndexInPath = allLessons.findIndex(
    (lesson) => lesson.state === "current",
  );
  const everythingDone =
    allLessons.length > 0 && allLessons.every((l) => l.state === "done");

  // Jump to where the learner actually is — but only once they're deep enough
  // in that scrolling there is a chore, so early on they still land on the
  // stats and the review button above the path.
  useEffect(() => {
    if (currentIndexInPath > 5)
      currentRef.current?.scrollIntoView({ block: "center" });
  }, [currentIndexInPath]);

  const shake = (lessonNumber: number) => {
    setShakingLesson(lessonNumber);
    window.setTimeout(() => setShakingLesson(null), 420);
  };

  // Offsets are assigned across the whole path up front, so the wave keeps its
  // rhythm through unit boundaries instead of restarting inside each section.
  const offsetByLesson = new Map<number, number>();
  const entranceByLesson = new Map<number, number>();
  allLessons.forEach((lesson, index) => {
    offsetByLesson.set(lesson.number, WAVE[index % WAVE.length]);
    entranceByLesson.set(lesson.number, index);
  });

  return (
    <div className="pb-4">
      {units.map((unit) => {
        const theme = themeFor(unit.index - 1);
        const accent: Accent = {
          face: theme.icon,
          slab: theme.shadow,
          ring: theme.bar,
          stroke: theme.stroke,
        };
        const doneCount = unit.lessons.filter((l) => l.state === "done").length;
        const unitDone = doneCount === unit.lessons.length;
        const offsets = unit.lessons.map(
          (l) => offsetByLesson.get(l.number) ?? 0,
        );

        return (
          <section key={unit.title + unit.index} className="mb-2">
            <header
              className={`sticky top-16 z-[5] mx-auto mb-8 mt-8 flex max-w-md items-center justify-between gap-3 rounded-2xl ${theme.icon} px-5 py-3 text-white ${theme.shadow}`}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80">
                  Unit {unit.index}
                </p>
                <h2 className="truncate text-lg font-extrabold tracking-tight">
                  {unit.title}
                </h2>
              </div>
              {unitDone ? (
                <span aria-label="Unit complete" className="shrink-0 text-xl">
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
              <Trail lessons={unit.lessons} offsets={offsets} accent={accent} />
              {unit.lessons.map((lesson) => {
                const node = (
                  <LessonNode
                    lesson={lesson}
                    offset={offsetByLesson.get(lesson.number) ?? 0}
                    entrance={entranceByLesson.get(lesson.number) ?? 0}
                    accent={accent}
                    onOpen={() => {
                      // Inside the tap, before the route changes: iOS only
                      // unlocks speech from a user gesture.
                      primeSpeech();
                      navigate(
                        `/decks/${deckId}/study?lesson=${lesson.number}`,
                      );
                    }}
                    onBlocked={() => shake(lesson.number)}
                    isBlockedShaking={shakingLesson === lesson.number}
                  />
                );
                return lesson.state === "current" ? (
                  <div
                    key={lesson.number}
                    ref={currentRef}
                    className="scroll-mt-32"
                  >
                    {node}
                  </div>
                ) : (
                  <div key={lesson.number}>{node}</div>
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
              : `${allLessons.length} lessons`}
          </p>
        </div>
      )}
    </div>
  );
}

export default LearningPath;
