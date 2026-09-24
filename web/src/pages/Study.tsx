import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { Card, Deck } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import {
  buildQuizOptions,
  buildWordOptions,
  type QuizOption,
} from "../lib/quiz";
import { blankOut, BLANK } from "../lib/sentence";
import { hasStarted, buildPath } from "../lib/path";
import {
  buildLessonPlan,
  buildReviewPlan,
  pickRecap,
  repeatStep,
  type Step,
  type QuizFormat,
} from "../lib/lessonPlan";
import {
  speak,
  speakAuto,
  isSpeechMuted,
  setSpeechMuted,
  speechSupported,
} from "../lib/speech";
import { playCorrect, playIncorrect, playLessonComplete } from "../lib/sound";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import SpeakButton from "../components/SpeakButton";
import QuizOptions from "../components/QuizOptions";
import Mascot from "../components/Mascot";
import MeetBody from "../components/MeetBody";
import TontonLine from "../components/TontonLine";
import SoundMatch from "../components/SoundMatch";
import RoundRail, { type RailStage } from "../components/RoundRail";
import { SpeakerIcon } from "../components/icons";
import { useRecordStudyDay } from "../lib/streak";
import { useUnits } from "../lib/units";
import { lessonOverBudget, useDayBudget } from "../lib/plan";
import { tintStyle } from "../lib/tint";

type ReviewInput = { cardId: number; cardDeckId: number; quality: 1 | 4 };
type SessionMode = "lesson" | "review";

const KEY_TO_OPTION: Record<string, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
};

/** Ignore taps landing within the cross-fade, so a double tap can't skip a step. */
const TRANSITION_GUARD_MS = 180;

/** From this attempt on, a repeated question narrows to two options. */
const NARROW_FROM_ATTEMPT = 2;

/**
 * Typed answers are judged on the letters, not the typing: case, stray
 * spaces, apostrophe style and trailing punctuation are all forgiven.
 */
function spellingMatches(typed: string, expected: string): boolean {
  const norm = (value: string) =>
    value
      .toLowerCase()
      .replace(/[\u2019\u2018]/g, "'")
      .replace(/[.!?,;:]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  return norm(typed) === norm(expected);
}

function describeError(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Bir şeyler ters gitti. Tekrar dener misin?";
}

function StudySkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-full rounded-full" />
      <Skeleton className="mt-8 h-8 w-48 rounded-full" />
      <Skeleton className="mt-6 min-h-[12rem] w-full rounded-3xl" />
      <Skeleton className="mt-4 h-14 w-full rounded-2xl" />
      <Skeleton className="mt-3 h-14 w-full rounded-2xl" />
    </div>
  );
}

type StudySessionProps = {
  deckId: string;
  /** Snapshotted on mount; later changes to the queue are ignored on purpose. */
  cards: Card[];
  mode: SessionMode;
  title: string;
  /** CEFR level of the lesson's unit; decides which extra rounds a lesson gets. */
  level?: string | null;
  lessonNumber?: number;
  /** Undefined while the deck's full card list is still loading, or if it failed. */
  deckCardCount?: number;
  /** The deck's full card list, used to draw multiple-choice distractors from. */
  deckCards?: Card[];
  deckCardsError: unknown;
  onRetryDeckCards: () => void;
};

/**
 * Drives one pass over a queue of cards — today's reviews, one lesson, or
 * everything learned so far.
 *
 * A lesson teaches its new words before it tests them, and will not end while
 * a word is still unanswered: a wrong answer sends that word to the back of
 * the session, so a lesson can never be finished by getting everything wrong.
 *
 * Grading a card pushes its due_date into the future, so refetching the queue
 * mid-session would make it shift underneath us and skip cards. The queue is
 * snapshotted once here and never re-read; the caches are refreshed when the
 * session is left instead of after every answer.
 */
