import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SpeakButton from "../components/SpeakButton";
import MeaningText from "../components/MeaningText";
import Skeleton from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import { CheckIcon, XIcon } from "../components/icons";
import { api, ApiError } from "../lib/api";
import { usePersonalCards, usePersonalDeck, usePractice } from "../lib/personal";
import { usePlan, type DailyPlan } from "../lib/plan";
import { useRecordStudyDay } from "../lib/streak";
import { hasStarted, isDue } from "../lib/path";
import { byNextReview } from "../lib/memory";
import { coreGloss } from "../lib/senses";
import { tintStyle } from "../lib/tint";
import { speakAuto } from "../lib/speech";
import { playCorrect, playIncorrect, playLessonComplete } from "../lib/sound";
import {
  FIRST_GAP,
  FREE_LIMIT,
  MAX_EXTRAS,
  REVIEW_LIMIT,
  answerExtra,
  answerFree,
  answerNew,
  answerReview,
  buildRound,
  freshState,
  placeAfter,
  posText,
  shuffled,
  whenText,
  type Answer,
  type NewState,
  type Outcome,
  type Step,
} from "../lib/round";
import type { Card } from "../types";

/** The word as big as the card allows. */
const wordSize = (word: string) => (word.length <= 7 ? "text-[60px]" : word.length <= 10 ? "text-[50px]" : word.length <= 13 ? "text-[42px]" : "text-[34px]");

/** What the last answer did, shown under the next card. */
type Last = { word: string; answer: Answer; note: string };
/** Where each word ended the round, for the summary. */
type Result = { first: Answer; nextDays: number | null };

/** The way out and how much is left. */
function TopBar({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex items-center gap-3.5">
      <Link to="/kartlar" aria-label="Çık" className="-m-2 grid h-11 w-11 shrink-0 place-items-center rounded-full p-2 text-hare transition-colors hover:text-graphite">
        <XIcon className="h-6 w-6" />
      </Link>
      <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-rule" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="h-full rounded-full bg-grass transition-[width] duration-500 ease-soft" style={{ width: `${Math.max(4, Math.round((done / Math.max(1, total)) * 100))}%` }} />
      </div>
      <span className="shrink-0 text-[13px] font-black tabular-nums text-graphite">{total - done} kaldı</span>
    </div>
  );
}

/** The word, its part of speech and a speaker: the top of every card's back. */
function WordLine({ card }: { card: Card }) {
  const pos = posText(card);
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="wrap-break-word text-[26px] font-black leading-tight text-(--tint-ink)">{card.front}</p>
        {pos && <p className="mt-0.5 text-[14px] font-bold text-graphite">{pos}</p>}
      </div>
      <SpeakButton text={card.front} size="md" />
    </div>
  );
}

/** The meaning, big, in the middle of the card. */
function Meaning({ card }: { card: Card }) {
  return (
    <div className="flex flex-1 items-center justify-center text-center">
      <p className="wrap-break-word text-[34px] font-black leading-[1.15] tracking-[-0.015em] text-ink animate-rise-in">
        <MeaningText text={coreGloss(card)} />
      </p>
    </div>
  );
}

/** A new word, shown before it is asked: the word, what it is, what it means. */
function MeetCard({ card }: { card: Card }) {
  return (
    <div style={tintStyle(card)} className="card-3d flex h-full flex-col rounded-[28px] p-5 animate-[card-rise_420ms_var(--ease-spring)]">
      <p className="mb-3 w-max rounded-full bg-(--tint-soft) px-3 py-1 text-[12px] font-black text-(--tint-ink)">Yeni kelime</p>
      <WordLine card={card} />
      <Meaning card={card} />
      <p className="text-center text-[13px] font-bold text-graphite">Birazdan sana soracağım.</p>
    </div>
  );
}

