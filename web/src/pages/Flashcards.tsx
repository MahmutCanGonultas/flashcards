import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "../lib/api";
import type { Card } from "../types";
import { posLabel } from "../lib/cardBack";
import { isSpeechMuted, primeSpeech, speak, speakAuto, speechSupported } from "../lib/speech";
import { playCorrect, playIncorrect, playLessonComplete, playReveal } from "../lib/sound";
import { useRecordStudyDay } from "../lib/streak";
import { tintStyle } from "../lib/tint";
import { familyStyle } from "../lib/palette";
import { STAGE_LABEL, nextReview, stageOf } from "../lib/memory";
import { hasStarted } from "../lib/path";
import { STAGE_PILL, TONE_PILL } from "../lib/stageStyle";
import { learnerDayNumber } from "../lib/day";
import { usePractice, type PracticePhase } from "../lib/personal";
import { anchorOf, backLine, coreChunk, coreGloss, corePos, secondGloss } from "../lib/senses";
import { afterLearnAnswer, afterReviewAnswer, takeUnwritten, type LearnState, type Tally } from "../lib/learning";
import {
  KIND_LABEL,
  TYPED_KINDS,
  buildDrill,
  buildExercises,
  buildSession,
  captionFor,
  checkAnswer,
  expectedAnswer,
  insertLater,
  labelFor,
  letterPattern,
  placeApart,
  retryOf,
  skipStep,
  wantsOwnSentence,
  writeStep,
  type Direction,
  type Exercise,
  type Gap,
  type Verdict,
} from "../lib/practice";
import { splitOnWord } from "../lib/sentence";
import { flipOrder, usePlan } from "../lib/plan";
import { summaryView, type RoundMode, type RoundResult } from "../lib/summary";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import Mascot, { type MascotMood } from "../components/Mascot";
import SpeakButton from "../components/SpeakButton";
import Sheet from "../components/Sheet";
import WordCardBack, { ExampleBubble, PosPill, TurkishLit } from "../components/WordCardBack";
import Cover from "../components/Cover";
import StrengthBars from "../components/StrengthBars";
import TontonLine from "../components/TontonLine";
import MeaningText from "../components/MeaningText";
import Confetti from "../components/Confetti";
import ReminderCard from "../components/ReminderCard";
import { ArrowRightIcon, CheckIcon, PencilIcon, SpeakerIcon, XIcon } from "../components/icons";

/**
 * The learner's own words, practised two ways that never mix.
 *
 * "Tekrar et" is the cards. A new word (three a day at most) is met first
 * — its sentence, a guess, then its one core meaning — and asked three
 * times in the round with other cards in between, the last time from the
 * Turkish; it is written to the schedule once, at its second right answer.
 * Every other word is flipped: see it (or, on alternate reviews, its
 * Turkish), say the answer aloud, turn it over, say honestly how it went
 * (swipe right for Bildim, left for Bilemedim, up for Zorlandım). A miss
 * comes back twice more in the round; only the first answer is written to
 * the schedule. With nothing due, the cards can still be gone through; only
 * the due ones count.
 *
 * "Egzersiz" is the exercises, on their own: the word typed into its
 * sentence, into a phrase, from its Turkish, into the learner's own
 * sentence, or caught by ear, marked by the app, and never written to the
 * schedule. Every answer that isn't a graded review is logged apart
 * (/practice), so the numbers stay honest. The rules live in
 * lib/practice.ts and lib/learning.ts; this is the screen.
 *
 * Tonton sits on the screen with each question (his line changes with the
 * step and his face with the answer), and the director hears about every
 * card and grade through `tonton:*` window events.
 */

type Grade = 1 | 3 | 4 | 5;
type SessionMode = RoundMode;
/** A card's first answer this session, and what the schedule made of it. */
type Result = RoundResult;

/** Sentences asked for in one round of exercises: one, so it stays a moment and not a chore. */
const MAX_WRITES = 1;

/** Each verdict's colour, once: red missed it, orange was hard, green knew it; and the standard it is held to. */
const GRADES: { grade: Grade; label: string; hint: string; button: string; stamp: string; wash: string; key: string; arrow: string }[] = [
  { grade: 1, label: "Bilemedim", hint: "gelmedi", button: "bg-berry", stamp: "border-berry text-berry-ink", wash: "bg-berry/15", key: "1", arrow: "ArrowLeft" },
  { grade: 3, label: "Zorlandım", hint: "geç ya da yarım", button: "bg-tangerine", stamp: "border-tangerine text-tangerine-ink", wash: "bg-tangerine/15", key: "2", arrow: "ArrowUp" },
  { grade: 5, label: "Bildim", hint: "hemen geldi", button: "bg-grass", stamp: "border-grass text-grass-ink", wash: "bg-grass/15", key: "3", arrow: "ArrowRight" },
];
const gradeOf = (grade: Grade) => GRADES.find((g) => g.grade === grade) ?? GRADES[0];
/** Passing a card without answering: grey, like something set aside. */
const SKIP = { label: "Geç", stamp: "border-hare text-graphite", wash: "bg-rule/50" };
type Leave = Grade | "skip";
const hintOf = (hint: Leave) => (hint === "skip" ? SKIP : gradeOf(hint));

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: reducedMotion() ? "0ms" : `${ms}ms` });

/** How far a swipe has to go before it counts. */
const SWIPE_PX = 96;
/** The throw lasts 380ms; the next card starts rising 60ms before it ends so the pile never sits empty. */
const THROW_MS = 380;
const SETTLE_MS = THROW_MS - 60;

/** The big buttons of the screen: a solid colour on a darker band of itself. */
const BIG = "face flex min-h-[56px] w-full items-center justify-center rounded-2xl text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d focus-visible:outline-none focus-visible:ring-4 disabled:bg-rule disabled:text-hare disabled:shadow-none";
/**
 * The word on a card is the loudest thing on the screen: the shorter it is,
 * the bigger it gets, and it sits a little off its colour on a soft shadow.
 */
const wordSize = (word: string) => (word.length <= 7 ? "text-[64px]" : word.length <= 9 ? "text-[56px]" : word.length <= 12 ? "text-[46px]" : "text-[38px]");
const WORD_ON_COVER = "wrap-break-word font-black leading-[0.95] tracking-[-0.025em] [text-shadow:0_3px_0_rgba(0,0,0,0.14)]";
/** A white speaker on a coloured cover, its icon in the word's own ink. */
const COVER_SPEAKER = "!h-12 !w-12 !bg-white !text-(--c-ink) !shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.12)]";

function tellTonton(name: "card" | "grade", detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent(`tonton:${name}`, { detail }));
}

/**
 * The meaning a card teaches, big: its core sense's gloss, the standard
 * every grade is held to. Once the word holds, its second sense joins on a
 * smaller line in sense 2's colour; the rest wait on the word's page.
 */
function CoreMeaning({ card, animate, second = null }: { card: Card; animate: boolean; second?: string | null }) {
  return (
    <>
      <p className={`wrap-break-word text-[28px] font-black leading-[1.12] tracking-[-0.01em] text-ink ${animate ? "animate-rise-in" : ""}`} style={delay(200)}>
        <MeaningText text={coreGloss(card)} />
      </p>
      {second && (
        <p style={{ ...familyStyle("grass"), ...delay(280) }} className={`mt-2 text-[17px] font-extrabold leading-snug text-graphite ${animate ? "animate-rise-in" : ""}`}>
          <span className="font-black text-(--c-ink)">2 · </span>
          <MeaningText text={second} />
        </p>
      )}
    </>
  );
}

/**
 * A sentence on a coloured cover: white type, the word as a white chip in
 * the word's own ink (the soft highlight elsewhere would vanish on the colour).
 */
function CoverSentence({ sentence, headword }: { sentence: string; headword: string }) {
  const parts = splitOnWord(sentence, headword);
  return (
    <p className="mt-5 max-w-[21rem] text-[17px] font-bold leading-[1.45] text-white wrap-break-word animate-[cover-line_420ms_var(--ease-soft)_200ms_both]">
      {parts ? (
        <>
          {parts.before}
          <span className="rounded-md bg-white px-1 font-black text-(--c-ink) [box-decoration-break:clone]">{parts.match}</span>
          {parts.after}
        </>
      ) : (
        sentence
      )}
    </p>
  );
}

/* ------------------------------------------------------------ the rule -- */

