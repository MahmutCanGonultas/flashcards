import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { speakAuto } from "../lib/speech";
import { playCorrect, playIncorrect, playLessonComplete, playReveal } from "../lib/sound";
import { useRecordStudyDay } from "../lib/streak";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import Mascot from "../components/Mascot";
import SpeakButton from "../components/SpeakButton";
import TontonLine from "../components/TontonLine";
import Modal from "../components/Modal";
import WordCardBack from "../components/WordCardBack";

/**
 * Real flashcards for the learner's own words.
 *
 * Front: the word. Think. Flip. Back: every sense, pattern and example.
 * Then say how it went — Bilemedim / Zorlandım / Bildim — and the card's
 * schedule moves accordingly: a miss comes back in ten minutes and again
 * before the session ends; a hard pass shortens the next gap; an easy one
 * stretches it. One grade per card per session; the repeats are practice.
 */

type Grade = 1 | 3 | 5;
type Step = { key: string; cardId: number; attempt: number };

const GRADES: { grade: Grade; label: string; emoji: string; className: string; key: string }[] = [
  { grade: 1, label: "Bilemedim", emoji: "😵", className: "bg-rose-500 text-white shadow-[0_4px_0_0_var(--color-rose-700)] active:translate-y-[3px] active:shadow-none", key: "1" },
  { grade: 3, label: "Zorlandım", emoji: "🤔", className: "bg-amber-400 text-amber-950 shadow-[0_4px_0_0_var(--color-amber-600)] active:translate-y-[3px] active:shadow-none", key: "2" },
  { grade: 5, label: "Bildim", emoji: "✅", className: "bg-emerald-500 text-white shadow-[0_4px_0_0_var(--color-emerald-700)] active:translate-y-[3px] active:shadow-none", key: "3" },
];

