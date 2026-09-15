import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { primeSpeech, speakAuto } from "../lib/speech";
import {
  playCorrect,
  playIncorrect,
  playLessonComplete,
  playReveal,
} from "../lib/sound";
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
import Confetti from "../components/Confetti";
import WordCardBack from "../components/WordCardBack";
import Photo from "../components/Photo";

/**
 * Real flashcards for the learner's own words.
 *
 * A pile of cards. The top one shows its picture and the word; think,
 * flip it (a real turn, in 3D), and the back is the meaning — nothing
 * else. Then say how it went: swipe right for "Bildim", left for
 * "Bilemedim", up for "Zorlandım" — or tap the buttons. The card flies
 * off, the next one rises from the pile. A miss comes back before the
 * session ends and again ten minutes later; a hard pass shortens the
 * next gap; an easy one stretches it. One grade per card per session;
 * the repeats are practice.
 */

type Grade = 1 | 3 | 5;
type Step = { key: string; cardId: number; attempt: number };
type Outcome = { grade: Grade; interval: number | null };

const GRADES: {
  grade: Grade;
  label: string;
  emoji: string;
  className: string;
  key: string;
  arrow: string;
}[] = [
  {
    grade: 1,
    label: "Bilemedim",
    emoji: "😵",
    className:
      "bg-rose-500 text-white shadow-[0_4px_0_0_var(--color-rose-700)] active:translate-y-[3px] active:shadow-none",
    key: "1",
    arrow: "ArrowLeft",
  },
  {
    grade: 3,
    label: "Zorlandım",
    emoji: "🤔",
    className:
      "bg-amber-400 text-amber-950 shadow-[0_4px_0_0_var(--color-amber-600)] active:translate-y-[3px] active:shadow-none",
    key: "2",
    arrow: "ArrowUp",
  },
  {
    grade: 5,
    label: "Bildim",
    emoji: "✅",
    className:
      "bg-emerald-500 text-white shadow-[0_4px_0_0_var(--color-emerald-700)] active:translate-y-[3px] active:shadow-none",
    key: "3",
    arrow: "ArrowRight",
  },
];

/** How far a swipe has to go before it counts. */
const SWIPE_PX = 96;

/** When the card comes back, from the grade and (if the server answered) its new interval. */
function nextLabel({ grade, interval }: Outcome): string {
  if (grade === 1) return "10 dk sonra, yarın yine";
  if (interval === null) return grade === 3 ? "yakında yine" : "daha seyrek";
  if (interval <= 1) return "yarın";
  if (interval < 30) return `${interval} gün sonra`;
  const months = Math.round(interval / 30);
  return months <= 1 ? "1 ay sonra" : `${months} ay sonra`;
}