function ProgressRule({ index, total, exitTo }: { index: number; total: number; exitTo: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <Link to={exitTo} aria-label="Çık" className="-m-2 grid h-11 w-11 shrink-0 place-items-center rounded-full p-2 text-hare transition-colors hover:text-graphite">
        <XIcon className="h-6 w-6" />
      </Link>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-rule" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index}>
        <div className="relative h-full rounded-full bg-grass transition-[width] duration-500 ease-soft" style={{ width: `${Math.max(4, Math.round((index / Math.max(1, total)) * 100))}%` }}>
          <span aria-hidden="true" className="absolute inset-x-2 top-[3px] h-[4px] rounded-full bg-white/30" />
        </div>
      </div>
      <span className="shrink-0 text-[13px] font-black tabular-nums text-graphite">{total - index} kaldı</span>
    </div>
  );
}

/** The fixed slot the forward buttons live in, so they never move between steps. */
function BottomBar({ children, tone = "plain", tall = false }: { children: ReactNode; tone?: "plain" | "right" | "slip" | "wrong"; tall?: boolean }) {
  const ground =
    tone === "right" ? "bg-grass-soft animate-sheet-up" : tone === "slip" ? "bg-tangerine-soft animate-sheet-up" : tone === "wrong" ? "bg-berry-soft animate-sheet-up" : "border-t-2 border-rule bg-white";
  return (
    <>
      <div className={`fixed inset-x-0 bottom-0 z-10 ${ground}`}>
        <div className="mx-auto max-w-2xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">{children}</div>
      </div>
      <div className={tall ? "h-72" : "h-28"} aria-hidden="true" />
    </>
  );
}

/* ---------------------------------------------------------------- meet -- */

/**
 * Meeting a word: the word, then the word at work in its anchor sentence,
 * and a moment to guess what it means before it's shown. A guess — even a
 * wrong one — makes the meaning land harder than being told outright. Then
 * one meaning and one chunk, nothing else: the rest of the word waits
 * until this much holds.
 */
function MeetStep({ card, counter, onDone }: { card: Card; counter: string; onDone: () => void }) {
  const line = anchorOf(card);
  const anchor = line?.en ?? null;
  const [revealed, setRevealed] = useState(!line);
  const meaningRef = useRef<HTMLDivElement>(null);
  const pos = corePos(card);
  const chunk = coreChunk(card);

  useEffect(() => {
    speakAuto(card.front);
    tellTonton("card", { front: card.front, flipped: false });
  }, [card.front]);

  const reveal = useCallback(() => {
    playReveal();
    setRevealed(true);
    // The sentence once more, a little slower, now that it means something.
    if (anchor) speakAuto(anchor, { rate: 0.85 });
    // The meanings open below the fold on a phone: bring them up.
    window.setTimeout(() => meaningRef.current?.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" }), 60);
  }, [anchor]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      if ((event.target as HTMLElement | null)?.closest?.("button, a, input, textarea")) return;
      event.preventDefault();
      if (revealed) onDone();
      else reveal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, reveal, onDone]);

  return (
    <div className="mt-6 animate-[card-rise_420ms_var(--ease-spring)]" style={tintStyle(card)}>
      <Cover card={card} label={KIND_LABEL.meet} counter={counter} className="min-h-[15rem]">
        <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          {pos && <PosPill pos={pos} className="mb-2.5 !bg-white/25 !text-white" />}
          <h2 className={`max-w-full ${WORD_ON_COVER} ${wordSize(card.front)}`}>{card.front}</h2>
        </div>
        <div className="flex justify-end">
          <SpeakButton text={card.front} size="md" className={COVER_SPEAKER} />
        </div>
      </Cover>

      <div className="mt-4 space-y-3">
        {line && <ExampleBubble en={line.en} tr={revealed ? line.tr : null} headword={card.front} meaning={line.gloss} />}

        {!revealed ? (
          <TontonLine mood="think" size={54}>
            Cümleye bak: sence ne demek? Bir tahmin geçir aklından, sonra aç.
          </TontonLine>
        ) : (
          <>
            <section ref={meaningRef} className="card-3d scroll-mb-40 rounded-[22px] p-4">
              <p className="mb-2.5 text-[13px] font-black uppercase tracking-[0.1em] text-graphite">Anlamı</p>
              <CoreMeaning card={card} animate />
              {chunk && (
                <p className="mt-3.5 rounded-2xl bg-tangerine-soft px-3.5 py-2.5 text-[15px] font-bold leading-snug text-ink animate-rise-in" style={delay(360)}>
                  <span className="font-black text-tangerine-ink">{chunk.en}</span> — {chunk.tr}
                </p>
              )}
            </section>
            <TontonLine mood="happy" size={46} className="animate-rise-in">
              {chunk ? (
                <>
                  Kalıbı bir kez sesli söyle: <span className="font-black">{chunk.en}</span>.
                </>
              ) : (
                "Kelimeyi bir kez sesli söyle."
              )}{" "}
              Bugün sana üç kez soracağım; arada başka kartlar gelecek.
            </TontonLine>
          </>
        )}
      </div>

      <BottomBar>
        {!revealed ? (
          <button type="button" onClick={reveal} className={`${BIG} bg-ocean focus-visible:ring-ocean/40`}>
            Anlamını göster
          </button>
        ) : (
          <button type="button" onClick={onDone} className={`${BIG} bg-grass focus-visible:ring-grass/40`}>
            Tamam
          </button>
        )}
      </BottomBar>
    </div>
  );
}

/**
 * "Geç": on to the next card without marking anything. The card isn't
 * graded; it comes back once at the end of the round, and if it's passed
 * again it simply stays due for next time.
 */
function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 rounded-xl border-2 border-rule bg-white px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.08em] text-graphite shadow-edge press hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
    >
      Geç
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ---------------------------------------------------------------- flip -- */

/**
 * Recall: the word (or its sound) on the cover — or, the other way round,
 * its Turkish on a plain white card; say the answer aloud, turn it over,
 * grade yourself. The back carries the core meaning and one sentence with
 * the word lit up — the meaning always arrives with a picture of it in use.
 */