function FlipSession({ deckId, cards, title }: { deckId: string; cards: Card[]; title: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const recordStudyDay = useRecordStudyDay();

  // Snapshotted; append-only, like a lesson.
  const [queue] = useState(() => cards);
  const [plan, setPlan] = useState<Step[]>(() => cards.map((card) => ({ key: `${card.id}:0`, cardId: card.id, attempt: 0 })));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<number, Grade>>({});
  const gradedRef = useRef(new Set<number>());
  const recordedDayRef = useRef(false);
  const runRef = useRef(0);
  const byId = new Map(queue.map((card) => [card.id, card]));

  const step = plan[index];
  const card = step ? byId.get(step.cardId) : undefined;
  const finished = index >= plan.length;

  const review = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: number; quality: Grade }) =>
      api.post<{ card: Card }>(`/decks/${deckId}/cards/${cardId}/review`, { quality }),
    retry: 2,
  });
  const { mutate: sendReview } = review;

  // Refresh the deck's lists when a session that graded something is left.
  // Guarded, or StrictMode's mount-unmount-mount would refetch the due list
  // and remount the session in a loop.
  const didGradeRef = useRef(false);
  useEffect(() => {
    return () => {
      if (!didGradeRef.current) return;
      queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
    };
  }, [queryClient, deckId]);

  // Say the word as each card turns up.
  useEffect(() => {
    if (card) speakAuto(card.front);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key]);

  const flip = useCallback(() => {
    if (flipped || !card) return;
    playReveal();
    setFlipped(true);
  }, [flipped, card]);

  const grade = useCallback(
    (quality: Grade) => {
      if (!step || !card || !flipped) return;
      if (quality === 1) {
        playIncorrect();
        runRef.current = 0;
        // Back to the end of the pile until it's answered right.
        setPlan((p) => [...p, { key: `${card.id}:${step.attempt + 1}`, cardId: card.id, attempt: step.attempt + 1 }]);
      } else {
        runRef.current += 1;
        playCorrect(runRef.current);
      }
      // The first answer is the card's grade; repeats are practice.
      if (!gradedRef.current.has(card.id)) {
        gradedRef.current.add(card.id);
        didGradeRef.current = true;
        sendReview({ cardId: card.id, quality });
        setOutcomes((o) => ({ ...o, [card.id]: quality }));
        if (!recordedDayRef.current) {
          recordedDayRef.current = true;
          recordStudyDay.mutate();
        }
      }
      setFlipped(false);
      setExamplesOpen(false);
      setIndex((i) => i + 1);
    },
    [step, card, flipped, sendReview, recordStudyDay],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || finished) return;
      if (!flipped && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        flip();
        return;
      }
      const hit = GRADES.find((g) => g.key === event.key);
      if (flipped && hit) {
        event.preventDefault();
        grade(hit.grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, flipped, flip, grade]);

  if (finished) {
    const known = queue.filter((c) => outcomes[c.id] === 5).length;
    const hard = queue.filter((c) => outcomes[c.id] === 3).length;
    const missed = queue.filter((c) => outcomes[c.id] === 1).length;
    return <FlipSummary queue={queue} known={known} hard={hard} missed={missed} onDone={() => navigate("/decks")} />;
  }

  if (!card) return null;
  const { pos, emoji, text: meaning } = parseBack(card.back);
  // The back is the word and what it means — nothing more. A word with
  // several senses lists their meanings; the sentences live on its page.
  const senseMeanings = (card.senses ?? []).map((sense) => ({ pos: sense.pos ?? null, meaning: sense.meaning }));
  // Only label senses by type when the types actually differ (approach: verb / noun).
  const mixedTypes = new Set(senseMeanings.map((s) => s.pos ?? "")).size > 1;
  const hasDetails = Boolean(card.senses?.length || card.example_sentence || card.related?.length || card.watch_out);
  const progress = Math.round((index / plan.length) * 100);

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          to="/decks"
          aria-label="Kartlardan çık"
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 text-2xl leading-none text-stone-400 transition hover:bg-stone-900/5 hover:text-stone-700"
        >
          ×
        </Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-extrabold text-stone-400">
          {Math.min(index + 1, plan.length)}/{plan.length}
        </span>
      </div>

      <p className="mt-4 text-center text-[11px] font-extrabold uppercase tracking-widest text-violet-500">
        {title} · {step.attempt > 0 ? "bir daha" : "kart"}
      </p>

      <TontonLine mood={flipped ? "idle" : "think"} className="mt-3" tone="amber">
        {flipped ? "Peki, nasıl geçti? Dürüst ol — ona göre hatırlatırım." : "Aklından geçir: ne demek, nasıl kullanılır? Sonra çevir."}
      </TontonLine>

      {/* The card. Front until it's flipped; the back slides in on the same spot. */}
      <div key={step.key} className="mt-4 [perspective:1200px]">
        {!flipped ? (
          // A div, not a button: the speaker inside is a button of its own.
          // The bottom bar carries the real "Çevir" control for keyboards.
          <div
            role="button"
            tabIndex={0}
            aria-label="Kartı çevir"
            onClick={flip}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                flip();
              }
            }}
            className="group relative flex min-h-[19rem] w-full cursor-pointer select-none flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-white via-violet-50 to-violet-100 p-6 text-center ring-2 ring-violet-200 shadow-[0_6px_0_0_var(--color-violet-200)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 animate-[flip-in_360ms_ease-out]"
          >
            {card.image_url ? (
              <img src={card.image_url} alt="" className="mb-4 h-28 w-28 rounded-2xl object-cover ring-2 ring-white shadow-md" />
            ) : emoji ? (
              <span aria-hidden="true" className="mb-3 text-6xl leading-none">
                {emoji}
              </span>
            ) : null}
            <p className="text-4xl font-extrabold leading-tight tracking-tight text-stone-800 break-words sm:text-5xl">{card.front}</p>
            <div className="mt-3 flex items-center gap-2">
              {pos && (
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-600 ring-1 ring-violet-200">
                  {posLabel(pos)}
                </span>
              )}
              <span onClick={(event) => event.stopPropagation()}>
                <SpeakButton text={card.front} size="md" />
              </span>
            </div>
            <span className="mt-5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-violet-500 ring-1 ring-violet-100 animate-[bob_1.6s_ease-in-out_infinite]">
              Çevirmek için dokun
            </span>
          </div>
        ) : (
          <div className="relative flex min-h-[19rem] flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-violet-600 to-fuchsia-600 p-6 text-center text-white ring-2 ring-violet-300 shadow-[0_6px_0_0_var(--color-violet-800)] animate-[flip-in_360ms_ease-out]">
            <div className="flex items-center gap-2">
              {card.image_url ? (
                <img src={card.image_url} alt="" className="h-9 w-9 rounded-lg object-cover ring-2 ring-white/60" />
              ) : emoji ? (
                <span aria-hidden="true" className="text-2xl leading-none">
                  {emoji}
                </span>
              ) : null}
              <p className="text-xl font-extrabold text-white/85">{card.front}</p>
              {pos && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {posLabel(pos)}
                </span>
              )}
            </div>
            {senseMeanings.length > 1 ? (
              <ol className="mt-4 space-y-2 text-left">
                {senseMeanings.map((sense, i) => (
                  <li key={i} className="flex items-baseline gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-extrabold">
                      {i + 1}
                    </span>
                    <span className="text-[19px] font-extrabold leading-snug">{sense.meaning}</span>
                    {sense.pos && mixedTypes && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-white/60">{posLabel(sense.pos)}</span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-3xl font-extrabold leading-snug break-words">{meaning}</p>
            )}
            {hasDetails && (
              <button
                type="button"
                onClick={() => setExamplesOpen(true)}
                className="mt-5 rounded-full bg-white/15 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-white/40 transition hover:bg-white/25"
              >
                📖 Örnek cümleler
              </button>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={examplesOpen} onClose={() => setExamplesOpen(false)} title={card.front} emoji="📖">
        <WordCardBack card={card} />
      </Modal>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200/70 bg-[#FDF9F3]/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {!flipped ? (
            <Button size="lg" fullWidth onClick={flip}>
              Çevir 🔄
            </Button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => grade(g.grade)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-2 text-sm font-extrabold transition-transform duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${g.className}`}
                >
                  <span aria-hidden="true" className="text-xl leading-none">{g.emoji}</span>
                  <span className="mt-1">{g.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="h-28" aria-hidden="true" />
    </>
  );
}

function FlipSummary({ queue, known, hard, missed, onDone }: { queue: Card[]; known: number; hard: number; missed: number; onDone: () => void }) {
  useEffect(() => {
    playLessonComplete();
  }, []);
  const verdict =
    missed === 0 && hard === 0
      ? "Hepsini bildin. Bunlar artık daha seyrek gelecek. 🥳"
      : missed === 0
        ? "Bildin ama zorlandıkların var; onları biraz daha sık getireceğim. 💪"
        : `${missed} kelime kaçtı — on dakika sonra tekrar hazır olacak, yarın da geri gelecek. 🌱`;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-emerald-50 p-8 text-center ring-2 ring-emerald-100 shadow-[0_5px_0_0_var(--color-emerald-100)] animate-[pop-in_220ms_ease-out] sm:p-12">
      <Mascot mood={missed === 0 ? "happy" : "idle"} size={132} className="mx-auto" />
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-800">Kartlar bitti! 🃏</h2>
      <p className="mx-auto mt-2 max-w-sm text-stone-600">{verdict}</p>
      <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2">
        {[
          ["✅", known, "bildin", "bg-emerald-100 text-emerald-800"],
          ["🤔", hard, "zorlandın", "bg-amber-100 text-amber-800"],
          ["😵", missed, "kaçtı", "bg-rose-100 text-rose-800"],
        ].map(([icon, n, label, cls]) => (
          <div key={String(label)} className={`rounded-2xl p-3 ${cls}`}>
            <p className="text-2xl font-extrabold tabular-nums">{n as number}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide">{icon} {label as string}</p>
          </div>
        ))}
      </div>
      <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left">
        {queue.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200">
            <span className="font-extrabold text-stone-800">{c.front}</span>
            <span className="min-w-0 truncate text-sm text-stone-500">{parseBack(c.back).text}</span>
          </li>
        ))}
      </ul>
      <Button size="lg" className="mt-8" onClick={onDone}>
        Bitti
      </Button>
    </div>
  );
}

function Flashcards() {
  const { deckId = "" } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const all = searchParams.get("mode") === "all";

  const cardsQuery = useQuery({
    queryKey: ["cards", deckId],
    queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deckId}/cards`).then((r) => r.cards),
    enabled: deckId !== "",
  });
  const dueQuery = useQuery({
    queryKey: ["dueCards", deckId],
    queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deckId}/cards/due`).then((r) => r.cards),
    enabled: deckId !== "" && !all,
    staleTime: Infinity,
    refetchOnMount: "always",
    refetchOnReconnect: false,
  });

  if (!deckId) return <Navigate to="/decks" replace />;

  const loading = cardsQuery.isLoading || (!all && (!dueQuery.data || dueQuery.isFetching));
  const cards = all ? (cardsQuery.data ?? []) : (dueQuery.data ?? []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-40 pt-8">
        {(cardsQuery.isError || dueQuery.isError) && (
          <ErrorState
            title="Kartlar yüklenemedi"
            message="Bağlantını kontrol edip tekrar dene."
            onRetry={() => {
              void cardsQuery.refetch();
              void dueQuery.refetch();
            }}
          />
        )}
        {!cardsQuery.isError && loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        )}
        {!loading && !cardsQuery.isError && cards.length === 0 && (
          <EmptyState
            emoji={all ? "🃏" : "🎉"}
            title={all ? "Henüz kartın yok" : "Bugünlük tamam"}
            description={all ? "Bir kelime ekle, kartın hazır olsun." : "Şu an tekrar bekleyen kart yok. Hepsini yeniden görmek istersen aşağıdan."}
            action={
              all ? (
                <LinkButton to="/decks">Ana sayfa</LinkButton>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <LinkButton to={`/decks/${deckId}/flashcards?mode=all`}>Hepsini gözden geçir</LinkButton>
                  <LinkButton to="/decks" variant="ghost">
                    Ana sayfa
                  </LinkButton>
                </div>
              )
            }
          />
        )}
        {!loading && !cardsQuery.isError && cards.length > 0 && (
          <FlipSession key={`${deckId}-${all ? "all" : "due"}`} deckId={deckId} cards={cards} title={all ? "Hepsi" : "Bugünün kartları"} />
        )}
      </main>
    </div>
  );
}

export default Flashcards;
