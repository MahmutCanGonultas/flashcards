import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { primeSpeech } from "../lib/speech";
import { tintStyle } from "../lib/tint";
import { STAGE_LABEL, isLeech, nextReview, stageOf } from "../lib/memory";
import { STAGE_TEXT, TONE_TEXT } from "../lib/stageStyle";
import { splitOnWord } from "../lib/sentence";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import SpeakButton from "../components/SpeakButton";
import ConfirmDialog from "../components/ConfirmDialog";
import WordCardBack from "../components/WordCardBack";
import StrengthBars from "../components/StrengthBars";

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

/** Where the word stands: its stage, when it's back, and how often it has slipped. */
function MemoryLine({ card }: { card: Card }) {
  const stage = stageOf(card);
  const next = nextReview(card);
  const lapses = card.lapses ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-rule py-3 text-[11px] font-extrabold uppercase tracking-[0.16em]">
      <StrengthBars card={card} />
      <span className={STAGE_TEXT[stage]}>{STAGE_LABEL[stage]}</span>
      <span aria-hidden="true" className="text-rule">
        ·
      </span>
      <span className={TONE_TEXT[next.tone]}>{stage === "new" ? "İlk kez sorulacak" : next.text === "Şimdi" ? "Tekrar vakti" : `Sıradaki: ${next.text}`}</span>
      {lapses > 0 && (
        <>
          <span aria-hidden="true" className="text-rule">
            ·
          </span>
          <span className={isLeech(card) ? "text-gilt-ink" : "text-graphite"}>{isLeech(card) ? `İnatçı · ${lapses} kez kaçtı` : `${lapses} kez kaçtı`}</span>
        </>
      )}
    </div>
  );
}

/**
 * The learner's own sentence with the word — the strongest cue a word can
 * have. Written here or right after the word is first recalled; later
 * reviews blank the word out of it.
 */
