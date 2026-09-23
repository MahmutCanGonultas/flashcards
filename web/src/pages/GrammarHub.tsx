import { Link } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import TontonLine from "../components/TontonLine";
import Stars from "../components/Stars";
import { BoltIcon, CheckIcon, StarIcon } from "../components/icons";
import { CATALOG, LEVELS } from "../content/grammar/catalog";
import { starsFor, useGrammarProgress } from "../lib/grammar";
import { familyStyle } from "../lib/palette";

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

/** What Tonton says over the list: where the learner is in it. */
function hubLine(started: number, stars: number): string {
  if (started === 0) return "Listenin başından başla: önce konuyu oku, sonra 10 soruluk alıştırma. Renkler yol gösterir: yeşil, konunun yapısı.";
  if (stars >= CATALOG.length * 3) return "Bütün yıldızlar senin. Karışık alıştırmayla ara ara tazele; gramer de kelime gibi unutulur.";
  return `${started} konuya başladın, ${stars} yıldızın var. Karışık alıştırma en zayıf konularından daha çok sorar.`;
}

/**
 * Gramer — the learner's own list of topics, in the order they were
 * taught: three levels, each a coloured banner over its topics, every
 * topic with its stars. A mixed round draws on the ones already practised.
 */
function GrammarHub() {
  const progress = useGrammarProgress();
  const data = progress.data ?? {};
  const started = CATALOG.filter((t) => data[t.slug]).length;
  const stars = CATALOG.reduce((sum, t) => sum + starsFor(data[t.slug]?.best), 0);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        <Link to="/kartlar" viewTransition className="-m-2 inline-block p-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
          ← Kartlarım
        </Link>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[32px] font-black leading-[1.05] tracking-[-0.02em] text-ink">Gramer</h1>
            <p className="mt-1 text-[15px] font-bold text-graphite">
              {CATALOG.length} konu · {LEVELS.length} seviye
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-2xl border-2 border-sunny bg-sunny-soft px-3 py-1.5 text-[16px] font-black text-sunny-ink">
            <StarIcon className="h-5 w-5 text-sunny" />
            {stars}
            <span className="text-[13px] font-extrabold text-sunny-ink/70">/ {CATALOG.length * 3}</span>
          </span>
        </div>

        <TontonLine className="mt-5" size={56}>
          {hubLine(started, stars)}
        </TontonLine>

        <Link
          to="/gramer/karisik/alistirma"
          className="face mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-tangerine text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine/40"
        >
          <BoltIcon className="h-5 w-5" />
          Karışık alıştırma
        </Link>

        {LEVELS.map((level, li) => {
          const topics = CATALOG.filter((t) => t.level === level.key);
          const done = topics.filter((t) => data[t.slug]).length;
          return (
            <section key={level.key} aria-labelledby={`level-${level.key}`} className="mt-8" style={familyStyle(level.tone)}>
              <div className="relative overflow-hidden rounded-[22px] bg-(--c) px-4 pb-5 pt-3.5 text-white shadow-[inset_0_-5px_0_0_rgba(0,0,0,0.15)]">
                <span aria-hidden="true" className="pointer-events-none absolute -right-3 -top-6 select-none text-[110px] font-black leading-none text-white/15">
                  {li + 1}
                </span>
                <p className="text-[12px] font-black uppercase tracking-[0.12em] text-white/85">
                  Bölüm {li + 1} · {level.titleTr}
                </p>
                <h2 id={`level-${level.key}`} className="mt-0.5 text-[24px] font-black leading-tight">
                  {level.title}
                </h2>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <span className="h-3 flex-1 overflow-hidden rounded-full bg-black/15">
                    <span className="block h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${(done / topics.length) * 100}%` }} />
                  </span>
                  <span className="text-[13px] font-black tabular-nums">
                    {done} / {topics.length}
                  </span>
                </div>
              </div>

              <ol className="mt-3 space-y-2.5">
                {topics.map((topic, i) => {
                  const best = data[topic.slug]?.best;
                  const count = starsFor(best);
                  return (
                    <li key={topic.slug} className="animate-rise-in" style={delay(Math.min(i, 6) * 40)}>
                      <Link
                        to={`/gramer/${topic.slug}`}
                        viewTransition
                        className="card-3d press flex items-center gap-3.5 rounded-[20px] px-3.5 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
                      >
                        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-(--c-soft) text-[24px]">
                          <span aria-hidden="true">{topic.emoji}</span>
                          {count === 3 && (
                            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-grass text-white ring-2 ring-white">
                              <CheckIcon className="h-3 w-3" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-black leading-tight text-ink">{topic.title}</span>
                          <span className="mt-0.5 block truncate text-[14px] font-bold text-graphite">{topic.titleTr}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <Stars count={count} />
                          {best !== undefined && <span className="text-[11px] font-black tabular-nums text-(--c-ink)">%{best}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </main>
      <AppTabs />
    </div>
  );
}

export default GrammarHub;
