import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import StreakWeek from "../components/StreakWeek";
import WeekProgram from "../components/WeekProgram";
import MemoryPanel from "../components/MemoryPanel";
import Skeleton from "../components/Skeleton";
import { CheckIcon } from "../components/icons";
import { useDeckStats, usePersonalCards, usePersonalDeck } from "../lib/personal";
import { EXERCISES_FOR_THE_DAY, cardMinutes, exerciseMinutes, usePlan, type DailyPlan } from "../lib/plan";
import { primeSpeech } from "../lib/speech";
import { hasStarted } from "../lib/path";
import { learnerDayNumber } from "../lib/day";
import { doneToday, type DoneTask } from "../lib/dailyDone";
import { WEEK_DAYS, lookBack, lookBackHref, testHref, wordsOfWeek } from "../lib/programme";
import { hasWeekText } from "../content/weeks";
import { CATALOG } from "../content/grammar/catalog";
import type { Card } from "../types";

type Step = { key: string; title: string; detail: string; minutes: number | null; to: string | null; done: boolean };

/** Today's grammar reminder: a different topic every day, round the whole list. */
const topicOfTheDay = () => CATALOG[learnerDayNumber() % CATALOG.length];

/**
 * The day in a few steps, in the order to do them: the cards, the
 * exercises, and what this day of the week is for (a grammar reminder
 * Monday to Thursday, Friday's reading, Saturday's translation, Sunday's
 * test and look back). Each one ticks green when it's done.
 */
function stepsFor(deckId: number, cards: Card[], plan: DailyPlan, done: ReadonlySet<DoneTask>): Step[] {
  const count = plan.reviewsDue + plan.newIds.length;
  const steps: Step[] = [
    {
      key: "cards",
      title: "Kartlar",
      detail: count > 0 ? [plan.newIds.length > 0 ? `${plan.newIds.length} yeni kelime` : null, plan.reviewsDue > 0 ? `${plan.reviewsDue} tekrar` : null].filter(Boolean).join(" · ") : "Bugünün kartları bitti",
      minutes: count > 0 ? cardMinutes(plan.reviewsDue, plan.newIds.length) : null,
      to: `/decks/${deckId}/flashcards${count > 0 ? "" : "?mode=all"}`,
      done: count === 0,
    },
    {
      key: "exercises",
      title: "Egzersiz",
      detail: plan.exercisable > 0 ? "Kelimeleri yazarak pekiştir" : "Kartlarda kelimelerle tanışınca açılır",
      minutes: plan.exercisable > 0 ? exerciseMinutes(plan.exercisable) : null,
      to: plan.exercisable > 0 ? `/decks/${deckId}/flashcards?mode=exercises` : null,
      done: plan.exercisable > 0 && plan.exercisesToday >= Math.min(EXERCISES_FOR_THE_DAY, plan.exercisable),
    },
  ];
  const week = plan.week?.number ?? null;
  const task = WEEK_DAYS[plan.week?.weekday ?? 0].task;
  if (task === "new" || week === null) {
    const topic = topicOfTheDay();
    steps.push({
      key: "grammar",
      title: "Gramer hatırlatması",
      detail: `${topic.emoji} ${topic.title}`,
      minutes: 1,
      to: `/gramer/hatirla?konu=${topic.slug}`,
      done: done.has("grammar"),
    });
  } else if (task === "reading") {
    steps.push({ key: "reading", title: "Haftanın okuması", detail: "Bu haftanın kelimeleriyle kısa bir metin", minutes: 5, to: hasWeekText(week) ? `/hafta/${week}/okuma` : null, done: done.has("reading") });
  } else if (task === "translation") {
    steps.push({ key: "translation", title: "Haftanın çevirisi", detail: "Türkçe metni İngilizceye çevir", minutes: 8, to: hasWeekText(week) ? `/hafta/${week}/ceviri` : null, done: done.has("translation") });
  } else {
    const met = wordsOfWeek(cards, week).filter(hasStarted);
    const back = lookBack(cards, week);
    steps.push({ key: "test", title: "Haftanın testi", detail: `${met.length} kelime, Türkçesinden yazarak`, minutes: 4, to: met.length > 0 ? `${testHref(deckId, met.map((c) => c.id))}&done=test` : null, done: done.has("test") });
    if (back.length > 0) {
      steps.push({ key: "lookback", title: "Büyük tekrar", detail: `Eski haftalardan ${back.length} kelime`, minutes: 4, to: `${lookBackHref(deckId, back.map((c) => c.id))}&done=lookback`, done: done.has("lookback") });
    }
  }
  return steps;
}

