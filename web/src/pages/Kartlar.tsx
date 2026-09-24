import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import TontonSays from "../components/TontonSays";
import PersonalCardSheet from "../components/PersonalCardSheet";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import StrengthBars from "../components/StrengthBars";
import WordList from "../components/WordList";
import { BookIcon, CardsIcon, CheckIcon, PencilIcon, PlusIcon, StarIcon } from "../components/icons";
import { useDeckStats, usePersonalCards, usePersonalDeck, type DeckStats } from "../lib/personal";
import { useGrammarProgress, starsFor } from "../lib/grammar";
import { CATALOG } from "../content/grammar/catalog";
import { useStreak } from "../lib/streak";
import { homeLines } from "../lib/tonton";
import { primeSpeech } from "../lib/speech";
import { hasStarted } from "../lib/path";
import { learnerDayStart } from "../lib/day";
import { planHref, planView, usePlan, type DailyPlan, type PlanStep, type PlanView } from "../lib/plan";
import { STAGES, STAGE_LABEL, byNextReview, forecast, stageCounts, stageOf } from "../lib/memory";
import { STAGE_BG, STAGE_TEXT } from "../lib/stageStyle";
import { sortCards } from "../lib/wordBrowser";
import { tintStyle } from "../lib/tint";
import type { Card } from "../types";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_SHORT = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
/** Words on the front page's own list; the rest are one tap away. */
const RECENT = 5;

/**
 * The page composes itself once per app session — week, headline, covers,
 * tiles, one after another. Coming back from a word or a session it's
 * simply there; a front page that re-animates every visit is a tic.
 */
let composed = false;

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

const SECTION = "text-[13px] font-black uppercase tracking-[0.1em] text-graphite";

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The week so far: today's date, and seven days lit orange where the streak
 * covers them. Days are the learner's (lib/day.ts): at 00:30 it is still
 * the evening's day, the one a round finished now counts for.
 */
