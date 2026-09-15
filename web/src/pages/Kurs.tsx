import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { Card, Deck, UnitRecord } from "../types";
import { themeFor } from "../lib/themes";
import { buildPath, pathStats } from "../lib/path";
import { pathLines } from "../lib/tonton";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import Button from "../components/Button";
import TontonSays from "../components/TontonSays";
import CourseHub from "../components/CourseHub";
import LearningPath from "../components/LearningPath";
import DeckCard from "../components/DeckCard";
import type { DeckStats } from "../components/DeckCard";
import DeckFormModal from "../components/DeckFormModal";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";

function dueStats(cards: Card[]): Pick<DeckStats, "due" | "newDue" | "reviewDue"> {
  const now = Date.now();
  const due = cards.filter((card) => new Date(card.due_date).getTime() <= now);
  const newDue = due.filter((card) => card.repetitions === 0).length;
  return { due: due.length, newDue, reviewDue: due.length - newDue };
}

/**
 * Kurs: the course half — where you are, the map, and any other decks
 * you've made. Nothing about the flashcards.
 */
function Kurs() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const decksQuery = useQuery<Deck[]>({
    queryKey: ["decks"],
    queryFn: () => api.get<{ decks: Deck[] }>("/decks").then((r) => r.decks),
  });
  const decks = (decksQuery.data ?? []).filter((deck) => deck.kind !== "personal");

  const cardQueries = useQueries({
    queries: decks.map((deck) => ({
      queryKey: ["cards", String(deck.id)],
      queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deck.id}/cards`).then((r) => r.cards),
    })),
  });
  const unitQueries = useQueries({
    queries: decks.map((deck) => ({
      queryKey: ["units", String(deck.id)],
      queryFn: () => api.get<{ units: UnitRecord[] }>(`/decks/${deck.id}/units`).then((r) => r.units),
    })),
  });

  // The course is the deck with units; the rest are plain decks.
  const courseIndex = decks.findIndex((_, i) => (unitQueries[i]?.data?.length ?? 0) > 0);
  const course = courseIndex === -1 ? null : decks[courseIndex];
  const courseCards = courseIndex === -1 ? undefined : cardQueries[courseIndex]?.data;
  const courseUnits = courseIndex === -1 ? undefined : unitQueries[courseIndex]?.data;
  const path = courseCards && courseUnits ? buildPath(courseCards, courseUnits) : [];
  const stats = pathStats(path);
  const loadingCourse = decksQuery.isLoading || unitQueries.some((q) => q.isLoading);

  const createDeck = useMutation({
    mutationFn: (name: string) => api.post<{ deck: Deck }>("/decks", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      setIsModalOpen(false);
    },
  });
  const createError = createDeck.error
    ? createDeck.error instanceof ApiError
      ? createDeck.error.message
      : "Bir şeyler ters gitti. Tekrar dener misin?"
    : null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-6 pb-28 pt-8">
        <TontonSays
          size={84}
          lines={
            path.length > 0
              ? pathLines(stats, path, stats.wordsLearned === 0 && path.every((u) => u.state !== "passed"))
              : ["Kurs burada: ünite ünite, ders ders. Nereden başlayalım? 📚"]
          }
        />

        {decksQuery.isError && (
          <div className="mt-6">
            <ErrorState message="Kurs yüklenemedi." onRetry={() => void decksQuery.refetch()} />
          </div>
        )}

        {course ? (
          <>
            <div className="mt-5">
              <CourseHub deck={course} cards={courseCards} units={courseUnits} />
            </div>
            {courseCards && courseUnits && path.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Yol haritası</p>
                <LearningPath deckId={String(course.id)} units={path} />
              </div>
            )}
          </>
        ) : loadingCourse ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
        ) : null}

        {/* Other decks the learner made themselves. */}
        <div className="mt-10 flex items-end justify-between gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Diğer desteler</p>
          <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
            + Yeni deste
          </Button>
        </div>
        {decks.filter((_, i) => i !== courseIndex).length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">Kendi destelerin burada görünür.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck, i) =>
              i === courseIndex ? null : (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  theme={themeFor(i)}
                  stats={cardQueries[i]?.data ? { total: cardQueries[i].data.length, ...dueStats(cardQueries[i].data) } : undefined}
                />
              ),
            )}
          </div>
        )}
      </main>

      <DeckFormModal
        mode="create"
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          createDeck.reset();
        }}
        onSubmit={(name) => createDeck.mutate(name)}
        isPending={createDeck.isPending}
        error={createError}
      />
      <AppTabs />
    </div>
  );
}

export default Kurs;
