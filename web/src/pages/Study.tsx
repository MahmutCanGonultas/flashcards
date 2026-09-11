import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { Card, Deck } from "../types";
import { parseBack } from "../lib/cardBack";
import { buildQuizOptions, buildWordOptions, type QuizOption } from "../lib/quiz";
import { blankOut, BLANK } from "../lib/sentence";
import { hasStarted, buildPath } from "../lib/path";
import {
  buildLessonPlan,
  buildReviewPlan,
  repeatStep,
  type Step,
  type QuizFormat,
} from "../lib/lessonPlan";
import { speak, speakAuto, isSpeechMuted, setSpeechMuted, speechSupported } from "../lib/speech";
import { playCorrect, playIncorrect } from "../lib/sound";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import SpeakButton from "../components/SpeakButton";
import QuizOptions from "../components/QuizOptions";
import Mascot from "../components/Mascot";
import MeetBody from "../components/MeetBody";
import SoundMatch from "../components/SoundMatch";
import RoundRail, { type RailStage } from "../components/RoundRail";
import { SpeakerIcon } from "../components/icons";
import { useRecordStudyDay } from "../lib/streak";

type ReviewInput = { cardId: number; quality: 1 | 4 };
type SessionMode = "lesson" | "review";

const KEY_TO_OPTION: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };

/** Ignore taps landing within the cross-fade, so a double tap can't skip a step. */
const TRANSITION_GUARD_MS = 180;

/** From this attempt on, a repeated question narrows to two options. */
const NARROW_FROM_ATTEMPT = 2;

