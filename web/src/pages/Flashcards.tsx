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
import { STAGE_LABEL, byNextReview, isLeech, nextReview, stageOf } from "../lib/memory";
import { STAGE_TEXT, TONE_TEXT } from "../lib/stageStyle";
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
import { locateTurkish, splitOnWord } from "../lib/sentence";
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
import Cover from "../components/Cover";
import StrengthBars from "../components/StrengthBars";
import { SpeakerIcon } from "../components/icons";

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
 * the schedule. The rules live in lib/practice.ts; this is the paper.
 *
 * Tonton isn't here in person (he'd be over the buttons); the screen tells
 * him what happened through `tonton:*` window events instead.
 */

type Grade = 1 | 3 | 4 | 5;
type SessionMode = "due" | "all" | "drill";
/** A card's first answer this session, and what the schedule made of it. */
type Result = { grade: Grade; graded: boolean; before: Card; after: Card | null; failed?: boolean };

/** Sentences asked for in one session, at most: each takes a minute, and the session is fifteen. */
const MAX_WRITES = 3;
/** Words in one free-practice session. */
const PRACTICE_LIMIT = 20;

/** Each verdict's colour, once: vermilion missed it, moss knew it, gilt is the honest middle. */
const GRADES: { grade: Grade; label: string; button: string; stamp: string; wash: string; key: string; arrow: string }[] = [
  { grade: 1, label: "Bilemedim", button: "bg-accent text-paper-lift shadow-button", stamp: "border-accent text-accent", wash: "bg-accent/14", key: "1", arrow: "ArrowLeft" },
  {
    grade: 3,
    label: "Zorlandım",
    button: "bg-paper-lift text-gilt-ink ring-[1.5px] ring-inset ring-gilt/70 shadow-print",
    stamp: "border-gilt text-gilt-ink",
    wash: "bg-gilt/16",
    key: "2",
    arrow: "ArrowUp",
  },
  { grade: 5, label: "Bildim", button: "bg-moss text-paper-lift shadow-button", stamp: "border-moss text-moss", wash: "bg-moss/12", key: "3", arrow: "ArrowRight" },
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

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

function tellTonton(name: "card" | "grade", detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent(`tonton:${name}`, { detail }));
}

/** The word's meanings, one per sense, or the short gloss for a plain card. */
function meaningsOf(card: Card): { pos: string | null; meaning: string }[] {
  if (card.senses && card.senses.length > 0) return card.senses.map((s) => ({ pos: s.pos ?? null, meaning: s.meaning }));
  const { pos, text } = parseBack(card.back);
  return [{ pos, meaning: text }];
}

/** A sentence with the headword underlined in the word's own ink. */
function Highlighted({ sentence, headword, className = "" }: { sentence: string; headword: string; className?: string }) {
  const parts = splitOnWord(sentence, headword);
  if (!parts) return <>{sentence}</>;
  return (
    <>
      {parts.before}
      <span className={`font-extrabold underline decoration-[var(--tint)] decoration-[2px] underline-offset-4 ${className}`}>{parts.match}</span>
      {parts.after}
    </>
  );
}

/** The Turkish of a sentence, the word's counterpart set in ink. */
function TurkishLine({ sentence, meaning }: { sentence: string; meaning: string }) {
  const at = locateTurkish(sentence, meaning);
  if (!at) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, at.start)}
      <span className="font-bold text-ink">{sentence.slice(at.start, at.end)}</span>
      {sentence.slice(at.end)}
    </>
  );
}

/* ------------------------------------------------------------ the rule -- */

function ProgressRule({ index, total, exitTo }: { index: number; total: number; exitTo: string }) {
  return (
    <div className="flex items-center gap-4">
      <Link
        to={exitTo}
        aria-label="Çık"
        className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-2 text-2xl leading-none text-graphite transition-colors hover:text-ink"
      >
        ×
      </Link>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-soft" style={{ width: `${Math.round((index / Math.max(1, total)) * 100)}%` }} />
      </div>
      <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite tabular-nums">{total - index} kaldı</span>
    </div>
  );
}

