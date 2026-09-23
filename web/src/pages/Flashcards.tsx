import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { isSpeechMuted, primeSpeech, speak, speakAuto, speechSupported } from "../lib/speech";
import { playCorrect, playIncorrect, playLessonComplete, playReveal } from "../lib/sound";
import { useRecordStudyDay } from "../lib/streak";
import { tintStyle } from "../lib/tint";
import { familyAt, familyStyle } from "../lib/palette";
import { STAGE_LABEL, byNextReview, isLeech, nextReview, stageOf } from "../lib/memory";
import { STAGE_PILL, TONE_PILL } from "../lib/stageStyle";
import {
  KIND_LABEL,
  TYPED_KINDS,
  buildDrill,
  buildSession,
  checkAnswer,
  expectedAnswer,
  insertLater,
  letterPattern,
  repeatOf,
  sentencesOf,
  writeStep,
  type Exercise,
  type Gap,
  type Kind,
  type Verdict,
} from "../lib/practice";
import { splitOnWord } from "../lib/sentence";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import Mascot, { type MascotMood } from "../components/Mascot";
import SpeakButton from "../components/SpeakButton";
import Sheet from "../components/Sheet";
import WordCardBack, { ExampleBubble, PosPill } from "../components/WordCardBack";
import Cover from "../components/Cover";
import StrengthBars from "../components/StrengthBars";
import TontonLine from "../components/TontonLine";
import Confetti from "../components/Confetti";
import { CheckIcon, SpeakerIcon, XIcon } from "../components/icons";

/**
 * "Tekrar et": the learner's own words, asked the way each one needs.
 *
 * A new word is met first — its sentence, a guess, then the meaning — and
 * asked a few cards later. A word still being learned is flipped: see it,
 * recall the Turkish, turn it over, say honestly how it went (swipe right
 * for Bildim, left for Bilemedim, up for Zorlandım). A word that holds has
 * to be produced — typed from its Turkish, into its sentence, into a chunk,
 * into the learner's own sentence — and the app marks it. A miss comes back
 * a few cards later until it's got; only the first answer is written to
 * the schedule. The rules live in lib/practice.ts; this is the screen.
 *
 * Tonton sits on the screen with each question (his line changes with the
 * step and his face with the answer), and the director hears about every
 * card and grade through `tonton:*` window events.
 */

type Grade = 1 | 3 | 4 | 5;
type SessionMode = "due" | "all" | "drill";
/** A card's first answer this session, and what the schedule made of it. */
type Result = { grade: Grade; graded: boolean; before: Card; after: Card | null; failed?: boolean };

/** Sentences asked for in one session, at most: each takes a minute, and the session is fifteen. */
const MAX_WRITES = 3;
/** Words in one free-practice session. */
const PRACTICE_LIMIT = 20;

/** Each verdict's colour, once: red missed it, orange was hard, green knew it. */
const GRADES: { grade: Grade; label: string; button: string; stamp: string; wash: string; key: string; arrow: string }[] = [
  { grade: 1, label: "Bilemedim", button: "bg-berry", stamp: "border-berry text-berry-ink", wash: "bg-berry/15", key: "1", arrow: "ArrowLeft" },
  { grade: 3, label: "Zorlandım", button: "bg-tangerine", stamp: "border-tangerine text-tangerine-ink", wash: "bg-tangerine/15", key: "2", arrow: "ArrowUp" },
  { grade: 5, label: "Bildim", button: "bg-grass", stamp: "border-grass text-grass-ink", wash: "bg-grass/15", key: "3", arrow: "ArrowRight" },
];
const gradeOf = (grade: Grade) => GRADES.find((g) => g.grade === grade) ?? GRADES[0];

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
/** A white speaker on a coloured cover, its icon in the word's own ink. */
const COVER_SPEAKER = "!h-12 !w-12 !bg-white !text-(--c-ink) !shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.12)]";

function tellTonton(name: "card" | "grade", detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent(`tonton:${name}`, { detail }));
}

/** The word's meanings, one per sense, or the short gloss for a plain card. */
function meaningsOf(card: Card): { pos: string | null; meaning: string }[] {
  if (card.senses && card.senses.length > 0) return card.senses.map((s) => ({ pos: s.pos ?? null, meaning: s.meaning }));
  const { pos, text } = parseBack(card.back);
  return [{ pos, meaning: text }];
}