function FlipStep({
  card,
  step,
  counter,
  remaining,
  rushed,
  onGrade,
  onSkip,
}: {
  card: Card;
  step: Exercise;
  counter: string;
  remaining: number;
  /** The last few cards were turned in a blink: the caption asks for a moment first. */
  rushed: boolean;
  /** The grade, and how long the front was up before it was turned. */
  onGrade: (grade: Grade, thinkMs: number | null) => void;
  /** On to the next card without an answer; nothing is written to the schedule. */
  onSkip: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [leaving, setLeaving] = useState<Leave | null>(null);
  // The day, fixed when the card comes up: the sentence on the back rotates with it.
  const [day] = useState(() => learnerDayNumber());
  const dragStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const flyTimer = useRef(0);
  const shownAt = useRef(0);
  const thinkMs = useRef<number | null>(null);
  const listen = step.kind === "listen";
  const reverse = step.kind === "reverse";
  const pos = corePos(card);
  const hasDetails = Boolean(card.senses?.length || card.example_sentence || card.related?.length || card.watch_out);
  // The sentence on the back: the one the word was met in, or — once it
  // holds — one of its core sense's by the day. Asked from the Turkish,
  // it is the sentence whose Turkish was on the front.
  const line = reverse ? anchorOf(card) : backLine(card, day);
  const cue = step.support && !reverse ? anchorOf(card) : null;
  const chunk = reverse ? coreChunk(card) : null;
  const second = secondGloss(card);

  useEffect(() => () => window.clearTimeout(flyTimer.current), []);

  // Say the word as the card comes to the top — for a listening card that
  // *is* the question; a card asked from the Turkish stays silent, or it
  // would say the answer — and tell Tonton a new card is face down.
  useEffect(() => {
    shownAt.current = performance.now();
    if (!reverse) speakAuto(card.front);
    tellTonton("card", { front: card.front, flipped: false });
  }, [card.front, reverse]);

  const flip = useCallback(() => {
    primeSpeech();
    if (flipped || leaving !== null) return;
    thinkMs.current = Math.round(performance.now() - shownAt.current);
    playReveal();
    setFlipped(true);
    if (listen || reverse) speakAuto(card.front);
    tellTonton("card", { front: card.front, flipped: true });
  }, [flipped, leaving, listen, reverse, card.front]);

  const grade = useCallback(
    (quality: Grade) => {
      if (!flipped || leaving !== null) return;
      setLeaving(quality);
      flyTimer.current = window.setTimeout(() => onGrade(quality, thinkMs.current), reducedMotion() ? 0 : SETTLE_MS);
    },
    [flipped, leaving, onGrade],
  );

  // Passing works face up or face down: the card drops out of the bottom.
  const skip = useCallback(() => {
    if (leaving !== null) return;
    setLeaving("skip");
    flyTimer.current = window.setTimeout(onSkip, reducedMotion() ? 0 : SETTLE_MS);
  }, [leaving, onSkip]);

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
    else if (dy > SWIPE_PX && Math.abs(dx) < SWIPE_PX) skip();
    else setDrag(null);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || examplesOpen) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea")) return;
      if (event.key === "ArrowDown" || event.key === "4") {
        event.preventDefault();
        skip();
        return;
      }
      if (!flipped && (event.key === " " || event.key === "Enter")) {
        // A focused button or the card itself answers its own Enter.
        if (target?.closest?.("button, a, [role=button]")) return;
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
  }, [flipped, flip, grade, skip, examplesOpen]);

  // Where the top card is: dragged, thrown away, or resting.
  const dx = drag?.dx ?? 0;
  const dy = drag?.dy ?? 0;
  const flyX = leaving === 5 ? 520 : leaving === 1 ? -520 : 0;
  const flyY = leaving === "skip" ? 760 : leaving === 3 ? -640 : leaving ? -40 : 0;
  const topStyle: CSSProperties = leaving
    ? {
        transform: `translate(${flyX}px, ${flyY}px) rotate(${leaving === 5 ? 22 : leaving === 1 ? -22 : 0}deg) scale(0.96)`,
        opacity: 0,
        transition: `transform ${THROW_MS}ms var(--ease-throw), opacity 300ms ease-in 60ms`,
      }
    : drag
      ? { transform: `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)` }
      : { transform: "translate(0, 0) rotate(0)", transition: "transform 260ms var(--ease-spring)" };
  const swipeHint: Leave | null = drag && !leaving ? (dx > 40 ? 5 : dx < -40 ? 1 : dy < -40 ? 3 : dy > 40 ? "skip" : null) : leaving;
  const hintOpacity = drag ? Math.min(1, Math.max(Math.abs(dx), Math.abs(dy)) / SWIPE_PX) : leaving ? 1 : 0;
  const caption = captionFor({ kind: step.kind, attempt: step.attempt, flipped, support: Boolean(cue), rushed });
  const label = labelFor(step);
  const mood: MascotMood = leaving === 5 ? "happy" : leaving === 1 ? "sad" : flipped || leaving === "skip" ? "idle" : "think";

  return (
    <>
      {/* The pile, with Tonton peeking over its top edge. */}
      <div className="relative mt-11 h-[36rem] max-h-[calc(100dvh-16rem)] min-h-[21rem]">
        <Mascot size={56} mood={mood} quiet className="absolute -top-8 right-6 z-10" />
        {remaining > 2 && <div aria-hidden="true" className="absolute inset-x-5 top-4 h-full rounded-[24px] border-2 border-rule bg-paper-deep animate-pile-nudge [animation-delay:60ms]" />}
        {remaining > 1 && <div aria-hidden="true" className="absolute inset-x-2.5 top-2 h-full rounded-[24px] border-2 border-rule bg-white animate-pile-nudge" />}

        <div
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
          {/* The verdict, stamped on the card as you drag. */}
          {swipeHint && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[24px] ${hintOf(swipeHint).wash}`}
              style={{ opacity: hintOpacity }}
            >
              <span
                key={swipeHint}
                className={`rounded-xl border-[3px] bg-white px-4 py-1.5 text-[26px] font-black uppercase tracking-[0.14em] animate-stamp ${hintOf(swipeHint).stamp}`}
              >
                {hintOf(swipeHint).label}
              </span>
            </div>
          )}

          <div className="relative h-full w-full animate-[card-rise_420ms_var(--ease-spring)] [perspective:1400px]">
            <div
              className={`relative h-full w-full transition-transform duration-[560ms] ease-soft [transform-style:preserve-3d] motion-reduce:transform-none ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* FRONT — the word, or its sound, on the word's own colour; its Turkish on plain white. */}
              <div
                role="button"
                tabIndex={flipped ? -1 : 0}
                aria-label={listen ? "Duyduğun kelime — kartı çevir" : reverse ? "İngilizcesi ne? — kartı çevir" : `${card.front} — kartı çevir`}
                onClick={flip}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    flip();
                  }
                }}
                className={`card-face absolute inset-0 cursor-pointer select-none rounded-[24px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/40 motion-reduce:transition-opacity ${
                  flipped ? "motion-reduce:opacity-0" : ""
                }`}
              >
                {reverse ? (
                  // White, not the word's colour: with a handful of words, the colour alone would give it away.
                  <div style={familyStyle("ocean")} className="card-3d flex h-full flex-col rounded-[24px] px-5 pb-6 pt-4 text-ink">
                    <div className="flex items-center justify-between gap-3 tabular-nums">
                      <span data-cover-label className="min-w-0 truncate rounded-full bg-(--c) px-3 py-1 text-[12px] font-black uppercase tracking-[0.1em] text-white">{label}</span>
                      <span className="shrink-0 text-[12px] font-black tracking-[0.06em] text-graphite">{counter}</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      {pos && <PosPill pos={pos} className="mb-3" />}
                      <p className="max-w-full wrap-break-word text-[28px] font-black leading-[1.12] tracking-[-0.01em] text-ink animate-[cover-line_420ms_var(--ease-soft)_120ms_both]">
                        <MeaningText text={coreGloss(card)} />
                      </p>
                      {line?.tr && (
                        <p className="mt-5 max-w-[21rem] text-[17px] font-bold leading-[1.45] text-graphite wrap-break-word">
                          <TurkishLit sentence={line.tr} meaning={line.gloss} />
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StrengthBars card={card} />
                      <span className="flex-1 text-[11px] font-black uppercase tracking-[0.1em] text-hare">dokun · çevir</span>
                    </div>
                  </div>
                ) : (
                  <Cover card={card} label={label} counter={counter} className="h-full">
                    {listen ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                        <button
                          type="button"
                          aria-label="Bir daha dinle"
                          onClick={(event) => {
                            event.stopPropagation();
                            void speak(card.front);
                          }}
                          className="grid h-28 w-28 place-items-center rounded-[32px] bg-white text-(--c-ink) shadow-[inset_0_-6px_0_0_rgba(0,0,0,0.12)] transition-transform duration-100 active:translate-y-[3px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                        >
                          <SpeakerIcon className="h-12 w-12" />
                        </button>
                        <p className="max-w-[16rem] text-[18px] font-black leading-snug text-white">Duyduğun kelime ne demek?</p>
                      </div>
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center text-center">
                        {pos && <PosPill pos={pos} className="mb-3 !bg-white/25 !text-white" />}
                        <h2 className={`max-w-full animate-[cover-line_420ms_var(--ease-soft)_120ms_both] ${WORD_ON_COVER} ${wordSize(card.front)}`}>{card.front}</h2>
                        {cue && <CoverSentence sentence={cue.en} headword={card.front} />}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <StrengthBars card={card} onDark />
                      <span className="flex-1 text-[11px] font-black uppercase tracking-[0.1em] text-white/80">dokun · çevir</span>
                      {!listen && (
                        <span onClick={(event) => event.stopPropagation()}>
                          <SpeakButton text={card.front} size="md" className={COVER_SPEAKER} />
                        </span>
                      )}
                    </div>
                  </Cover>
                )}
              </div>

              {/* BACK — white, the word on a band of its colour, the core meaning, one sentence. */}
              <div
                aria-hidden={!flipped}
                className={`card-face !absolute inset-0 flex select-none flex-col overflow-hidden rounded-[24px] border-2 border-rule bg-white text-ink [-webkit-touch-callout:none] [transform:rotateY(180deg)] motion-reduce:transform-none motion-reduce:transition-opacity ${
                  flipped ? "" : "motion-reduce:opacity-0"
                }`}
              >
                {/* Speaker first, the word, then Örnekler: the top-right corner is where Tonton sits. */}
                <div className="flex items-center gap-2.5 tint-ground px-4 pb-3.5 pt-4 text-white shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.14)] [@media(max-height:720px)]:pb-2.5 [@media(max-height:720px)]:pt-3">
                  <span onPointerDown={(event) => event.stopPropagation()} className="shrink-0">
                    <SpeakButton text={card.front} size="sm" className="!bg-white !text-(--c-ink) !shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.12)]" />
                  </span>
                  <p className={`min-w-0 flex-1 truncate font-black leading-tight [text-shadow:0_2px_0_rgba(0,0,0,0.12)] ${card.front.length <= 10 ? "text-[30px]" : "text-[24px]"}`}>{card.front}</p>
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => setExamplesOpen(true)}
                      onPointerDown={(event) => event.stopPropagation()}
                      className="mt-3 shrink-0 rounded-full bg-white/25 px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.08em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Örnekler
                    </button>
                  )}
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-3 pt-4 [@media(max-height:720px)]:pt-3">
                  {flipped && <CoreMeaning card={card} animate second={second} />}
                  {chunk && flipped && (
                    <p className="mt-3 rounded-2xl bg-tangerine-soft px-3.5 py-2 text-[15px] font-bold leading-snug text-ink animate-rise-in" style={delay(340)}>
                      <span className="font-black text-tangerine-ink">{chunk.en}</span> — {chunk.tr}
                    </p>
                  )}
                  {line && flipped && (
                    <div className="mt-auto pt-3 animate-rise-in" style={delay(420)}>
                      <ExampleBubble en={line.en} tr={line.tr} headword={card.front} meaning={line.gloss} size="sm" />
                    </div>
                  )}
                </div>

                {/* The swipe hints; on a short screen the grade buttons below say the same, so the sentence gets the room. */}
                <div
                  aria-hidden="true"
                  className={`flex items-center justify-between border-t-2 border-paper-deep px-4 pb-3 pt-2 text-[11px] font-black uppercase tracking-[0.08em] [@media(max-height:720px)]:hidden ${flipped ? "animate-rise-in" : "opacity-0"}`}
                  style={delay(520)}
                >
                  <span className="text-berry-ink">← bilemedim</span>
                  <span className="text-tangerine-ink">↑ zorlandım</span>
                  <span className="text-grass-ink">bildim →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Under the card (clear of the pile's lowest edge, 16px down): what to do, and the way past it without an answer. */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] font-bold leading-snug text-graphite">{caption}</p>
        <SkipButton onClick={skip} />
      </div>

      <Sheet isOpen={examplesOpen} onClose={() => setExamplesOpen(false)} title={card.front} kicker={pos ? posLabel(pos) : null} style={tintStyle(card)}>
        <WordCardBack card={card} variant="flat" />
      </Sheet>

      {/* The grade bar. The three verdicts spring up in turn when the card
          is flipped, live from the first frame — the animation never gates a tap. */}
      <BottomBar>
        {!flipped ? (
          <button type="button" onClick={flip} className={`${BIG} bg-ocean focus-visible:ring-ocean/40`}>
            Çevir
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {GRADES.map((g, i) => (
              <button
                key={g.grade}
                type="button"
                onClick={() => grade(g.grade)}
                style={delay(i * 50)}
                className={`face flex min-h-[64px] flex-col items-center justify-center rounded-2xl px-1 text-white shadow-button press-3d animate-rise-spring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30 ${g.button}`}
              >
                {/* Under 360px "ZORLANDIM" is wider than its third of the bar: a size and spacing down. */}
                <span className="text-[14px] font-black uppercase leading-tight tracking-[0.04em] max-[359px]:text-[12px] max-[359px]:tracking-normal">{g.label}</span>
                <span className="mt-0.5 text-[11px] font-bold leading-tight text-white/90">{g.hint}</span>
              </button>
            ))}
          </div>
        )}
      </BottomBar>
    </>
  );
}

