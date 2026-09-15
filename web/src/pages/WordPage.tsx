import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { isDue } from "../lib/path";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import SpeakButton from "../components/SpeakButton";
import ConfirmDialog from "../components/ConfirmDialog";
import WordCardBack from "../components/WordCardBack";

/** When this card next comes back, in words. */
function nextReviewLabel(card: Card): string {
  if (isDue(card)) return card.repetitions === 0 ? "İlk kez sorulacak" : "Tekrar vakti geldi";
  const days = Math.ceil((new Date(card.due_date).getTime() - Date.now()) / 86_400_000);
  return days <= 1 ? "Yarın tekrar" : `${days} gün sonra tekrar`;
}

/**
 * One word's page: the reference half of the flashcards. The card asks
 * "what does it mean?"; this page answers everything else — each sense
 * with its pattern and sentences, the family, the trap.
 */
function WordPage() {
  const { deckId = "", cardId = "" } = useParams<{ deckId: string; cardId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const cardsQuery = useQuery({
    queryKey: ["cards", deckId],
    queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deckId}/cards`).then((r) => r.cards),
    enabled: deckId !== "",
  });
  const remove = useMutation({
    mutationFn: () => api.delete<{ message: string }>(`/decks/${deckId}/cards/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
      navigate(`/decks/${deckId}`);
    },
  });

  if (!deckId || !cardId) return <Navigate to="/decks" replace />;

  const card = cardsQuery.data?.find((c) => String(c.id) === cardId);
  const back = card ? parseBack(card.back) : null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-16 pt-8">
        <Link
          to={`/decks/${deckId}`}
          className="-m-2 inline-flex items-center gap-1.5 p-2 font-medium text-stone-500 transition hover:text-stone-800"
        >
          <span aria-hidden="true">←</span> Kelimelerim
        </Link>

        {cardsQuery.isLoading && (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
        )}
        {cardsQuery.isError && (
          <div className="mt-6">
            <ErrorState title="Kelime yüklenemedi" message="Bağlantını kontrol edip tekrar dene." onRetry={() => void cardsQuery.refetch()} />
          </div>
        )}
        {cardsQuery.isSuccess && !card && (
          <div className="mt-6">
            <ErrorState title="Böyle bir kelime yok" message="Silinmiş olabilir." />
          </div>
        )}

        {card && back && (
          <>
            {/* The hero: the picture, the word, what it means. */}
            <div className="mt-5 overflow-hidden rounded-3xl bg-white ring-2 ring-violet-100 shadow-[0_6px_0_0_var(--color-violet-100)]">
              {card.image_url && (
                <img src={card.image_url} alt="" className="h-52 w-full object-cover sm:h-64" />
              )}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="text-4xl font-extrabold tracking-tight text-stone-800 break-words">{card.front}</h1>
                  <SpeakButton text={card.front} size="md" />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {back.pos && (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-600 ring-1 ring-violet-100">
                      {posLabel(back.pos)}
                    </span>
                  )}
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100">
                    {nextReviewLabel(card)}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold leading-snug text-violet-700">{back.text}</p>
              </div>
            </div>

            <h2 className="mt-7 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Anlamlar ve örnek cümleler</h2>
            <div className="mt-2">
              <WordCardBack card={card} />
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-stone-200/70 pt-6">
              <LinkButton to={`/decks/${deckId}/flashcards?mode=all`} variant="secondary" size="sm">
                🃏 Kartlara dön
              </LinkButton>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
                Bu kelimeyi sil
              </Button>
            </div>
          </>
        )}
      </main>

      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => remove.mutate()}
        title="Kelimeyi sil"
        message={card ? `"${card.front}" kartı ve tüm notları silinecek.` : ""}
        isLoading={remove.isPending}
      />
    </div>
  );
}

export default WordPage;
