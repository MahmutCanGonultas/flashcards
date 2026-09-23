import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card } from "../types";
import { parseBack } from "../lib/cardBack";
import { primeSpeech } from "../lib/speech";
import { tintStyle } from "../lib/tint";
import { STAGE_LABEL, isLeech, nextReview, stageOf } from "../lib/memory";
import { TONE_PILL } from "../lib/stageStyle";
import { splitOnWord } from "../lib/sentence";
import { familyStyle } from "../lib/palette";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import Button from "../components/Button";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import SpeakButton from "../components/SpeakButton";
import ConfirmDialog from "../components/ConfirmDialog";
import WordCardBack, { Lit, PosPill } from "../components/WordCardBack";
import StrengthBars from "../components/StrengthBars";
import TontonLine from "../components/TontonLine";
import { BoltIcon, ClockIcon, PencilIcon, TargetIcon } from "../components/icons";

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

/** One fact about where the word stands: a small white card with a coloured icon. */
function Fact({ icon, iconClass, label, children }: { icon: ReactNode; iconClass: string; label: string; children: ReactNode }) {
  return (
    <div className="card-3d min-w-0 rounded-2xl px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-graphite">
        <span className={`grid h-5 w-5 place-items-center rounded-md text-white ${iconClass}`}>{icon}</span>
        {label}
      </p>
      <div className="mt-1.5 truncate text-[15px] font-black text-ink">{children}</div>
    </div>
  );
}