/* --------------------------------------------------------------- typed -- */

/** What "İngilizcesi?" asks from: the core meaning, big — the one the cards teach. */
function ProducePrompt({ card }: { card: Card }) {
  return (
    <p className="wrap-break-word text-[30px] font-black leading-[1.12] tracking-[-0.01em]">
      <MeaningText text={coreGloss(card)} noteClassName="font-extrabold opacity-80" />
    </p>
  );
}

/** The gap in a sentence: a line the width of the missing word, or the word itself once answered. */
function GapLine({ gap, filled }: { gap: Gap; filled: boolean }) {
  return (
    <p className="text-[23px] font-extrabold leading-[1.5] wrap-break-word">
      {gap.before}
      {filled ? (
        <span className="rounded-lg bg-white px-1.5 font-black text-(--c-ink) animate-rise-in">{gap.answer}</span>
      ) : (
        <span aria-label="boşluk" className="mx-0.5 inline-block translate-y-[3px] border-b-[4px] border-white/85 align-baseline" style={{ width: `${Math.min(10, Math.max(3, gap.answer.length * 0.62))}em` }} />
      )}
      {gap.after}
    </p>
  );
}

const VERDICT_STYLE: Record<Verdict["tone"], { title: string; bar: "right" | "slip" | "wrong"; text: string; button: string; mood: MascotMood }> = {
  right: { title: "Harika!", bar: "right", text: "text-grass-ink", button: "bg-grass", mood: "happy" },
  form: { title: "Doğru kelime!", bar: "right", text: "text-grass-ink", button: "bg-grass", mood: "happy" },
  slip: { title: "Az kaldı", bar: "slip", text: "text-tangerine-ink", button: "bg-tangerine", mood: "idle" },
  wrong: { title: "Olmadı, şimdi bak", bar: "wrong", text: "text-berry-ink", button: "bg-berry", mood: "sad" },
};

/**
 * Production: the Turkish, a sentence, a chunk or the learner's own
 * sentence, and a box to type the English into. The app marks it; a wrong
 * mark that was really right (a synonym, a spelling it doesn't know) can be
 * taken back once.
 */