function OwnSentence({ card, deckId }: { card: Card; deckId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(!card.my_sentence);
  const [text, setText] = useState(card.my_sentence ?? "");
  const [warned, setWarned] = useState(false);
  const save = useMutation({
    mutationFn: (sentence: string | null) =>
      api.put<{ card: Card }>(`/decks/${deckId}/cards/${card.id}`, { front: card.front, back: card.back, mySentence: sentence }),
    onSuccess: (data) => {
      queryClient.setQueryData<Card[]>(["cards", deckId], (cards) => cards?.map((c) => (c.id === data.card.id ? { ...c, ...data.card } : c)));
      setEditing(false);
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const sentence = text.trim();
    if (!sentence) return;
    if (!splitOnWord(sentence, card.front) && !warned) {
      setWarned(true);
      return;
    }
    save.mutate(sentence);
  };

  const parts = card.my_sentence ? splitOnWord(card.my_sentence, card.front) : null;

  return (
    <section className="mt-6 rounded-[20px] bg-paper-lift px-5 pb-5 pt-4 ring-1 ring-rule shadow-print paper-grain">
      <div className="flex items-baseline justify-between gap-3">
        <p className={KICKER}>Kendi cümlen</p>
        {card.my_sentence && !editing && (
          <button
            type="button"
            onClick={() => {
              setText(card.my_sentence ?? "");
              setEditing(true);
            }}
            className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink underline decoration-ink decoration-[1.5px] underline-offset-4"
          >
            Değiştir
          </button>
        )}
      </div>
      {!editing && card.my_sentence ? (
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="min-w-0 text-[19px] leading-[1.45] text-ink wrap-break-word">
            {parts ? (
              <>
                {parts.before}
                <span className="font-extrabold underline decoration-[var(--tint)] decoration-[2px] underline-offset-4">{parts.match}</span>
                {parts.after}
              </>
            ) : (
              card.my_sentence
            )}
          </p>
          <SpeakButton text={card.my_sentence} size="sm" className="bg-paper-lift text-ink ring-1 ring-rule" />
        </div>
      ) : (
        <form onSubmit={submit} className="mt-2">
          <p className="text-[14px] font-semibold leading-snug text-graphite">
            Bu kelimeyle kendi hayatından bir cümle yaz. En güçlü ipucu budur; tekrarlarda onu da boşluklu soracağım.
          </p>
          <label htmlFor={`own-${card.id}`} className="sr-only">
            Cümlen
          </label>
          <textarea
            id={`own-${card.id}`}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setWarned(false);
            }}
            rows={2}
            maxLength={300}
            autoCapitalize="sentences"
            autoCorrect="off"
            spellCheck={false}
            placeholder={`I … ${card.front} …`}
            className="mt-3 w-full resize-none rounded-2xl bg-paper px-4 py-3 text-[17px] leading-snug text-ink outline-none ring-1 ring-rule transition placeholder:text-graphite/50 focus:ring-2 focus:ring-ink/40"
          />
          {warned && (
            <p role="alert" className="mt-2 text-[13px] font-semibold text-gilt-ink">
              Cümlede “{card.front}” göremedim. Yine de kaydedeyim mi? Bir daha bas.
            </p>
          )}
          {save.isError && (
            <p role="alert" className="mt-2 text-[13px] font-semibold text-accent">
              Kaydedilemedi. Bir daha dene.
            </p>
          )}
          <div className="mt-3 flex items-center justify-end gap-3">
            {card.my_sentence && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Vazgeç
              </Button>
            )}
            <Button type="submit" variant="ink" size="sm" isLoading={save.isPending} disabled={!text.trim()}>
              Kaydet
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

/**
 * One word's page: everything about it, in reading order. The word on its
 * own colour, where it stands in memory, the learner's own sentence, then
 * the entry — meanings, sentences, chunks, family, the one trap. From here
 * the word can be drilled on its own, without touching its schedule.
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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-28 pt-5">
        <Link
          to="/kartlar"
          viewTransition
          className="-m-2 inline-block p-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite transition-colors hover:text-ink"
        >
          ← Kelimelerim
        </Link>

        {cardsQuery.isLoading && (
          <div className="mt-4 space-y-4">
            <Skeleton className="-mx-6 h-52 rounded-none" />
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

        {card && back && (
          <article style={tintStyle(card)}>
            {/* The masthead: the word on its own colour, its initial huge and faint behind it. */}
            <header className="relative isolate -mx-6 mt-4 overflow-hidden cover-ground px-6 pb-6 pt-5 text-paper-lift">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[0.22em] right-2 -z-10 select-none text-[240px] font-black leading-none tracking-[-0.06em] text-paper-lift/[0.07]"
              >
                {card.front.charAt(0)}
              </span>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-paper-lift/70">
                Kelime{back.pos ? ` · ${posLabel(back.pos)}` : ""}
              </p>
              <span aria-hidden="true" className="mt-1 block h-[2px] w-7 bg-paper-lift/70 animate-bar-print" style={delay(120)} />
              <div className="mt-12 flex items-end justify-between gap-3">
                <h1
                  className={`min-w-0 wrap-break-word font-black leading-[0.95] tracking-[-0.02em] animate-[cover-line_420ms_var(--ease-soft)_120ms_both] ${
                    card.front.length > 11 ? "text-[40px]" : "text-[52px]"
                  }`}
                  style={{ viewTransitionName: `word-${card.id}` }}
                >
                  {card.front}
                </h1>
                <SpeakButton text={card.front} size="md" className="!bg-paper-lift/10 !text-paper-lift ring-1 ring-paper-lift/40 hover:!bg-paper-lift/20" />
              </div>
            </header>

            <MemoryLine card={card} />
            <p className="mt-4 text-[20px] font-semibold leading-snug text-ink animate-rise-in" style={delay(200)}>
              {back.text}
            </p>

            <OwnSentence key={card.id} card={card} deckId={deckId} />

            <section className="mt-7">
              <span aria-hidden="true" className="block h-[2px] w-full tint-bar animate-bar-print" style={delay(260)} />
              <p className={`mt-2 ${KICKER}`}>Anlamlar</p>
              <div className="mt-2">
                <WordCardBack card={card} />
              </div>
            </section>

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-rule pt-5">
              <LinkButton to={`/decks/${deckId}/flashcards?card=${card.id}`} variant="ink" size="sm" onClick={primeSpeech}>
                Bu kelimeyi çalış
              </LinkButton>
              <button
                type="button"
                className="text-[12px] font-bold text-graphite underline underline-offset-4 transition-colors hover:text-ink"
                onClick={() => setConfirming(true)}
              >
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
