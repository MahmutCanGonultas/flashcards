import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { primeSpeech, speakAuto } from "../lib/speech";
import { playCorrect, playIncorrect, playLessonComplete, playReveal } from "../lib/sound";
import { useRecordStudyDay } from "../lib/streak";
import { focalFor, tintStyle } from "../lib/tint";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import Mascot from "../components/Mascot";
import SpeakButton from "../components/SpeakButton";
import Sheet from "../components/Sheet";
import WordCardBack from "../components/WordCardBack";

/**
 * Real flashcards for the learner's own words, printed like a magazine.
 *
 * A pile of covers. The top one is the photo, full bleed on ink, fading
 * into the word's own colour, with the word as the cover line. Think,
 * flip it (a real turn), and the back is the opening page: the meanings,
 * nothing else. Then say how it went — swipe right for Bildim, left for
 * Bilemedim, up for Zorlandım, or tap. The card is thrown off; the next
 * issue rises from the pile. A miss comes back before the session ends
 * and again ten minutes later; a hard pass shortens the next gap; an easy
 * one stretches it. One grade per card per session; the repeats are practice.
 *
 * Tonton isn't here in person (he'd be over the grade bar); the screen
 * tells him what happened through `tonton:*` window events instead.
 */

type Grade = 1 | 3 | 5;
type Step = { key: string; cardId: number; attempt: number };
type Outcome = { grade: Grade; interval: number | null };

/** Each verdict's colour, once: vermilion missed it, moss knew it, gilt is the honest middle. */
const GRADES: { grade: Grade; label: string; button: string; stamp: string; wash: string; key: string; arrow: string }[] = [
  {
    grade: 1,
    label: "Bilemedim",
    button: "bg-accent text-paper-lift shadow-button",
    stamp: "border-accent text-accent",
    wash: "bg-accent/14",
    key: "1",
    arrow: "ArrowLeft",
  },
  {
    grade: 3,
    label: "Zorlandım",
    button: "bg-paper-lift text-gilt-ink ring-[1.5px] ring-inset ring-gilt/70 shadow-print",
    stamp: "border-gilt text-gilt-ink",
    wash: "bg-gilt/16",
    key: "2",
    arrow: "ArrowUp",
  },
  {
    grade: 5,
    label: "Bildim",
    button: "bg-moss text-paper-lift shadow-button",
    stamp: "border-moss text-moss",
    wash: "bg-moss/12",
    key: "3",
    arrow: "ArrowRight",
  },
];
const gradeOf = (grade: Grade) => GRADES.find((g) => g.grade === grade)!;

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

/** How far a swipe has to go before it counts. */
const SWIPE_PX = 96;
/** The throw lasts 380ms; the next card starts rising 60ms before it ends so the pile never sits empty. */
const THROW_MS = 380;
const SETTLE_MS = THROW_MS - 60;

/** When the card comes back, from the grade and (if the server answered) its new interval. */
function nextLabel({ grade, interval }: Outcome): string {
  if (grade === 1) return "10 dk sonra, yarın yine";
  if (interval === null) return grade === 3 ? "yakında yine" : "daha seyrek";
  if (interval <= 1) return "yarın";
  if (interval < 30) return `${interval} gün sonra`;
  const months = Math.round(interval / 30);
  return months <= 1 ? "1 ay sonra" : `${months} ay sonra`;
}