/** What Tonton says on this word: something true about this card, not a slogan. */
function tontonLine(card: Card): string {
  const senses = card.senses?.length ?? 1;
  const chunks = card.collocations?.length ?? 0;
  if (isLeech(card)) return `"${card.front}" seninle inatlaşıyor. Sesli oku, bir cümle kur, sonra "Bu kelimeyi çalış"a bas; bu sefer kalır.`;
  if (!card.my_sentence) return `"${card.front}" ile kendi hayatından bir cümle yaz. Benim bütün örneklerimden daha iyi hatırlatır.`;
  if (senses > 1 && chunks > 0) return `${senses} anlamı, ${chunks} kalıbı var. Önce 1. anlamı oku, sonra kalıpları sesli söyle.`;
  if (senses > 1) return `${senses} anlamı var ama hepsi aynı kökten. Renklere bak: her anlam kendi rengiyle.`;
  return "Örnek cümleyi sesli oku; kelime cümlesinde yaşar.";
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

  return (
    <section style={familyStyle("sunny")} className="rounded-[22px] border-2 border-sunny bg-sunny-soft p-4 shadow-[0_2px_0_0_var(--color-sunny)]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-sunny text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.12)]">
          <PencilIcon className="h-5 w-5" />
        </span>
        <h2 className="flex-1 text-[19px] font-black text-ink">Kendi cümlen</h2>
        {card.my_sentence && !editing && (
          <button
            type="button"
            onClick={() => {
              setText(card.my_sentence ?? "");
              setEditing(true);
            }}
            className="rounded-xl px-2 py-1.5 text-[13px] font-black uppercase tracking-[0.08em] text-sunny-ink hover:bg-white/60"
          >
            Değiştir
          </button>
        )}
      </div>
      {!editing && card.my_sentence ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-white px-3.5 py-3" style={tintStyle(card)}>
          <p className="min-w-0 flex-1 text-[18px] font-bold leading-[1.45] text-ink wrap-break-word">
            <Lit sentence={card.my_sentence} headword={card.front} />
          </p>
          <SpeakButton text={card.my_sentence} size="sm" className="!h-9 !w-9" />
        </div>
      ) : (
        <form onSubmit={submit} className="mt-2.5">
          <p className="text-[15px] font-semibold leading-snug text-ink/80">
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
            className="mt-3 w-full resize-none rounded-2xl border-2 border-white bg-white px-4 py-3 text-[17px] font-bold leading-snug text-ink outline-none transition-colors placeholder:font-semibold placeholder:text-hare focus:border-sunny-deep"
          />
          {warned && (
            <p role="alert" className="mt-2 text-[14px] font-bold text-sunny-ink">
              Cümlede “{card.front}” göremedim. Yine de kaydedeyim mi? Bir daha bas.
            </p>
          )}
          {save.isError && (
            <p role="alert" className="mt-2 text-[14px] font-bold text-berry-ink">
              Kaydedilemedi. Bir daha dene.
            </p>
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            {card.my_sentence && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Vazgeç
              </Button>
            )}
            <Button type="submit" variant="go" size="sm" isLoading={save.isPending} disabled={!text.trim()}>
              Kaydet
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

/**
 * One word's page, in colour. The word on its own colour with what it
 * means, where it stands in memory in three small cards, the green button
 * that drills it, Tonton with something true about this word, the
 * learner's own sentence, then the entry — every sense in its own colour,
 * the chunks, the family, the one trap.
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
      navigate("/kelimelerim");
    },
  });

  if (!deckId || !cardId) return <Navigate to="/kartlar" replace />;

  const card = cardsQuery.data?.find((c) => String(c.id) === cardId);
  const back = card ? parseBack(card.back) : null;
  const stage = card ? stageOf(card) : "new";
  const next = card ? nextReview(card) : null;
  const lapses = card?.lapses ?? 0;
  // The short gloss under the word: each sense's first meaning, notes in brackets left out.
  const gloss = card
    ? card.senses?.length
      ? card.senses.map((s) => s.meaning.replace(/\([^)]*\)/g, "").split(/[,;]/)[0].trim()).filter(Boolean).join(" · ")
      : back?.text
    : "";
  const pos = card ? (back?.pos ?? card.senses?.[0]?.pos ?? null) : null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        <Link to="/kelimelerim" viewTransition className="-m-2 inline-block p-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
          ← Kelimelerim
        </Link>

        {cardsQuery.isLoading && (
          <div className="mt-3 space-y-4">
            <Skeleton className="h-56 w-full rounded-[28px]" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
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

        {card && back && next && (
          <article style={tintStyle(card)}>
            {/* The word on its own colour: what it is, what it means, how firmly it's held. */}
            <header className="relative isolate mt-3 overflow-hidden rounded-[28px] cover-ground px-5 pb-7 pt-4 text-white">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[0.24em] right-1 -z-10 select-none text-[230px] font-black leading-none tracking-[-0.06em] text-white/[0.08]"
              >
                {card.front.charAt(0)}
              </span>
              <div className="flex items-center gap-2">
                {pos && <PosPill pos={pos} className="!bg-white/25 !text-white" />}
                <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[12px] font-black">{STAGE_LABEL[stage]}</span>
                {isLeech(card) && <span className="rounded-full bg-sunny px-2.5 py-0.5 text-[12px] font-black text-sunny-ink">inatçı</span>}
              </div>
              <div className="mt-10 flex items-end justify-between gap-3">
                <h1
                  className={`min-w-0 wrap-break-word font-black leading-[0.95] tracking-[-0.025em] [text-shadow:0_3px_0_rgba(0,0,0,0.14)] animate-[cover-line_420ms_var(--ease-soft)_120ms_both] ${
                    card.front.length > 11 ? "text-[42px]" : "text-[56px]"
                  }`}
                  style={{ viewTransitionName: `word-${card.id}` }}
                >
                  {card.front}
                </h1>
                <SpeakButton text={card.front} size="md" className="!h-12 !w-12 !bg-white !text-(--c-ink) !shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.12)]" />
              </div>
              <p className="mt-2.5 text-[18px] font-extrabold leading-snug text-white/95 animate-rise-in" style={delay(200)}>
                {gloss}
              </p>
            </header>

            <div className="mt-4 grid grid-cols-3 gap-2 animate-rise-in" style={delay(120)}>
              <Fact icon={<BoltIcon className="h-3.5 w-3.5" />} iconClass="bg-ocean" label="Güç">
                <StrengthBars card={card} size="lg" className="h-[23px]" />
              </Fact>
              <Fact icon={<ClockIcon className="h-3.5 w-3.5" />} iconClass="bg-tangerine" label="Sıradaki">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[12px] ${TONE_PILL[next.tone]}`}>
                  {stage === "new" ? "İlk tanışma" : next.text === "Şimdi" ? "Şimdi" : next.text}
                </span>
              </Fact>
              <Fact icon={<TargetIcon className="h-3.5 w-3.5" />} iconClass={lapses > 0 ? "bg-berry" : "bg-grass"} label="Kaçırma">
                <span className={lapses === 0 ? "text-grass-ink" : isLeech(card) ? "text-berry-ink" : "text-ink"}>{lapses === 0 ? "Hiç" : `${lapses} kez`}</span>
              </Fact>
            </div>

            <Link
              to={`/decks/${deckId}/flashcards?card=${card.id}`}
              onClick={primeSpeech}
              className="face mt-4 flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-grass text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-grass/40"
            >
              Bu kelimeyi çalış
            </Link>

            <TontonLine className="mt-6" size={54}>
              {tontonLine(card)}
            </TontonLine>

            <div className="mt-6">
              <OwnSentence key={card.id} card={card} deckId={deckId} />
            </div>

            <div className="mt-8">
              <WordCardBack card={card} />
            </div>

            <div className="mt-10 flex justify-center border-t-2 border-paper-deep pt-5">
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-hare transition-colors hover:bg-berry-soft hover:text-berry-ink"
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