function StudySession({
  deckId,
  cards,
  mode,
  title,
  level = null,
  lessonNumber = 0,
  deckCardCount,
  deckCards,
  deckCardsError,
  onRetryDeckCards,
}: StudySessionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [queue] = useState(() => cards);
  const [deckCardPool] = useState(() => deckCards ?? []);

  // Append-only. Never reorder and never remove: every other operation can
  // shift an index that has already been consumed.
  const [plan, setPlan] = useState<Step[]>(() =>
    mode === "lesson"
      ? buildLessonPlan(cards, level, lessonNumber, pickRecap(deckCards ?? [], cards))
      : buildReviewPlan(cards),
  );
  // Only the typed round uses this; the multiple-choice rounds use `answer`.
  const [typedRight, setTypedRight] = useState<boolean | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  // Right answers in a row, this session. The ref is what the sound reads
  // inside the handler; the state is what the feedback bar shows.
  const runRef = useRef(0);
  const [run, setRun] = useState(0);
  const [outcomes, setOutcomes] = useState<Record<number, "right" | "wrong">>(
    {},
  );
  const [failedReviews, setFailedReviews] = useState(0);
  const [muted, setMuted] = useState(() => isSpeechMuted());

  const didReviewRef = useRef(false);
  const recordedDayRef = useRef(false);
  const gradedRef = useRef<Set<number>>(new Set());
  const stepEnteredAtRef = useRef(0);
  const recordStudyDay = useRecordStudyDay();

  const byId = useMemo(() => {
    const map = new Map<number, Card>();
    for (const card of [...deckCardPool, ...queue]) map.set(card.id, card);
    return map;
  }, [deckCardPool, queue]);

  const step: Step | undefined = plan[stepIndex];
  const finished = plan.length > 0 && stepIndex >= plan.length;
  const stepCard =
    step && step.kind !== "listen" ? byId.get(step.cardId) : undefined;

  // Reshuffles exactly once per step — a repeated question gets fresh options,
  // but re-rendering the same step never moves the answers under a tapping thumb.
  const options = useMemo<QuizOption[] | null>(() => {
    if (!step || step.kind !== "quiz" || !stepCard || step.format === "type")
      return null;
    const mates = step.mateIds
      .map((id) => byId.get(id))
      .filter((card): card is Card => card !== undefined);

    // A word that keeps coming back narrows to a straight choice between two,
    // so the loop that guards against a zero-score lesson always terminates.
    const build = {
      mates,
      maxOptions: step.attempt >= NARROW_FROM_ATTEMPT ? 2 : 4,
    };

    return step.format === "meaning"
      ? buildQuizOptions(stepCard, deckCardPool, build)
      : buildWordOptions(stepCard, deckCardPool, build);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key, stepCard, deckCardPool, byId]);

  const answered = answer !== null;
  const answeredRight =
    step?.kind === "quiz" && step.format === "type"
      ? typedRight
      : answered && options
        ? options[answer].isCorrect
        : null;

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, cardDeckId, quality }: ReviewInput) =>
      api.post<{ card: Card }>(`/decks/${cardDeckId}/cards/${cardId}/review`, {
        quality,
      }),
    // The day's new words already used up (409) isn't a lost connection:
    // asking again gets the same answer, and the word simply waits.
    retry: (count, error) => !(error instanceof ApiError && error.status === 409) && count < 2,
    onSuccess: () => {
      didReviewRef.current = true;
    },
    onError: (error) => {
      if (!(error instanceof ApiError && error.status === 409)) setFailedReviews((n) => n + 1);
    },
  });
  const { mutate: mutateReview } = reviewMutation;

  const markStudied = useCallback(() => {
    if (recordedDayRef.current) return;
    recordedDayRef.current = true;
    recordStudyDay.mutate();
  }, [recordStudyDay]);

  // Refresh the deck's other screens when this one is left, so the path and
  // review counts reflect what just happened. Every deck's plan too: a
  // lesson's new words come out of the same three a day as the own words'.
  useEffect(() => {
    return () => {
      if (didReviewRef.current) {
        queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
        queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
        queryClient.invalidateQueries({ queryKey: ["plan"] });
      }
    };
  }, [queryClient, deckId]);

  // Say the word whenever a step showing it opens. Keyed on the step, not the
  // card: one word is now met, heard and asked about within a single session.
  const stepKeyRef = useRef<string | null>(null);
  // The sentence is read once per step, however many times the word's
  // utterance reports ending (a cancelled one reports too).
  const sentenceSpokenForRef = useRef<string | null>(null);
  useEffect(() => {
    stepEnteredAtRef.current = Date.now();
    stepKeyRef.current = step?.key ?? null;
    if (!step || step.kind === "listen") return;
    const card = byId.get(step.cardId);
    // Hearing the word is the whole point of "meet" and "listen"; for the
    // rounds that ask for the English, it would be the answer.
    const silent =
      step.kind === "quiz" &&
      ["context", "reverse", "type"].includes(step.format);
    if (!card || silent) return;
    // Meeting a word: say it, then let Tonton say the sentence it lives in —
    // hearing the word inside real speech is half of what makes it stick.
    // The step key is checked again so a learner who has tapped on isn't
    // read the previous word's sentence.
    const key = step.key;
    const sentence = step.kind === "meet" ? card.example_sentence : null;
    speakAuto(card.front, {
      onEnd: () => {
        if (!sentence || stepKeyRef.current !== key || sentenceSpokenForRef.current === key) return;
        sentenceSpokenForRef.current = key;
        window.setTimeout(() => {
          if (stepKeyRef.current === key) speakAuto(sentence, { rate: 0.88 });
        }, 450);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key]);

  const advance = useCallback(() => {
    if (Date.now() - stepEnteredAtRef.current < TRANSITION_GUARD_MS) return;
    setAnswer(null);
    setTypedRight(null);
    setStepIndex((index) => index + 1);
  }, []);

  // Everything that happens once an answer is in, whichever way it arrived:
  // sounds, the single SM-2 write, the ledger, and the come-back-later repeat.
  const settleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!step || step.kind !== "quiz" || !stepCard) return;

      // The lift climbs with the run of right answers, and drops back to
      // the plain nudge the moment one is missed.
      if (isCorrect) {
        playCorrect(runRef.current + 1);
        runRef.current += 1;
      } else {
        playIncorrect();
        runRef.current = 0;
      }
      setRun(runRef.current);

      // Exactly one write per card per session. A second would silently take a
      // word from interval 1 to interval 6 inside a single day.
      if (step.graded && !gradedRef.current.has(stepCard.id)) {
        gradedRef.current.add(stepCard.id);
        mutateReview({ cardId: stepCard.id, cardDeckId: stepCard.deck_id, quality: isCorrect ? 4 : 1 });
        markStudied();
      }

      setOutcomes((previous) =>
        previous[stepCard.id]
          ? previous
          : { ...previous, [stepCard.id]: isCorrect ? "right" : "wrong" },
      );

      // Missed words come back until they land. The repeat is never graded —
      // the schedule already recorded the lapse.
      if (!isCorrect && mode === "lesson") {
        setPlan((previous) => [
          ...previous,
          repeatStep(stepCard, step.format, step.attempt),
        ]);
      }

      if (!isCorrect) speakAuto(stepCard.front);
    },
    [step, stepCard, mode, mutateReview, markStudied],
  );

  const chooseOption = useCallback(
    (index: number) => {
      if (!options || answer !== null) return;
      setAnswer(index);
      settleAnswer(options[index].isCorrect);
    },
    [options, answer, settleAnswer],
  );

  const submitTyped = useCallback(
    (text: string) => {
      if (!stepCard || typedRight !== null) return;
      const isCorrect = spellingMatches(text, stepCard.front);
      setTypedRight(isCorrect);
      // Typing has no option index; the sentinel marks "answered".
      setAnswer(0);
      settleAnswer(isCorrect);
    },
    [stepCard, typedRight, settleAnswer],
  );

  const stages = useMemo<RailStage[]>(() => {
    if (mode !== "lesson") return [];
    const rail: RailStage[] = [];
    if (plan.some((s) => s.kind === "quiz" && s.recap))
      rail.push({ id: "recap", label: "Tekrar" });
    if (plan.some((s) => s.kind === "meet"))
      rail.push({ id: "meet", label: "Tanış" });
    if (plan.some((s) => s.kind === "listen"))
      rail.push({ id: "listen", label: "Dinle" });
    rail.push({ id: "prove", label: "Göster" });
    return rail;
  }, [mode, plan]);

  const activeStage = useMemo(() => {
    if (!step) return stages.length - 1;
    const id = step.kind === "quiz" ? (step.recap ? "recap" : "prove") : step.kind;
    const found = stages.findIndex((stage) => stage.id === id);
    return found === -1 ? stages.length - 1 : found;
  }, [step, stages]);

  // Keyboard. Order matters: without the teaching branches first, pressing "2"
  // on a screen with nothing to answer would grade a card unanswered.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !step) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (step.kind === "meet" || step.kind === "listen") {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (step.kind === "meet") advance();
        }
        return;
      }

      if (answer !== null) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          advance();
        }
        return;
      }

      const index = KEY_TO_OPTION[event.key];
      if (index !== undefined && options && index < options.length) {
        event.preventDefault();
        chooseOption(index);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, answer, options, advance, chooseOption]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSpeechMuted(next);
  };

  // Nothing in the queue: say why, in the way that actually helps.
  if (queue.length === 0) {
    if (deckCardCount === undefined) {
      if (deckCardsError) {
        return (
          <ErrorState
            title="Bu deste yüklenemedi"
            message={describeError(deckCardsError)}
            onRetry={onRetryDeckCards}
          />
        );
      }
      return <StudySkeleton />;
    }
    if (deckCardCount === 0) {
      return (
        <EmptyState
          emoji="🃏"
          title="Henüz kart yok"
          description="Bu desteye birkaç kart ekle, çalışmak için burada seni beklesinler."
          action={<LinkButton to={`/decks/${deckId}`}>Desteye dön</LinkButton>}
        />
      );
    }
    return (
      <EmptyState
        emoji="☕"
        title="Tekrar edecek bir şey yok"
        description="Hepsini hallettin. Sonra yine gel!"
        action={
          <LinkButton to={`/decks/${deckId}`} variant="outline">
            Desteye dön
          </LinkButton>
        }
      />
    );
  }

  // Without a pool there are no distractors and so no questions at all. Say so
  // once, at the top, rather than failing card by card.
  if (deckCardPool.length === 0) {
    return (
      <ErrorState
        title="Kelimelerin yüklenemedi"
        message="Desten yerinde duruyor — uygulama ona ulaşamadı. Bağlantını kontrol et."
        onRetry={onRetryDeckCards}
      />
    );
  }

  if (finished) {
    return (
      <LessonSummary
        mode={mode}
        queue={queue}
        outcomes={outcomes}
        newWords={queue.filter((card) => !hasStarted(card)).length}
        streak={recordStudyDay.data?.streak ?? 0}
        failedReviews={failedReviews}
        onDone={() =>
          navigate(`/decks/${deckId}`, {
            state: mode === "lesson" ? { completedLesson: lessonNumber } : null,
          })
        }
      />
    );
  }

  if (!step) return <StudySkeleton />;

  const answeredCount = plan
    .slice(0, stepIndex)
    .filter((s) => s.kind === "quiz").length;
  const totalQuestions = plan.filter((s) => s.kind === "quiz").length;
  const progress =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100);

  const actLabel = (() => {
    if (step.kind === "meet") {
      const meets = plan.filter((s) => s.kind === "meet");
      const position = meets.findIndex((s) => s.key === step.key) + 1;
      return `Yeni kelime ${position}/${meets.length}`;
    }
    if (step.kind === "listen") return "Ses kontrolü";
    if (step.recap) return "Hızlı tekrar";
    if (step.attempt > 0) return "Bir kez daha";
    const byFormat: Record<QuizFormat, string> = {
      meaning: mode === "lesson" ? "Sıra sende" : title,
      context: "Cümlede kullan",
      listen: "İyi dinle",
      reverse: "İngilizcesi ne?",
      type: "Yaz bakalım",
    };
    return byFormat[step.format];
  })();

  return (
    <div className="pb-40">
      {/* Session chrome: leave, where you are, and the sound switch. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/decks/${deckId}`)}
          aria-label={mode === "lesson" ? "Dersten çık" : "Tekrardan çık"}
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 text-2xl leading-none text-graphite transition hover:bg-ink/5 hover:text-ink"
        >
          ×
        </button>
        {stages.length > 0 ? (
          <div className="flex min-w-0 flex-1 justify-center">
            <RoundRail stages={stages} activeIndex={activeStage} />
          </div>
        ) : (
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-rule">
            <div
              className="h-full rounded-full bg-grass transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={
              muted ? "Sesi aç" : "Sesi kapat"
            }
            className={`-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 transition ${
              muted ? "text-graphite/50" : "text-ink"
            }`}
          >
            <SpeakerIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {stages.length > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-rule">
          <div
            className="h-full rounded-full bg-grass transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <p className="mt-5 text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
        {actLabel}
      </p>

      {/* Keyed on the step so each one arrives with a short settle rather
          than snapping into place. */}
      <div key={step.key} className="animate-[step-in_180ms_ease-out]">
        {step.kind === "listen" ? (
          <ListenStep
            cards={step.cardIds
              .map((id) => byId.get(id))
              .filter((card): card is Card => card !== undefined)}
            onComplete={markStudied}
            onContinue={advance}
          />
        ) : stepCard ? (
          <QuestionStep
            card={stepCard}
            step={step}
            lessonWords={
              step.kind === "meet"
                ? plan
                    .filter((s) => s.kind === "meet")
                    .map((s) => byId.get(s.cardId))
                    .filter((c): c is Card => Boolean(c))
                : []
            }
            options={options}
            answer={answer}
            answeredRight={answeredRight}
            run={run}
            onChoose={chooseOption}
            onSubmitTyped={submitTyped}
            onContinue={advance}
          />
        ) : (
          <StudySkeleton />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- steps -- */

function ListenStep({
  cards,
  onComplete,
  onContinue,
}: {
  cards: Card[];
  onComplete: () => void;
  onContinue: () => void;
}) {
  const [done, setDone] = useState(false);

  return (
    <>
      <SoundMatch
        cards={cards}
        onComplete={() => {
          setDone(true);
          onComplete();
        }}
      />
      <BottomBar>
        <Button size="lg" fullWidth variant="ink" disabled={!done} onClick={onContinue}>
          {done ? "Sorulara geç" : "Üçünü de eşleştir"}
        </Button>
      </BottomBar>
    </>
  );
}

function QuestionStep({
  card,
  step,
  lessonWords,
  options,
  answer,
  answeredRight,
  run,
  onChoose,
  onSubmitTyped,
  onContinue,
}: {
  card: Card;
  step: Step;
  /** The lesson's new words in teaching order, for the strip under a meet step. */
  lessonWords: Card[];
  options: QuizOption[] | null;
  answer: number | null;
  answeredRight: boolean | null;
  /** Right answers in a row, for the feedback bar to crow about. */
  run: number;
  onChoose: (index: number) => void;
  onSubmitTyped: (text: string) => void;
  onContinue: () => void;
}) {
  const { pos, text: meaning, emoji } = parseBack(card.back);
  const isMeet = step.kind === "meet";
  const format: QuizFormat | null = step.kind === "quiz" ? step.format : null;
  const attempt = step.kind === "quiz" ? step.attempt : 0;
  const blanked =
    format === "context" && card.example_sentence
      ? blankOut(card.example_sentence, card.front)
      : null;

  return (
    <>
      {/* The hero keeps the same shape on every step, so the word never jumps
          between being taught and being asked about. */}
      <div
        className="relative mt-4 min-h-[9.25rem] overflow-hidden rounded-3xl bg-paper-lift p-6 text-center ring-1 ring-rule shadow-print sm:p-8"
        style={tintStyle(card)}
      >
        {blanked ? (
          <p className="text-xl font-bold leading-relaxed text-ink break-words sm:text-2xl">
            {blanked.text.split(BLANK).map((piece, index, all) => (
              <span key={index}>
                {piece}
                {index < all.length - 1 && (
                  <span className="mx-1 inline-block min-w-[4.5rem] border-b-[3px] border-ink align-middle" />
                )}
              </span>
            ))}
          </p>
        ) : format === "listen" ? (
          <ListenHero word={card.front} revealed={answer !== null} />
        ) : format === "reverse" || format === "type" ? (
          <>
            {emoji && (
              <p className="text-4xl leading-none" aria-hidden="true">
                {emoji}
              </p>
            )}
            <p className="mt-2 text-3xl font-extrabold leading-snug tracking-tight text-ink break-words sm:text-4xl">
              {meaning}
            </p>
            {pos && (
              <span className="mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-graphite ring-1 ring-rule">
                {posLabel(pos)}
              </span>
            )}
          </>
        ) : isMeet ? (
          // Meeting the word: its sticker, the word and what it means, on one
          // card, so the sentence below has the rest of the screen.
          <div className={`flex gap-4 ${emoji ? "items-center text-left" : "justify-center text-center"}`}>
            {emoji ? (
              // The emoji as a sticker: a tile of its own, so every word has
              // the same kind of picture in the same place.
              <span
                aria-hidden="true"
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-paper text-6xl leading-none ring-1 ring-rule"
              >
                {emoji}
              </span>
            ) : null}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-3xl font-extrabold leading-tight tracking-tight text-ink break-words">
                  {card.front}
                </p>
                <SpeakButton text={card.front} size="md" />
              </div>
              {pos && (
                <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-graphite ring-1 ring-rule">
                  {posLabel(pos)}
                </span>
              )}
              <p className="mt-1.5 text-xl font-extrabold leading-snug tint-text break-words">{meaning}</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-3xl font-extrabold leading-snug tracking-tight text-ink break-words sm:text-5xl">
              {card.front}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {pos && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-graphite ring-1 ring-rule">
                  {posLabel(pos)}
                </span>
              )}
              <SpeakButton text={card.front} size="md" />
            </div>
          </>
        )}
      </div>

      {isMeet ? (
        <>
          <div className="mt-4">
            <MeetBody card={card} />
          </div>
          {lessonWords.length > 1 && (
            <ol className="mt-5 flex items-center justify-center gap-2" aria-label="Bu dersin kelimeleri">
              {lessonWords.map((word) => {
                const here = word.id === card.id;
                const met = lessonWords.indexOf(word) < lessonWords.findIndex((w) => w.id === card.id);
                return (
                  <li
                    key={word.id}
                    aria-current={here ? "step" : undefined}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition ${
                      here
                        ? "bg-ocean text-white shadow-button"
                        : met
                          ? "bg-paper-lift text-ink ring-1 ring-rule"
                          : "bg-paper-deep/60 text-graphite"
                    }`}
                  >
                    <span aria-hidden="true">{parseBack(word.back).emoji ?? (met ? "✓" : "·")}</span>
                    {word.front}
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-3 text-center text-sm font-semibold text-graphite">
            Bir kez daha dinle, sonra yüksek sesle söyle. 🗣️
          </p>
          <BottomBar>
            <Button size="lg" fullWidth variant="ink" onClick={onContinue}>
              Anladım
            </Button>
          </BottomBar>
        </>
      ) : format === "type" ? (
        <TypeAnswer
          key={step.key}
          expected={card.front}
          attempt={attempt}
          answered={answer !== null}
          onSubmit={onSubmitTyped}
        />
      ) : options ? (
        <>
          <TontonLine className="mt-4" mood={answer === null ? "think" : answeredRight ? "happy" : "sad"}>
            {format === "context"
              ? "Hangi kelime eksik?"
              : format === "listen"
                ? "Hangi kelimeyi duydun?"
                : format === "reverse"
                  ? "Bu hangi kelime?"
                  : "Bu ne demek?"}
          </TontonLine>
          <QuizOptions
            options={options}
            selectedIndex={answer}
            onSelect={onChoose}
          />
          {answer === null && (
            <p className="mt-5 text-center text-xs font-medium text-graphite">
              Bir cevaba dokun · 1-4 tuşları
            </p>
          )}
        </>
      ) : (
        <ErrorState
          title="Bu soru hazırlanamadı"
          message="Çoktan seçmeli bir soru kurmak için bu destede henüz yeterli kelime yok."
        />
      )}

      {/* Feedback. A wrong answer re-opens the full explanation — the moment
          it is worth most is right after getting it wrong. */}
      {answer !== null && (
        <div
          className={`fixed inset-x-0 bottom-0 z-20 max-h-[70vh] overflow-y-auto animate-[slide-up_220ms_ease-out] border-t-[3px] bg-paper-lift shadow-sheet ${
            answeredRight ? "border-moss" : "border-accent"
          }`}
        >
          <div className="mx-auto max-w-2xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-start gap-3">
              <Mascot
                mood={answeredRight ? "happy" : "sad"}
                size={56}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-lg font-extrabold tracking-tight ${
                    answeredRight ? "text-moss" : "text-accent"
                  }`}
                >
                  {answeredRight
                    ? step.kind === "quiz" && step.attempt > 0
                      ? "İşte bu!"
                      : run >= 5
                        ? "Durdurulamazsın!"
                        : run >= 3
                          ? "Seri gidiyor!"
                          : "Süper!"
                    : "Olmadı."}
                  {answeredRight && run >= 3 && (
                    <span className="ml-2 inline-block rounded-full bg-gilt/15 px-2 py-0.5 align-middle text-xs font-extrabold text-gilt-ink ring-1 ring-gilt/40 animate-[pop-in_220ms_cubic-bezier(0.34,1.56,0.64,1)]">
                      🔥 üst üste {run}
                    </span>
                  )}
                </p>
                {answeredRight && (
                  <p className="mt-0.5 text-sm font-semibold text-ink break-words">
                    {card.front} — {meaning}
                  </p>
                )}
                {/* The sentence round was about the sentence: show what it said. */}
                {answeredRight && format === "context" && card.example_tr && (
                  <p className="mt-1 text-sm text-graphite break-words">{card.example_tr}</p>
                )}
              </div>
            </div>

            {!answeredRight && (
              <div className="mt-3">
                <MeetBody card={card} variant="panel" />
              </div>
            )}

            <Button
              size="lg"
              fullWidth
              className="mt-3"
              variant="ink"
              onClick={onContinue}
            >
              Devam
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The listening round's hero: no text, just the sound. The word appears in
 * the same slot the instant an answer is in, so what was heard and how it's
 * spelled land together.
 */
function ListenHero({ word, revealed }: { word: string; revealed: boolean }) {
  const [playing, setPlaying] = useState(false);
  const play = (rate?: number) =>
    void speak(word, {
      rate,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
    });

  if (revealed) {
    return (
      <p className="text-3xl font-extrabold leading-snug tracking-tight text-ink break-words sm:text-5xl animate-[pop-in_200ms_ease-out]">
        {word}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => play()}
        aria-label="Kelimeyi dinle"
        className={`flex h-20 w-20 items-center justify-center rounded-full transition ${
          playing
            ? "bg-ocean-deep text-white scale-105 animate-ring-pulse"
            : "bg-ocean text-white shadow-[inset_0_-5px_0_0_rgba(0,0,0,0.18)] hover:-translate-y-0.5"
        }`}
      >
        <SpeakerIcon className={`h-9 w-9 ${playing ? "animate-pulse" : ""}`} />
      </button>
      <button
        type="button"
        onClick={() => play(0.65)}
        className="text-xs font-bold text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink"
      >
        🐢 Daha yavaş
      </button>
    </div>
  );
}

/**
 * The production round: write the English from the Turkish. Judged on the
 * letters only (see spellingMatches). After a miss the word comes back with
 * its first letter shown, then its shape, so the repeat always ends.
 */
function TypeAnswer({
  expected,
  attempt,
  answered,
  onSubmit,
}: {
  expected: string;
  attempt: number;
  answered: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const hint =
    attempt >= 2
      ? expected
          .replace(/[a-z]/gi, (ch, i) => (i === 0 ? ch : "_"))
          .replace(/_/g, " _")
      : attempt === 1
        ? `${expected[0]}…`
        : null;

  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim()) onSubmit(text);
      }}
    >
      <TontonLine mood={answered ? "idle" : "think"}>İngilizcesini yaz</TontonLine>
      {hint && (
        <p className="mt-1 text-center font-mono text-sm tracking-widest text-gilt-ink">
          {hint}
        </p>
      )}
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={answered}
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-label="Cevabın"
        placeholder="buraya yaz"
        className="mt-3 w-full rounded-2xl bg-paper px-4 py-4 text-center text-2xl font-extrabold text-ink outline-none ring-1 ring-rule transition placeholder:font-semibold placeholder:text-graphite/70 focus:ring-2 focus:ring-ink/40 disabled:bg-paper-deep/60"
      />
      {!answered && (
        <Button
          type="submit"
          size="lg"
          fullWidth
          variant="ink"
          className="mt-3"
          disabled={!text.trim()}
        >
          Kontrol et
        </Button>
      )}
    </form>
  );
}

/** The fixed slot every forward button lives in, so it never moves between steps. */
function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-rule bg-white">
      <div className="mx-auto max-w-2xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- summary -- */

function LessonSummary({
  mode,
  queue,
  outcomes,
  newWords,
  streak,
  failedReviews,
  onDone,
}: {
  mode: SessionMode;
  queue: Card[];
  outcomes: Record<number, "right" | "wrong">;
  newWords: number;
  streak: number;
  failedReviews: number;
  onDone: () => void;
}) {
  // One fanfare, when the summary first appears.
  useEffect(() => {
    playLessonComplete();
  }, []);

  const firstTimeRight = queue.filter(
    (card) => outcomes[card.id] === "right",
  ).length;
  const accuracy =
    queue.length === 0 ? 0 : Math.round((firstTimeRight / queue.length) * 100);

  const heading =
    mode === "review"
      ? "Tekrar tamam! 🔁"
      : newWords === 0
        ? "Güzel pratikti! 💪"
        : newWords === 1
          ? "1 yeni kelime cebinde! 🎉"
          : `${newWords} yeni kelime cebinde! 🎉`;
  const verdict =
    accuracy === 100
      ? "Hepsini ilk denemede bildin. Tonton gururlu! 🥳"
      : accuracy >= 60
        ? "Kaçanlar sana yarın tekrar gelecek — korkma, böyle öğreniliyor. 💪"
        : "Zor bir dersti, ama artık tanışıksınız. Yarın çok daha kolay gelecek. 🌱";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-paper-lift p-8 text-center ring-1 ring-rule shadow-print paper-grain animate-[pop-in_220ms_ease-out] sm:p-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <span className="absolute left-8 top-6 h-3 w-3 animate-bounce rounded-full bg-accent/70" />
        <span className="absolute right-10 top-10 h-2 w-2 rounded-full bg-moss/70" />
        <span className="absolute left-1/2 top-16 h-2.5 w-2.5 animate-pulse rounded-full bg-gilt/80" />
        <span className="absolute bottom-12 left-12 h-2 w-2 animate-pulse rounded-full bg-moss/60" />
        <span className="absolute bottom-14 right-16 h-3 w-3 animate-bounce rounded-full bg-gilt/70" />
      </div>

      <div className="relative">
        <Mascot mood="happy" size={132} className="mx-auto" />
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
          {heading}
        </h2>

        {/* What you actually did, word by word — tap one to hear it again. */}
        <div className="mx-auto mt-5 max-w-sm space-y-1.5">
          {queue.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => void speak(card.front)}
              className="flex w-full items-center gap-2 rounded-xl bg-paper px-3 py-2 text-left ring-1 ring-rule transition-transform duration-100 active:scale-[0.98]"
            >
              <span
                className={`shrink-0 text-xs font-black ${outcomes[card.id] === "right" ? "text-moss" : "text-accent"}`}
                aria-hidden="true"
              >
                {outcomes[card.id] === "right" ? "✓" : "↺"}
              </span>
              <span className="min-w-0 flex-1 truncate font-extrabold text-ink">
                {card.front}
              </span>
              <span className="min-w-0 flex-1 truncate text-right text-sm text-graphite">
                {parseBack(card.back).text}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <div className="min-w-[6.5rem] rounded-2xl bg-paper px-4 py-3 ring-1 ring-rule">
            <p className="text-2xl font-extrabold text-ink tabular-nums">
              {queue.length}
            </p>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
              Kelime
            </p>
          </div>
          {mode === "review" && (
            <div className="min-w-[6.5rem] rounded-2xl bg-paper px-4 py-3 ring-1 ring-rule">
              <p className={`text-2xl font-extrabold tabular-nums ${accuracy >= 60 ? "text-moss" : "text-accent"}`}>
                %{accuracy}
              </p>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
                Doğru
              </p>
            </div>
          )}
          {streak > 0 && (
            <div className="min-w-[6.5rem] rounded-2xl bg-paper px-4 py-3 ring-1 ring-gilt/70">
              <p className="text-2xl font-extrabold text-gilt-ink tabular-nums">{streak}</p>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
                Günlük seri
              </p>
            </div>
          )}
        </div>

        {failedReviews > 0 && (
          <p
            role="alert"
            className="mx-auto mt-5 max-w-sm rounded-2xl bg-accent/8 p-3 text-sm font-medium text-accent ring-1 ring-accent/30"
          >
            {failedReviews} cevap kaydedilemedi — bağlantını kontrol edip o
            kelimeleri tekrar çalış.
          </p>
        )}

        <TontonLine className="mt-5 text-left" mood="happy" size={48} tone="amber">
          {verdict}
        </TontonLine>

        <div className="mt-6 flex justify-center">
          <Button size="lg" variant="ink" onClick={onDone}>
            Bitti
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- page -- */

function Study() {
  // Falls back to "" so the hooks below always run in the same order.
  const { deckId = "" } = useParams<{ deckId: string }>();
  // ?lesson=N walks one lesson of the path; ?mode=all practises everything
  // introduced so far; no parameter means today's reviews.
  const [searchParams] = useSearchParams();
  const lessonParam = Number(searchParams.get("lesson"));
  const lessonNumber =
    Number.isInteger(lessonParam) && lessonParam > 0 ? lessonParam : null;
  const isReviewAll = searchParams.get("mode") === "all";
  const usesDueQueue = lessonNumber === null && !isReviewAll;

  const dueQuery = useQuery({
    queryKey: ["dueCards", deckId],
    queryFn: () =>
      api
        .get<{ cards: Card[] }>(`/decks/${deckId}/cards/due`)
        .then((response) => response.cards),
    enabled: deckId !== "" && usesDueQueue,
    // The session snapshots this list, so it must never change underneath it.
    staleTime: Infinity,
    refetchOnMount: "always",
    refetchOnReconnect: false,
  });

  // Tells "the deck is empty" apart from "nothing is due right now", supplies
  // lesson queues, and doubles as the distractor pool for the quiz.
  const cardsQuery = useQuery({
    queryKey: ["cards", deckId],
    queryFn: () =>
      api
        .get<{ cards: Card[] }>(`/decks/${deckId}/cards`)
        .then((response) => response.cards),
    enabled: deckId !== "",
  });

  // There is no GET /decks/:id, so the name comes from the cached list.
  const decksQuery = useQuery({
    queryKey: ["decks"],
    queryFn: () =>
      api.get<{ decks: Deck[] }>("/decks").then((response) => response.decks),
  });

  // Unit gates decide which lessons are reachable.
  const unitsQuery = useUnits(deckId);

  // A lesson's new words come out of the day's three, shared with the own words.
  const budgetQuery = useDayBudget(deckId, lessonNumber !== null);


  // Every hook has run by now, so this early return is safe.
  if (!deckId) {
    return <Navigate to="/decks" replace />;
  }

  const renderContent = () => {
    const deckName = decksQuery.data?.find(
      (deck) => String(deck.id) === deckId,
    )?.name;

    // Both non-due modes read their queue straight from the deck's card list.
    if (!usesDueQueue) {
      if (cardsQuery.isError) {
        return (
          <ErrorState
            title="Çalışma başlatılamadı"
            message={describeError(cardsQuery.error)}
            onRetry={() => void cardsQuery.refetch()}
          />
        );
      }
      if (
        cardsQuery.isLoading ||
        !cardsQuery.data ||
        unitsQuery.isLoading ||
        // The budget is read fresh before a lesson opens; a failed read lets the server decide.
        (lessonNumber !== null && budgetQuery.isFetching && !budgetQuery.isError)
      ) {
        return <StudySkeleton />;
      }

      if (lessonNumber !== null) {
        const path = buildPath(cardsQuery.data, unitsQuery.data ?? []);
        const unit = path.find((candidate) =>
          candidate.lessons.some((lesson) => lesson.number === lessonNumber),
        );
        const lesson = unit?.lessons.find(
          (candidate) => candidate.number === lessonNumber,
        );

        if (!lesson) {
          return (
            <EmptyState
              emoji="🤔"
              title="Böyle bir ders yok"
              description="O ders bu destede yok."
              action={
                <LinkButton to={`/decks/${deckId}`}>
                  Patikaya dön
                </LinkButton>
              }
            />
          );
        }
        // Walking straight to a URL must not hand out words the path hasn't
        // reached — three a day is the whole plan.
        if (lesson.state === "locked") {
          return (
            <EmptyState
              emoji="🔒"
              title="Şimdi değil"
              description="Önce bundan önceki dersleri bitir — günde üç kelime, planın tamamı bu."
              action={
                <LinkButton to={`/decks/${deckId}`}>
                  Patikaya dön
                </LinkButton>
              }
            />
          );
        }
        // Today's three new words are used up (the own words count too): the
        // lesson waits for tomorrow. One with nothing new in it never waits.
        if (lessonOverBudget(budgetQuery.data, lesson.cards)) {
          return (
            <EmptyState
              emoji="🌙"
              title={`Bugünün ${budgetQuery.data?.cap ?? 3} yeni kelimesi tamam`}
              description={`Ders ${lessonNumber} yarın açılır. Tekrarların varsa onlar hazır.`}
              action={
                <LinkButton to="/kurs">
                  Kursa dön
                </LinkButton>
              }
            />
          );
        }

        return (
          <StudySession
            key={`${deckId}-lesson-${lessonNumber}`}
            deckId={deckId}
            cards={[...lesson.cards].sort((a, b) => a.id - b.id)}
            mode="lesson"
            title={`Ders ${lessonNumber}`}
            level={unit?.level ?? null}
            lessonNumber={lessonNumber}
            deckCardCount={cardsQuery.data.length}
            deckCards={cardsQuery.data}
            deckCardsError={cardsQuery.error}
            onRetryDeckCards={() => void cardsQuery.refetch()}
          />
        );
      }

      // Practice is only ever words already met. A never-seen word appearing
      // here was the other way new words leaked out ahead of the path.
      return (
        <StudySession
          key={`${deckId}-all`}
          deckId={deckId}
          cards={cardsQuery.data.filter(hasStarted)}
          mode="review"
          title="Pratik"
          deckCardCount={cardsQuery.data.length}
          deckCards={cardsQuery.data}
          deckCardsError={cardsQuery.error}
          onRetryDeckCards={() => void cardsQuery.refetch()}
        />
      );
    }

    if (dueQuery.isError) {
      return (
        <ErrorState
          title="Çalışma başlatılamadı"
          message={describeError(dueQuery.error)}
          onRetry={() => dueQuery.refetch()}
        />
      );
    }

    // On a second visit React Query serves the previous due list from cache
    // while it refetches; mounting on that stale data would snapshot cards
    // that were already reviewed. Wait for the fetch to settle. Also wait for
    // the deck's card list on its first load only, so quiz mode doesn't
    // flicker on for card 1 and off for card 2.
    if (!dueQuery.data || dueQuery.isFetching || cardsQuery.isLoading) {
      return <StudySkeleton />;
    }

    return (
      <StudySession
        key={`${deckId}-due`}
        deckId={deckId}
        cards={dueQuery.data}
        mode="review"
        title={deckName ?? "Tekrar"}
        deckCardCount={cardsQuery.data?.length}
        deckCards={cardsQuery.data}
        deckCardsError={cardsQuery.error}
        onRetryDeckCards={() => void cardsQuery.refetch()}
      />
    );
  };

  // The same side margins as every other page: without them the cards meet the edge of a phone.
  return <div className="mx-auto max-w-2xl px-5 pt-5 sm:px-6">{renderContent()}</div>;
}

export default Study;