function TypedStep({
  card,
  step,
  counter,
  onDone,
  onSkip,
}: {
  card: Card;
  step: Exercise;
  counter: string;
  onDone: (grade: Grade) => void;
  /** On to the next card without an answer. */
  onSkip: () => void;
}) {
  const [text, setText] = useState("");
  const [hints, setHints] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [overridden, setOverridden] = useState(false);
  const [showTurkish, setShowTurkish] = useState(Boolean(step.openTranslation) || step.kind === "chunk");
  const inputRef = useRef<HTMLInputElement>(null);
  const expected = expectedAnswer(step, card);
  const pos = corePos(card);
  const gap = step.gap ?? null;
  const example = gap ? null : anchorOf(card);
  const answered = verdict !== null;

  useEffect(() => {
    tellTonton("card", { front: card.front, flipped: false });
    // Focus only where there is a real keyboard: on a phone the keyboard
    // would jump up over the question before it has been read.
    if (window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) inputRef.current?.focus({ preventScroll: true });
  }, [card.front]);

  const mark = (next: Verdict) => {
    setVerdict(next);
    inputRef.current?.blur();
    if (next.grade >= 3) playCorrect(next.grade === 5 ? 2 : 1);
    else playIncorrect();
    speakAuto(expected === card.front ? card.front : `${card.front}. ${expected}`);
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (answered || !text.trim()) return;
    mark(checkAnswer(text, expected, card.front, { hinted: hints > 0 }));
  };

  const next = useCallback(() => {
    if (!verdict) return;
    onDone(overridden ? 3 : verdict.grade);
  }, [verdict, overridden, onDone]);

  useEffect(() => {
    if (!answered) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat) return;
      if ((event.target as HTMLElement | null)?.closest?.("button, a")) return;
      event.preventDefault();
      next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, next]);

  const style = verdict ? VERDICT_STYLE[overridden ? "slip" : verdict.tone] : null;
  const typed = text.trim();
  const detail = verdict
    ? verdict.tone === "form"
      ? gap
        ? `Bu cümlede “${expected}” olmalı.`
        : `Aradığım yalın hâli: ${expected}.`
      : verdict.tone === "slip"
        ? `Yazımı: ${expected}${typed ? ` — sen “${typed}” yazdın.` : "."}`
        : verdict.tone === "wrong" && typed
          ? `Sen “${typed}” yazdın. Doğrusu: ${expected}.`
          : `Doğrusu: ${expected}.`
    : "";

  return (
    <div className="mt-6 animate-[card-rise_420ms_var(--ease-spring)]" style={tintStyle(card)}>
      <Cover card={card} label={KIND_LABEL[step.kind]} counter={counter} ornament={step.kind === "produce" ? null : "“"} className="min-h-[12.5rem]">
        <div className="mt-auto pt-7">
          {step.kind === "produce" ? (
            <>
              {pos && <PosPill pos={pos} className="mb-2 !bg-white/25 !text-white" />}
              <ProducePrompt card={card} />
              {answered && <p className="mt-2.5 w-max rounded-xl bg-white px-2.5 py-0.5 text-[30px] font-black leading-tight tracking-[-0.02em] text-(--c-ink) animate-rise-in">{card.front}</p>}
            </>
          ) : gap ? (
            <>
              <GapLine gap={gap} filled={answered} />
              {gap.translation &&
                (showTurkish || answered ? (
                  <p className="mt-3 text-[15px] font-bold leading-[1.45] text-white/90 wrap-break-word">{gap.translation}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTurkish(true)}
                    className="mt-3 rounded-full bg-white/25 px-3 py-1 text-[12px] font-black uppercase tracking-[0.08em] text-white"
                  >
                    Türkçesini göster
                  </button>
                ))}
            </>
          ) : null}
        </div>
      </Cover>

      {!answered ? (
        <form onSubmit={submit} className="mt-4">
          <label htmlFor={`answer-${step.key}`} className="sr-only">
            İngilizcesini yaz
          </label>
          <input
            id={`answer-${step.key}`}
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={letterPattern(expected, hints)}
            className="w-full rounded-2xl border-2 border-rule bg-paper-deep px-4 py-3.5 text-[22px] font-extrabold tracking-[0.02em] text-ink outline-none transition-colors placeholder:font-black placeholder:tracking-[0.18em] placeholder:text-hare focus:border-ocean focus:bg-white"
          />
          <div className="mt-2.5 flex items-center justify-between px-1 text-[12px] font-black uppercase tracking-[0.08em]">
            <button
              type="button"
              disabled={hints >= Math.max(1, expected.replace(/[^\p{L}]/gu, "").length - 1)}
              onClick={() => {
                setHints((h) => h + 1);
                inputRef.current?.focus({ preventScroll: true });
              }}
              className="-mx-2 rounded-xl px-2 py-2 uppercase text-tangerine-ink hover:bg-tangerine-soft disabled:opacity-40"
            >
              💡 İpucu{hints > 0 ? ` · ${hints} harf` : ""}
            </button>
            <span className="flex items-center gap-2">
              <button type="button" onClick={() => mark({ grade: 1, tone: "wrong" })} className="rounded-xl px-2 py-2 uppercase text-graphite hover:bg-paper-deep hover:text-ink">
                Bilmiyorum
              </button>
              <SkipButton onClick={onSkip} />
            </span>
          </div>
          <TontonLine mood="think" size={46} className="mt-4">
            {step.kind === "produce"
              ? "Türkçesine bak, İngilizcesini yaz. Aklına gelmezse ipucu bir harf açar."
              : step.kind === "own"
                ? "Bu senin cümlen! Boşluğa hangi kelime geliyordu?"
                : step.kind === "chunk"
                  ? "Kalıbı tamamla; kelime kalıbıyla birlikte daha iyi kalır."
                  : "Cümleyi oku, boşluğa kelimenin doğru hâlini yaz."}
          </TontonLine>
        </form>
      ) : (
        example && (
          <div className="mt-4 animate-rise-in">
            <ExampleBubble en={example.en} tr={example.tr} headword={card.front} meaning={example.gloss} />
          </div>
        )
      )}

      {!answered ? (
        <BottomBar>
          <button type="button" onClick={() => submit()} disabled={!typed} className={`${BIG} bg-grass focus-visible:ring-grass/40`}>
            Kontrol et
          </button>
        </BottomBar>
      ) : (
        style &&
        verdict && (
          <BottomBar tone={style.bar} tall>
            <div className="mb-4 flex items-start gap-3" role="status">
              <div className="relative shrink-0">
                <Mascot mood={style.mood} size={64} />
                <span className={`absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-white shadow ${style.text}`}>
                  {style.bar === "wrong" ? <XIcon className="h-3.5 w-3.5" /> : <CheckIcon className="h-3.5 w-3.5" />}
                </span>
              </div>
              <div className="min-w-0 pt-1">
                <p className={`text-[22px] font-black leading-tight ${style.text}`}>{overridden ? "Tamam, doğru saydım" : style.title}</p>
                <p className={`mt-0.5 text-[16px] font-bold leading-snug ${style.text}`}>{detail}</p>
                {verdict.tone === "wrong" && typed && !overridden && (
                  <button
                    type="button"
                    onClick={() => setOverridden(true)}
                    className="mt-1.5 text-[12px] font-black uppercase tracking-[0.08em] text-berry-ink underline decoration-berry/40 decoration-2 underline-offset-4"
                  >
                    Yazdığım da doğruydu
                  </button>
                )}
              </div>
              <SpeakButton text={card.front} size="sm" className="ml-auto !bg-white !text-(--c-ink) !shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.1)]" />
            </div>
            <button type="button" onClick={next} autoFocus className={`${BIG} ${style.button} focus-visible:ring-ocean/30`}>
              Devam
            </button>
          </BottomBar>
        )
      )}
    </div>
  );
}

/* --------------------------------------------------------------- write -- */

/**
 * After a word from an earlier day is got right in the exercises: a
 * sentence of the learner's own. Writing it is the strongest thing they can
 * do for the memory, and from then on the exercises blank the word out of it.
 */
function WriteStep({ card, deckId, onSaved, onDone }: { card: Card; deckId: string; onSaved: (card: Card) => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const [warned, setWarned] = useState(false);
  const example = anchorOf(card);
  const save = useMutation({
    mutationFn: (sentence: string) => api.put<{ card: Card }>(`/decks/${deckId}/cards/${card.id}`, { front: card.front, back: card.back, mySentence: sentence }),
    onSuccess: (data) => {
      playCorrect(3);
      onSaved(data.card);
      onDone();
    },
  });

  useEffect(() => {
    tellTonton("card", { front: card.front, flipped: false });
  }, [card.front]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const sentence = text.trim();
    if (!sentence) return;
    if (!splitOnWord(sentence, card.front) && !warned) {
      setWarned(true);
      return;
    }
    save.mutate(sentence);
  };

  return (
    <form onSubmit={submit} className="mt-6 animate-[card-rise_420ms_var(--ease-spring)]" style={tintStyle(card)}>
      <p className="w-max rounded-full bg-sunny-soft px-3 py-1 text-[12px] font-black uppercase tracking-[0.1em] text-sunny-ink">{KIND_LABEL.write}</p>
      <h2 className="mt-3 text-[30px] font-black leading-[1.05] tracking-[-0.02em] text-ink">
        <span className="rounded-lg tint-ground px-1.5 text-white">{card.front}</span> ile bir cümle kur
      </h2>
      <TontonLine mood="happy" size={54} className="mt-4">
        Kendi hayatından bir cümle kur: her gün yaptığın, şu an olan ya da yakında olacak bir şey (I usually… · I'm …-ing · I'm going to …). İleride bu cümleyi sana boşluklu soracağım.
      </TontonLine>
      {example && (
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] font-black uppercase tracking-[0.1em] text-graphite">Örnek</p>
          <ExampleBubble en={example.en} tr={example.tr} headword={card.front} meaning={example.gloss} size="sm" />
        </div>
      )}
      <label htmlFor={`sentence-${card.id}`} className="sr-only">
        Cümlen
      </label>
      <textarea
        id={`sentence-${card.id}`}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setWarned(false);
        }}
        rows={3}
        maxLength={300}
        autoCapitalize="sentences"
        autoCorrect="off"
        spellCheck={false}
        placeholder={`I … ${card.front} …`}
        className="mt-4 w-full resize-none rounded-2xl border-2 border-rule bg-paper-deep px-4 py-3.5 text-[19px] font-bold leading-snug text-ink outline-none transition-colors placeholder:font-semibold placeholder:text-hare focus:border-sunny-deep focus:bg-white"
      />
      {warned && (
        <p role="alert" className="mt-2 text-[14px] font-bold text-sunny-ink">
          Cümlede “{card.front}” göremedim. Yine de kaydedeyim mi? Bir daha bas.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="mt-2 text-[14px] font-bold text-berry-ink">
          Kaydedilemedi. Bağlantını kontrol edip bir daha dene.
        </p>
      )}
      <BottomBar>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onDone} className="shrink-0">
            Şimdi değil
          </Button>
          <button type="submit" disabled={!text.trim() || save.isPending} className={`${BIG} bg-grass focus-visible:ring-grass/40`}>
            {save.isPending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </BottomBar>
    </form>
  );
}

/* ------------------------------------------------------------- session -- */

/** A write to the schedule: a graded review, or a new word's one learning write. */
type ReviewWrite = { cardId: number; quality: Grade; kind: string; phase: "learn" | "review"; direction?: Direction; thinkMs?: number };

/** Think time as the server takes it: whole milliseconds, ten minutes at most. */
const thinkOf = (ms: number | null): number | undefined => (ms === null ? undefined : Math.min(600_000, Math.max(0, Math.round(ms))));

/** Three fronts in a row turned faster than this, and the next caption asks for a moment. */
const RUSHED_MS = 1500;

