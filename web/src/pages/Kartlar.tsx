import { useState } from "react";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import TontonSays from "../components/TontonSays";
import StreakStrip from "../components/StreakStrip";
import FlashcardsHub from "../components/FlashcardsHub";
import ReminderCard from "../components/ReminderCard";
import PersonalDeckView from "../components/PersonalDeckView";
import PersonalCardSheet from "../components/PersonalCardSheet";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import { usePersonalCards, usePersonalDeck } from "../lib/personal";
import { useStreak } from "../lib/streak";
import { homeLines } from "../lib/tonton";

/**
 * Kartlarım: the flashcards half. Your words, the pile that's waiting,
 * the reminder, and the list of word pages. Nothing about the course.
 */
function Kartlar() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const streak = useStreak().data?.streak ?? 0;
  const cards = cardsQuery.data;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-6 pb-28 pt-8">
        <TontonSays size={84} lines={homeLines({ cards: [], due: 0, streak, personal: cards ?? [] })} />

        <div className="mt-5">
          <StreakStrip />
        </div>

        <div className="mt-4">
          <FlashcardsHub deck={deckQuery.data} cards={cards} onAdd={() => deckQuery.data && setIsAddOpen(true)} />
        </div>

        <div className="mt-4">
          <ReminderCard />
        </div>

        {deckQuery.isError || cardsQuery.isError ? (
          <div className="mt-6">
            <ErrorState
              title="Kelimelerin yüklenemedi"
              message="Bağlantını kontrol edip tekrar dene."
              onRetry={() => {
                void deckQuery.refetch();
                void cardsQuery.refetch();
              }}
            />
          </div>
        ) : !deckQuery.data || !cards ? (
          <div className="mt-6 space-y-2">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <PersonalDeckView deckId={String(deckQuery.data.id)} cards={cards} onAdd={() => setIsAddOpen(true)} showActions={false} />
        )}
      </main>

      <PersonalCardSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} deckId={deckQuery.data?.id} />
      <AppTabs />
    </div>
  );
}

export default Kartlar;