/** The schedule label's colour follows its meaning: now, tomorrow, later. */
function nextTone(outcome: Outcome): string {
  if (outcome.grade === 1) return "text-accent";
  if (outcome.interval !== null && outcome.interval <= 1) return "text-gilt-ink";
  return "text-moss";
}

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
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [leaving, setLeaving] = useState<Grade | null>(null);
  const dragStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const flyTimer = useRef(0);
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
      api.post<{ card: Partial<Card> }>(`/decks/${deckId}/cards/${cardId}/review`, { quality }),
    retry: 2,
    onSuccess: (data, { cardId }) => {
      const interval = typeof data.card?.interval === "number" ? data.card.interval : null;
      setOutcomes((o) => (o[cardId] ? { ...o, [cardId]: { ...o[cardId], interval } } : o));
    },
  });
  const { mutate: sendReview } = review;

  useEffect(() => () => window.clearTimeout(flyTimer.current), []);

  // Refresh the deck's lists when a session that graded something is left.
  useEffect(() => {
    return () => {
      if (!didGradeRef.current) return;
      queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
    };
  }, [queryClient, deckId]);

  // Say the word as each card comes to the top, and tell Tonton a new
  // cover is showing (he keeps quiet while it's face down).
  useEffect(() => {
    if (!card) return;
    speakAuto(card.front);
    window.dispatchEvent(new CustomEvent("tonton:card", { detail: { front: card.front, flipped: false } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key]);

  const flip = useCallback(() => {
    primeSpeech();
    if (flipped || !card || leaving !== null) return;
    playReveal();
    setFlipped(true);
    window.dispatchEvent(new CustomEvent("tonton:card", { detail: { front: card.front, flipped: true } }));
  }, [flipped, card, leaving]);

  const settle = useCallback(
    (quality: Grade) => {
      if (!step || !card) return;
      if (quality === 1) {
        setPlan((p) => [...p, { key: `${card.id}:${step.attempt + 1}`, cardId: card.id, attempt: step.attempt + 1 }]);
      }
      if (!gradedRef.current.has(card.id)) {
        gradedRef.current.add(card.id);
        didGradeRef.current = true;
        setOutcomes((o) => ({ ...o, [card.id]: { grade: quality, interval: null } }));
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
      window.dispatchEvent(
        new CustomEvent("tonton:grade", { detail: { quality, front: card.front, attempt: step.attempt, index, total: plan.length } }),
      );
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      flyTimer.current = window.setTimeout(() => settle(quality), reduced ? 0 : SETTLE_MS);
    },
    [step, card, flipped, leaving, settle, index, plan.length],
  );

  // Swipes, only once the answer is showing.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!flipped || leaving !== null) return;
    dragStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || dragStart.current.id !== event.pointerId) return;
    setDrag({ dx: event.clientX - dragStart.current.x, dy: event.clientY - dragStart.current.y });
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
      if ((event.target as HTMLElement | null)?.getAttribute?.("role") === "button") return;
      if (!flipped && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        flip();
        return;
      }
      const hit = GRADES.find((g) => g.key === event.key || g.arrow === event.key);
      if (flipped && hit) {
        event.preventDefault();
        grade(hit.grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, flipped, flip, grade, examplesOpen]);

  if (finished) {
    return <FlipSummary queue={queue} outcomes={outcomes} onDone={() => navigate("/kartlar")} />;
  }
  if (!card) return null;

  const { pos, emoji, text: meaning } = parseBack(card.back);
  const senseMeanings = (card.senses ?? []).map((sense) => ({ pos: sense.pos ?? null, meaning: sense.meaning }));
  const mixedTypes = new Set(senseMeanings.map((s) => s.pos ?? "")).size > 1;
  const hasDetails = Boolean(card.senses?.length || card.example_sentence || card.related?.length || card.watch_out);

  // Where the top card is: dragged, thrown away, or resting.
  const dx = drag?.dx ?? 0;
  const dy = drag?.dy ?? 0;
  const flyX = leaving === 5 ? 520 : leaving === 1 ? -520 : 0;
  const flyY = leaving === 3 ? -640 : leaving ? -40 : 0;
  const topStyle: CSSProperties = leaving
    ? {
        transform: `translate(${flyX}px, ${flyY}px) rotate(${leaving === 5 ? 22 : leaving === 1 ? -22 : 0}deg) scale(0.96)`,
        opacity: 0,
        transition: `transform ${THROW_MS}ms var(--ease-throw), opacity 300ms ease-in 60ms`,
      }
    : drag
      ? { transform: `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)` }
      : { transform: "translate(0, 0) rotate(0)", transition: "transform 260ms var(--ease-spring)" };
  const swipeHint = drag && !leaving ? (dx > 40 ? 5 : dx < -40 ? 1 : dy < -40 ? 3 : null) : leaving;
  const hintOpacity = drag ? Math.min(1, Math.max(Math.abs(dx), Math.abs(dy)) / SWIPE_PX) : leaving ? 1 : 0;
  const caption =
    step.attempt > 0 ? "Bu bir daha geldi. Bu sefer?" : flipped ? "Dürüst ol; ona göre hatırlatırım." : index === 0 ? "Aklından geçir, sonra çevir." : "Ne demekti?";
  // The senses land a beat after the flip does; the hook and the hints after them.
  const senseDelay = (i: number) => delay(220 + Math.min(i, 6) * 60);

  return (
    <>
      {/* The rule: where we are in the issue. */}
      <div className="flex items-center gap-4">
        <Link
          to="/kartlar"
          aria-label="Kartlardan çık"
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-2 text-2xl leading-none text-graphite transition-colors hover:text-ink"
        >
          ×
        </Link>
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-rule">
          <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-soft" style={{ width: `${Math.round((index / plan.length) * 100)}%` }} />
        </div>
        <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite tabular-nums">{remaining} kaldı</span>
      </div>

      {/* The pile, with Tonton peeking over its top edge. The sheets under
          the top card breathe as each new one rises off them. */}
      <div className="relative mt-11 h-[30rem] max-h-[calc(100dvh-23rem)]">
        {/* TODO(tonton): greet={false} quiet — once Mascot grows the props. */}
        <Mascot size={52} mood={flipped ? "idle" : "think"} className="absolute -top-7 right-6" />
        {remaining > 2 && <div key={`${step.key}-3`} aria-hidden="true" className="absolute inset-x-4 top-3 h-full rounded-[20px] bg-umber/45 animate-pile-nudge [animation-delay:60ms]" />}
        {remaining > 1 && <div key={`${step.key}-2`} aria-hidden="true" className="absolute inset-x-2 top-1.5 h-full rounded-[20px] bg-umber/75 animate-pile-nudge" />}

        <div
          key={step.key}
          className={`absolute inset-0 ${flipped ? "touch-none" : ""}`}
          style={{ ...tintStyle(card), ...topStyle }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragStart.current = null;
            setDrag(null);
          }}
        >
          {/* The verdict, stamped on the page as you drag. */}
          {swipeHint && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[20px] ${gradeOf(swipeHint).wash}`}
              style={{ opacity: hintOpacity }}
            >
              <span
                key={swipeHint}
                className={`rounded-md border-[3px] bg-paper-lift/70 px-4 py-1.5 text-[26px] font-black uppercase tracking-[0.18em] mix-blend-multiply animate-stamp ${gradeOf(swipeHint).stamp}`}
              >
                {gradeOf(swipeHint).label}
              </span>
            </div>
          )}

          <div className="relative h-full w-full animate-[card-rise_420ms_var(--ease-spring)] [perspective:1400px]">
            {/* The shadow swells at mid-turn: the card lifts off the table to flip. */}
            <div
              key={String(flipped)}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[-2%] top-[4%] bottom-[-3%] rounded-[22px] opacity-0 animate-flip-shadow"
              style={{ background: "radial-gradient(60% 40% at 50% 100%, rgba(78,58,40,.55), transparent 70%)" }}
            />
            <div
              className={`relative h-full w-full transition-transform duration-[560ms] ease-soft [transform-style:preserve-3d] motion-reduce:transform-none ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* FRONT — the cover. The photo bleeds full width, never cropped
                  tighter than 4:3: its height is natural, clamped between 62%
                  and 100% of the face. Under reduced motion the faces crossfade
                  instead of turning. */}
              <div
                role="button"
                tabIndex={flipped ? -1 : 0}
                aria-label={`${card.front} — kartı çevir`}
                onClick={flip}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    flip();
                  }
                }}
                className={`card-face absolute inset-0 cursor-pointer select-none overflow-hidden rounded-[20px] bg-ink text-paper-lift shadow-cover ring-1 ring-inset ring-paper-lift/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30 motion-reduce:transition-opacity ${
                  flipped ? "motion-reduce:opacity-0" : ""
                }`}
              >
                {card.image_url ? (
                  <div className="absolute inset-0 flex items-start justify-center overflow-hidden">
                    <img
                      src={card.image_url}
                      alt=""
                      draggable={false}
                      className="h-auto max-h-full min-h-[62%] w-full object-cover photo-print animate-[cover-settle_900ms_ease-out_both]"
                      style={{ objectPosition: focalFor(card) }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-x-0 top-0 flex h-[60%] items-center justify-center">
                    <span aria-hidden="true" className="text-[88px] leading-none">
                      {emoji ?? "🃏"}
                    </span>
                  </div>
                )}

                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/55 to-transparent" />
                <div className="absolute inset-x-0 top-0 flex items-baseline justify-between px-5 pt-4 text-[10px] font-extrabold uppercase tracking-[0.24em] text-paper-lift/80 tabular-nums">
                  <span className="min-w-0 pr-4">
                    <span className="block truncate">{title}</span>
                    {/* The masthead rule in the word's own ink, printed in from the left. */}
                    <span aria-hidden="true" className="mt-1 block h-[2px] w-7 tint-bar animate-bar-print [animation-delay:200ms]" />
                  </span>
                  <span className="shrink-0">
                    {index + 1} / {plan.length}
                  </span>
                </div>

                {/* The caption band: the photo fades into the word's colour, not into a black slab. */}
                <div className="absolute inset-x-0 bottom-0 cover-fade px-5 pb-5 pt-16">
                  {pos && <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-paper-lift/70">{posLabel(pos)}</p>}
                  <h2
                    className={`wrap-break-word font-black leading-[0.95] tracking-[-0.02em] text-paper-lift animate-[cover-line_420ms_var(--ease-soft)_120ms_both] ${
                      card.front.length > 11 ? "text-[34px]" : "text-[44px]"
                    }`}
                  >
                    {card.front}
                  </h2>
                  <div className="mt-3.5 flex items-center gap-3.5">
                    <span aria-hidden="true" className="h-px flex-1 bg-paper-lift/20" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-paper-lift/50">dokun · çevir</span>
                    <span onClick={(event) => event.stopPropagation()}>
                      <SpeakButton
                        text={card.front}
                        size="md"
                        className="!bg-paper-lift/10 !text-paper-lift ring-paper-lift/40 backdrop-blur-sm hover:!bg-paper-lift/20"
                      />
                    </span>
                  </div>
                </div>
              </div>

              {/* BACK — the opening page: lifted paper with a grain, the
                  word's colour as a rule under the header band. */}
              <div
                aria-hidden={!flipped}
                className={`card-face !absolute inset-0 flex select-none flex-col overflow-hidden rounded-[20px] bg-paper-lift text-ink ring-1 ring-rule shadow-print paper-grain [-webkit-touch-callout:none] [transform:rotateY(180deg)] motion-reduce:transform-none motion-reduce:transition-opacity ${
                  flipped ? "" : "motion-reduce:opacity-0"
                }`}
              >
                <div className="flex items-center gap-3 border-b border-rule bg-paper-deep/55 px-5 pb-3 pt-4">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt=""
                      draggable={false}
                      className="h-9 w-9 shrink-0 rounded-md bg-paper-deep object-cover tint-ring"
                      style={{ objectPosition: focalFor(card) }}
                    />
                  ) : emoji ? (
                    <span aria-hidden="true" className="text-2xl leading-none">
                      {emoji}
                    </span>
                  ) : null}
                  <p className="min-w-0 truncate text-[15px] font-extrabold text-ink">
                    {card.front}
                    {pos && <span className="ml-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-graphite">{posLabel(pos)}</span>}
                  </p>
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => setExamplesOpen(true)}
                      onPointerDown={(event) => event.stopPropagation()}
                      className="-my-2 ml-auto shrink-0 rounded-sm py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink underline decoration-ink decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                    >
                      Örnekler
                    </button>
                  )}
                </div>
                <span aria-hidden="true" className="block h-[3px] w-full shrink-0 tint-bar" />

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-3 pt-5">
                  {senseMeanings.length > 1 ? (
                    <ol className="space-y-3.5">
                      {senseMeanings.map((sense, i) => (
                        <li key={i} className={`grid grid-cols-[28px_1fr] items-baseline gap-x-3 ${flipped ? "animate-rise-in" : "opacity-0"}`} style={senseDelay(i)}>
                          <span className="text-[13px] font-black tabular-nums tint-text">{i + 1}</span>
                          <p className="text-[21px] font-extrabold leading-[1.2] text-ink">
                            {sense.meaning}
                            {sense.pos && mixedTypes && (
                              <span className="ml-2 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.14em] text-graphite">{posLabel(sense.pos)}</span>
                            )}
                          </p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className={flipped ? "animate-rise-in" : "opacity-0"} style={senseDelay(0)}>
                      <span aria-hidden="true" className="mb-3.5 block h-[3px] w-7 tint-bar" />
                      <p className="wrap-break-word text-[30px] font-black leading-[1.1] tracking-[-0.015em] text-ink">{meaning}</p>
                    </div>
                  )}
                  {card.hook && (
                    <p className={`mt-auto pt-4 text-[12px] font-semibold italic leading-snug text-graphite ${flipped ? "animate-rise-in" : "opacity-0"}`} style={delay(460)}>
                      {card.hook}
                    </p>
                  )}
                </div>

                <div
                  aria-hidden="true"
                  className={`flex items-center justify-between border-t border-rule px-5 pb-4 pt-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] ${flipped ? "animate-rise-in" : "opacity-0"}`}
                  style={delay(520)}
                >
                  <span className="text-accent">← bilemedim</span>
                  <span className="text-gilt-ink">↑ zorlandım</span>
                  <span className="text-moss">bildim →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] font-bold text-graphite">{caption}</p>

      <Sheet isOpen={examplesOpen} onClose={() => setExamplesOpen(false)} title={card.front} kicker={pos ? posLabel(pos) : null} style={tintStyle(card)}>
        <WordCardBack card={card} variant="flat" />
      </Sheet>

      {/* The grade bar. The three verdicts spring up in turn when the card
          is flipped, live from the first frame — the animation never gates a tap. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-paper/92 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {!flipped ? (
            <Button size="lg" fullWidth variant="ink" onClick={flip}>
              Çevir
            </Button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map((g, i) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => grade(g.grade)}
                  style={delay(i * 50)}
                  className={`min-h-14 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] transition-transform duration-100 animate-rise-spring active:translate-y-px active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30 ${g.button}`}
                >
                  {g.label}
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

/** A number counting up to its target over 600ms, easing out; timer-driven only. */
function useCountUp(target: number, ms = 600): number {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / ms);
      setShown(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return shown;
}

/** A clean sweep: two dozen pieces in the page's own inks, once, and gone. */
const CONFETTI_INKS = ["#d4471f", "#3e7a5a", "#c8922a", "#fffbf3"];
function PrintConfetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      drift: (Math.random() - 0.5) * 140,
      colour: CONFETTI_INKS[i % CONFETTI_INKS.length],
      size: 6 + Math.random() * 6,
      round: i % 3 === 0,
    })),
  );
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute top-0 block animate-[confetti-fall_1.2s_var(--ease-soft)_var(--delay)_both]"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.round ? piece.size : piece.size * 1.6,
              backgroundColor: piece.colour,
              borderRadius: piece.round ? "9999px" : "2px",
              "--delay": `${piece.delay}s`,
              "--drift": `${piece.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function FlipSummary({ queue, outcomes, onDone }: { queue: Card[]; outcomes: Record<number, Outcome>; onDone: () => void }) {
  const known = queue.filter((c) => outcomes[c.id]?.grade === 5).length;
  const hard = queue.filter((c) => outcomes[c.id]?.grade === 3).length;
  const missed = queue.filter((c) => outcomes[c.id]?.grade === 1).length;
  const perfect = missed === 0 && hard === 0;
  const shownKnown = useCountUp(known);
  const shownHard = useCountUp(hard);
  const shownMissed = useCountUp(missed);

  useEffect(() => {
    playLessonComplete();
    window.dispatchEvent(new CustomEvent("tonton:summary", { detail: { known, hard, missed } }));
    // A summary is mounted once; the counts are fixed by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verdict = perfect
    ? "Hepsini bildin. Bunlar artık daha seyrek gelecek."
    : missed === 0
      ? "Bildin ama zorlandıkların var; onları biraz daha sık getireceğim."
      : `${missed} kelime kaçtı — on dakika sonra tekrar hazır olacak, yarın da geri gelecek.`;
  return (
    <div className="animate-rise-in">
      {perfect && known >= 3 && <PrintConfetti />}
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">Oturum bitti</p>
      <h2 className="mt-2 text-[34px] font-black leading-[1.02] tracking-[-0.02em] text-ink">Kartlar bitti.</h2>
      <div className="mt-4 flex items-start gap-3.5">
        <Mascot mood={missed === 0 ? "happy" : "idle"} size={60} className="shrink-0" />
        <blockquote className="min-w-0 border-l-2 border-rule pl-3.5">
          <p className="text-[17px] font-semibold leading-[1.35] text-ink">{verdict}</p>
          <cite className="mt-1.5 block text-[10px] font-extrabold uppercase not-italic tracking-[0.18em] text-graphite">— Tonton</cite>
        </blockquote>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2 border-y border-rule py-4 text-center">
        {[
          [shownKnown, "bildin", "text-moss"],
          [shownHard, "zorlandın", "text-gilt-ink"],
          [shownMissed, "kaçtı", "text-accent"],
        ].map(([n, label, cls]) => (
          <div key={String(label)}>
            <dt className={`text-[30px] font-black leading-none tabular-nums ${cls}`}>{n as number}</dt>
            <dd className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-graphite">{label as string}</dd>
          </div>
        ))}
      </dl>

      {/* Every card, and when it comes back — the schedule made visible. */}
      <ul className="mt-2 divide-y divide-rule">
        {queue.map((c, i) => {
          const outcome = outcomes[c.id];
          return (
            <li key={c.id} style={{ ...tintStyle(c), ...delay(200 + i * 60) }} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-3 animate-rise-in">
              {c.image_url ? (
                <img src={c.image_url} alt="" className="h-11 w-11 rounded-md bg-paper-deep object-cover tint-ring" style={{ objectPosition: focalFor(c) }} />
              ) : (
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-md bg-paper-deep text-xl tint-ring">
                  {parseBack(c.back).emoji ?? "🃏"}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[17px] font-extrabold leading-tight text-ink">{c.front}</p>
                <p className="line-clamp-2 text-[13px] leading-snug text-graphite">{parseBack(c.back).text}</p>
              </div>
              {outcome && (
                <span className={`shrink-0 text-right text-[10px] font-extrabold uppercase tracking-[0.14em] tabular-nums ${nextTone(outcome)}`}>{nextLabel(outcome)}</span>
              )}
            </li>
          );
        })}
      </ul>
      <Button size="lg" fullWidth variant="ink" className="mt-8" onClick={onDone}>
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

  if (!deckId) return <Navigate to="/kartlar" replace />;

  const loading = cardsQuery.isLoading || (!all && (!dueQuery.data || dueQuery.isFetching));
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
            <Skeleton className="h-[3px] w-full rounded-full" />
            <Skeleton className="mt-8 h-[30rem] max-h-[calc(100dvh-23rem)] w-full rounded-[20px]" />
          </div>
        )}
        {!loading && !cardsQuery.isError && cards.length === 0 && (
          <EmptyState
            emoji={all ? "🃏" : "🎉"}
            title={all ? "Henüz kartın yok" : "Bugünlük tamam"}
            description={all ? "Bir kelime ekle, kartın hazır olsun." : "Şu an tekrar bekleyen kart yok. Hepsini yeniden görmek istersen aşağıdan."}
            action={
              all ? (
                <LinkButton to="/kartlar" variant="ink">
                  Kartlarım
                </LinkButton>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <LinkButton to={`/decks/${deckId}/flashcards?mode=all`} variant="ink" onClick={primeSpeech}>
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
          <FlipSession key={`${deckId}-${all ? "all" : "due"}`} deckId={deckId} cards={cards} title={all ? "Hepsi" : "Bugünün kartları"} />
        )}
      </main>
    </div>
  );
}

export default Flashcards;