function describeError(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
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
    mode === "lesson" ? buildLessonPlan(cards) : buildReviewPlan(cards),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<Record<number, "right" | "wrong">>({});
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
  const stepCard = step && step.kind !== "listen" ? byId.get(step.cardId) : undefined;

  // Reshuffles exactly once per step — a repeated question gets fresh options,
  // but re-rendering the same step never moves the answers under a tapping thumb.
  const options = useMemo<QuizOption[] | null>(() => {
    if (!step || step.kind !== "quiz" || !stepCard) return null;
    const mates = step.mateIds
      .map((id) => byId.get(id))
      .filter((card): card is Card => card !== undefined);

    // A word that keeps coming back narrows to a straight choice between two,
    // so the loop that guards against a zero-score lesson always terminates.
    const build = { mates, maxOptions: step.attempt >= NARROW_FROM_ATTEMPT ? 2 : 4 };

    return step.format === "meaning"
      ? buildQuizOptions(stepCard, deckCardPool, build)
      : buildWordOptions(stepCard, deckCardPool, build);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key, stepCard, deckCardPool, byId]);

  const answered = answer !== null;
  const answeredRight = answered && options ? options[answer].isCorrect : null;

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }: ReviewInput) =>
      api.post<{ card: Card }>(`/decks/${deckId}/cards/${cardId}/review`, { quality }),
    retry: 2,
    onSuccess: () => {
      didReviewRef.current = true;
    },
    onError: () => setFailedReviews((n) => n + 1),
  });
  const { mutate: mutateReview } = reviewMutation;

  const markStudied = useCallback(() => {
    if (recordedDayRef.current) return;
    recordedDayRef.current = true;
    recordStudyDay.mutate();
  }, [recordStudyDay]);

  // Refresh the deck's other screens when this one is left, so the path and
  // review counts reflect what just happened.
  useEffect(() => {
    return () => {
      if (didReviewRef.current) {
        queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
        queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      }
    };
  }, [queryClient, deckId]);

  // Every photo in the session, fetched up front. Cards now appear several
  // times, so preloading per card would fire late and repeatedly.
  useEffect(() => {
    for (const card of queue) {
      if (card.image_url) {
        const preload = new Image();
        preload.src = card.image_url;
      }
    }
  }, [queue]);

  // Say the word whenever a step showing it opens. Keyed on the step, not the
  // card: one word is now met, heard and asked about within a single session.
  useEffect(() => {
    stepEnteredAtRef.current = Date.now();
    if (!step || step.kind === "listen") return;
    const card = byId.get(step.cardId);
    // The sentence question would give its own answer away if it spoke.
    if (card && !(step.kind === "quiz" && step.format === "context")) {
      speakAuto(card.front);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key]);

  const advance = useCallback(() => {
    if (Date.now() - stepEnteredAtRef.current < TRANSITION_GUARD_MS) return;
    setAnswer(null);
    setStepIndex((index) => index + 1);
  }, []);

  const chooseOption = useCallback(
    (index: number) => {
      if (!step || step.kind !== "quiz" || !stepCard || !options || answer !== null) return;
      const isCorrect = options[index].isCorrect;
      setAnswer(index);

      if (isCorrect) playCorrect();
      else playIncorrect();

      // Exactly one write per card per session. A second would silently take a
      // word from interval 1 to interval 6 inside a single day.
      if (step.graded && !gradedRef.current.has(stepCard.id)) {
        gradedRef.current.add(stepCard.id);
        mutateReview({ cardId: stepCard.id, quality: isCorrect ? 4 : 1 });
        markStudied();
      }

      setOutcomes((previous) =>
        previous[stepCard.id] ? previous : { ...previous, [stepCard.id]: isCorrect ? "right" : "wrong" },
      );

      // Missed words come back until they land. The repeat is never graded —
      // the schedule already recorded the lapse.
      if (!isCorrect && mode === "lesson") {
        setPlan((previous) => [...previous, repeatStep(stepCard, step.format, step.attempt)]);
      }

      if (!isCorrect) speakAuto(stepCard.front);
    },
    [step, stepCard, options, answer, mode, mutateReview, markStudied],
  );

  const stages = useMemo<RailStage[]>(() => {
    if (mode !== "lesson") return [];
    const rail: RailStage[] = [];
    if (plan.some((s) => s.kind === "meet")) rail.push({ id: "meet", label: "Meet" });
    if (plan.some((s) => s.kind === "listen")) rail.push({ id: "listen", label: "Listen" });
    rail.push({ id: "prove", label: "Prove" });
    return rail;
  }, [mode, plan]);

  const activeStage = useMemo(() => {
    if (!step) return stages.length - 1;
    const id = step.kind === "quiz" ? "prove" : step.kind;
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
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
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
            title="Couldn't load this deck"
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
          title="No cards yet"
          description="Add a few cards to this deck and they'll show up here to study."
          action={<LinkButton to={`/decks/${deckId}`}>Back to deck</LinkButton>}
        />
      );
    }
    return (
      <EmptyState
        emoji="☕"
        title="Nothing to review"
        description="You're all caught up. Come back later!"
        action={
          <LinkButton to={`/decks/${deckId}`} variant="secondary">
            Back to deck
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
        title="Couldn't load your words"
        message="Your deck is fine — the app just couldn't reach it. Check your connection."
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
        onDone={() => navigate(`/decks/${deckId}`)}
      />
    );
  }

  if (!step) return <StudySkeleton />;

  const answeredCount = plan
    .slice(0, stepIndex)
    .filter((s) => s.kind === "quiz").length;
  const totalQuestions = plan.filter((s) => s.kind === "quiz").length;
  const progress = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

  const actLabel = (() => {
    if (step.kind === "meet") {
      const meets = plan.filter((s) => s.kind === "meet");
      const position = meets.findIndex((s) => s.key === step.key) + 1;
      return `New word ${position} of ${meets.length}`;
    }
    if (step.kind === "listen") return "Sound check";
    if (step.attempt > 0) return "One more time";
    if (step.format === "context") return "Use it in a sentence";
    return mode === "lesson" ? "Your turn" : title;
  })();

  return (
    <div className="pb-40">
      {/* Session chrome: leave, where you are, and the sound switch. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/decks/${deckId}`)}
          aria-label={mode === "lesson" ? "Leave lesson" : "Leave review"}
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 text-2xl leading-none text-stone-400 transition hover:bg-stone-900/5 hover:text-stone-700"
        >
          ×
        </button>
        {stages.length > 0 ? (
          <div className="flex flex-1 justify-center">
            <RoundRail stages={stages} activeIndex={activeStage} />
          </div>
        ) : (
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Turn pronunciation on" : "Turn pronunciation off"}
            className={`-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 transition ${
              muted ? "text-stone-300" : "text-violet-500"
            }`}
          >
            <SpeakerIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {stages.length > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <p className="mt-5 text-center text-sm font-bold uppercase tracking-widest text-stone-400">
        {actLabel}
      </p>

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
          options={options}
          answer={answer}
          answeredRight={answeredRight}
          onChoose={chooseOption}
          onContinue={advance}
        />
      ) : (
        <StudySkeleton />
      )}
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
        <Button size="lg" fullWidth disabled={!done} onClick={onContinue}>
          {done ? "Start the quiz" : "Match all three"}
        </Button>
      </BottomBar>
    </>
  );
}

function QuestionStep({
  card,
  step,
  options,
  answer,
  answeredRight,
  onChoose,
  onContinue,
}: {
  card: Card;
  step: Step;
  options: QuizOption[] | null;
  answer: number | null;
  answeredRight: boolean | null;
  onChoose: (index: number) => void;
  onContinue: () => void;
}) {
  const { pos, text: meaning } = parseBack(card.back);
  const isMeet = step.kind === "meet";
  const format: QuizFormat | null = step.kind === "quiz" ? step.format : null;
  const blanked =
    format === "context" && card.example_sentence
      ? blankOut(card.example_sentence, card.front)
      : null;

  return (
    <>
      {/* The hero keeps the same shape on every step, so the word never jumps
          between being taught and being asked about. */}
      <div className="mt-4 min-h-[9.25rem] rounded-3xl bg-gradient-to-br from-white via-violet-50 to-violet-100 p-6 text-center ring-2 ring-violet-200 shadow-[0_5px_0_0_var(--color-violet-200)] sm:p-8">
        {blanked ? (
          <p className="text-xl font-bold leading-relaxed text-stone-800 break-words sm:text-2xl">
            {blanked.text.split(BLANK).map((piece, index, all) => (
              <span key={index}>
                {piece}
                {index < all.length - 1 && (
                  <span className="mx-1 inline-block min-w-[4.5rem] border-b-4 border-violet-400 align-middle" />
                )}
              </span>
            ))}
          </p>
        ) : (
          <>
            <p className="text-3xl font-extrabold leading-snug tracking-tight text-stone-800 break-words sm:text-5xl">
              {card.front}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {pos && (
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-600 ring-1 ring-violet-200">
                  {pos}
                </span>
              )}
              <SpeakButton text={card.front} size="md" />
            </div>
          </>
        )}
      </div>

      {isMeet ? (
        <>
          <div className="mt-3">
            <MeetBody card={card} />
          </div>
          <BottomBar>
            <Button size="lg" fullWidth onClick={onContinue}>
              Got it
            </Button>
          </BottomBar>
        </>
      ) : options ? (
        <>
          <p className="mt-4 text-center text-sm font-semibold text-stone-500">
            {format === "context" ? "Which word is missing?" : "What does it mean?"}
          </p>
          <QuizOptions options={options} selectedIndex={answer} onSelect={onChoose} />
          {answer === null && (
            <p className="mt-5 text-center text-xs font-medium text-stone-400">
              Tap an answer · keys 1-4
            </p>
          )}
        </>
      ) : (
        <ErrorState
          title="Couldn't build this question"
          message="There aren't enough words in this deck to make a multiple-choice question yet."
        />
      )}

      {/* Feedback. A wrong answer re-opens the full explanation — the moment
          it is worth most is right after getting it wrong. */}
      {answer !== null && (
        <div
          className={`fixed inset-x-0 bottom-0 z-20 max-h-[70vh] overflow-y-auto animate-[slide-up_220ms_ease-out] border-t-2 ${
            answeredRight ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="mx-auto max-w-2xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-start gap-3">
              <Mascot mood={answeredRight ? "happy" : "sad"} size={56} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-lg font-extrabold tracking-tight ${
                    answeredRight ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {answeredRight
                    ? step.kind === "quiz" && step.attempt > 0
                      ? "There it is."
                      : "Nice!"
                    : "Not quite."}
                </p>
                {answeredRight && (
                  <p className="mt-0.5 text-sm font-semibold text-emerald-800 break-words">
                    {card.front} — {meaning}
                  </p>
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
              variant={answeredRight ? "primary" : "danger"}
              onClick={onContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/** The fixed slot every forward button lives in, so it never moves between steps. */
function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200/70 bg-[#FDF9F3]/95 backdrop-blur">
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
  const firstTimeRight = queue.filter((card) => outcomes[card.id] === "right").length;
  const accuracy = queue.length === 0 ? 0 : Math.round((firstTimeRight / queue.length) * 100);

  const heading =
    mode === "review"
      ? "Review done."
      : newWords === 0
        ? "Nice practice."
        : newWords === 1
          ? "1 new word."
          : `${newWords} new words.`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-emerald-50 p-8 text-center ring-2 ring-emerald-100 shadow-[0_5px_0_0_var(--color-emerald-100)] animate-[pop-in_220ms_ease-out] sm:p-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <span className="absolute left-8 top-6 h-3 w-3 animate-bounce rounded-full bg-violet-300" />
        <span className="absolute right-10 top-10 h-2 w-2 rounded-full bg-emerald-300" />
        <span className="absolute left-1/2 top-16 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-300" />
        <span className="absolute bottom-12 left-12 h-2 w-2 animate-pulse rounded-full bg-sky-300" />
        <span className="absolute bottom-14 right-16 h-3 w-3 animate-bounce rounded-full bg-rose-300" />
      </div>

      <div className="relative">
        <Mascot mood="happy" size={132} className="mx-auto" />
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-800">{heading}</h2>

        {/* What you actually did, word by word — tap one to hear it again. */}
        <div className="mx-auto mt-5 max-w-sm space-y-1.5">
          {queue.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => void speak(card.front)}
              className="flex w-full items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-left ring-1 ring-emerald-100 transition hover:bg-white"
            >
              <span className="shrink-0 text-xs" aria-hidden="true">
                {outcomes[card.id] === "right" ? "✓" : "↺"}
              </span>
              <span className="min-w-0 flex-1 truncate font-extrabold text-stone-800">
                {card.front}
              </span>
              <span className="min-w-0 flex-1 truncate text-right text-sm text-stone-500">
                {parseBack(card.back).text}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <div className="min-w-[6.5rem] rounded-2xl bg-white px-4 py-3 ring-2 ring-emerald-100">
            <p className="text-2xl font-extrabold text-emerald-600">{queue.length}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Words</p>
          </div>
          {mode === "review" && (
            <div className="min-w-[6.5rem] rounded-2xl bg-white px-4 py-3 ring-2 ring-violet-100">
              <p className="text-2xl font-extrabold text-violet-600">{accuracy}%</p>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Correct</p>
            </div>
          )}
          {streak > 0 && (
            <div className="min-w-[6.5rem] rounded-2xl bg-white px-4 py-3 ring-2 ring-amber-100">
              <p className="text-2xl font-extrabold text-amber-500">{streak}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Day streak</p>
            </div>
          )}
        </div>

        {failedReviews > 0 && (
          <p
            role="alert"
            className="mx-auto mt-5 max-w-sm rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-800 ring-1 ring-amber-200"
          >
            {failedReviews} answer{failedReviews === 1 ? "" : "s"} couldn't be saved — check your
            connection and study those words again.
          </p>
        )}

        <p className="mt-5 text-sm text-stone-500">
          You'll see these again tomorrow. That's when it counts.
        </p>

        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={onDone}>
            Done
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
  const lessonNumber = Number.isInteger(lessonParam) && lessonParam > 0 ? lessonParam : null;
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

  // Every hook has run by now, so this early return is safe.
  if (!deckId) {
    return <Navigate to="/decks" replace />;
  }

  const renderContent = () => {
    const deckName = decksQuery.data?.find((deck) => String(deck.id) === deckId)?.name;

    // Both non-due modes read their queue straight from the deck's card list.
    if (!usesDueQueue) {
      if (cardsQuery.isError) {
        return (
          <ErrorState
            title="Couldn't start studying"
            message={describeError(cardsQuery.error)}
            onRetry={() => void cardsQuery.refetch()}
          />
        );
      }
      if (cardsQuery.isLoading || !cardsQuery.data) return <StudySkeleton />;

      if (lessonNumber !== null) {
        const lesson = buildPath(cardsQuery.data)
          .flatMap((unit) => unit.lessons)
          .find((candidate) => candidate.number === lessonNumber);

        if (!lesson) {
          return (
            <EmptyState
              emoji="🤔"
              title="No such lesson"
              description="That lesson isn't in this deck."
              action={<LinkButton to={`/decks/${deckId}`}>Back to the path</LinkButton>}
            />
          );
        }
        // Walking straight to a URL must not hand out words the path hasn't
        // reached — three a day is the whole plan.
        if (lesson.state === "locked") {
          return (
            <EmptyState
              emoji="🔒"
              title="Not yet"
              description="Finish the lessons before this one first — three words a day is the whole plan."
              action={<LinkButton to={`/decks/${deckId}`}>Back to the path</LinkButton>}
            />
          );
        }

        return (
          <StudySession
            key={`${deckId}-lesson-${lessonNumber}`}
            deckId={deckId}
            cards={[...lesson.cards].sort((a, b) => a.id - b.id)}
            mode="lesson"
            title={`Lesson ${lessonNumber}`}
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
          title="Practice"
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
          title="Couldn't start studying"
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
        title={deckName ?? "Review"}
        deckCardCount={cardsQuery.data?.length}
        deckCards={cardsQuery.data}
        deckCardsError={cardsQuery.error}
        onRetryDeckCards={() => void cardsQuery.refetch()}
      />
    );
  };

  return <div className="mx-auto max-w-2xl">{renderContent()}</div>;
}

export default Study;