function FlipSession({
  deckId,
  cards,
  title,
}: {
  deckId: string;
  cards: Card[];
  title: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const recordStudyDay = useRecordStudyDay();

  // Snapshotted; append-only, like a lesson.
  const [queue] = useState(() => cards);
  const [plan, setPlan] = useState<Step[]>(() =>
    cards.map((card) => ({ key: `${card.id}:0`, cardId: card.id, attempt: 0 })),
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  // The top card while it's being dragged, and while it flies away.
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [leaving, setLeaving] = useState<Grade | null>(null);
  const dragStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const flyTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(flyTimer.current), []);
  const gradedRef = useRef(new Set<number>());
  const recordedDayRef = useRef(false);
  const runRef = useRef(0);
  const didGradeRef = useRef(false);
  const byId = new Map(queue.map((card) => [card.id, card]));

  const step = plan[index];
  const card = step ? byId.get(step.cardId) : undefined;
  const finished = index >= plan.length;
  const remaining = plan.length - index;

  const review = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: number; quality: Grade }) =>
      api.post<{ card: Partial<Card> }>(
        `/decks/${deckId}/cards/${cardId}/review`,
        { quality },
      ),
    retry: 2,
    onSuccess: (data, { cardId }) => {
      const interval =
        typeof data.card?.interval === "number" ? data.card.interval : null;
      setOutcomes((o) =>
        o[cardId] ? { ...o, [cardId]: { ...o[cardId], interval } } : o,
      );
    },
  });
  const { mutate: sendReview } = review;

  // Refresh the deck's lists when a session that graded something is left.
  useEffect(() => {
    return () => {
      if (!didGradeRef.current) return;
      queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
    };
  }, [queryClient, deckId]);

  // Say the word as each card comes to the top.
  useEffect(() => {
    if (card) speakAuto(card.front);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key]);

  const flip = useCallback(() => {
    primeSpeech();
    if (flipped || !card || leaving !== null) return;
    playReveal();
    setFlipped(true);
  }, [flipped, card, leaving]);

  const settle = useCallback(
    (quality: Grade) => {
      if (!step || !card) return;
      if (quality === 1) {
        // Back to the bottom of the pile until it's answered right.
        setPlan((p) => [
          ...p,
          {
            key: `${card.id}:${step.attempt + 1}`,
            cardId: card.id,
            attempt: step.attempt + 1,
          },
        ]);
      }
      // The first answer is the card's grade; repeats are practice.
      if (!gradedRef.current.has(card.id)) {
        gradedRef.current.add(card.id);
        didGradeRef.current = true;
        setOutcomes((o) => ({
          ...o,
          [card.id]: { grade: quality, interval: null },
        }));
        sendReview({ cardId: card.id, quality });
        if (!recordedDayRef.current) {
          recordedDayRef.current = true;
          recordStudyDay.mutate();
        }
      }
      setFlipped(false);
      setExamplesOpen(false);
      setDrag(null);
      setLeaving(null);
      setIndex((i) => i + 1);
    },
    [step, card, sendReview, recordStudyDay],
  );

  /** A grade: the sound, the card flies off, then the pile moves up. */
  const grade = useCallback(
    (quality: Grade) => {
      if (!step || !card || !flipped || leaving !== null) return;
      if (quality === 1) {
        playIncorrect();
        runRef.current = 0;
      } else {
        runRef.current += 1;
        playCorrect(runRef.current);
      }
      setLeaving(quality);
      // With reduced motion there is no fly-out to wait for.
      const reduced = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      flyTimer.current = window.setTimeout(
        () => settle(quality),
        reduced ? 0 : 320,
      );
    },
    [step, card, flipped, leaving, settle],
  );

  // Swipes. Only once the answer is showing: you have to look before you judge.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!flipped || leaving !== null) return;
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || dragStart.current.id !== event.pointerId) return;
    setDrag({
      dx: event.clientX - dragStart.current.x,
      dy: event.clientY - dragStart.current.y,
    });
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || dragStart.current.id !== event.pointerId) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    dragStart.current = null;
    if (dx > SWIPE_PX) grade(5);
    else if (dx < -SWIPE_PX) grade(1);
    else if (dy < -SWIPE_PX && Math.abs(dx) < SWIPE_PX) grade(3);
    else setDrag(null);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || finished || examplesOpen) return;
      // The focused card handles its own Enter/Space; don't flip twice.
      if (
        (event.target as HTMLElement | null)?.getAttribute?.("role") ===
        "button"
      )
        return;
      if (!flipped && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        flip();
        return;
      }
      const hit = GRADES.find(
        (g) => g.key === event.key || g.arrow === event.key,
      );
      if (flipped && hit) {
        event.preventDefault();
        grade(hit.grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, flipped, flip, grade, examplesOpen]);

  if (finished) {
    return (
      <FlipSummary
        queue={queue}
        outcomes={outcomes}
        onDone={() => navigate("/kartlar")}
      />
    );
  }
  if (!card) return null;

  const { pos, emoji, text: meaning } = parseBack(card.back);
  const senseMeanings = (card.senses ?? []).map((sense) => ({
    pos: sense.pos ?? null,
    meaning: sense.meaning,
  }));
  const mixedTypes = new Set(senseMeanings.map((s) => s.pos ?? "")).size > 1;
  const hasDetails = Boolean(
    card.senses?.length ||
    card.example_sentence ||
    card.related?.length ||
    card.watch_out,
  );

  // Where the top card is: dragged, flying away, or resting.
  const dx = drag?.dx ?? 0;
  const dy = drag?.dy ?? 0;
  const flyX = leaving === 5 ? 520 : leaving === 1 ? -520 : 0;
  const flyY = leaving === 3 ? -640 : leaving ? -40 : 0;
  const topStyle = leaving
    ? {
        transform: `translate(${flyX}px, ${flyY}px) rotate(${leaving === 5 ? 18 : leaving === 1 ? -18 : 0}deg)`,
        opacity: 0,
        transition: "transform 320ms ease-in, opacity 320ms ease-in",
      }
    : drag
      ? { transform: `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)` }
      : {
          transform: "translate(0, 0) rotate(0)",
          transition: "transform 260ms cubic-bezier(0.34,1.4,0.64,1)",
        };
  const swipeHint =
    drag && !leaving
      ? dx > 40
        ? 5
        : dx < -40
          ? 1
          : dy < -40
            ? 3
            : null
      : leaving;
  const hintOpacity = drag
    ? Math.min(1, Math.max(Math.abs(dx), Math.abs(dy)) / SWIPE_PX)
    : leaving
      ? 1
      : 0;

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          to="/kartlar"
          aria-label="Kartlardan çık"
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 text-2xl leading-none text-stone-400 transition hover:bg-stone-900/5 hover:text-stone-700"
        >
          ×
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-300"
            style={{ width: `${Math.round((index / plan.length) * 100)}%` }}
          />
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold tabular-nums text-stone-500 ring-1 ring-stone-200">
          {remaining} kaldı
        </span>
      </div>

      <TontonLine
        mood={flipped ? "idle" : "think"}
        size={36}
        className="mt-3"
        tone="amber"
      >
        {step.attempt > 0
          ? "Bu bir daha geldi. Bu sefer?"
          : flipped
            ? index === 0
              ? "Sağa kaydır: bildim · sola: bilemedim · yukarı: zorlandım."
              : "Dürüst ol; ona göre hatırlatırım."
            : index === 0
              ? `${title} · Aklından geçir, sonra çevir.`
              : "Ne demekti?"}
      </TontonLine>

      {/* The pile: two cards peeking out behind the top one. */}
      <div className="relative mt-4 h-[26rem] max-h-[52vh]">
        {remaining > 2 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-4 top-3 h-full rounded-3xl bg-white/70 ring-1 ring-stone-200"
          />
        )}
        {remaining > 1 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-2 top-1.5 h-full rounded-3xl bg-white/90 ring-1 ring-stone-200 shadow-sm"
          />
        )}

        <div
          key={step.key}
          // touch-action none: once the answer is showing, a drag is a
          // verdict, not a scroll.
          className={`absolute inset-0 ${flipped ? "touch-none" : ""}`}
          style={topStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragStart.current = null;
            setDrag(null);
          }}
        >
          {/* The swipe verdict, fading in with the drag. */}
          {swipeHint && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl ${
                swipeHint === 5
                  ? "bg-emerald-500/25"
                  : swipeHint === 1
                    ? "bg-rose-500/25"
                    : "bg-amber-400/25"
              }`}
              style={{ opacity: hintOpacity }}
            >
              <span
                className={`rounded-2xl px-5 py-2 text-2xl font-extrabold uppercase tracking-widest text-white shadow-lg ${
                  swipeHint === 5
                    ? "bg-emerald-500 -rotate-6"
                    : swipeHint === 1
                      ? "bg-rose-500 rotate-6"
                      : "bg-amber-500"
                }`}
              >
                {GRADES.find((g) => g.grade === swipeHint)?.label}
              </span>
            </div>
          )}

          {/* The card itself: two faces on a turning plate. The rise-in lives
              on its own wrapper so it never fights the drag or the flip. */}
          <div className="h-full w-full animate-[card-rise_360ms_cubic-bezier(0.34,1.3,0.64,1)] [perspective:1400px]">
            <div
              className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
            >
              {/* FRONT */}
              <div
                role="button"
                tabIndex={flipped ? -1 : 0}
                aria-label="Kartı çevir"
                onClick={flip}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    flip();
                  }
                }}
                className="card-face absolute inset-0 flex cursor-pointer select-none flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200 shadow-[0_10px_30px_-14px_rgba(28,25,23,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
              >
                {card.image_url ? (
                  <Photo src={card.image_url} frameClassName="h-[58%] w-full" />
                ) : (
                  <div className="flex h-[58%] w-full items-center justify-center bg-gradient-to-br from-violet-100 via-violet-50 to-fuchsia-100">
                    <span
                      aria-hidden="true"
                      className="text-8xl leading-none drop-shadow-sm"
                    >
                      {emoji ?? "🃏"}
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
                  <p className="text-4xl font-extrabold leading-tight tracking-tight text-stone-800 break-words">
                    {card.front}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {pos && (
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                        {posLabel(pos)}
                      </span>
                    )}
                    <span onClick={(event) => event.stopPropagation()}>
                      <SpeakButton text={card.front} size="md" />
                    </span>
                  </div>
                  <span className="mt-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400 animate-[bob_1.6s_ease-in-out_infinite]">
                    Çevirmek için dokun
                  </span>
                </div>
              </div>

              {/* BACK */}
              <div
                aria-hidden={!flipped}
                className="card-face absolute inset-0 flex select-none flex-col overflow-hidden rounded-3xl bg-[#FFF8EA] text-stone-800 ring-1 ring-amber-200 shadow-[0_10px_30px_-14px_rgba(28,25,23,0.45)] [-webkit-touch-callout:none] [transform:rotateY(180deg)]"
              >
                <div className="flex items-center gap-2.5 px-5 pt-5">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt=""
                      className="h-10 w-10 rounded-xl object-cover ring-1 ring-stone-200"
                      draggable={false}
                    />
                  ) : emoji ? (
                    <span aria-hidden="true" className="text-2xl leading-none">
                      {emoji}
                    </span>
                  ) : null}
                  <p className="min-w-0 truncate text-xl font-extrabold text-stone-800">
                    {card.front}
                  </p>
                  {pos && (
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500 ring-1 ring-stone-200">
                      {posLabel(pos)}
                    </span>
                  )}
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => setExamplesOpen(true)}
                      onPointerDown={(event) => event.stopPropagation()}
                      aria-label="Örnek cümleler"
                      className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg ring-1 ring-stone-200 transition hover:bg-stone-50"
                    >
                      📖
                    </button>
                  )}
                </div>
                {/* Scrolls when the meanings outgrow the card; centred otherwise
                    (m-auto rather than justify-center, so the top is never clipped). */}
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
                  {senseMeanings.length > 1 ? (
                    <ol className="m-auto w-full space-y-2.5">
                      {senseMeanings.map((sense, i) => (
                        <li key={i} className="flex items-baseline gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-extrabold text-amber-900">
                            {i + 1}
                          </span>
                          <span className="text-[19px] font-extrabold leading-snug text-stone-800">
                            {sense.meaning}
                          </span>
                          {sense.pos && mixedTypes && (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-stone-400">
                              {posLabel(sense.pos)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="m-auto text-center text-3xl font-extrabold leading-snug text-stone-800 break-words">
                      {meaning}
                    </p>
                  )}
                </div>
                <p className="px-5 pb-4 text-center text-[11px] font-bold uppercase tracking-widest text-stone-400">
                  Nasıl geçti?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={examplesOpen}
        onClose={() => setExamplesOpen(false)}
        title={card.front}
        emoji="📖"
      >
        <WordCardBack card={card} variant="flat" />
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
                  <span aria-hidden="true" className="text-xl leading-none">
                    {g.emoji}
                  </span>
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

function FlipSummary({
  queue,
  outcomes,
  onDone,
}: {
  queue: Card[];
  outcomes: Record<number, Outcome>;
  onDone: () => void;
}) {
  useEffect(() => {
    playLessonComplete();
  }, []);
  const known = queue.filter((c) => outcomes[c.id]?.grade === 5).length;
  const hard = queue.filter((c) => outcomes[c.id]?.grade === 3).length;
  const missed = queue.filter((c) => outcomes[c.id]?.grade === 1).length;
  const perfect = missed === 0 && hard === 0;
  const verdict = perfect
    ? "Hepsini bildin. Bunlar artık daha seyrek gelecek. 🥳"
    : missed === 0
      ? "Bildin ama zorlandıkların var; onları biraz daha sık getireceğim. 💪"
      : `${missed} kelime kaçtı — on dakika sonra tekrar hazır olacak, yarın da geri gelecek. 🌱`;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-8 text-center ring-1 ring-stone-200 shadow-[0_10px_30px_-18px_rgba(28,25,23,0.4)] animate-[pop-in_220ms_ease-out] sm:p-12">
      {perfect && <Confetti />}
      <Mascot
        mood={missed === 0 ? "happy" : "idle"}
        size={132}
        className="mx-auto"
      />
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-800">
        Kartlar bitti! 🃏
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-stone-600">{verdict}</p>
      <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2">
        {[
          ["✅", known, "bildin", "text-emerald-700"],
          ["🤔", hard, "zorlandın", "text-amber-700"],
          ["😵", missed, "kaçtı", "text-rose-700"],
        ].map(([icon, n, label, cls]) => (
          <div
            key={String(label)}
            className="rounded-2xl bg-white p-3 ring-1 ring-stone-200"
          >
            <p className={`text-2xl font-extrabold tabular-nums ${cls}`}>
              {n as number}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
              {icon} {label as string}
            </p>
          </div>
        ))}
      </div>

      {/* Every card, and when it comes back — the schedule made visible. */}
      <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left">
        {queue.map((c) => {
          const outcome = outcomes[c.id];
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200"
            >
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-lg"
                >
                  {parseBack(c.back).emoji ?? "🃏"}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-stone-800">
                  {c.front}
                </p>
                <p className="line-clamp-2 text-xs text-stone-500">
                  {parseBack(c.back).text}
                </p>
              </div>
              {outcome && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                    outcome.grade === 5
                      ? "bg-emerald-100 text-emerald-800"
                      : outcome.grade === 3
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {nextLabel(outcome)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <Button size="lg" fullWidth className="mt-8" onClick={onDone}>
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
    queryFn: () =>
      api.get<{ cards: Card[] }>(`/decks/${deckId}/cards`).then((r) => r.cards),
    enabled: deckId !== "",
  });
  const dueQuery = useQuery({
    queryKey: ["dueCards", deckId],
    queryFn: () =>
      api
        .get<{ cards: Card[] }>(`/decks/${deckId}/cards/due`)
        .then((r) => r.cards),
    enabled: deckId !== "" && !all,
    staleTime: Infinity,
    refetchOnMount: "always",
    refetchOnReconnect: false,
  });

  if (!deckId) return <Navigate to="/kartlar" replace />;

  const loading =
    cardsQuery.isLoading || (!all && (!dueQuery.data || dueQuery.isFetching));
  const cards = all ? (cardsQuery.data ?? []) : (dueQuery.data ?? []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-40 pt-6">
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
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-[26rem] w-full rounded-3xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        )}
        {!loading && !cardsQuery.isError && cards.length === 0 && (
          <EmptyState
            emoji={all ? "🃏" : "🎉"}
            title={all ? "Henüz kartın yok" : "Bugünlük tamam"}
            description={
              all
                ? "Bir kelime ekle, kartın hazır olsun."
                : "Şu an tekrar bekleyen kart yok. Hepsini yeniden görmek istersen aşağıdan."
            }
            action={
              all ? (
                <LinkButton to="/kartlar">Kartlarım</LinkButton>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <LinkButton
                    to={`/decks/${deckId}/flashcards?mode=all`}
                    onClick={primeSpeech}
                  >
                    Hepsini gözden geçir
                  </LinkButton>
                  <LinkButton to="/kartlar" variant="ghost">
                    Kartlarım
                  </LinkButton>
                </div>
              )
            }
          />
        )}
        {!loading && !cardsQuery.isError && cards.length > 0 && (
          <FlipSession
            key={`${deckId}-${all ? "all" : "due"}`}
            deckId={deckId}
            cards={cards}
            title={all ? "Hepsi" : "Bugünün kartları"}
          />
        )}
      </main>
    </div>
  );
}

export default Flashcards;
