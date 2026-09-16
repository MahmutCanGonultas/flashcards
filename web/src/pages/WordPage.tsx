import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { isDue } from "../lib/path";
import { primeSpeech } from "../lib/speech";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import SpeakButton from "../components/SpeakButton";
import ConfirmDialog from "../components/ConfirmDialog";
import WordCardBack from "../components/WordCardBack";

/** When this card next comes back, in words. */
function nextReviewLabel(card: Card): { text: string; due: boolean } {
  if (isDue(card)) return { text: card.repetitions === 0 ? "İlk kez sorulacak" : "Tekrar vakti", due: true };
  const days = Math.ceil((new Date(card.due_date).getTime() - Date.now()) / 86_400_000);
  return { text: days <= 1 ? "Yarın tekrar" : `${days} gün sonra tekrar`, due: false };
}

/**
 * One word's page — the feature opener. The photo full bleed, the caption
 * that ties it to the word, then the entry: meanings, sentences, chunks,
 * family, and the trap in Tonton's column.
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
      navigate("/kartlar");
    },
  });

  if (!deckId || !cardId) return <Navigate to="/kartlar" replace />;

  const card = cardsQuery.data?.find((c) => String(c.id) === cardId);
  const back = card ? parseBack(card.back) : null;
  const schedule = card ? nextReviewLabel(card) : null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-28 pt-5">
        <Link to="/kartlar" className="-m-2 inline-block p-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite transition hover:text-ink">
          ← Kelimelerim
        </Link>

        {cardsQuery.isLoading && (
          <div className="mt-4 space-y-4">
            <Skeleton className="-mx-6 h-64 rounded-none" />
            <Skeleton className="h-10 w-2/3 rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
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

        {card && back && schedule && (
          <article className="animate-[step-in_180ms_ease-out]">
            {card.image_url && (
              <figure className="-mx-6 mt-4">
                <div className="overflow-hidden bg-ink">
                  <img src={card.image_url} alt="" className="h-auto max-h-[62vh] w-full object-cover object-center animate-[cover-settle_900ms_ease-out_both]" />
                </div>
                {card.hook && <figcaption className="px-6 pt-3 text-[14px] font-semibold italic leading-snug text-graphite">{card.hook}</figcaption>}
              </figure>
            )}

            <p className="mt-5 flex flex-wrap items-center gap-x-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
              {back.pos && <span>{posLabel(back.pos)}</span>}
              {back.pos && <span aria-hidden="true">·</span>}
              <span className={schedule.due ? "text-accent" : ""}>{schedule.text}</span>
            </p>
            <h1 className="mt-2 flex items-center gap-3 break-words text-[40px] font-black leading-none tracking-[-0.02em] text-ink">
              {card.front}
              <SpeakButton text={card.front} size="md" className="!bg-transparent !text-ink ring-1 ring-ink/15" />
            </h1>
            <p className="mt-3 text-[20px] font-semibold leading-snug text-ink">{back.text}</p>

            <section className="mt-6 border-t border-ink pt-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">Anlamlar</p>
              <div className="mt-2">
                <WordCardBack card={card} />
              </div>
            </section>

            <div className="mt-10 flex items-center justify-between border-t border-ink/10 pt-5">
              <LinkButton to={`/decks/${deckId}/flashcards?mode=all`} variant="outline" size="sm" onClick={primeSpeech}>
                Kartlara dön
              </LinkButton>
              <button type="button" className="text-[12px] font-bold text-graphite underline underline-offset-4 hover:text-ink" onClick={() => setConfirming(true)}>
                Bu kelimeyi sil
              </button>
            </div>
          </article>
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
      <AppTabs />
    </div>
  );
}

export default WordPage;
