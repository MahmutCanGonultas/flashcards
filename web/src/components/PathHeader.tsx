import { Link } from "react-router-dom";
import type { PathStats, Unit } from "../lib/path";
import { pathLines } from "../lib/tonton";
import Button from "./Button";
import TontonSays from "./TontonSays";

type PathHeaderProps = {
  stats: PathStats;
  units: Unit[];
  onReview: () => void;
  onPractice: () => void;
  /** Where the placement test lives; omitted for decks without levels. */
  placementTo?: string;
  /** True until the learner has done anything at all — then the test is the headline. */
  isFresh?: boolean;
};

/** The status strip above the path: how far along you are, and what's waiting. */
function PathHeader({ stats, units, onReview, onPractice, placementTo, isFresh = false }: PathHeaderProps) {
  const pct = (n: number) => (stats.totalWords === 0 ? 0 : (n / stats.totalWords) * 100);
  const knownPct = pct(stats.wordsKnown);
  const learningPct = pct(stats.wordsLearning);

  return (
    <div className="mt-6 rounded-3xl bg-gradient-to-br from-white to-violet-50 p-5 ring-2 ring-violet-100 shadow-[0_5px_0_0_var(--color-violet-100)]">
      <TontonSays size={76} lines={pathLines(stats, units, isFresh)} />

      <div className="mt-4 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-stone-500">
            Lesson {stats.currentLesson ?? stats.totalLessons} of {stats.totalLessons}
          </p>
          <p className="mt-0.5 text-lg font-extrabold tracking-tight text-stone-800">
            {stats.wordsKnown} {stats.wordsKnown === 1 ? "word" : "words"} known
            <span className="font-bold text-stone-400"> · {stats.totalWords} in the course</span>
          </p>

          {/* Two tones: what has stuck, and what is still being held in place
              by the schedule. One right answer only moves the lighter part. */}
          <div
            className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-stone-200"
            role="progressbar"
            aria-valuenow={Math.round(knownPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${stats.wordsKnown} words known, ${stats.wordsLearning} still learning`}
          >
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500"
              style={{ width: `${knownPct}%` }}
            />
            <div
              className="h-full bg-violet-300 transition-[width] duration-500"
              style={{ width: `${learningPct}%` }}
            />
          </div>
          {stats.wordsLearning > 0 && (
            <p className="mt-1 text-xs font-semibold text-stone-400">
              {stats.wordsLearning} still learning — they'll count once they come back and stick.
            </p>
          )}
        </div>
      </div>

      {isFresh && placementTo ? (
        // Nothing learned yet: the first decision is where to begin.
        <div className="mt-4 rounded-2xl bg-white/70 p-4 ring-1 ring-violet-100">
          <p className="text-sm font-bold text-stone-700">
            Already know some English?
          </p>
          <p className="mt-0.5 text-sm text-stone-500">
            A five-minute test finds your level and skips what you already know.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link
              to={placementTo}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-base font-extrabold text-white shadow-[0_4px_0_0_var(--color-orange-700)] transition hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none"
            >
              🎯 Find my level
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {stats.dueNow > 0 ? (
            <Button fullWidth onClick={onReview}>
              🔁 Review {stats.dueNow} {stats.dueNow === 1 ? "word" : "words"}
            </Button>
          ) : (
            <Button fullWidth variant="secondary" onClick={onPractice}>
              💪 Practice what you know
            </Button>
          )}
        </div>
      )}

      {!isFresh && placementTo && (
        <p className="mt-3 text-center text-xs text-stone-400">
          Started too low or too high?{" "}
          <Link to={placementTo} className="font-bold text-violet-600 hover:text-violet-800">
            Retake the level test
          </Link>
        </p>
      )}
    </div>
  );
}

export default PathHeader;