function Session({
  deckId,
  cards,
  mode,
  fillers = [],
  focusIds = [],
}: {
  deckId: string;
  cards: Card[];
  mode: SessionMode;
  /** Words not due, to flip between a new word's steps when nothing else is left. */
  fillers?: Card[];
  /** Words the exercises start with. */
  focusIds?: number[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: recordStudyDay } = useRecordStudyDay();
  const { mutate: logPractice } = usePractice(deckId);

  // Snapshotted at the start; a saved sentence updates its card in place.
  const [byId, setById] = useState(() => new Map([...fillers, ...cards].map((card) => [card.id, card])));
  const [plan, setPlan] = useState<Exercise[]>(() =>
    mode === "drill"
      ? buildDrill(cards[0])
      : mode === "exercises"
        ? buildExercises(cards, { speech: speechSupported && !isSpeechMuted(), focusIds })
        : buildSession(cards, { mode, fillers }),
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, Result>>({});
  // Cards passed without an answer at least once; the summary names the ones never answered.
  const [skipped, setSkipped] = useState<ReadonlySet<number>>(() => new Set());
  // New words the server turned away: the day's three were already in (a course lesson, another phone).
  const [refused, setRefused] = useState<ReadonlySet<number>>(() => new Set());
  // How long the last three fronts were up before they were turned.
  const [thinks, setThinks] = useState<number[]>([]);
  // The exercises' typed first tries, and how many of them were right.
  const [typed, setTyped] = useState({ n: 0, right: 0 });
  const answeredRef = useRef(new Set<number>());
  const askedSentenceRef = useRef(new Set<number>());
  // Each new word's learning steps so far, and each missed word's extra asks (learning.ts).
  const learningRef = useRef(new Map<number, LearnState>());
  const tallyRef = useRef(new Map<number, Tally>());
  // New words already written (or refused) this round: each is written once.
  const writtenRef = useRef(new Set<number>());
  const answeredAnyRef = useRef(false);
  const finishedRef = useRef(false);
  const touchedRef = useRef(false);
  const runRef = useRef(0);

  const review = useMutation({
    mutationFn: ({ cardId, ...body }: ReviewWrite) => api.post<{ card: Card }>(`/decks/${deckId}/cards/${cardId}/review`, body),
    // The day's new words already used up (409) isn't a hiccup: asking again gets the same answer.
    retry: (count, error) => !(error instanceof ApiError && error.status === 409) && count < 2,
    onSuccess: (data, { cardId }) => {
      if (!data?.card) return;
      setResults((r) => (r[cardId] ? { ...r, [cardId]: { ...r[cardId], after: data.card } } : r));
    },
    onError: (error, { cardId }) => {
      if (error instanceof ApiError && error.status === 409) {
        // Refused, nothing written: the word stays unwritten and is met again another day.
        setResults((r) => {
          const next = { ...r };
          delete next[cardId];
          return next;
        });
        setRefused((s) => new Set(s).add(cardId));
        return;
      }
      setResults((r) => (r[cardId] ? { ...r, [cardId]: { ...r[cardId], failed: true } } : r));
    },
  });
  const { mutate: sendReview } = review;

  /**
   * An answer the schedule doesn't count, logged apart so the numbers stay
   * honest. A missed exercise asked again goes in as its retry ("cloze-retry"):
   * the typed tally counts first tries, as the summary does.
   */
  const log = useCallback(
    (step: Exercise, quality: Grade, phase: PracticePhase, thinkMs?: number) => {
      touchedRef.current = true;
      const kind = (phase === "exercise" || phase === "drill") && step.attempt > 0 ? `${step.kind}-retry` : step.kind;
      logPractice({ cardId: step.cardId, quality, kind, phase, direction: step.direction, thinkMs });
    },
    [logPractice],
  );

  // Leaving: the new words asked but not written yet go in as not learned
  // (back tomorrow), once each; then the deck's lists and plan refresh.
  useEffect(() => {
    const learning = learningRef.current;
    const written = writtenRef.current;
    return () => {
      const pending = takeUnwritten(learning, written).map((cardId) =>
        api.post(`/decks/${deckId}/cards/${cardId}/review`, { quality: 1, kind: "learn", phase: "learn" }).catch(() => null),
      );
      if (pending.length > 0) touchedRef.current = true;
      if (!touchedRef.current) return;
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
        queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
        queryClient.invalidateQueries({ queryKey: ["deckStats", deckId] });
        queryClient.invalidateQueries({ queryKey: ["plan", deckId] });
      };
      refresh();
      if (pending.length > 0) void Promise.all(pending).then(refresh);
    };
  }, [queryClient, deckId]);

  const step = plan[index];
  const card = step ? byId.get(step.cardId) : undefined;
  const finished = index >= plan.length;
  const counter = `${Math.min(index + 1, plan.length)} / ${plan.length}`;
  const rushed = thinks.length >= 3 && thinks.every((ms) => ms < RUSHED_MS);

  /**
   * The round is over: the new words asked but never got twice are written
   * as not learned yet, and the day counts for the streak — a finished
   * round, not a started one, lights it (the drill doesn't count).
   */
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const unwritten = takeUnwritten(learningRef.current, writtenRef.current);
    if (unwritten.length > 0) {
      touchedRef.current = true;
      for (const cardId of unwritten) sendReview({ cardId, quality: 1, kind: "learn", phase: "learn" });
      setResults((r) => {
        const next = { ...r };
        for (const cardId of unwritten) {
          const before = byId.get(cardId);
          if (before) next[cardId] = { grade: 1, graded: true, before, after: null };
        }
        return next;
      });
    }
    if (mode !== "drill" && answeredAnyRef.current) recordStudyDay();
  }, [byId, mode, recordStudyDay, sendReview]);

  /**
   * On to the next step, with the plan as the answer left it — from the top
   * of the page: a meeting that scrolled down to its meaning would otherwise
   * open the next card with its counter and the way out above the screen.
   */
  const advance = useCallback(
    (next: Exercise[]) => {
      if (next !== plan) setPlan(next);
      setIndex((i) => i + 1);
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
      if (index + 1 >= next.length) finish();
    },
    [plan, index, finish],
  );

  /** Every step ends here: a grade for the ones that ask, null for meeting and writing. */
  const settle = useCallback(
    (grade: Grade | null, thinkMs: number | null = null) => {
      if (!step || !card) return;
      let next = plan;
      if (grade !== null) {
        answeredAnyRef.current = true;
        if (grade === 1) runRef.current = 0;
        else runRef.current += 1;
        tellTonton("grade", { quality: grade, front: card.front, attempt: step.attempt, index, total: plan.length });
        const think = thinkOf(thinkMs);
        const onCards = mode === "due" || mode === "all";

        if (step.learn) {
          // A new word's learning step: never graded itself; the word is written once, at its second right answer.
          const outcome = afterLearnAnswer(plan, index, step, grade, learningRef.current.get(card.id));
          learningRef.current.set(card.id, outcome.state);
          next = outcome.plan;
          log(step, grade, "learn-step", think);
          const quality = outcome.write;
          if (quality && !writtenRef.current.has(card.id)) {
            writtenRef.current.add(card.id);
            touchedRef.current = true;
            setResults((r) => ({ ...r, [card.id]: { grade: quality, graded: true, before: card, after: null } }));
            sendReview({ cardId: card.id, quality, kind: "learn", phase: "learn", direction: "fwd", thinkMs: think });
          }
        } else {
          const first = !answeredRef.current.has(card.id);
          if (first) {
            answeredRef.current.add(card.id);
            setResults((r) => ({ ...r, [card.id]: { grade, graded: step.graded, before: card, after: null } }));
          }
          if (first && step.graded) {
            touchedRef.current = true;
            sendReview({ cardId: card.id, quality: grade, kind: step.kind, phase: "review", direction: step.direction ?? "fwd", thinkMs: think });
          } else {
            const phase: PracticePhase = !onCards ? (mode === "drill" ? "drill" : "exercise") : step.relearn ? "relearn" : step.filler ? "filler" : "practice";
            log(step, grade, phase, think);
          }

          if (onCards) {
            // A missed card comes back twice more in the round: with its sentence, then without.
            const outcome = afterReviewAnswer(plan, index, step, grade, tallyRef.current.get(card.id));
            tallyRef.current.set(card.id, outcome.tally);
            next = outcome.plan;
          } else {
            if (mode === "exercises" && step.attempt === 0 && TYPED_KINDS.has(step.kind)) setTyped((t) => ({ n: t.n + 1, right: t.right + (grade >= 4 ? 1 : 0) }));
            if (grade === 1) {
              // A missed exercise comes back as the same question, once — never next to the word's other one.
              const again = retryOf(step);
              if (again) next = placeApart(next, index, again);
            } else if (
              // A word from an earlier day just got right is the moment to write a sentence of your own with it.
              mode === "exercises" &&
              grade >= 4 &&
              wantsOwnSentence(card) &&
              !askedSentenceRef.current.has(card.id) &&
              askedSentenceRef.current.size < MAX_WRITES
            ) {
              askedSentenceRef.current.add(card.id);
              next = insertLater(next, index, writeStep(card), 0);
            }
          }
        }
      }
      advance(next);
    },
    [step, card, plan, index, mode, log, sendReview, advance],
  );

  /** "Geç": no grade, nothing written; the card comes back at the end once. */
  const skip = useCallback(() => {
    if (!step || !card) return;
    setSkipped((s) => new Set(s).add(card.id));
    advance(skipStep(plan, index));
  }, [step, card, plan, index, advance]);

  const onFlipGrade = useCallback(
    (grade: Grade, thinkMs: number | null) => {
      if (grade === 1) playIncorrect();
      else playCorrect(runRef.current + 1);
      if (thinkMs !== null) setThinks((t) => [...t, thinkMs].slice(-3));
      settle(grade, thinkMs);
    },
    [settle],
  );

  const onSaved = useCallback(
    (updated: Card) => {
      touchedRef.current = true;
      setById((map) => new Map(map).set(updated.id, { ...map.get(updated.id), ...updated }));
    },
    [],
  );

  const exitTo = mode === "drill" && cards[0] ? `/decks/${deckId}/words/${cards[0].id}` : "/kartlar";

  if (finished) {
    // What the exercises could ask now: the words met before the round (the
    // whole deck rides along as fillers in a 'due' round) and the ones written today.
    const pool = [...byId.values()].filter((c) => hasStarted(c) || results[c.id]?.graded).length;
    return (
      <Summary
        deckId={deckId}
        cards={[...new Map(plan.map((s) => [s.cardId, byId.get(s.cardId)])).values()].filter((c): c is Card => Boolean(c))}
        results={results}
        skipped={skipped}
        refused={refused}
        mode={mode}
        typed={typed}
        pool={pool}
        exitTo={exitTo}
        onGo={(to) => {
          if (to.includes("mode=exercises")) {
            // Straight on to the exercises: the words just written go in as the server
            // returned them, so today's new ones are there before the list refetches.
            const written = new Map(Object.values(results).flatMap((r) => (r.after ? [[r.after.id, r.after] as const] : [])));
            queryClient.setQueryData<Card[]>(["cards", deckId], (list) => list?.map((c) => ({ ...c, ...written.get(c.id) })));
            navigate(to, { replace: true });
          } else navigate(to);
        }}
      />
    );
  }
  if (!step || !card) return null;

  return (
    <>
      <ProgressRule index={index} total={plan.length} exitTo={exitTo} />
      {step.kind === "meet" ? (
        <MeetStep key={step.key} card={card} counter={counter} onDone={() => settle(null)} />
      ) : step.kind === "write" ? (
        <WriteStep key={step.key} card={card} deckId={deckId} onSaved={onSaved} onDone={() => settle(null)} />
      ) : TYPED_KINDS.has(step.kind) ? (
        <TypedStep key={step.key} card={card} step={step} counter={counter} onDone={settle} onSkip={skip} />
      ) : (
        <FlipStep key={step.key} card={card} step={step} counter={counter} remaining={plan.length - index} rushed={rushed} onGrade={onFlipGrade} onSkip={skip} />
      )}
    </>
  );
}

