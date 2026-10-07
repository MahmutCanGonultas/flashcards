import { Link } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import { CheckIcon } from "../components/icons";
import { usePersonalCards, usePersonalDeck } from "../lib/personal";
import { primeSpeech } from "../lib/speech";
import { hasStarted, isDue } from "../lib/path";
import { cardMinutes, usePlan, type DailyPlan } from "../lib/plan";
import { byNextReview, forecast } from "../lib/memory";
import { LADDER } from "../lib/round";
import { tintStyle } from "../lib/tint";
import type { Card } from "../types";

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

/** The word on the top card, as big as its width allows (a black letter is about 0.58em wide). */
const wordSize = (word: string) => `min(46px, ${(100 / (0.6 * Math.max(word.length, 1))).toFixed(1)}cqw)`;

/** Today's cards in the order the round meets them: the new words, then the reviews soonest due. */
function todaysCards(cards: Card[], plan: DailyPlan): Card[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const fresh = plan.newIds.map((id) => byId.get(id)).filter((card): card is Card => card !== undefined);
  return [...fresh, ...byNextReview(cards.filter((card) => hasStarted(card) && isDue(card)))];
}

/**
 * The day's cards as a real pile: the first word on top in its own colour,
 * two more fanned out behind it, the count on a white tab. Tapping the pile
 * starts the round. With nothing waiting, a white card says so.
 */
function CardStack({ top, behind, count, to }: { top: Card | null; behind: Card[]; count: number; to: string }) {
  return (
    <Link
      to={to}
      onClick={primeSpeech}
      aria-label={top ? `Kartlara başla: ${count} kart` : "Kartlara bak"}
      className="group relative mx-auto mt-7 block aspect-[4/5] w-[min(62vw,250px)] animate-rise-spring focus-visible:outline-none"
    >
      {behind
        .slice(0, 2)
        .reverse()
        .map((card, i, all) => (
          <span
            key={card.id}
            aria-hidden="true"
            style={tintStyle(card)}
            className={`absolute inset-0 rounded-[26px] cover-ground opacity-90 shadow-[0_6px_0_0_rgba(0,0,0,0.08)] transition-transform duration-300 ${
              i === all.length - 1 ? "-translate-x-6 -rotate-[8deg] group-hover:-rotate-[11deg]" : "translate-x-6 rotate-[7deg] group-hover:rotate-[10deg]"
            }`}
          />
        ))}
      {top ? (
        <span
          style={tintStyle(top)}
          className="@container absolute inset-0 flex flex-col rounded-[26px] cover-ground p-4 text-white shadow-[0_8px_0_0_rgba(0,0,0,0.12)] transition-transform duration-150 group-active:scale-[0.97]"
        >
          <span className="w-max rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em]">{hasStarted(top) ? "Tekrar" : "Yeni"}</span>
          <span
            className="my-auto text-center font-black leading-[0.95] tracking-[-0.02em] [text-shadow:0_3px_0_rgba(0,0,0,0.14)] wrap-break-word"
            style={{ fontSize: wordSize(top.front) }}
          >
            {top.front}
          </span>
          <span className="text-center text-[11px] font-black uppercase tracking-[0.12em] text-white/80">Dokun · başla</span>
        </span>
      ) : (
        <span className="card-3d absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[26px] bg-white p-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-grass text-white shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.15)]">
            <CheckIcon className="h-8 w-8" />
          </span>
          <span className="text-[20px] font-black leading-tight text-ink">Bugünlük tamam!</span>
          <span className="text-[13px] font-bold text-graphite">Dokun, serbest tekrar yap</span>
        </span>
      )}
      {top && count > 0 && (
        <span className="absolute -right-3 -top-3 grid h-12 min-w-12 place-items-center rounded-full bg-white px-2 text-[20px] font-black tabular-nums text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.15)] ring-2 ring-rule">
          {count}
        </span>
      )}
    </Link>
  );
}

/**
 * Tekrar takvimi: how many words already met come back on each of the next
 * seven days, so the learner can see the rhythm: a word known comes back
 * later and later (1, 3, 7 days, then weeks), a word missed comes back
 * tomorrow. New words come on top, three a day at most.
 */