/** The fixed slot the forward buttons live in, so they never move between steps. */
function BottomBar({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-paper/92 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">{children}</div>
      </div>
      <div className="h-28" aria-hidden="true" />
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
    <div className="mt-8 animate-[card-rise_420ms_var(--ease-spring)]">
      <Cover card={card} label={KIND_LABEL.meet} counter={counter} ornament={card.front.charAt(0)} className="min-h-[13.5rem]">
        <div className="mt-auto pt-8">
          {pos && <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-paper-lift/65">{posLabel(pos)}</p>}
          <div className="flex items-end justify-between gap-3">
            <h2 className={`min-w-0 wrap-break-word font-black leading-[0.95] tracking-[-0.02em] ${card.front.length > 11 ? "text-[36px]" : "text-[46px]"}`}>
              {card.front}
            </h2>
            <SpeakButton text={card.front} size="md" className="!bg-paper-lift/10 !text-paper-lift ring-1 ring-paper-lift/40 hover:!bg-paper-lift/20" />
          </div>
        </div>
      </Cover>

      <section style={tintStyle(card)} className="mt-3 rounded-[20px] bg-paper-lift px-5 pb-5 pt-4 ring-1 ring-rule shadow-print paper-grain">
        {line && (
          <>
            <p className={KICKER}>Cümlede</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[19px] leading-[1.5] text-ink wrap-break-word">
                  <Highlighted sentence={line.en} headword={card.front} />
                </p>
                {revealed && line.tr && (
                  <p className="mt-1.5 text-[15px] leading-[1.5] text-graphite animate-rise-in wrap-break-word">
                    <TurkishLine sentence={line.tr} meaning={meanings[0]?.meaning ?? ""} />
                  </p>
                )}
              </div>
              <SpeakButton text={line.en} size="sm" className="bg-paper-lift text-ink ring-1 ring-rule" />
            </div>
          </>
        )}

        {!revealed ? (
          <p className="mt-4 border-t border-rule pt-3 text-[15px] font-semibold leading-snug text-graphite">
            Cümleye bak: sence ne demek? Bir tahmin geçir aklından, sonra aç.
          </p>
        ) : (
          <div ref={meaningRef} className={`scroll-mb-32 ${line ? "mt-4 border-t border-rule pt-3" : ""}`}>
            <p className={KICKER}>Anlamı</p>
            <ol className="mt-2 space-y-2">
              {meanings.map((m, i) => (
                <li key={i} className="grid grid-cols-[22px_1fr] items-baseline gap-x-2 animate-rise-in" style={delay(Math.min(i, 4) * 60)}>
                  <span className="text-[13px] font-black tabular-nums tint-text">{i + 1}</span>
                  <span className="text-[19px] font-extrabold leading-snug text-ink">{m.meaning}</span>
                </li>
              ))}
            </ol>
            {chunk && (
              <p className="mt-3 text-[14px] leading-snug text-graphite animate-rise-in" style={delay(300)}>
                Sık kalıp: <span className="font-extrabold text-ink">{chunk.en}</span> — {chunk.tr}
              </p>
            )}
          </div>
        )}
      </section>

      <BottomBar>
        {!revealed ? (
          <Button size="lg" fullWidth variant="ink" onClick={reveal}>
            Anlamını göster
          </Button>
        ) : (
          <Button size="lg" fullWidth variant="ink" onClick={onDone}>
            Tamam, birazdan sor
          </Button>
        )}
      </BottomBar>
    </div>
  );
}

/* ---------------------------------------------------------------- flip -- */

/**
 * Recognition: the word (or its sound) on the cover; think, turn it over,
 * grade yourself. After a miss the back also carries the word's sentence.
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
  const meanings = meaningsOf(card);
  const mixedTypes = new Set(meanings.map((m) => m.pos ?? "")).size > 1;
  const hasDetails = Boolean(card.senses?.length || card.example_sentence || card.related?.length || card.watch_out);
  const support = step.support ? (sentencesOf(card)[0] ?? null) : null;

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

  return (
    <>
      {/* The pile, with Tonton peeking over its top edge. */}
      <div className="relative mt-11 h-[30rem] max-h-[calc(100dvh-23rem)] min-h-[21rem]">
        <Mascot size={52} mood={flipped ? "idle" : "think"} quiet className="absolute -top-7 right-6" />
        {remaining > 2 && <div aria-hidden="true" className="absolute inset-x-4 top-3 h-full rounded-[20px] bg-umber/45 animate-pile-nudge [animation-delay:60ms]" />}
        {remaining > 1 && <div aria-hidden="true" className="absolute inset-x-2 top-1.5 h-full rounded-[20px] bg-umber/75 animate-pile-nudge" />}

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
                className={`card-face absolute inset-0 cursor-pointer select-none rounded-[20px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30 motion-reduce:transition-opacity ${
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
                        className="flex h-28 w-28 items-center justify-center rounded-full bg-paper-lift/10 ring-1 ring-paper-lift/40 transition-transform duration-100 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paper-lift/50"
                      >
                        <SpeakerIcon className="h-11 w-11" />
                      </button>
                      <p className="max-w-[16rem] text-[17px] font-bold leading-snug text-paper-lift/85">Duyduğun kelime ne demek?</p>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col justify-center">
                      {pos && <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-paper-lift/65">{posLabel(pos)}</p>}
                      <h2
                        className={`wrap-break-word font-black leading-[0.95] tracking-[-0.02em] animate-[cover-line_420ms_var(--ease-soft)_120ms_both] ${
                          card.front.length > 11 ? "text-[40px]" : "text-[54px]"
                        }`}
                      >
                        {card.front}
                      </h2>
                    </div>
                  )}
                  <div className="flex items-center gap-3.5">
                    <StrengthBars card={card} onDark />
                    <span aria-hidden="true" className="h-px flex-1 bg-paper-lift/20" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-paper-lift/55">dokun · çevir</span>
                    {!listen && (
                      <span onClick={(event) => event.stopPropagation()}>
                        <SpeakButton
                          text={card.front}
                          size="md"
                          className="!bg-paper-lift/10 !text-paper-lift ring-1 ring-paper-lift/40 hover:!bg-paper-lift/20"
                        />
                      </span>
                    )}
                  </div>
                </Cover>
              </div>

              {/* BACK — lifted paper: the word, then its meanings, nothing else. */}
              <div
                aria-hidden={!flipped}
                className={`card-face !absolute inset-0 flex select-none flex-col overflow-hidden rounded-[20px] bg-paper-lift text-ink ring-1 ring-rule shadow-print paper-grain [-webkit-touch-callout:none] [transform:rotateY(180deg)] motion-reduce:transform-none motion-reduce:transition-opacity ${
                  flipped ? "" : "motion-reduce:opacity-0"
                }`}
              >
                <div className="flex items-center gap-3 border-b border-rule bg-paper-deep/55 px-5 pb-3 pt-4">
                  <p className="min-w-0 truncate text-[19px] font-black text-ink">
                    {card.front}
                    {pos && <span className="ml-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-graphite">{posLabel(pos)}</span>}
                  </p>
                  <span onPointerDown={(event) => event.stopPropagation()} className="shrink-0">
                    <SpeakButton text={card.front} size="sm" className="bg-paper-lift text-ink ring-1 ring-rule" />
                  </span>
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
                  {meanings.length > 1 ? (
                    <ol className="space-y-3">
                      {meanings.map((m, i) => (
                        <li key={i} className={`grid grid-cols-[26px_1fr] items-baseline gap-x-3 ${flipped ? "animate-rise-in" : "opacity-0"}`} style={delay(220 + Math.min(i, 6) * 60)}>
                          <span className="text-[13px] font-black tabular-nums tint-text">{i + 1}</span>
                          <p className="text-[20px] font-extrabold leading-[1.2] text-ink">
                            {m.meaning}
                            {m.pos && mixedTypes && (
                              <span className="ml-2 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.14em] text-graphite">{posLabel(m.pos)}</span>
                            )}
                          </p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className={flipped ? "animate-rise-in" : "opacity-0"} style={delay(220)}>
                      <span aria-hidden="true" className="mb-3.5 block h-[3px] w-7 tint-bar" />
                      <p className="wrap-break-word text-[30px] font-black leading-[1.1] tracking-[-0.015em] text-ink">{meanings[0]?.meaning}</p>
                    </div>
                  )}
                  {support && (
                    <div className={`mt-auto border-t border-rule pt-3 ${flipped ? "animate-rise-in" : "opacity-0"}`} style={delay(460)}>
                      <p className="text-[15px] leading-[1.45] text-ink wrap-break-word">
                        <Highlighted sentence={support.en} headword={card.front} />
                      </p>
                      {support.tr && <p className="mt-1 text-[13px] leading-[1.45] text-graphite wrap-break-word">{support.tr}</p>}
                    </div>
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
      <BottomBar>
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
      </BottomBar>
    </>
  );
}

/* --------------------------------------------------------------- typed -- */

/** The gap in a sentence: a line the width of the missing word, or the word itself once answered. */
function GapLine({ gap, filled, tone }: { gap: Gap; filled: boolean; tone: Verdict["tone"] | null }) {
  const ink = tone === "wrong" ? "decoration-accent" : tone === "slip" ? "decoration-gilt" : "decoration-moss";
  return (
    <p className="text-[23px] font-bold leading-[1.45] wrap-break-word">
      {gap.before}
      {filled ? (
        <span className={`font-black underline decoration-[3px] underline-offset-[6px] ${ink} animate-rise-in`}>{gap.answer}</span>
      ) : (
        <span aria-label="boşluk" className="mx-0.5 inline-block translate-y-[3px] border-b-[3px] border-paper-lift/80 align-baseline" style={{ width: `${Math.min(10, Math.max(3, gap.answer.length * 0.62))}em` }} />
      )}
      {gap.after}
    </p>
  );
}

const VERDICT_STYLE: Record<Verdict["tone"], { title: string; rule: string; text: string }> = {
  right: { title: "Doğru!", rule: "border-moss", text: "text-moss" },
  form: { title: "Doğru kelime", rule: "border-moss", text: "text-moss" },
  slip: { title: "Az kaldı", rule: "border-gilt", text: "text-gilt-ink" },
  wrong: { title: "Olmadı — şimdi bak", rule: "border-accent", text: "text-accent" },
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

  const submit = (event: FormEvent) => {
    event.preventDefault();
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

  return (
    <div className="mt-8 animate-[card-rise_420ms_var(--ease-spring)]">
      <Cover card={card} label={KIND_LABEL[step.kind]} counter={counter} ornament={step.kind === "produce" ? null : "“"} className="min-h-[12.5rem]">
        <div className="mt-auto pt-7">
          {step.kind === "produce" ? (
            <>
              {pos && <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-paper-lift/65">{posLabel(pos)}</p>}
              <p className="wrap-break-word text-[30px] font-black leading-[1.12] tracking-[-0.01em]">{gloss}</p>
              {answered && <p className="mt-2 text-[34px] font-black leading-none tracking-[-0.02em] animate-rise-in">{card.front}</p>}
            </>
          ) : gap ? (
            <>
              <GapLine gap={gap} filled={answered} tone={verdict && !overridden ? verdict.tone : answered ? "slip" : null} />
              {gap.translation &&
                (showTurkish || answered ? (
                  <p className="mt-3 text-[15px] font-semibold leading-[1.45] text-paper-lift/75 wrap-break-word">{gap.translation}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTurkish(true)}
                    className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-paper-lift/70 underline decoration-paper-lift/40 underline-offset-4"
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
          <div className="flex gap-2">
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
              className="min-w-0 flex-1 rounded-2xl bg-paper-lift px-4 py-3.5 text-[22px] font-extrabold tracking-[0.02em] text-ink outline-none ring-1 ring-rule shadow-print transition placeholder:font-black placeholder:tracking-[0.18em] placeholder:text-graphite/45 focus:ring-2 focus:ring-ink/40"
            />
            <button
              type="submit"
              aria-label="Kontrol et"
              disabled={!typed}
              className="flex w-[3.75rem] shrink-0 items-center justify-center rounded-2xl bg-ink text-2xl font-black text-paper-lift shadow-button transition-[transform,opacity] duration-100 active:scale-[0.96] disabled:opacity-35"
            >
              →
            </button>
          </div>
          <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] font-extrabold uppercase tracking-[0.16em]">
            <button
              type="button"
              disabled={hints >= Math.max(1, expected.replace(/[^\p{L}]/gu, "").length - 1)}
              onClick={() => {
                setHints((h) => h + 1);
                inputRef.current?.focus({ preventScroll: true });
              }}
              className="-mx-2 rounded-md px-2 py-2 uppercase text-gilt-ink disabled:opacity-40"
            >
              İpucu{hints > 0 ? ` · ${hints} harf` : ""}
            </button>
            <button type="button" onClick={() => mark({ grade: 1, tone: "wrong" })} className="-mx-2 rounded-md px-2 py-2 uppercase text-graphite hover:text-ink">
              Bilmiyorum
            </button>
          </div>
        </form>
      ) : (
        style &&
        verdict && (
          <section className={`mt-4 rounded-[20px] border-t-[3px] bg-paper-lift px-5 pb-5 pt-4 ring-1 ring-rule shadow-print paper-grain animate-rise-in ${style.rule}`} style={tintStyle(card)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-[11px] font-extrabold uppercase tracking-[0.18em] ${style.text}`}>{overridden ? "Tamam, doğru saydım" : style.title}</p>
                <p className="mt-1 text-[30px] font-black leading-none tracking-[-0.02em] text-ink">{card.front}</p>
              </div>
              <SpeakButton text={card.front} size="md" className="bg-paper-lift text-ink ring-1 ring-rule" />
            </div>
            <p className="mt-2 text-[14px] font-semibold leading-snug text-graphite">
              {verdict.tone === "form"
                ? gap
                  ? `Bu cümlede “${expected}” olmalı.`
                  : `Aradığım yalın hâli: ${expected}.`
                : verdict.tone === "slip"
                  ? `Yazımı: ${expected}${typed ? ` — sen “${typed}” yazdın.` : "."}`
                  : verdict.tone === "wrong" && typed
                    ? `Sen “${typed}” yazdın. Anlamı: ${gloss}.`
                    : `Anlamı: ${gloss}.`}
            </p>
            {example && (
              <div className="mt-3 border-t border-rule pt-3">
                <p className="text-[16px] leading-[1.45] text-ink wrap-break-word">
                  <Highlighted sentence={example.en} headword={card.front} />
                </p>
                {example.tr && <p className="mt-1 text-[13px] leading-[1.45] text-graphite wrap-break-word">{example.tr}</p>}
              </div>
            )}
            {verdict.tone === "wrong" && typed && !overridden && (
              <button
                type="button"
                onClick={() => setOverridden(true)}
                className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-graphite underline decoration-rule underline-offset-4 hover:text-ink"
              >
                Yazdığım da doğruydu
              </button>
            )}
          </section>
        )
      )}

      {answered && (
        <BottomBar>
          <Button size="lg" fullWidth variant="ink" onClick={next}>
            Devam
          </Button>
        </BottomBar>
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
  const { text: gloss } = parseBack(card.back);
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
    <form onSubmit={submit} className="mt-8 animate-[card-rise_420ms_var(--ease-spring)]" style={tintStyle(card)}>
      <p className={KICKER}>{KIND_LABEL.write}</p>
      <h2 className="mt-2 text-[30px] font-black leading-[1.05] tracking-[-0.02em] text-ink">
        <span className="tint-text">{card.front}</span> ile bir cümle kur
      </h2>
      <p className="mt-2 text-[15px] font-semibold leading-snug text-graphite">
        Kendi hayatından olsun: dün olan bir şey, bir plan, bir dert. İleride bu cümleyi sana boşluklu soracağım.
      </p>
      {example && (
        <p className="mt-3 border-l-2 border-rule pl-3 text-[14px] leading-snug text-graphite">
          Örnek: <Highlighted sentence={example.en} headword={card.front} className="text-ink" /> <span className="text-graphite/80">({gloss})</span>
        </p>
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
        className="mt-4 w-full resize-none rounded-2xl bg-paper-lift px-4 py-3.5 text-[19px] leading-snug text-ink outline-none ring-1 ring-rule shadow-print transition placeholder:text-graphite/50 focus:ring-2 focus:ring-ink/40"
      />
      {warned && (
        <p role="alert" className="mt-2 text-[14px] font-semibold text-gilt-ink">
          Cümlede “{card.front}” göremedim. Yine de kaydedeyim mi? Bir daha bas.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="mt-2 text-[14px] font-semibold text-accent">
          Kaydedilemedi. Bağlantını kontrol edip bir daha dene.
        </p>
      )}
      <BottomBar>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onDone} className="shrink-0">
            Şimdi değil
          </Button>
          <Button type="submit" size="lg" fullWidth variant="ink" isLoading={save.isPending} disabled={!text.trim()}>
            Kaydet
          </Button>
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
        : `${missed} kelime kaçtı — on dakika sonra yine hazır, yarın da geri gelecek.`;

  return (
    <div className="animate-rise-in">
      {perfect && known >= 3 && <PrintConfetti />}
      <p className={KICKER}>{mode === "drill" ? "Alıştırma bitti" : "Oturum bitti"}</p>
      <h2 className="mt-2 text-[34px] font-black leading-[1.02] tracking-[-0.02em] text-ink">Kartlar bitti.</h2>
      <div className="mt-4 flex items-start gap-3.5">
        <Mascot mood={missed === 0 ? "happy" : "idle"} size={60} className="shrink-0" />
        <blockquote className="min-w-0 border-l-2 border-rule pl-3.5">
          <p className="text-[17px] font-semibold leading-[1.35] text-ink">{verdict}</p>
          <cite className="mt-1.5 block text-[10px] font-extrabold uppercase not-italic tracking-[0.18em] text-graphite">— Tonton</cite>
        </blockquote>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2 border-y border-rule py-4 text-center">
        {(
          [
            [shownKnown, "bildin", "text-moss"],
            [shownHard, "zorlandın", "text-gilt-ink"],
            [shownMissed, "kaçtı", "text-accent"],
          ] as const
        ).map(([n, label, cls]) => (
          <div key={label}>
            <dt className={`text-[30px] font-black leading-none tabular-nums ${cls}`}>{n}</dt>
            <dd className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-graphite">{label}</dd>
          </div>
        ))}
      </dl>

      {/* Every word, where it now stands, and when it comes back — the schedule made visible. */}
      <ul className="mt-2 divide-y divide-rule">
        {cards.map((c, i) => {
          const result = results[c.id];
          const after = result?.after ?? null;
          const before = stageOf(c);
          const now = after ? stageOf(after) : null;
          const next = after ? nextReview(after) : null;
          return (
            <li key={c.id} style={{ ...tintStyle(c), ...delay(200 + Math.min(i, 8) * 60) }} className="grid grid-cols-[3px_1fr_auto] items-center gap-3.5 py-3 animate-rise-in">
              <span aria-hidden="true" className="h-10 w-[3px] rounded-full tint-bar" />
              <div className="min-w-0">
                <p className="truncate text-[17px] font-extrabold leading-tight text-ink">{c.front}</p>
                <p className="truncate text-[13px] leading-snug text-graphite">{parseBack(c.back).text}</p>
              </div>
              <div className="shrink-0 text-right text-[10px] font-extrabold uppercase tracking-[0.14em] tabular-nums">
                {result && !result.graded ? (
                  <span className="text-graphite">alıştırma</span>
                ) : result?.failed ? (
                  <span className="text-accent">kaydedilemedi</span>
                ) : next && now ? (
                  <>
                    <span className={`block ${TONE_TEXT[next.tone]}`}>{result?.grade === 1 ? `${next.text}, yarın yine` : next.text}</span>
                    {now !== before && (
                      <span className={`mt-0.5 block ${STAGE_TEXT[now]}`}>
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
      <Button size="lg" fullWidth variant="ink" className="mt-8" onClick={onDone}>
        Bitti
      </Button>
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
                  <LinkButton to={`/decks/${deckId}/flashcards?mode=all`} variant="ink" onClick={primeSpeech}>
                    Serbest alıştırma
                  </LinkButton>
                  <LinkButton to="/kartlar" variant="ghost">
                    Kartlarım
                  </LinkButton>
                </div>
              ) : (
                <LinkButton to="/kartlar" variant="ink">
                  Kartlarım
                </LinkButton>
              )
            }
          />
        )}
        {!loading && !cardsQuery.isError && cards.length > 0 && <Session key={`${deckId}-${mode}-${drillId ?? ""}`} deckId={deckId} cards={cards} mode={mode} />}
      </main>
    </div>
  );
}

export default Flashcards;