/** The one sentence a card's back has room for (see FlipStep). */
function backSentence(card: Card): { en: string; tr: string | null; meaning: string } | null {
  const senses = card.senses ?? [];
  if (senses.length > 2) {
    let best: { en: string; tr: string | null; meaning: string } | null = null;
    for (const sense of senses) {
      const lines = [{ en: sense.example_en, tr: sense.example_tr }, ...(sense.examples ?? [])];
      for (const line of lines) {
        const en = line.en?.trim();
        if (en && splitOnWord(en, card.front) && (!best || en.length < best.en.length)) best = { en, tr: line.tr?.trim() || null, meaning: sense.meaning };
      }
    }
    if (best) return best;
  }
  const first = sentencesOf(card)[0];
  return first ? { ...first, meaning: meaningsOf(card)[0]?.meaning ?? "" } : null;
}

/**
 * The meanings as a numbered list, each number in its sense's colour — the
 * same colours the word's page gives its senses, so meaning 2 is always the
 * green one.
 */
function Meanings({ card, animate, large = true }: { card: Card; animate: boolean; large?: boolean }) {
  const meanings = meaningsOf(card);
  const mixedTypes = new Set(meanings.map((m) => m.pos ?? "")).size > 1;
  // Three senses or more: a tighter list, so the card still has room for a sentence.
  const tight = meanings.length > 2;
  if (meanings.length === 1 && large) {
    return (
      <p className={`wrap-break-word text-[28px] font-black leading-[1.12] tracking-[-0.01em] text-ink ${animate ? "animate-rise-in" : ""}`} style={delay(200)}>
        {meanings[0].meaning}
      </p>
    );
  }
  return (
    <ol className={tight ? "space-y-1.5" : "space-y-2.5"}>
      {meanings.map((m, i) => (
        <li
          key={i}
          style={{ ...familyStyle(familyAt(i)), ...delay(200 + Math.min(i, 6) * 60) }}
          className={`flex items-start gap-3 ${animate ? "animate-rise-in" : ""}`}
        >
          <span
            className={`grid shrink-0 place-items-center rounded-full bg-(--c) font-black text-white shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.15)] ${
              tight ? "mt-px h-6 w-6 text-[12px]" : "mt-0.5 h-7 w-7 text-[13px]"
            }`}
          >
            {i + 1}
          </span>
          <p className={`min-w-0 font-black text-ink ${tight ? "text-[17px] leading-tight" : "text-[19px] leading-snug"}`}>
            {m.meaning}
            {m.pos && mixedTypes && <PosPill pos={m.pos} className={`ml-1.5 align-middle ${tight ? "!px-2 !py-0 !text-[11px]" : ""}`} />}
          </p>
        </li>
      ))}
    </ol>
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
 * Meeting a word: the word, then the word at work in a sentence, and a
 * moment to guess what it means before it's shown. A guess — even a wrong
 * one — makes the meaning land harder than being told outright.
 */
function MeetStep({ card, counter, onDone }: { card: Card; counter: string; onDone: () => void }) {
  const line = sentencesOf(card)[0] ?? null;
  const [revealed, setRevealed] = useState(!line);
  const meaningRef = useRef<HTMLDivElement>(null);
  const { pos } = parseBack(card.back);
  const firstPos = pos ?? card.senses?.[0]?.pos ?? null;
  const meanings = meaningsOf(card);
  const chunk = card.collocations?.[0] ?? null;

  useEffect(() => {
    speakAuto(card.front);
    tellTonton("card", { front: card.front, flipped: false });
  }, [card.front]);

  const reveal = useCallback(() => {
    playReveal();
    setRevealed(true);
    // The meanings open below the fold on a phone: bring them up.
    window.setTimeout(() => meaningRef.current?.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" }), 60);
  }, []);

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
      <Cover card={card} label={KIND_LABEL.meet} counter={counter} ornament={card.front.charAt(0)} className="min-h-[13rem]">
        <div className="mt-auto pt-8">
          {firstPos && <PosPill pos={firstPos} className="mb-2 !bg-white/25 !text-white" />}
          <div className="flex items-end justify-between gap-3">
            <h2 className={`min-w-0 wrap-break-word font-black leading-[0.95] tracking-[-0.025em] ${card.front.length > 11 ? "text-[38px]" : "text-[48px]"}`}>{card.front}</h2>
            <SpeakButton text={card.front} size="md" className={COVER_SPEAKER} />
          </div>
        </div>
      </Cover>

      <div className="mt-4 space-y-3">
        {line && <ExampleBubble en={line.en} tr={revealed ? line.tr : null} headword={card.front} meaning={meanings[0]?.meaning ?? ""} />}

        {!revealed ? (
          <TontonLine mood="think" size={54}>
            Cümleye bak: sence ne demek? Bir tahmin geçir aklından, sonra aç.
          </TontonLine>
        ) : (
          <>
            <section ref={meaningRef} className="card-3d scroll-mb-40 rounded-[22px] p-4">
              <p className="mb-2.5 text-[13px] font-black uppercase tracking-[0.1em] text-graphite">Anlamı</p>
              <Meanings card={card} animate />
              {chunk && (
                <p className="mt-3.5 rounded-2xl bg-tangerine-soft px-3.5 py-2.5 text-[15px] font-bold leading-snug text-ink animate-rise-in" style={delay(360)}>
                  <span className="font-black text-tangerine-ink">{chunk.en}</span> — {chunk.tr}
                </p>
              )}
            </section>
            <TontonLine mood="happy" size={46} className="animate-rise-in">
              Tahminin tuttu mu? Birkaç kart sonra ben soracağım; o arada aklında tut.
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
            Tamam, birazdan sor
          </button>
        )}
      </BottomBar>
    </div>
  );
}

/* ---------------------------------------------------------------- flip -- */

/**
 * Recognition: the word (or its sound) on the cover; think, turn it over,
 * grade yourself. The back carries the meanings and one sentence with the
 * word lit up — the meaning always arrives with a picture of it in use.
 */
function FlipStep({
  card,
  step,
  counter,
  remaining,
  onGrade,
}: {
  card: Card;
  step: Exercise;
  counter: string;
  remaining: number;
  onGrade: (grade: Grade) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [leaving, setLeaving] = useState<Grade | null>(null);
  const dragStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const flyTimer = useRef(0);
  const listen = step.kind === "listen";
  const { pos } = parseBack(card.back);
  const firstPos = pos ?? card.senses?.[0]?.pos ?? null;
  const hasDetails = Boolean(card.senses?.length || card.example_sentence || card.related?.length || card.watch_out);
  // The sentence on the back: the word's first one, or — when there are
  // many senses to fit — the shortest one the senses carry, with the
  // meaning it belongs to so its Turkish counterpart still lights up.
  const sentence = backSentence(card);

  useEffect(() => () => window.clearTimeout(flyTimer.current), []);

  // Say the word as the card comes to the top — for a listening card that
  // *is* the question — and tell Tonton a new card is face down.
  useEffect(() => {
    speakAuto(card.front);
    tellTonton("card", { front: card.front, flipped: false });
  }, [card.front]);

  const flip = useCallback(() => {
    primeSpeech();
    if (flipped || leaving !== null) return;
    playReveal();
    setFlipped(true);
    if (listen) speakAuto(card.front);
    tellTonton("card", { front: card.front, flipped: true });
  }, [flipped, leaving, listen, card.front]);

  const grade = useCallback(
    (quality: Grade) => {
      if (!flipped || leaving !== null) return;
      setLeaving(quality);
      flyTimer.current = window.setTimeout(() => onGrade(quality), reducedMotion() ? 0 : SETTLE_MS);
    },
    [flipped, leaving, onGrade],
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
      if (event.repeat || examplesOpen) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea")) return;
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
  }, [flipped, flip, grade, examplesOpen]);

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
    step.attempt > 0
      ? "Bu bir daha geldi. Bu sefer?"
      : flipped
        ? "Dürüst ol; ona göre hatırlatırım."
        : listen
          ? "Dinle, anlamını düşün, sonra çevir."
          : "Aklından geçir, sonra çevir.";
  const label = step.attempt > 0 ? "Bir daha" : KIND_LABEL[step.kind];
  const mood: MascotMood = leaving === 5 ? "happy" : leaving === 1 ? "sad" : flipped ? "idle" : "think";

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
              className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[24px] ${gradeOf(swipeHint).wash}`}
              style={{ opacity: hintOpacity }}
            >
              <span
                key={swipeHint}
                className={`rounded-xl border-[3px] bg-white px-4 py-1.5 text-[26px] font-black uppercase tracking-[0.14em] animate-stamp ${gradeOf(swipeHint).stamp}`}
              >
                {gradeOf(swipeHint).label}
              </span>
            </div>
          )}

          <div className="relative h-full w-full animate-[card-rise_420ms_var(--ease-spring)] [perspective:1400px]">
            <div
              className={`relative h-full w-full transition-transform duration-[560ms] ease-soft [transform-style:preserve-3d] motion-reduce:transform-none ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* FRONT — the word, or its sound, on the word's own colour. */}
              <div
                role="button"
                tabIndex={flipped ? -1 : 0}
                aria-label={listen ? "Duyduğun kelime — kartı çevir" : `${card.front} — kartı çevir`}
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
                <Cover card={card} label={label} counter={counter} ornament={listen ? null : card.front.charAt(0)} className="h-full">
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
                    <div className="flex flex-1 flex-col justify-center">
                      {firstPos && <PosPill pos={firstPos} className="mb-2.5 w-max !bg-white/25 !text-white" />}
                      <h2
                        className={`wrap-break-word font-black leading-[0.95] tracking-[-0.025em] animate-[cover-line_420ms_var(--ease-soft)_120ms_both] ${
                          card.front.length > 11 ? "text-[42px]" : "text-[56px]"
                        }`}
                      >
                        {card.front}
                      </h2>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <StrengthBars card={card} onDark />
                    <span className="flex-1 text-[12px] font-black uppercase tracking-[0.1em] text-white/90">dokun · çevir</span>
                    {!listen && (
                      <span onClick={(event) => event.stopPropagation()}>
                        <SpeakButton text={card.front} size="md" className={COVER_SPEAKER} />
                      </span>
                    )}
                  </div>
                </Cover>
              </div>

              {/* BACK — white, the word on a band of its colour, the meanings, one sentence. */}
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
                  <p className="min-w-0 flex-1 truncate text-[24px] font-black leading-tight">{card.front}</p>
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
                  {flipped && <Meanings card={card} animate />}
                  {sentence && flipped && (
                    <div className="mt-auto pt-3 animate-rise-in" style={delay(420)}>
                      <ExampleBubble en={sentence.en} tr={sentence.tr} headword={card.front} meaning={sentence.meaning} size="sm" />
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

      <p className="mt-3 text-center text-[13px] font-bold text-graphite">{caption}</p>

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
                className={`face min-h-[56px] rounded-2xl text-[14px] font-black uppercase tracking-[0.04em] text-white shadow-button press-3d animate-rise-spring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30 ${g.button}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}
      </BottomBar>
    </>
  );
}

/* --------------------------------------------------------------- typed -- */

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
function TypedStep({ card, step, counter, onDone }: { card: Card; step: Exercise; counter: string; onDone: (grade: Grade) => void }) {
  const [text, setText] = useState("");
  const [hints, setHints] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [overridden, setOverridden] = useState(false);
  const [showTurkish, setShowTurkish] = useState(Boolean(step.openTranslation) || step.kind === "chunk");
  const inputRef = useRef<HTMLInputElement>(null);
  const expected = expectedAnswer(step, card);
  const { pos, text: gloss } = parseBack(card.back);
  const meaning = card.senses?.length ? card.senses.map((s) => s.meaning).join(" · ") : gloss;
  const gap = step.gap ?? null;
  const example = gap ? null : (sentencesOf(card)[0] ?? null);
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
              <p className="wrap-break-word text-[30px] font-black leading-[1.12] tracking-[-0.01em]">{meaning}</p>
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
            <button type="button" onClick={() => mark({ grade: 1, tone: "wrong" })} className="-mx-2 rounded-xl px-2 py-2 uppercase text-graphite hover:bg-paper-deep hover:text-ink">
              Bilmiyorum
            </button>
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
            <ExampleBubble en={example.en} tr={example.tr} headword={card.front} meaning={meaningsOf(card)[0]?.meaning ?? ""} />
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
 * After a word is first recalled: a sentence of the learner's own. Writing
 * it is the strongest thing they can do for the memory, and from then on
 * reviews blank the word out of it.
 */
function WriteStep({ card, deckId, onSaved, onDone }: { card: Card; deckId: string; onSaved: (card: Card) => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const [warned, setWarned] = useState(false);
  const example = sentencesOf(card)[0] ?? null;
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
        Kendi hayatından olsun: dün olan bir şey, bir plan, bir dert. İleride bu cümleyi sana boşluklu soracağım.
      </TontonLine>
      {example && (
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] font-black uppercase tracking-[0.1em] text-graphite">Örnek</p>
          <ExampleBubble en={example.en} tr={example.tr} headword={card.front} meaning={meaningsOf(card)[0]?.meaning ?? ""} size="sm" />
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

function Session({ deckId, cards, mode }: { deckId: string; cards: Card[]; mode: SessionMode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const recordStudyDay = useRecordStudyDay();

  // Snapshotted at the start; a saved sentence updates its card in place.
  const [byId, setById] = useState(() => new Map(cards.map((card) => [card.id, card])));
  const [plan, setPlan] = useState<Exercise[]>(() =>
    mode === "drill" ? buildDrill(cards[0]) : buildSession(cards, { mode, speech: speechSupported && !isSpeechMuted() }),
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, Result>>({});
  const answeredRef = useRef(new Set<number>());
  const askedSentenceRef = useRef(new Set<number>());
  const recordedDayRef = useRef(false);
  const touchedRef = useRef(false);
  const runRef = useRef(0);

  const review = useMutation({
    mutationFn: ({ cardId, quality, kind }: { cardId: number; quality: Grade; kind: Kind }) =>
      api.post<{ card: Card }>(`/decks/${deckId}/cards/${cardId}/review`, { quality, kind }),
    retry: 2,
    onSuccess: (data, { cardId }) => {
      if (!data?.card) return;
      setResults((r) => (r[cardId] ? { ...r, [cardId]: { ...r[cardId], after: data.card } } : r));
    },
    onError: (_error, { cardId }) => {
      setResults((r) => (r[cardId] ? { ...r, [cardId]: { ...r[cardId], failed: true } } : r));
    },
  });
  const { mutate: sendReview } = review;

  // Refresh the deck's lists when a session that changed something is left.
  useEffect(() => {
    return () => {
      if (!touchedRef.current) return;
      queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      queryClient.invalidateQueries({ queryKey: ["deckStats", deckId] });
    };
  }, [queryClient, deckId]);

  const step = plan[index];
  const card = step ? byId.get(step.cardId) : undefined;
  const finished = index >= plan.length;
  const counter = `${Math.min(index + 1, plan.length)} / ${plan.length}`;

  /** Every step ends here: a grade for the ones that ask, null for meeting and writing. */
  const settle = useCallback(
    (grade: Grade | null) => {
      if (!step || !card) return;
      let next = plan;
      if (grade !== null) {
        if (grade === 1) runRef.current = 0;
        else runRef.current += 1;
        tellTonton("grade", { quality: grade, front: card.front, attempt: step.attempt, index, total: plan.length });
        if (!recordedDayRef.current) {
          recordedDayRef.current = true;
          recordStudyDay.mutate();
        }
        if (!answeredRef.current.has(card.id)) {
          answeredRef.current.add(card.id);
          setResults((r) => ({ ...r, [card.id]: { grade, graded: step.graded, before: card, after: null } }));
          if (step.graded) {
            touchedRef.current = true;
            sendReview({ cardId: card.id, quality: grade, kind: step.kind });
          }
        }
        // The moment to write a sentence with a word: it has just been
        // recalled for the first time in its life, or a stubborn one has
        // just come back.
        const firstHold = step.graded && card.repetitions === 0 && grade >= 3;
        const leechBack = step.attempt > 0 && isLeech(card);
        if (grade === 1) {
          next = insertLater(next, index, repeatOf(card, step.attempt + 1));
        } else if (
          mode !== "drill" &&
          !card.my_sentence &&
          !askedSentenceRef.current.has(card.id) &&
          askedSentenceRef.current.size < MAX_WRITES &&
          (firstHold || leechBack)
        ) {
          askedSentenceRef.current.add(card.id);
          next = insertLater(next, index, writeStep(card), 0);
        }
      }
      if (next !== plan) setPlan(next);
      setIndex((i) => i + 1);
    },
    [step, card, plan, index, mode, recordStudyDay, sendReview],
  );

  const onFlipGrade = useCallback(
    (grade: Grade) => {
      if (grade === 1) playIncorrect();
      else playCorrect(runRef.current + 1);
      settle(grade);
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
    return (
      <Summary
        cards={[...new Map(plan.map((s) => [s.cardId, byId.get(s.cardId)])).values()].filter((c): c is Card => Boolean(c))}
        results={results}
        mode={mode}
        onDone={() => navigate(exitTo)}
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
        <TypedStep key={step.key} card={card} step={step} counter={counter} onDone={settle} />
      ) : (
        <FlipStep key={step.key} card={card} step={step} counter={counter} remaining={plan.length - index} onGrade={onFlipGrade} />
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

function Summary({ cards, results, mode, onDone }: { cards: Card[]; results: Record<number, Result>; mode: SessionMode; onDone: () => void }) {
  const firsts = Object.values(results);
  const known = firsts.filter((r) => r.grade >= 4).length;
  const hard = firsts.filter((r) => r.grade === 3).length;
  const missed = firsts.filter((r) => r.grade === 1).length;
  const perfect = missed === 0 && hard === 0 && known > 0;
  const practice = firsts.length > 0 && firsts.every((r) => !r.graded);
  const shownKnown = useCountUp(known);
  const shownHard = useCountUp(hard);
  const shownMissed = useCountUp(missed);

  useEffect(() => {
    playLessonComplete();
    window.dispatchEvent(new CustomEvent("tonton:summary", { detail: { known, hard, missed } }));
    // A summary is mounted once; the counts are fixed by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verdict = practice
    ? "Güzel alıştırma. Takvime dokunmadım; asıl tekrar sırası gelince."
    : perfect
      ? "Hepsini bildin. Bunlar artık daha seyrek gelecek."
      : missed === 0
        ? "Bildin ama zorlandıkların var; onları biraz daha sık getireceğim."
        : `${missed} kelime kaçtı. On dakika sonra yine hazır, yarın da geri gelecek.`;

  return (
    <div className="pt-4 text-center animate-rise-in">
      {perfect && known >= 3 && <Confetti />}
      <Mascot mood={missed === 0 ? "happy" : "idle"} size={120} greet className="mx-auto" />
      <h2 className="mt-3 text-[32px] font-black leading-tight tracking-[-0.02em] text-sunny-deep">{mode === "drill" ? "Alıştırma bitti!" : "Oturum tamam!"}</h2>
      <p className="mx-auto mt-2 max-w-[22rem] text-[16px] font-bold leading-snug text-ink">{verdict}</p>

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
                <p className="truncate text-[13px] font-semibold leading-snug text-graphite">{meaningsOf(c).map((m) => m.meaning).join(" · ")}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] font-black tabular-nums">
                {result && !result.graded ? (
                  <span className="rounded-full bg-paper-deep px-2 py-0.5 text-graphite">alıştırma</span>
                ) : result?.failed ? (
                  <span className="rounded-full bg-berry-soft px-2 py-0.5 text-berry-ink">kaydedilemedi</span>
                ) : next && now ? (
                  <>
                    <span className={`rounded-full px-2 py-0.5 ${TONE_PILL[next.tone]}`}>{result?.grade === 1 ? `${next.text}, yarın yine` : next.text}</span>
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
      <button type="button" onClick={onDone} className={`${BIG} mt-8 bg-grass focus-visible:ring-grass/40`}>
        Devam
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- page -- */

function Flashcards() {
  const { deckId = "" } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const drillId = searchParams.get("card");
  const mode: SessionMode = drillId ? "drill" : searchParams.get("mode") === "all" ? "all" : "due";

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

  if (!deckId) return <Navigate to="/kartlar" replace />;

  const loading = cardsQuery.isLoading || (mode === "due" && (!dueQuery.data || dueQuery.isFetching));
  // Free practice takes the twenty words coming back soonest: the ones
  // about to be asked are the ones worth a warm-up.
  const cards =
    mode === "drill"
      ? (cardsQuery.data ?? []).filter((c) => String(c.id) === drillId)
      : mode === "all"
        ? byNextReview(cardsQuery.data ?? []).slice(0, PRACTICE_LIMIT)
        : (dueQuery.data ?? []);

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
        {!loading && !cardsQuery.isError && cards.length === 0 && (
          <div className="pt-6">
            <EmptyState
              emoji={mode === "due" ? "🎉" : "🃏"}
              title={mode === "due" ? "Bugünlük tamam" : "Henüz kartın yok"}
              description={
                mode === "due"
                  ? "Şu an sırası gelen kelime yok. İstersen hepsiyle alıştırma yap; takvim değişmez."
                  : "Bir kelime ekle, kartın hazır olsun."
              }
              action={
                mode === "due" && (cardsQuery.data?.length ?? 0) > 0 ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <LinkButton to={`/decks/${deckId}/flashcards?mode=all`} variant="go" onClick={primeSpeech}>
                      Serbest alıştırma
                    </LinkButton>
                    <LinkButton to="/kartlar" variant="ghost">
                      Kartlarım
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
            <Session key={`${deckId}-${mode}-${drillId ?? ""}`} deckId={deckId} cards={cards} mode={mode} />
          </div>
        )}
      </main>
    </div>
  );
}

export default Flashcards;