function Schedule({ cards, queued }: { cards: Card[]; queued: number }) {
  const days = forecast(cards, 7);
  const met = cards.filter(hasStarted).length;
  const top = Math.max(1, ...days.map((day) => day.count));
  return (
    <section aria-labelledby="schedule-heading" className="card-3d mt-8 rounded-[22px] p-4">
      <div className="flex items-center justify-between">
        <h2 id="schedule-heading" className="text-[13px] font-black uppercase tracking-[0.1em] text-graphite">
          Tekrar takvimi
        </h2>
        <Link to="/kelimelerim" viewTransition className="-m-2 p-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
          Kelimeler →
        </Link>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <li key={day.label} className="flex flex-col items-center gap-1.5">
            <span className="text-[15px] font-black tabular-nums text-ink">{day.count}</span>
            <span className="flex h-16 w-full items-end overflow-hidden rounded-lg bg-paper-deep">
              <span
                className={`w-full rounded-lg ${day.today ? "bg-grass" : "bg-ocean"} animate-rule-draw`}
                style={{ height: day.count === 0 ? 0 : `${Math.max(12, (day.count / top) * 100)}%` }}
              />
            </span>
            <span className={`text-[11px] font-black ${day.today ? "text-grass-ink" : "text-graphite"}`}>{day.label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3.5 text-[14px] font-semibold leading-snug text-graphite">
        Bildiğin kelime her seferinde daha geç gelir: {LADDER.join(" → ")} gün, sonra haftalar. Bilemediğin yarın yine gelir.
      </p>
      <p className="mt-2 text-[14px] font-bold text-ink">
        {met} kelime öğreniyorsun{queued > 0 ? ` · ${queued} kelime sırada` : ""}
      </p>
    </section>
  );
}

/**
 * Kartlar — the cards and nothing else: the day's pile, one button, and
 * when the words come back.
 */
function Kartlar() {
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const planQuery = usePlan(deckQuery.data);
  const deck = deckQuery.data;
  const cards = cardsQuery.data;
  const plan = planQuery.data;

  if (deckQuery.isError || cardsQuery.isError || planQuery.isError) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
          <ErrorState
            title="Kartların yüklenemedi"
            message="Bağlantını kontrol edip tekrar dene."
            onRetry={() => {
              void deckQuery.refetch();
              void cardsQuery.refetch();
              void planQuery.refetch();
            }}
          />
        </main>
        <AppTabs />
      </div>
    );
  }

  const today = cards && plan ? todaysCards(cards, plan) : [];
  const count = plan ? plan.reviewsDue + plan.newIds.length : 0;
  const anyMet = cards?.some(hasStarted) ?? false;
  // With nothing waiting, the pile shuffles the words already met (only the due ones would count).
  const to = count > 0 ? "/tur" : anyMet ? "/tur?serbest=1" : "/kartlar";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-4">
        {!deck || !cards || !plan ? (
          <>
            <Skeleton className="mx-auto mt-7 aspect-[4/5] w-[min(62vw,250px)] rounded-[26px]" />
            <Skeleton className="mx-auto mt-8 h-9 w-56 rounded-xl" />
            <Skeleton className="mt-6 h-[58px] w-full rounded-2xl" />
          </>
        ) : (
          <>
            <CardStack top={count > 0 ? (today[0] ?? null) : null} behind={count > 0 ? today.slice(1) : byNextReview(cards.filter(hasStarted)).slice(0, 2)} count={count} to={to} />

            <div className="mt-8 text-center animate-rise-in" style={delay(120)}>
              {count > 0 ? (
                <>
                  <h1 className="text-[30px] font-black leading-[1.05] tracking-[-0.02em] text-ink">
                    <span className="text-berry">{count} kart</span> seni bekliyor
                  </h1>
                  <p className="mt-2 text-[15px] font-bold text-graphite">
                    {[plan.newIds.length > 0 ? `${plan.newIds.length} yeni kelime` : null, plan.reviewsDue > 0 ? `${plan.reviewsDue} tekrar` : null, `~${cardMinutes(plan.reviewsDue, plan.newIds.length)} dk`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-[30px] font-black leading-[1.05] tracking-[-0.02em] text-ink">
                    Bugünlük <span className="text-grass">tamam!</span>
                  </h1>
                  <p className="mt-2 text-[15px] font-bold text-graphite">
                    {plan.tomorrow.reviews + plan.tomorrow.new > 0
                      ? `Yarın ${[plan.tomorrow.new > 0 ? `${plan.tomorrow.new} yeni kelime` : null, plan.tomorrow.reviews > 0 ? `${plan.tomorrow.reviews} tekrar` : null].filter(Boolean).join(" ve ")} var.`
                      : "Yarın boş; istersen serbest tekrar yap."}
                  </p>
                </>
              )}
            </div>

            <Link
              to={to}
              onClick={primeSpeech}
              style={delay(180)}
              className={`face mt-6 flex min-h-[58px] w-full items-center justify-center rounded-2xl text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d animate-rise-in focus-visible:outline-none focus-visible:ring-4 ${
                count > 0 ? "bg-grass focus-visible:ring-grass/40" : "bg-ocean focus-visible:ring-ocean/40"
              }`}
            >
              {count > 0 ? "Başla" : anyMet ? "Serbest tekrar" : "Yarın yeni kelimeler gelecek"}
            </Link>

            {cards.length > 0 && <Schedule cards={cards} queued={plan.queued} />}
          </>
        )}
      </main>
      <AppTabs />
    </div>
  );
}

export default Kartlar;
