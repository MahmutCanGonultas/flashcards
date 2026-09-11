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
 * path so the wave keeps its rhythm across unit boundaries. Modern
 * path-style UIs draw no connecting line — the wave itself reads as the trail.
 */
const WAVE = [0, 44, 68, 44, 0, -44, -68, -44];

function LessonNode({
  lesson,
  offset,
  accent,
  onOpen,
  onBlocked,
  isBlockedShaking,
}: {
  lesson: Lesson;
  offset: number;
  accent: { face: string; slab: string; ring: string };
  onOpen: () => void;
  onBlocked: () => void;
  isBlockedShaking: boolean;
}) {
  const locked = lesson.state === "locked";
  const current = lesson.state === "current";

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ transform: `translateX(${offset}px)` }}
    >
      {current && (
        <div className="mb-2 animate-[bob_1.4s_ease-in-out_infinite] rounded-2xl bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-violet-600 shadow-[0_3px_0_0_var(--color-stone-200)] ring-2 ring-stone-100">
          Start
        </div>
      )}

      <button
        type="button"
        onClick={locked ? onBlocked : onOpen}
        aria-label={
          locked
            ? `Lesson ${lesson.number}, locked`
            : `Lesson ${lesson.number}, ${lesson.state === "done" ? "completed" : "start"}`
        }
        className={`relative flex h-[70px] w-[70px] items-center justify-center rounded-full transition-transform duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${
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
        <span className="relative">
          {locked ? (
            <LockIcon className="h-7 w-7" />
          ) : lesson.state === "done" ? (
            <CheckIcon className="h-8 w-8" />
          ) : (
            <StarIcon className="h-8 w-8" />
          )}
        </span>
      </button>

      {lesson.due > 0 && !locked && (
        <span className="mt-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
          {lesson.due} review
        </span>
      )}
    </div>
  );
}

function LearningPath({ deckId, units }: LearningPathProps) {
  const navigate = useNavigate();
  const [shakingLesson, setShakingLesson] = useState<number | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  // Jump to where the learner actually is — but only once they're deep enough
  // in that scrolling there is a chore, so early on they still land on the
  // stats and the review button above the path.
  const currentIndexInPath = units
    .flatMap((unit) => unit.lessons)
    .findIndex((lesson) => lesson.state === "current");

  useEffect(() => {
    if (currentIndexInPath > 5) currentRef.current?.scrollIntoView({ block: "center" });
  }, [currentIndexInPath]);

  const shake = (lessonNumber: number) => {
    setShakingLesson(lessonNumber);
    window.setTimeout(() => setShakingLesson(null), 420);
  };

  // Offsets are assigned across the whole path up front, so the wave keeps its
  // rhythm through unit boundaries instead of restarting inside each section.
  const offsetByLesson = new Map<number, number>();
  units
    .flatMap((unit) => unit.lessons)
    .forEach((lesson, index) => offsetByLesson.set(lesson.number, WAVE[index % WAVE.length]));

  return (
    <div className="pb-4">
      {units.map((unit) => {
        const theme = themeFor(unit.index - 1);
        const accent = { face: theme.icon, slab: theme.shadow, ring: theme.bar };
        const unitDone = unit.lessons.every((l) => l.state === "done");

        return (
          <section key={unit.title + unit.index} className="mb-2">
            <header
              className={`sticky top-16 z-[5] mx-auto mb-6 mt-8 flex max-w-md items-center justify-between gap-3 rounded-2xl ${theme.icon} px-5 py-3 text-white ${theme.shadow}`}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80">
                  Unit {unit.index}
                </p>
                <h2 className="truncate text-lg font-extrabold tracking-tight">{unit.title}</h2>
              </div>
              {unitDone && (
                <span aria-hidden="true" className="shrink-0 text-xl">
                  🏆
                </span>
              )}
            </header>

            <div className="flex flex-col items-center gap-5">
              {unit.lessons.map((lesson) => {
                const node = (
                  <LessonNode
                    lesson={lesson}
                    offset={offsetByLesson.get(lesson.number) ?? 0}
                    accent={accent}
                    onOpen={() => {
                      // Inside the tap, before the route changes: iOS only
                      // unlocks speech from a user gesture.
                      primeSpeech();
                      navigate(`/decks/${deckId}/study?lesson=${lesson.number}`);
                    }}
                    onBlocked={() => shake(lesson.number)}
                    isBlockedShaking={shakingLesson === lesson.number}
                  />
                );
                return lesson.state === "current" ? (
                  <div key={lesson.number} ref={currentRef} className="scroll-mt-32">
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
    </div>
  );
}

export default LearningPath;
