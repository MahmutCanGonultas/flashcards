import { Link } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import StreakWeek from "../components/StreakWeek";
import WeekProgram from "../components/WeekProgram";
import MemoryPanel from "../components/MemoryPanel";
import TontonLine from "../components/TontonLine";
import Skeleton from "../components/Skeleton";
import { PencilIcon } from "../components/icons";
import { useDeckStats, usePersonalCards, usePersonalDeck } from "../lib/personal";
import { EXERCISES_FOR_THE_DAY, exerciseMinutes, usePlan } from "../lib/plan";
import { primeSpeech } from "../lib/speech";

/**
 * Hafta — everything around the cards, kept off the cards' page: the week of
 * the programme (its words, the seven days, the reading, the translation,
 * the test and the look back), the exercises, and the memory at a glance.
 */
function Hafta() {
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const planQuery = usePlan(deckQuery.data);
  const statsQuery = useDeckStats(deckQuery.data);
  const deck = deckQuery.data;
  const cards = cardsQuery.data;
  const plan = planQuery.data;
  const exercisesDone = plan ? plan.exercisesToday >= Math.min(EXERCISES_FOR_THE_DAY, plan.exercisable) && plan.exercisable > 0 : false;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        <StreakWeek />
        <h1 className="mt-5 text-[32px] font-black leading-[1.05] tracking-[-0.02em] text-ink">Haftan</h1>

        {!deck || !cards || !plan ? (
          <Skeleton className="mt-5 h-72 w-full rounded-[22px]" />
        ) : plan.week ? (
          <WeekProgram deckId={deck.id} cards={cards} week={plan.week} />
        ) : (
          <TontonLine className="mt-5" size={56} mood="think">
            Haftanın programı birazdan burada.
          </TontonLine>
        )}

        {/* The exercises: the word typed, in its sentence, in its phrase. Never the schedule's business. */}
        {deck && plan && plan.exercisable > 0 && (
          <Link
            to={`/decks/${deck.id}/flashcards?mode=exercises`}
            onClick={primeSpeech}
            className="card-3d press mt-4 flex items-center gap-3 rounded-[20px] p-3.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-tangerine text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.18)]">
              <PencilIcon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-black leading-tight text-ink">Egzersiz</span>
              <span className="mt-0.5 block text-[13px] font-bold leading-snug text-graphite">
                {exercisesDone ? "Bugün yaptın · istersen bir tur daha" : `Kelimeleri yazarak pekiştir · ~${exerciseMinutes(plan.exercisable)} dk`}
              </span>
            </span>
            <span aria-hidden="true" className="text-[20px] font-black text-ocean-ink">→</span>
          </Link>
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