/** The day's checklist: what's left is one tap away, what's done is ticked. */
function TodayList({ steps }: { steps: Step[] }) {
  const next = steps.findIndex((step) => !step.done && step.to);
  const doneCount = steps.filter((step) => step.done).length;
  return (
    <section aria-labelledby="today-heading" className="mt-4">
      <div className="flex items-baseline justify-between">
        <h2 id="today-heading" className="text-[13px] font-black uppercase tracking-[0.12em] text-graphite">
          Bugün yapacakların
        </h2>
        <span className={`text-[14px] font-black tabular-nums ${doneCount === steps.length ? "text-grass-ink" : "text-graphite"}`}>
          {doneCount}/{steps.length} tamam
        </span>
      </div>
      <ol className="mt-2.5 space-y-2.5">
        {steps.map((step, i) => {
          const isNext = i === next;
          const body = (
            <>
              <span
                aria-hidden="true"
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[16px] font-black ${
                  step.done ? "bg-grass text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]" : isNext ? "bg-ocean text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]" : "bg-paper-deep text-graphite"
                }`}
              >
                {step.done ? <CheckIcon className="h-5 w-5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[17px] font-black leading-tight ${step.done ? "text-graphite line-through decoration-2" : "text-ink"}`}>{step.title}</span>
                <span className="mt-0.5 block truncate text-[13px] font-bold text-graphite">{step.detail}</span>
              </span>
              {step.minutes !== null && !step.done && <span className="shrink-0 rounded-full bg-paper-deep px-2.5 py-1 text-[12px] font-black tabular-nums text-graphite">~{step.minutes} dk</span>}
              {step.to && <span aria-hidden="true" className={`shrink-0 text-[20px] font-black ${isNext ? "text-ocean-ink" : "text-hare"}`}>→</span>}
            </>
          );
          const cls = `flex min-h-[68px] items-center gap-3 rounded-[20px] p-3 ${
            isNext ? "border-2 border-ocean bg-ocean-soft shadow-[0_3px_0_0_var(--color-ocean)]" : "card-3d"
          } ${step.to ? "press" : "opacity-70"}`;
          return (
            <li key={step.key}>
              {step.to ? (
                <Link to={step.to} onClick={primeSpeech} className={cls}>
                  <span className="sr-only">{i + 1}. adım: </span>
                  {body}
                </Link>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Bugün — what to do today, in order, ticked off as it's done; then the
 * week of the programme and the memory at a glance. The cards themselves
 * are on their own tab.
 */
function Hafta() {
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const planQuery = usePlan(deckQuery.data);
  const statsQuery = useDeckStats(deckQuery.data);
  const deck = deckQuery.data;
  const cards = cardsQuery.data;
  const plan = planQuery.data;
  // Read once as the page opens; coming back from a piece of work opens it anew.
  const [done] = useState(() => doneToday());

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        <StreakWeek />
        <h1 className="mt-5 text-[32px] font-black leading-[1.05] tracking-[-0.02em] text-ink">Bugün</h1>

        {!deck || !cards || !plan ? (
          <div className="mt-4 space-y-2.5">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-[68px] w-full rounded-[20px]" />
            ))}
          </div>
        ) : (
          <TodayList steps={stepsFor(deck.id, cards, plan, done)} />
        )}

        {deck && cards && plan?.week && (
          <div className="mt-8">
            <WeekProgram deckId={deck.id} cards={cards} week={plan.week} />
          </div>
        )}

        {cards && cards.length > 0 && (
          <div className="mt-6">
            <MemoryPanel cards={cards} fresh={plan?.newIds.length ?? 0} stats={statsQuery.data} />
          </div>
        )}
      </main>
      <AppTabs />
    </div>
  );
}

export default Hafta;