/** A word asked: its front in its own colour, its back on white; a tap turns it. */
function AskCard({ card, flipped, onFlip }: { card: Card; flipped: boolean; onFlip: () => void }) {
  const pos = posText(card);
  return (
    <div style={tintStyle(card)} className="h-full [perspective:1400px] animate-[card-rise_420ms_var(--ease-spring)]">
      <div className={`relative h-full w-full transition-transform duration-[520ms] ease-soft [transform-style:preserve-3d] motion-reduce:transform-none ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
        <div
          role="button"
          tabIndex={flipped ? -1 : 0}
          aria-label={`${card.front}: kartı çevir`}
          onClick={onFlip}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onFlip();
            }
          }}
          className={`card-face absolute inset-0 flex cursor-pointer select-none flex-col rounded-[28px] cover-ground p-5 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/40 ${flipped ? "motion-reduce:opacity-0" : ""}`}
        >
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className={`max-w-full wrap-break-word font-black leading-[0.95] tracking-[-0.025em] [text-shadow:0_3px_0_rgba(0,0,0,0.14)] ${wordSize(card.front)}`}>{card.front}</p>
            {pos && <p className="mt-3 text-[16px] font-bold text-white/85">{pos}</p>}
            <SpeakButton text={card.front} size="md" className="mt-5 !bg-white !text-(--tint-ink) !shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.12)]" />
          </div>
          <p className="text-center text-[12px] font-black tracking-[0.06em] text-white/80">Ne demek? Dokun, çevir</p>
        </div>
        <div aria-hidden={!flipped} className={`card-face card-3d absolute inset-0 flex flex-col rounded-[28px] p-5 [transform:rotateY(180deg)] ${flipped ? "" : "motion-reduce:opacity-0"}`}>
          <WordLine card={card} />
          {flipped && <Meaning card={card} />}
        </div>
      </div>
    </div>
  );
}

/** The line under a card: what the last answer did and when that word comes back. */
function LastNote({ last, hint }: { last: Last | null; hint: boolean }) {
  if (!last) return hint ? <p className="py-2 text-center text-[14px] font-bold text-hare">Bildiysen Biliyorum, bilemediysen Bilmiyorum.</p> : null;
  const knew = last.answer === "knew";
  return (
    <p
      key={`${last.word}-${last.note}`}
      aria-live="polite"
      className={`flex items-start gap-2 rounded-2xl px-3 py-2 text-[14px] font-bold leading-snug animate-rise-in ${knew ? "bg-grass-soft text-grass-ink" : "bg-berry-soft text-berry-ink"}`}
    >
      <span aria-hidden="true" className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${knew ? "bg-grass" : "bg-berry"}`}>
        {knew ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
      </span>
      <span className="min-w-0">
        <span className="font-black">{last.word}</span>: {last.note}
      </span>
    </p>
  );
}

const BUTTON = "face flex min-h-[58px] items-center justify-center rounded-2xl text-[16px] font-black uppercase tracking-[0.06em] text-white shadow-button press-3d focus-visible:outline-none focus-visible:ring-4";

/** The end: how it went, and when each word comes back. */
function Summary({ cards, results, free }: { cards: Map<number, Card>; results: Map<number, Result>; free: boolean }) {
  useEffect(() => {
    playLessonComplete();
  }, []);
  const rows = [...results.entries()]
    .map(([id, result]) => ({ card: cards.get(id)!, ...result }))
    .filter((row) => row.card)
    .sort((a, b) => (a.nextDays ?? 0) - (b.nextDays ?? 0) || a.card.front.localeCompare(b.card.front));
  const knew = rows.filter((row) => row.first === "knew").length;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-10">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-grass text-white shadow-[inset_0_-5px_0_0_rgba(0,0,0,0.15)] animate-rise-spring">
        <CheckIcon className="h-10 w-10" />
      </span>
      <h1 className="mt-5 text-center text-[32px] font-black leading-tight text-ink">Tur bitti!</h1>
      <p className="mt-1 text-center text-[16px] font-bold text-graphite">
        {rows.length} kelimenin {knew} tanesini ilk seferde bildin.
        {free && " Serbest tekrar takvimi değiştirmez."}
      </p>

      {!free && rows.length > 0 && (
        <section aria-labelledby="when-heading" className="mt-8">
          <h2 id="when-heading" className="text-[13px] font-black uppercase tracking-[0.1em] text-graphite">
            Ne zaman tekrar gelecekler?
          </h2>
          <ul className="mt-2 divide-y-2 divide-paper-deep rounded-2xl border-2 border-rule">
            {rows.map((row) => (
              <li key={row.card.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.first === "knew" ? "bg-grass" : "bg-berry"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-black text-ink">{row.card.front}</span>
                  <span className="block truncate text-[13px] font-semibold text-graphite">{coreGloss(row.card)}</span>
                </span>
                <span className="shrink-0 rounded-full bg-paper-deep px-2.5 py-1 text-[13px] font-black text-ink">{row.nextDays === null ? "Sırada" : whenText(row.nextDays)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link to="/kartlar" className={`${BUTTON} mt-auto w-full bg-grass focus-visible:ring-grass/40`} style={{ marginTop: "2rem" }}>
        Tamam
      </Link>
    </main>
  );
}

/**
 * One round, from the cards it was given at the start (a refetch behind it
 * would reshuffle the pile under the learner's thumb).
 */
function Round({ deckId, cards, plan, free }: { deckId: number; cards: Card[]; plan: DailyPlan; free: boolean }) {
  const queryClient = useQueryClient();
  const { mutate: recordStudyDay } = useRecordStudyDay();
  const { mutate: logPractice } = usePractice(deckId);

  const [byId] = useState(() => new Map(cards.map((card) => [card.id, card])));
  const [steps, setSteps] = useState<Step[]>(() => {
    const met = cards.filter(hasStarted);
    if (free) return shuffled(met).slice(0, FREE_LIMIT).map((card) => ({ cardId: card.id, kind: "ask" }));
    const fresh = plan.newIds.map((id) => byId.get(id)).filter((card): card is Card => card !== undefined && !hasStarted(card));
    const due = shuffled(byNextReview(met.filter(isDue)).slice(0, REVIEW_LIMIT));
    return buildRound(fresh, due);
  });
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [last, setLast] = useState<Last | null>(null);
  const [results, setResults] = useState<Map<number, Result>>(() => new Map());

  const newState = useRef(new Map<number, NewState>());
  const graded = useRef(new Set<number>());
  const extras = useRef(new Map<number, number>());
  const shownAt = useRef(0);
  const thinkMs = useRef<number | null>(null);
  const studied = useRef(false);

  const review = useMutation({
    mutationFn: ({ cardId, ...body }: { cardId: number; quality: number; kind: string; phase: "learn" | "review"; direction: "fwd"; thinkMs?: number }) =>
      api.post<{ card: Card }>(`/decks/${deckId}/cards/${cardId}/review`, body),
    // The day's new words already used up (409) isn't a hiccup: asking again gets the same answer.
    retry: (count, error) => !(error instanceof ApiError && error.status === 409) && count < 2,
    onError: (error, { cardId }) => {
      // Turned away: nothing was written, the word stays in the queue.
      if (error instanceof ApiError && error.status === 409) setResults((r) => new Map(r).set(cardId, { first: r.get(cardId)?.first ?? "knew", nextDays: null }));
    },
  });

  // Leaving the round, the home page and the list read the new schedule.
  useEffect(
    () => () => {
      void queryClient.invalidateQueries({ queryKey: ["plan", String(deckId)] });
      void queryClient.invalidateQueries({ queryKey: ["cards", String(deckId)] });
    },
    [queryClient, deckId],
  );

  const step = steps[index] as Step | undefined;
  const card = step ? byId.get(step.cardId) : undefined;

  // Each card starts face down; a new word is said aloud as it is shown.
  useEffect(() => {
    if (!step || !card) return;
    shownAt.current = performance.now();
    thinkMs.current = null;
    if (step.kind === "meet") speakAuto(card.front);
  }, [step, card]);

  const flip = () => {
    if (flipped || !card) return;
    thinkMs.current = Math.round(performance.now() - shownAt.current);
    setFlipped(true);
    speakAuto(card.front);
  };

  const next = (put: Step | null, gap: number | null) => {
    setSteps((s) => (put && gap !== null ? placeAfter(s, index, put, gap) : s));
    setIndex((i) => i + 1);
    setFlipped(false);
  };

  const meetDone = () => {
    if (!step) return;
    newState.current.set(step.cardId, freshState());
    next({ cardId: step.cardId, kind: "ask" }, FIRST_GAP);
  };

  const answer = (a: Answer) => {
    if (!step || !card || !flipped) return;
    const id = card.id;
    let outcome: Outcome;
    const learning = newState.current.get(id);
    if (free) {
      const firstMiss = !extras.current.has(id);
      if (a === "missed") extras.current.set(id, 1);
      outcome = answerFree(a, firstMiss);
    } else if (learning) {
      const result = answerNew(learning, a);
      newState.current.set(id, result.state);
      outcome = result.outcome;
    } else if (!graded.current.has(id)) {
      graded.current.add(id);
      outcome = answerReview(card, a);
    } else {
      const used = extras.current.get(id) ?? 0;
      extras.current.set(id, used + 1);
      outcome = answerExtra(a, MAX_EXTRAS - used - 1);
    }

    const think = thinkMs.current ?? undefined;
    if (outcome.write.to === "review") review.mutate({ cardId: id, quality: outcome.write.quality, kind: "flip", phase: outcome.write.phase, direction: "fwd", thinkMs: think });
    else logPractice({ cardId: id, quality: outcome.write.quality, kind: "flip", phase: outcome.write.phase, direction: "fwd", thinkMs: think });
    if (!studied.current) {
      studied.current = true;
      recordStudyDay();
    }

    setResults((r) => {
      const prev = r.get(id);
      return new Map(r).set(id, { first: prev?.first ?? a, nextDays: outcome.nextDays ?? prev?.nextDays ?? null });
    });
    if (a === "knew") playCorrect();
    else playIncorrect();
    setLast({ word: card.front, answer: a, note: outcome.note });
    next(outcome.again !== null ? { cardId: id, kind: "ask" } : null, outcome.again);
  };

  // A keyboard, where there is one: space turns, ← Bilmiyorum, → Biliyorum.
  // Subscribed anew each render, so it always answers the card on screen.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("button, a, input")) return;
      const kind = step?.kind;
      if (kind === "meet" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        meetDone();
      } else if (kind === "ask" && !flipped && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        flip();
      } else if (kind === "ask" && flipped && (event.key === "ArrowLeft" || event.key === "1")) answer("missed");
      else if (kind === "ask" && flipped && (event.key === "ArrowRight" || event.key === "2")) answer("knew");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (steps.length === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <h1 className="text-[28px] font-black text-ink">Şu an sorulacak kart yok</h1>
        <p className="mt-2 text-[16px] font-bold text-graphite">Bugünün kartları bitti. İstersen bildiğin kelimeleri serbestçe tekrar et.</p>
        <Link to="/kartlar" className={`${BUTTON} mt-8 w-full bg-ocean focus-visible:ring-ocean/40`}>
          Ana sayfa
        </Link>
      </main>
    );
  }

  if (!step || !card) return <Summary cards={byId} results={results} free={free} />;

  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <TopBar done={index} total={steps.length} />
      {free && <p className="mt-3 text-center text-[12px] font-black uppercase tracking-[0.1em] text-ocean-ink">Serbest tekrar · takvim değişmez</p>}

      <div className="mt-5 min-h-0 flex-1">
        {step.kind === "meet" ? <MeetCard key={`m${index}`} card={card} /> : <AskCard key={`a${index}`} card={card} flipped={flipped} onFlip={flip} />}
      </div>

      <div className="mt-3 min-h-[40px]">
        <LastNote last={last} hint={step.kind === "ask"} />
      </div>

      <div className="mt-3">
        {step.kind === "meet" ? (
          <button type="button" onClick={meetDone} className={`${BUTTON} w-full bg-ocean focus-visible:ring-ocean/40`}>
            Tamam
          </button>
        ) : flipped ? (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => answer("missed")} className={`${BUTTON} bg-berry focus-visible:ring-berry/40`}>
              Bilmiyorum
            </button>
            <button type="button" onClick={() => answer("knew")} className={`${BUTTON} bg-grass focus-visible:ring-grass/40`}>
              Biliyorum
            </button>
          </div>
        ) : (
          <button type="button" onClick={flip} className={`${BUTTON} w-full bg-ocean focus-visible:ring-ocean/40`}>
            Çevir
          </button>
        )}
      </div>
    </main>
  );
}

/**
 * Tur: the day's cards (or, with ?serbest=1, the words already met, for
 * practice that changes nothing). The page waits for the deck, its cards
 * and the day's plan, then hands them to one round.
 */
function Tur() {
  const [params] = useSearchParams();
  const free = params.get("serbest") === "1";
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const planQuery = usePlan(deckQuery.data);
  const [startedAt] = useState(() => Date.now());

  if (deckQuery.isError || cardsQuery.isError || planQuery.isError) {
    return (
      <main className="mx-auto max-w-md px-5 pt-16">
        <ErrorState title="Kartlar yüklenemedi" message="Bağlantını kontrol edip tekrar dene." onRetry={() => void cardsQuery.refetch()} />
      </main>
    );
  }
  if (!deckQuery.data || !cardsQuery.data || !planQuery.data) {
    return (
      <main className="mx-auto flex h-dvh max-w-md flex-col px-5 pb-5 pt-4">
        <Skeleton className="h-3.5 w-full rounded-full" />
        <Skeleton className="mt-5 w-full flex-1 rounded-[28px]" />
        <Skeleton className="mt-4 h-[58px] w-full rounded-2xl" />
      </main>
    );
  }
  return <Round key={`${startedAt}-${free}`} deckId={deckQuery.data.id} cards={cardsQuery.data} plan={planQuery.data} free={free} />;
}

export default Tur;
