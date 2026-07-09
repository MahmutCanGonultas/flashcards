import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { themeFor } from "../lib/themes";
import type { Deck } from "../types";
import Header from "../components/Header";
import Button from "../components/Button";
import DeckCard from "../components/DeckCard";
import DeckFormModal from "../components/DeckFormModal";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";

function Decks() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<Deck[]>({
    queryKey: ["decks"],
    queryFn: () => api.get<{ decks: Deck[] }>("/decks").then((r) => r.decks),
  });

  const createDeck = useMutation({
    mutationFn: (name: string) =>
      api.post<{ deck: Deck }>("/decks", { name }),
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

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight flex items-center gap-2">
              My Decks <span className="text-2xl">📚</span>
            </h1>
            <p className="text-stone-500 mt-1.5">
              Pick a deck and keep your streak going!
            </p>
          </div>
          <Button size="md" onClick={() => setIsModalOpen(true)}>
            <span className="text-xl leading-none">+</span> New deck
          </Button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-44 rounded-3xl" />
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
              <DeckCard key={deck.id} deck={deck} theme={themeFor(i)} />
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
