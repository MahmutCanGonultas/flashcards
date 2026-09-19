import { Link } from "react-router-dom";
import type { PathStats, Unit } from "../lib/path";
import { pathLines } from "../lib/tonton";
import Button from "./Button";
import LinkButton from "./LinkButton";
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
    <div className="mt-6 rounded-[28px] bg-paper-lift p-5 ring-1 ring-rule shadow-print">
      <TontonSays variant="column" size={60} lines={pathLines(stats, units, isFresh)} />

      <div className="mt-5 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
            Ders {stats.currentLesson ?? stats.totalLessons}/{stats.totalLessons}
          </p>
          <p className="mt-0.5 text-lg font-extrabold tracking-tight text-ink">
            {stats.wordsKnown} kelime öğrenildi
            <span className="font-bold text-graphite"> · kursta {stats.totalWords} kelime</span>
          </p>

          {/* Two tones of the same ink: what has stuck, and what is still being
              held in place by the schedule. One right answer only moves the lighter part. */}
          <div
            className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-rule"
            role="progressbar"
            aria-valuenow={Math.round(knownPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${stats.wordsKnown} kelime öğrenildi, ${stats.wordsLearning} hâlâ öğreniliyor`}
          >
            <div
              className="h-full bg-ink transition-[width] duration-500"
              style={{ width: `${knownPct}%` }}
            />
            <div
              className="h-full bg-ink/35 transition-[width] duration-500"
              style={{ width: `${learningPct}%` }}
            />
          </div>
          {stats.wordsLearning > 0 && (
            <p className="mt-1.5 text-xs font-semibold text-graphite">
              {stats.wordsLearning} hâlâ öğreniliyor — tekrar karşına çıkıp aklında kalınca sayılacak.
            </p>
          )}
        </div>
      </div>

      {isFresh && placementTo ? (
        // Nothing learned yet: the first decision is where to begin.
        <div className="mt-4 rounded-2xl bg-paper-deep/60 p-4 ring-1 ring-rule">
          <p className="text-sm font-bold text-ink">
            Biraz İngilizce biliyor musun?
          </p>
          <p className="mt-0.5 text-sm text-graphite">
            Beş dakikalık bir test seviyeni bulur, zaten bildiklerini atlar.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <LinkButton to={placementTo} variant="ink" className="shadow-button">
              Seviyemi bul
            </LinkButton>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {stats.dueNow > 0 ? (
            <Button fullWidth variant="ink" onClick={onReview}>
              {stats.dueNow} kelimeyi tekrar et
            </Button>
          ) : (
            <Button fullWidth variant="outline" onClick={onPractice}>
              Bildiklerinle pratik yap
            </Button>
          )}
        </div>
      )}

      {!isFresh && placementTo && (
        <p className="mt-3 text-center text-xs text-graphite">
          Çok kolay ya da çok zor mu geldi?{" "}
          <Link to={placementTo} className="font-bold text-ink underline decoration-ink underline-offset-2">
            Seviye testini yenile
          </Link>
        </p>
      )}
    </div>
  );
}

export default PathHeader;
