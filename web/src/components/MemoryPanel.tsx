import type { Card } from "../types";
import type { DeckStats } from "../lib/personal";
import { STAGES, STAGE_LABEL, forecast, stageCounts } from "../lib/memory";
import { STAGE_BG, STAGE_TEXT } from "../lib/stageStyle";

const SECTION = "text-[13px] font-black uppercase tracking-[0.1em] text-graphite";

/** Out of a hundred, rounded. */
const percent = (part: number, whole: number) => Math.round((part / whole) * 100);

/** The typed exercises join the week's line once there are enough of them to mean something. */
const TYPED_ENOUGH = 5;

/**
 * Memory, made visible: how many words sit at each stage, what the next
 * seven days will ask for, and how the last seven went. The schedule is
 * the method; showing it is what makes a short daily session make sense.
 * The week's line keeps Bildim and Zorlandım apart: a word recalled with
 * effort isn't a word known.
 */
function MemoryPanel({ cards, fresh, stats }: { cards: Card[]; fresh: number; stats: DeckStats | undefined }) {
  const counts = stageCounts(cards);
  const total = cards.length;
  const week = forecast(cards, 7, undefined, fresh);
  const peak = Math.max(1, ...week.map((d) => d.count));
  const reviews = stats?.reviews ?? 0;
  const typed = stats?.typed ?? 0;
  const showWeek = reviews > 0 || typed >= TYPED_ENOUGH;
  return (
    <section aria-labelledby="memory-heading" className="card-3d rounded-[20px] p-4">
      <div className="flex items-baseline justify-between">
        <h2 id="memory-heading" className={SECTION}>
          Hafıza
        </h2>
        <span className="text-[13px] font-extrabold text-graphite">{total} kelime</span>
      </div>

      <div className="mt-3 flex h-4 gap-[3px] overflow-hidden rounded-full bg-paper-deep" role="img" aria-label={STAGES.map((s) => `${STAGE_LABEL[s]} ${counts[s]}`).join(", ")}>
        {STAGES.map((stage) =>
          counts[stage] > 0 ? (
            <span
              key={stage}
              className={`h-full rounded-full ${STAGE_BG[stage]} shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.12)] animate-rule-draw`}
              style={{ width: `${(counts[stage] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <dl className="mt-3 grid grid-cols-4 gap-2">
        {STAGES.map((stage) => (
          <div key={stage} className="min-w-0 rounded-2xl bg-paper-deep px-1 pb-2 pt-2.5 text-center">
            <dt className={`text-[24px] font-black leading-none tabular-nums ${counts[stage] === 0 ? "text-hare" : STAGE_TEXT[stage]}`}>{counts[stage]}</dt>
            <dd className="mt-1.5 text-[11px] font-extrabold leading-tight text-graphite">{STAGE_LABEL[stage]}</dd>
          </div>
        ))}
      </dl>

      <p className={`mt-5 ${SECTION}`}>Önümüzdeki 7 gün</p>
      <ol className="mt-2.5 grid grid-cols-7 gap-1.5" aria-label="Önümüzdeki yedi günün tekrarları">
        {week.map((day) => (
          <li key={day.label} className="flex flex-col items-center gap-1.5" aria-label={`${day.label}: ${day.count} kelime`}>
            <span className={`text-[12px] font-black tabular-nums ${day.count === 0 ? "text-hare" : day.today ? "text-berry-ink" : "text-ocean-ink"}`}>{day.count}</span>
            <span className="flex h-14 w-full items-end justify-center">
              <span
                className={`w-full max-w-[28px] rounded-[7px] ${day.count === 0 ? "bg-paper-deep" : day.today ? "bg-berry" : "bg-ocean"} ${day.count > 0 ? "shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]" : ""}`}
                style={{ height: day.count === 0 ? 5 : `${Math.max(16, (day.count / peak) * 100)}%` }}
              />
            </span>
            <span className={`text-[11px] font-extrabold ${day.today ? "text-ink" : "text-graphite"}`}>{day.label}</span>
          </li>
        ))}
      </ol>

      {showWeek && stats && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-[14px] font-bold text-graphite">
          Son 7 gün:
          <span className="rounded-full bg-ocean-soft px-2.5 py-0.5 font-black text-ocean-ink">{reviews} tekrar</span>
          {reviews > 0 && (
            <>
              <span className="rounded-full bg-grass-soft px-2.5 py-0.5 font-black text-grass-ink">%{percent(stats.knew ?? stats.remembered, reviews)} bildin</span>
              <span className="rounded-full bg-tangerine-soft px-2.5 py-0.5 font-black text-tangerine-ink">%{percent(stats.hard ?? 0, reviews)} zorlandın</span>
            </>
          )}
          {typed >= TYPED_ENOUGH && <span className="rounded-full bg-sunny-soft px-2.5 py-0.5 font-black text-sunny-ink">yazarak %{percent(stats.typedRight ?? 0, typed)}</span>}
        </p>
      )}
    </section>
  );
}

export default MemoryPanel;