function Week() {
  const { data } = useStreak();
  const streak = data?.streak ?? 0;
  const last = data?.lastStudyDate ?? null;
  const today = new Date(learnerDayStart());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const lastIndex = last ? days.findIndex((d) => localISO(d) === last) : -1;
  const lit = (i: number) => lastIndex !== -1 && i <= lastIndex && lastIndex - i < streak;
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 truncate text-[15px] font-extrabold text-graphite">
        {DAY_LABELS[today.getDay()]}, {today.getDate()} {MONTHS[today.getMonth()]}
      </p>
      <ol className="flex shrink-0 gap-[3px]" aria-label="Son yedi gün">
        {days.map((d, i) => (
          <li
            key={i}
            aria-label={`${DAY_LABELS[d.getDay()]}${lit(i) ? ", çalışıldı" : ""}`}
            className={`grid h-6 w-6 place-items-center rounded-full text-[9px] font-black ${
              lit(i) ? "bg-tangerine text-white" : i === 6 ? "border-2 border-dashed border-tangerine text-tangerine-ink" : "bg-paper-deep text-hare"
            }`}
          >
            {lit(i) ? <CheckIcon className="h-3 w-3" /> : DAY_SHORT[d.getDay()]}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * A word on a cover as large as the cover allows: a black-weight letter is
 * about 0.58em wide, so the whole word fits the cover's width (at 320px as
 * at 390px) without breaking, and a short word stops at 23px.
 */
const coverSize = (word: string) => `min(23px, ${(100 / (0.58 * Math.max(word.length, 1))).toFixed(1)}cqw)`;

/**
 * The next three up, as covers in their own colours: today's new words
 * first, then the soonest reviews; the word set large, its strength in the
 * corner. Only the English shows — the meaning is what the session will
 * ask. Words still in the queue aren't up yet and never show here.
 */
function Covers({ cards, plan, animate }: { cards: Card[]; plan: DailyPlan; animate: boolean }) {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const fresh = plan.newIds.map((id) => byId.get(id)).filter((card): card is Card => card !== undefined);
  const shown = [...fresh, ...byNextReview(cards.filter(hasStarted))].slice(0, 3);
  const extra = plan.reviewsDue + plan.newIds.length - 3;
  if (shown.length === 0) return null;
  // On a short screen (a small phone, or Safari's own bars) they give way, so the day's button stays above the tab bar.
  return (
    <div className="mt-5 grid grid-cols-3 gap-2.5 [@media(max-height:700px)]:hidden">
      {shown.map((card, i) => (
        <div
          key={card.id}
          style={{ ...tintStyle(card), ...delay(120 + i * 60) }}
          className={`@container relative isolate flex aspect-[4/5] flex-col overflow-hidden rounded-[18px] cover-ground p-2.5 pb-3.5 text-white ${animate ? "animate-rise-spring" : ""}`}
        >
          <StrengthBars card={card} onDark className="self-end" />
          <span className="mt-auto text-[9px] font-black uppercase tracking-[0.08em] text-white/80">{STAGE_LABEL[stageOf(card)]}</span>
          <span
            className="mt-0.5 wrap-break-word font-black leading-[1.02] tracking-[-0.015em] [text-shadow:0_2px_0_rgba(0,0,0,0.14)]"
            style={{ fontSize: coverSize(card.front) }}
          >
            {card.front}
          </span>
          {i === 2 && extra > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[13px] font-black text-ink shadow-[0_2px_0_0_rgba(0,0,0,0.15)]">+{extra}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/** A way into one part of the learner's section: a coloured badge, a name, a line of what's there. */
function Tile({ to, badge, icon, title, line, children }: { to: string; badge: string; icon: React.ReactNode; title: string; line: string; children?: React.ReactNode }) {
  return (
    <Link
      to={to}
      viewTransition
      className="card-3d press flex min-w-0 flex-col rounded-[20px] p-3.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
    >
      <span className={`grid h-11 w-11 place-items-center rounded-2xl text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.18)] ${badge}`}>{icon}</span>
      <span className="mt-2.5 text-[17px] font-black leading-tight text-ink">{title}</span>
      <span className="mt-0.5 text-[13px] font-bold leading-snug text-graphite">{line}</span>
      {children}
    </Link>
  );
}

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
function Memory({ cards, fresh, stats }: { cards: Card[]; fresh: number; stats: DeckStats | undefined }) {
  const counts = stageCounts(cards);
  const total = cards.length;
  const week = forecast(cards, 7, undefined, fresh);
  const peak = Math.max(1, ...week.map((d) => d.count));
  const reviews = stats?.reviews ?? 0;
  const typed = stats?.typed ?? 0;
  const showWeek = reviews > 0 || typed >= TYPED_ENOUGH;
  return (
    <section aria-labelledby="memory-heading" className="mt-8 card-3d rounded-[20px] p-4">
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

/** The headline with its accent in colour: the count in red while cards wait, "tamam!" in green after. */
function Headline({ headline }: { headline: PlanView["headline"] }) {
  const at = headline.text.indexOf(headline.accent);
  return (
    <>
      {headline.text.slice(0, at)}
      <span className={headline.tone === "berry" ? "text-berry" : "text-grass"}>{headline.accent}</span>
      {headline.text.slice(at + headline.accent.length)}
    </>
  );
}

/**
 * Bugünün planı: the day in two steps, the cards and then the exercises,
 * each ticked green once done. The step to do now wears a green ring.
 */
function PlanSteps({ steps }: { steps: PlanStep[] }) {
  const current = steps.findIndex((step) => !step.done);
  return (
    <section aria-labelledby="plan-heading" className="card-3d mt-4 rounded-[20px] px-3.5 pb-3 pt-3">
      <h2 id="plan-heading" className={SECTION}>
        Bugünün planı
      </h2>
      <ol className="mt-2.5 space-y-2.5">
        {steps.map((step, i) => (
          <li key={step.title} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-black ${
                step.done
                  ? "bg-grass text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]"
                  : i === current
                    ? "border-2 border-grass bg-white text-grass-ink"
                    : "bg-paper-deep text-hare"
              }`}
            >
              {step.done ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
            <p className="min-w-0 flex-1 leading-tight">
              <span className="sr-only">{i + 1}. adım: </span>
              <span className={`block text-[16px] font-black ${step.done ? "text-graphite" : "text-ink"}`}>{step.title}</span>
              <span className={`mt-0.5 block text-[13px] font-bold ${step.done ? "text-grass-ink" : "text-graphite"}`}>{step.detail}</span>
            </p>
            {step.minutes !== null && <span className="shrink-0 rounded-full bg-paper-deep px-2.5 py-1 text-[12px] font-black tabular-nums text-graphite">~{step.minutes} dk</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The two buttons of the day, and in the evening a quiet way on to the grammar. */
function PlanButtons({ deckId, view }: { deckId: number; view: PlanView }) {
  const { primary, secondary } = view;
  const icon = (mode: string) =>
    mode === "exercises" ? <PencilIcon className="h-5 w-5" /> : mode === "all" ? <CardsIcon className="h-5 w-5" /> : mode === "grammar" ? <BookIcon className="h-5 w-5" /> : null;
  return (
    <div className="space-y-2.5">
      {/* The green button is the next thing to do; the cards and the exercises stay two doors. */}
      <Link
        to={planHref(deckId, primary.mode)}
        onClick={primeSpeech}
        className={`face flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d focus-visible:outline-none focus-visible:ring-4 ${
          primary.tone === "grass" ? "bg-grass focus-visible:ring-grass/40" : "bg-ocean focus-visible:ring-ocean/40"
        }`}
      >
        {icon(primary.mode)}
        {primary.label}
      </Link>
      <Link
        to={planHref(deckId, secondary.mode)}
        onClick={primeSpeech}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-rule bg-white text-[15px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
      >
        {icon(secondary.mode)}
        {secondary.label}
      </Link>
      {view.grammar && (
        <p className="pt-1 text-center text-[14px] font-bold text-graphite">
          Vaktin varsa:{" "}
          <Link to="/gramer" viewTransition className="font-black text-ocean-ink underline decoration-ocean/50 decoration-2 underline-offset-4">
            Gramer
          </Link>
        </p>
      )}
    </div>
  );
}

/**
 * Kartlarım — the front page of the learner's own words: the week, a
 * headline saying what's waiting today (from the day's plan, never the raw
 * list: a word in the queue isn't waiting), the plan's two steps, the next
 * covers, the green button for whatever comes next and a white one for the
 * other door (the cards and the exercises are kept apart on purpose), the
 * way into the word list and grammar, Tonton, the memory at a glance and
 * the words added last.
 */
function Kartlar() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const planQuery = usePlan(deckQuery.data);
  const statsQuery = useDeckStats(deckQuery.data);
  const grammar = useGrammarProgress();
  const streak = useStreak().data?.streak ?? 0;
  const cards = cardsQuery.data;
  const plan = planQuery.data;
  const deck = deckQuery.data;
  const total = cards?.length ?? 0;
  const view = plan ? planView(plan) : null;
  const stars = CATALOG.reduce((sum, t) => sum + starsFor(grammar.data?.[t.slug]?.best), 0);
  const started = CATALOG.filter((t) => grammar.data?.[t.slug]).length;

  // Read once, on the first render of this visit; flipped after it.
  const [animate] = useState(() => !composed);
  useEffect(() => {
    composed = true;
  }, []);
  const rise = animate ? "animate-rise-in" : "";
  const at = (ms: number) => (animate ? delay(ms) : undefined);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        <div className={rise} style={at(0)}>
          <Week />
        </div>

        <h1 className={`mt-5 max-w-[320px] text-[34px] font-black leading-[1.02] tracking-[-0.02em] text-ink ${rise}`} style={at(40)}>
          {!cards || (total > 0 && !view) ? "Kartların" : total === 0 || !view ? "Henüz kart yok" : <Headline headline={view.headline} />}
        </h1>
        <p className={`mt-2 text-[16px] font-bold leading-[1.45] text-graphite ${rise}`} style={at(80)}>
          {!cards || (total > 0 && !view) ? "Kelimelerin yükleniyor." : total === 0 || !view ? "İlk kelimeni ekle; ne zaman soracağımı ben ayarlarım." : view.subline}
        </p>

        {cards && plan && view && total > 0 && (
          <>
            <div className={rise} style={at(120)}>
              <PlanSteps steps={view.steps} />
            </div>
            <Covers cards={cards} plan={plan} animate={animate} />
            {view.note && <p className={`mt-3 text-[14px] font-bold leading-snug text-graphite ${rise}`} style={at(260)}>{view.note}</p>}
            {view.toCourse && (
              <p className={`mt-3 text-[14px] font-bold leading-snug text-graphite ${rise}`} style={at(260)}>
                Kendi listende yeni kelime kalmadı. Yeni kelimeler için{" "}
                <Link to="/kurs" viewTransition className="font-black text-ocean-ink underline decoration-ocean/50 decoration-2 underline-offset-4">
                  Kurs →
                </Link>
              </p>
            )}
          </>
        )}

        <div className={`mt-5 ${rise}`} style={at(300)}>
          {deck && total > 0 ? (
            view ? (
              <PlanButtons deckId={deck.id} view={view} />
            ) : (
              <div className="space-y-2.5">
                <Skeleton className="h-[58px] w-full rounded-2xl" />
                <Skeleton className="h-[52px] w-full rounded-2xl" />
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => deck && setIsAddOpen(true)}
              className="face flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-grass text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d"
            >
              <PlusIcon className="h-5 w-5" /> Kelime ekle
            </button>
          )}
        </div>

        <div className={`mt-4 grid grid-cols-2 gap-3 ${rise}`} style={at(340)}>
          <Tile to="/kelimelerim" badge="bg-ocean" icon={<CardsIcon className="h-6 w-6" />} title="Kelimelerim" line={cards ? `${total} kelime · ara, süz` : "Yükleniyor…"}>
            {cards && view && (
              <span className={`mt-2 w-max rounded-full px-2 py-0.5 text-[12px] font-black ${view.count > 0 ? "bg-berry-soft text-berry-ink" : "bg-grass-soft text-grass-ink"}`}>
                {view.count > 0 ? `${view.count} bugün` : "Hepsi takvimde"}
              </span>
            )}
          </Tile>
          <Tile to="/gramer" badge="bg-tangerine" icon={<BookIcon className="h-6 w-6" />} title="Gramer" line={`${CATALOG.length} konu${started > 0 ? ` · ${started} başladı` : ""}`}>
            <span className="mt-2 flex items-center gap-1 text-[13px] font-black text-sunny-ink">
              <StarIcon className="h-4 w-4 text-sunny" />
              {stars} / {CATALOG.length * 3}
            </span>
          </Tile>
        </div>

        <div className={`mt-7 ${rise}`} style={at(380)}>
          <TontonSays variant="column" size={64} lines={homeLines({ cards: [], due: 0, streak, personal: cards ?? [], plan })} />
        </div>

        {deckQuery.isError || cardsQuery.isError || planQuery.isError ? (
          <div className="mt-8">
            <ErrorState
              title="Kelimelerin yüklenemedi"
              message="Bağlantını kontrol edip tekrar dene."
              onRetry={() => {
                void deckQuery.refetch();
                void cardsQuery.refetch();
                void planQuery.refetch();
              }}
            />
          </div>
        ) : !deck || !cards ? (
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          total > 0 && (
            <>
              <Memory cards={cards} fresh={plan?.newIds.length ?? 0} stats={statsQuery.data} />

              <section className="mt-8" aria-labelledby="recent-heading">
                <div className="flex items-center justify-between">
                  <h2 id="recent-heading" className={SECTION}>
                    Son eklenenler
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(true)}
                    className="-mr-2 flex min-h-10 items-center gap-1 rounded-xl px-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink hover:bg-ocean-soft"
                  >
                    <PlusIcon className="h-4 w-4" /> Ekle
                  </button>
                </div>
                <div className="mt-1">
                  <WordList deckId={deck.id} cards={sortCards(cards, "recent").slice(0, RECENT)} />
                </div>
                <Link
                  to="/kelimelerim"
                  viewTransition
                  className="mt-3 flex min-h-[50px] w-full items-center justify-center rounded-2xl border-2 border-rule bg-white text-[14px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
                >
                  {total > RECENT ? `Tüm kelimeler · ${total}` : "Kelimelerim"}
                </Link>
              </section>
            </>
          )
        )}
      </main>

      <PersonalCardSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} deckId={deck?.id} />
      <AppTabs />
    </div>
  );
}

export default Kartlar;