/* ------------------------------------------------------------- summary -- */

/** A number counting up to its target over 600ms, easing out; timer-driven only. */
function useCountUp(target: number, ms = 600): number {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = reducedMotion() ? 1 : Math.min(1, (now - start) / ms);
      setShown(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return shown;
}

/** When a weak word is asked again, as the schedule set it: most come back tomorrow; a hard review may hold its gap. */
function againLine(result: Result | undefined): string {
  const next = result?.after ? nextReview(result.after) : null;
  return !next || next.text === "Yarın" ? "yarın yine" : `${next.text.toLocaleLowerCase("tr")} yine`;
}

/** The words worth another go before tomorrow, each with its meaning: the exercises below start with them. */
function WeakWords({ cards, results }: { cards: Card[]; results: Record<number, Result> }) {
  return (
    <section aria-labelledby="weak-heading" className="card-3d mt-6 rounded-[20px] p-4 text-left animate-rise-in" style={delay(160)}>
      <h3 id="weak-heading" className="text-[13px] font-black uppercase tracking-[0.1em] text-graphite">
        Biraz daha çalışalım
      </h3>
      <ul className="mt-2.5 space-y-2">
        {cards.map((c) => (
          <li key={c.id} style={tintStyle(c)} className="flex items-center gap-3">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl tint-ground text-[16px] font-black uppercase text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.18)]">
              {c.front.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-black leading-tight text-ink">{c.front}</p>
              <p className="line-clamp-2 wrap-break-word text-[13px] font-semibold leading-snug text-graphite">{coreGloss(c)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-tangerine-soft px-2 py-0.5 text-[11px] font-black text-tangerine-ink">{againLine(results[c.id])}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Summary({
  deckId,
  cards,
  results,
  skipped,
  refused,
  mode,
  typed,
  pool,
  exitTo,
  onGo,
}: {
  deckId: string;
  cards: Card[];
  results: Record<number, Result>;
  skipped: ReadonlySet<number>;
  /** New words the server turned away: the day's three were already in. */
  refused: ReadonlySet<number>;
  mode: SessionMode;
  /** The exercises' typed first tries, and how many were right. */
  typed: { n: number; right: number };
  /** Words met by now: what the exercises can ask. */
  pool: number;
  exitTo: string;
  onGo: (to: string) => void;
}) {
  const view = summaryView({ cards, results, mode, deckId, exitTo, skipped, typed, pool });
  const firsts = Object.values(results);
  const known = firsts.filter((r) => r.grade >= 4).length;
  const hard = firsts.filter((r) => r.grade === 3).length;
  const missed = firsts.filter((r) => r.grade === 1).length;
  const perfect = missed === 0 && hard === 0 && known > 0;
  const handoff = view.secondary;
  const shownKnown = useCountUp(known);
  const shownHard = useCountUp(hard);
  const shownMissed = useCountUp(missed);

  useEffect(() => {
    playLessonComplete();
    window.dispatchEvent(new CustomEvent("tonton:summary", { detail: { known, hard, missed } }));
    // A summary is mounted once; the counts are fixed by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pt-4 text-center animate-rise-in">
      {perfect && known >= 3 && <Confetti />}
      <Mascot mood={missed === 0 ? "happy" : "idle"} size={120} greet className="mx-auto" />
      <h2 className="mt-3 text-[32px] font-black leading-tight tracking-[-0.02em] text-sunny-deep">{view.title}</h2>
      <p className="mx-auto mt-2 max-w-[22rem] text-[16px] font-bold leading-snug text-ink">{view.line}</p>

      {/* The day's cards are done: on to the exercises, the weak words first. */}
      {view.weak.length > 0 && <WeakWords cards={view.weak} results={results} />}
      {handoff && (
        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => onGo(view.primary.to)}
            className={`${BIG} gap-2 bg-grass px-3 focus-visible:ring-grass/40 max-[359px]:text-[14px] max-[359px]:tracking-[0.04em]`}
          >
            <PencilIcon className="h-5 w-5 shrink-0 max-[359px]:hidden" />
            {view.primary.label}
          </button>
          <button
            type="button"
            onClick={() => onGo(handoff.to)}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-rule bg-white text-[15px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
          >
            {handoff.label}
          </button>
        </div>
      )}
      {mode === "due" && firsts.length > 0 && (
        <div className="mt-6">
          <ReminderCard variant="prompt" defaultHour={22} />
        </div>
      )}

      <dl className="mt-6 grid grid-cols-3 gap-2.5">
        {(
          [
            [shownKnown, "Bildin", "border-grass", "bg-grass", "text-grass-ink"],
            [shownHard, "Zorlandın", "border-tangerine", "bg-tangerine", "text-tangerine-ink"],
            [shownMissed, "Kaçtı", "border-berry", "bg-berry", "text-berry-ink"],
          ] as const
        ).map(([n, label, border, head, ink], i) => (
          <div key={label} className={`overflow-hidden rounded-2xl border-2 ${border} animate-rise-spring`} style={delay(200 + i * 120)}>
            <dt className={`${head} py-1 text-[12px] font-black uppercase tracking-[0.1em] text-white`}>{label}</dt>
            <dd className={`grid min-h-14 place-items-center bg-white text-[28px] font-black tabular-nums ${ink}`}>{n}</dd>
          </div>
        ))}
      </dl>

      {/* Every word, where it now stands, and when it comes back — the schedule made visible. */}
      <ul className="mt-6 space-y-2 text-left">
        {cards.map((c, i) => {
          const result = results[c.id];
          const fresh = !hasStarted(c);
          const after = result?.after ?? null;
          const before = stageOf(c);
          const now = after ? stageOf(after) : null;
          const next = after ? nextReview(after) : null;
          return (
            <li key={c.id} style={{ ...tintStyle(c), ...delay(300 + Math.min(i, 8) * 60) }} className="card-3d flex items-center gap-3 rounded-2xl px-3 py-2.5 animate-rise-in">
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl tint-ground text-[18px] font-black uppercase text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.18)]">
                {c.front.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-black leading-tight text-ink">{c.front}</p>
                <p className="line-clamp-2 wrap-break-word text-[13px] font-semibold leading-snug text-graphite">{coreGloss(c)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] font-black tabular-nums">
                {!result && skipped.has(c.id) ? (
                  <span className="rounded-full bg-paper-deep px-2 py-0.5 text-graphite">geçildi · sırada</span>
                ) : !result && refused.has(c.id) ? (
                  <span className="rounded-full bg-paper-deep px-2 py-0.5 text-graphite">bugünün 3'ü doldu · yarın</span>
                ) : !result && fresh && mode === "due" ? (
                  // Met but not asked twice: it is met again next time.
                  <span className="rounded-full bg-paper-deep px-2 py-0.5 text-graphite">yarım kaldı · sırada</span>
                ) : result && !result.graded ? (
                  <span className="rounded-full bg-paper-deep px-2 py-0.5 text-graphite">{mode === "exercises" ? "egzersiz" : "alıştırma"}</span>
                ) : result?.failed ? (
                  <span className="rounded-full bg-berry-soft px-2 py-0.5 text-berry-ink">kaydedilemedi</span>
                ) : fresh && result?.grade === 1 ? (
                  <span className="rounded-full bg-tangerine-soft px-2 py-0.5 text-tangerine-ink">yarın yeniden</span>
                ) : next && now ? (
                  <>
                    <span className={`rounded-full px-2 py-0.5 ${TONE_PILL[next.tone]}`}>
                      {/* A miss is back tomorrow anyway; only a sooner return (the old ten minutes) needs "yarın yine" after it. */}
                      {result?.grade === 1 && next.text !== "Yarın" ? `${next.text}, yarın yine` : next.text}
                    </span>
                    {now !== before && (
                      <span className={`rounded-full px-2 py-0.5 ${STAGE_PILL[now]}`}>
                        {STAGE_LABEL[before]} → {STAGE_LABEL[now]}
                      </span>
                    )}
                  </>
                ) : result ? (
                  <span className="text-graphite">kaydediliyor…</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {!handoff && (
        <button type="button" onClick={() => onGo(view.primary.to)} className={`${BIG} mt-8 bg-grass focus-visible:ring-grass/40`}>
          {view.primary.label}
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- page -- */

function Flashcards() {
  const { deckId = "" } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const drillId = searchParams.get("card");
  const asked = searchParams.get("mode");
  const mode: SessionMode = drillId ? "drill" : asked === "exercises" ? "exercises" : asked === "all" ? "all" : "due";
  // The exercises can be pointed at words: ?focus=12,34 (the summary's weak ones).
  const focusIds = (searchParams.get("focus") ?? "")
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

  const cardsQuery = useQuery({
    queryKey: ["cards", deckId],
    queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deckId}/cards`).then((r) => r.cards),
    enabled: deckId !== "",
  });
  const dueQuery = useQuery({
    queryKey: ["dueCards", deckId],
    queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deckId}/cards/due`).then((r) => r.cards),
    enabled: deckId !== "" && mode === "due",
    staleTime: Infinity,
    refetchOnMount: "always",
    refetchOnReconnect: false,
  });

  const loading = cardsQuery.isLoading || (mode === "due" && (!dueQuery.data || dueQuery.isFetching));
  // Going through the cards takes twenty words already met, the ones not
  // seen today first (lib/plan.ts): a word in the queue is met on the day's
  // round, three a day, never here. The exercises take the words already met
  // and pick their own order (practice.ts); the drill, one word already met
  // (a link to a word still in the queue would teach it outside the three).
  const all = cardsQuery.data ?? [];
  const cards =
    mode === "drill"
      ? all.filter((c) => String(c.id) === drillId && hasStarted(c))
      : mode === "all"
        ? flipOrder(all)
        : mode === "exercises"
          ? all.filter(hasStarted)
          : (dueQuery.data ?? []);
  const anyMet = all.some(hasStarted);
  // Nothing to go through yet, because nothing is met: "Önce kartlar".
  const metFirst = !loading && !cardsQuery.isError && cards.length === 0 && (mode === "drill" ? all.some((c) => String(c.id) === drillId) : mode !== "due" && all.length > 0);
  // Read only for the empty screens: whether today's round still has new words to meet.
  const plan = usePlan(metFirst ? { id: deckId } : undefined).data;
  const noneToday = plan !== undefined && plan.newIds.length === 0 && plan.reviewsDue === 0;

  if (!deckId) return <Navigate to="/kartlar" replace />;

  return (
    <div className="min-h-screen">
      {/* A session is a room of its own: no header, just the rule and the card. */}
      <main className="mx-auto max-w-2xl px-5 pb-40 pt-[max(1rem,env(safe-area-inset-top))]">
        {(cardsQuery.isError || dueQuery.isError) && (
          <div className="pt-6">
            <ErrorState
              title="Kartlar yüklenemedi"
              message="Bağlantını kontrol edip tekrar dene."
              onRetry={() => {
                void cardsQuery.refetch();
                void dueQuery.refetch();
              }}
            />
          </div>
        )}
        {!cardsQuery.isError && loading && (
          <div className="space-y-3 pt-3">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="mt-8 h-[36rem] max-h-[calc(100dvh-16rem)] w-full rounded-[24px]" />
          </div>
        )}
        {metFirst && (
          <div className="pt-6">
            <EmptyState
              emoji="🃏"
              title="Önce kartlar"
              description={`${
                mode === "exercises"
                  ? "Önce kartlarda yeni kelimelerle tanış; egzersizler sonra açılır."
                  : mode === "drill"
                    ? "Bu kelimeyle önce kartlarda tanış; sırası gelince burada alıştırırsın."
                    : "Önce kartlarda yeni kelimelerle tanış; tanıştıklarını burada istediğin zaman çevirirsin."
              }${noneToday ? " Bugünün yeni kelimeleri tamam; yenileriyle yarın tanışırsın." : ""}`}
              action={
                // With no new word left for today, "Tekrar et" would open an empty round.
                noneToday ? (
                  <LinkButton to="/kartlar" variant="go">
                    Kartlarım
                  </LinkButton>
                ) : (
                  <LinkButton to={`/decks/${deckId}/flashcards`} variant="go" onClick={primeSpeech}>
                    Tekrar et
                  </LinkButton>
                )
              }
            />
          </div>
        )}
        {!loading && !cardsQuery.isError && cards.length === 0 && !metFirst && (
          <div className="pt-6">
            <EmptyState
              emoji={mode === "due" ? "🎉" : "🃏"}
              title={mode === "due" ? "Bugünlük tamam" : "Henüz kartın yok"}
              description={
                mode !== "due"
                  ? "Bir kelime ekle, kartın hazır olsun."
                  : anyMet
                    ? "Şu an sırası gelen kelime yok. İstersen kartlara yine de bak ya da egzersiz yap; takvim değişmez."
                    : all.length > 0
                      ? "Şu an sırası gelen kelime yok. Bugünün yeni kelimeleri tamam; yenileriyle yarın tanışırsın."
                      : "Şu an sırası gelen kelime yok."
              }
              action={
                // Flipping and the exercises take words already met: with none, both would be empty.
                mode === "due" && anyMet ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <LinkButton to={`/decks/${deckId}/flashcards?mode=all`} variant="go" onClick={primeSpeech}>
                      Kartları çalış
                    </LinkButton>
                    <LinkButton to={`/decks/${deckId}/flashcards?mode=exercises`} variant="outline" onClick={primeSpeech}>
                      Egzersiz yap
                    </LinkButton>
                  </div>
                ) : (
                  <LinkButton to="/kartlar" variant="go">
                    Kartlarım
                  </LinkButton>
                )
              }
            />
          </div>
        )}
        {!loading && !cardsQuery.isError && cards.length > 0 && (
          <div className="pt-2">
            <Session
              key={`${deckId}-${mode}-${drillId ?? ""}`}
              deckId={deckId}
              cards={cards}
              mode={mode}
              fillers={mode === "due" ? cardsQuery.data : undefined}
              focusIds={focusIds}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default Flashcards;
