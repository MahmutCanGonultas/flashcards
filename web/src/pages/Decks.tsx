import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { themeFor } from "../lib/themes";
import type { Card, Deck } from "../types";
import Header from "../components/Header";
import Button from "../components/Button";
import DeckCard from "../components/DeckCard";
import type { DeckStats } from "../components/DeckCard";
import DeckFormModal from "../components/DeckFormModal";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import Mascot from "../components/Mascot";
import { buildPath, pathStats } from "../lib/path";

/** Splits the due cards into brand-new ones and spaced-repetition repeats. */
function dueStats(cards: Card[]): Pick<DeckStats, "due" | "newDue" | "reviewDue"> {
  const now = Date.now();
  const due = cards.filter((card) => new Date(card.due_date).getTime() <= now);
  const newDue = due.filter((card) => card.repetitions === 0).length;
  return { due: due.length, newDue, reviewDue: due.length - newDue };
}

/** Path progress, for decks whose cards carry lesson numbers. */
function pathProgress(cards: Card[]): DeckStats["path"] {
  const units = buildPath(cards);
  if (units.length === 0) return undefined;
  const stats = pathStats(units);
  return {
    lessonsDone: stats.doneLessons,
    totalLessons: stats.totalLessons,
    wordsLearned: stats.wordsLearned,
    totalWords: stats.totalWords,
  };
}

/** Shaped like a real DeckCard, so the loading grid doesn't jump around once data lands. */
function DeckCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 ring-2 ring-stone-100">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4 rounded-full" />
      <Skeleton className="mt-2.5 h-4 w-24 rounded-full" />
      <Skeleton className="mt-5 h-4 w-14 rounded-full" />
    </div>
  );
}

function Decks() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<Deck[]>({
    queryKey: ["decks"],
    queryFn: () => api.get<{ decks: Deck[] }>("/decks").then((r) => r.decks),
  });

  // One request per deck, under the same key DeckDetail uses, so opening a deck
  // afterwards is instant. It gives us both the card count and how many are due.
  const cardQueries = useQueries({
    queries: (data ?? []).map((deck) => ({
      queryKey: ["cards", String(deck.id)],
      queryFn: () =>
        api.get<{ cards: Card[] }>(`/decks/${deck.id}/cards`).then((r) => r.cards),
    })),
  });

  const statsFor = (index: number): DeckStats | undefined => {
    const cards = cardQueries[index]?.data;
    return cards
      ? { total: cards.length, ...dueStats(cards), path: pathProgress(cards) }
      : undefined;
  };

  const createDeck = useMutation({
    mutationFn: (name: string) => api.post<{ deck: Deck }>("/decks", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      setIsModalOpen(false);
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    // Drop any failed attempt so a stale error doesn't flash on reopen.
    createDeck.reset();
  };

  const createError = createDeck.error
    ? createDeck.error instanceof ApiError
      ? createDeck.error.message
      : "Something went wrong. Please try again."
    : null;

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <Mascot mood="happy" size={64} className="shrink-0" />
            <div>
              <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">
                My Decks
              </h1>
              <p className="text-stone-500 mt-1">Pick up where you left off.</p>
            </div>
          </div>
          <Button
            className="w-full shrink-0 whitespace-nowrap sm:w-auto"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="text-xl leading-none">+</span> New deck
          </Button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <DeckCardSkeleton key={n} />
            ))}
          </div>
        )}

        {isError && (
          <ErrorState
            message="We couldn't load your decks."
            onRetry={() => refetch()}
          />
        )}

        {data && data.length === 0 && (
          <EmptyState
            emoji="🗂️"
            title="No decks yet"
            description="Create your first deck and start learning!"
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                Create your first deck
              </Button>
            }
          />
        )}

        {data && data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((deck, i) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                theme={themeFor(i)}
                stats={statsFor(i)}
              />
            ))}
          </div>
        )}
      </main>

      <DeckFormModal
        mode="create"
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={(name) => createDeck.mutate(name)}
        isPending={createDeck.isPending}
        error={createError}
      />
    </div>
  );
}

export default Decks;
