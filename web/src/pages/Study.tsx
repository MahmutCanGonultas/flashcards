import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { Card, Deck, ReviewQuality } from "../types";
import { parseBack } from "../lib/cardBack";
import { buildQuizOptions } from "../lib/quiz";
import { speak } from "../lib/speech";
import { playCorrect, playIncorrect } from "../lib/sound";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import SpeakButton from "../components/SpeakButton";
import QuizOptions from "../components/QuizOptions";
import Mascot from "../components/Mascot";

type ReviewInput = { cardId: number; quality: ReviewQuality };

/** The four SM-2 grades, used only by the self-graded fallback for tiny decks. */
const RATINGS = [
  { label: "Again", emoji: "😵", quality: 1, variant: "softDanger" },
  { label: "Hard", emoji: "😖", quality: 3, variant: "softWarning" },
  { label: "Good", emoji: "🙂", quality: 4, variant: "softInfo" },
  { label: "Easy", emoji: "😎", quality: 5, variant: "softSuccess" },
] as const;

const KEY_TO_OPTION: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };

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
 * Grading a card pushes its due_date into the future, so refetching the queue
 * mid-session would make it shift underneath us and skip cards. The queue is
 * snapshotted once here and never re-read; the caches are refreshed when the
 * session is left instead of after every answer.
 */
function StudySession({
  deckId,
  cards,
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const [failedReviews, setFailedReviews] = useState(0);

  const didReviewRef = useRef(false);

  const currentCard = currentIndex < queue.length ? queue[currentIndex] : null;
  const finished = queue.length > 0 && currentIndex >= queue.length;

  // null when the pool is too small (or too repetitive) to draw 3 distinct
  // distractors from — that deck falls back to a self-graded reveal.
  // Depending on currentCard?.id reshuffles exactly once per card.
  const quizOptions = useMemo(
    () => (currentCard ? buildQuizOptions(currentCard, deckCardPool) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentCard?.id, deckCardPool],
  );
  const canQuiz = quizOptions !== null;
  const revealed = canQuiz ? quizAnswer !== null : isFlipped;
  const answeredCorrectly =
    canQuiz && quizAnswer !== null ? quizOptions![quizAnswer].isCorrect : null;

  // Grading is fire-and-forget so the next word appears the instant Continue
  // is tapped. It retries on its own; anything that still fails after that is
  // reported at the end of the lesson rather than silently swallowed.
  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }: ReviewInput) =>
      api.post<{ card: Card }>(`/decks/${deckId}/cards/${cardId}/review`, { quality }),
    retry: 2,
    onSuccess: () => {
      didReviewRef.current = true;
    },
    onError: () => {
      setFailedReviews((n) => n + 1);
    },
  });

  const { isPending: isReviewing, mutate: mutateReview } = reviewMutation;

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

  // Read the word aloud the moment it appears — that's the point where the
  // learner is looking at English with no meaning shown yet.
  useEffect(() => {
    if (currentCard) void speak(currentCard.front);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard?.id]);

  // Start fetching the answer's photo now rather than when it's revealed, so
  // it's decoded and ready by the time the feedback panel opens.
  useEffect(() => {
    if (currentCard?.image_url) {
      const preload = new Image();
      preload.src = currentCard.image_url;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard?.id]);

  const goToNextCard = useCallback(() => {
    setQuizAnswer(null);
    setIsFlipped(false);
    setCurrentIndex((index) => index + 1);
  }, []);

  // Grading is fired the instant an answer is picked, so the request flies
  // while the feedback is being read.
  const selectQuizOption = useCallback(
    (index: number) => {
      if (!currentCard || quizAnswer !== null || !quizOptions) return;
      setQuizAnswer(index);
      const isCorrect = quizOptions[index].isCorrect;
      if (isCorrect) {
        playCorrect();
        setCorrectCount((n) => n + 1);
      } else {
        playIncorrect();
      }
      mutateReview({ cardId: currentCard.id, quality: isCorrect ? 4 : 1 });
    },
    [currentCard, quizAnswer, quizOptions, mutateReview],
  );

  const rate = useCallback(
    (quality: ReviewQuality) => {
      if (!currentCard || isReviewing) return;
      if (quality >= 3) setCorrectCount((n) => n + 1);
      mutateReview({ cardId: currentCard.id, quality });
      goToNextCard();
    },
    [currentCard, isReviewing, mutateReview, goToNextCard],
  );

  const handleContinue = useCallback(() => goToNextCard(), [goToNextCard]);

  // Keyboard: 1-4 pick an answer, then Enter/Space continues.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !currentCard) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      if (revealed) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleContinue();
        }
        return;
      }

      if (canQuiz) {
        const index = KEY_TO_OPTION[event.key];
        if (index !== undefined && quizOptions && index < quizOptions.length) {
          event.preventDefault();
          selectQuizOption(index);
        }
        return;
      }

      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setIsFlipped(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCard, revealed, canQuiz, quizOptions, selectQuizOption, handleContinue]);

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

  if (finished) {
    const accuracy = Math.round((correctCount / queue.length) * 100);
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
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-800">
            Lesson complete!
          </h2>

          <div className="mt-6 flex justify-center gap-3">
            <div className="min-w-[6.5rem] rounded-2xl bg-white px-4 py-3 ring-2 ring-emerald-100">
              <p className="text-2xl font-extrabold text-emerald-600">{queue.length}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Words</p>
            </div>
            <div className="min-w-[6.5rem] rounded-2xl bg-white px-4 py-3 ring-2 ring-violet-100">
              <p className="text-2xl font-extrabold text-violet-600">{accuracy}%</p>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Correct</p>
            </div>
          </div>

          {failedReviews > 0 && (
            <p
              role="alert"
              className="mx-auto mt-5 max-w-sm rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-800 ring-1 ring-amber-200"
            >
              {failedReviews} answer
              {failedReviews === 1 ? "" : "s"} couldn't be saved — check your
              connection and study those words again.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate(`/decks/${deckId}`)}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) return <StudySkeleton />;

  const { pos, text: answerText, emoji } = parseBack(currentCard.back);
  const progress = Math.round((currentIndex / queue.length) * 100);
  const feedbackTone = answeredCorrectly === false ? "wrong" : "right";

  return (
    <div className="pb-56">
      {/* Lesson chrome: leave, and how far in you are. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/decks/${deckId}`)}
          aria-label="Leave lesson"
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 text-2xl leading-none text-stone-400 transition hover:bg-stone-900/5 hover:text-stone-700"
        >
          ×
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-extrabold text-stone-400">
          {currentIndex + 1}/{queue.length}
        </span>
      </div>

      <p className="mt-6 text-center text-sm font-bold uppercase tracking-widest text-stone-400">
        {title}
      </p>

      {/* The word being asked. */}
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-white via-violet-50 to-violet-100 p-6 text-center ring-2 ring-violet-200 shadow-[0_5px_0_0_var(--color-violet-200)] sm:p-8">
        <p className="text-3xl font-extrabold leading-snug tracking-tight text-stone-800 break-words sm:text-5xl">
          {currentCard.front}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {pos && (
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-600 ring-1 ring-violet-200">
              {pos}
            </span>
          )}
          <SpeakButton text={currentCard.front} size="md" />
        </div>
      </div>

      {canQuiz && quizOptions ? (
        <QuizOptions
          options={quizOptions}
          selectedIndex={quizAnswer}
          onSelect={selectQuizOption}
        />
      ) : (
        <div className="mt-5">
          {!isFlipped ? (
            <Button size="lg" fullWidth onClick={() => setIsFlipped(true)}>
              Show answer
            </Button>
          ) : (
            <div className="rounded-3xl bg-gradient-to-br from-white to-emerald-50 p-6 text-center ring-2 ring-emerald-200">
              {emoji && (
                <div className="text-5xl leading-none" aria-hidden="true">
                  {emoji}
                </div>
              )}
              <p className="mt-2 text-2xl font-extrabold leading-snug text-stone-800 break-words">
                {answerText}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {RATINGS.map((rating) => (
                  <Button
                    key={rating.quality}
                    variant={rating.variant}
                    fullWidth
                    className="flex-col"
                    disabled={isReviewing}
                    onClick={() => rate(rating.quality)}
                  >
                    <span className="text-xl leading-none" aria-hidden="true">
                      {rating.emoji}
                    </span>
                    {rating.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!revealed && (
        <p className="mt-5 text-center text-xs font-medium text-stone-400">
          {canQuiz ? "Tap an answer · keys 1-4" : "Tap the button to reveal"}
        </p>
      )}

      {/* Duolingo-style feedback panel: everything worth reading about this
          word, and nothing moves on until you say so. */}
      {revealed && canQuiz && (
        <div
          className={`fixed inset-x-0 bottom-0 z-20 animate-[slide-up_220ms_ease-out] border-t-2 ${
            feedbackTone === "right"
              ? "border-emerald-200 bg-emerald-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="mx-auto max-w-2xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-start gap-3">
              <Mascot
                mood={feedbackTone === "right" ? "happy" : "sad"}
                size={56}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-lg font-extrabold tracking-tight ${
                    feedbackTone === "right" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {feedbackTone === "right" ? "Nice!" : `Answer: ${answerText}`}
                </p>

                {currentCard.example_sentence && (
                  <p className="mt-1 text-sm italic leading-relaxed text-stone-600 break-words">
                    {currentCard.example_sentence}
                  </p>
                )}

                {currentCard.mnemonic && (
                  <details className="mt-2">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-bold text-amber-600 [&::-webkit-details-marker]:hidden hover:text-amber-700">
                      <span aria-hidden="true">💡</span> Memory tip
                    </summary>
                    <p className="mt-1.5 rounded-xl bg-amber-50 p-2.5 text-sm leading-relaxed text-amber-900 break-words ring-1 ring-amber-100">
                      {currentCard.mnemonic}
                    </p>
                  </details>
                )}
              </div>

              {currentCard.image_url && (
                <img
                  src={currentCard.image_url}
                  alt=""
                  className="hidden h-20 w-24 shrink-0 rounded-2xl object-cover sm:block"
                />
              )}
            </div>

            <Button
              size="lg"
              fullWidth
              className="mt-3"
              variant={feedbackTone === "right" ? "primary" : "danger"}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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

      const queue =
        lessonNumber !== null
          ? cardsQuery.data
              .filter((card) => card.lesson === lessonNumber)
              .sort((a, b) => a.id - b.id)
          : // Everything ever shown: reviewed at least once, or already due.
            cardsQuery.data.filter(
              (card) =>
                card.repetitions > 0 ||
                card.interval > 0 ||
                new Date(card.due_date).getTime() <= Date.now(),
            );

      return (
        <StudySession
          key={`${deckId}-${lessonNumber ?? "all"}`}
          deckId={deckId}
          cards={queue}
          title={lessonNumber !== null ? `Lesson ${lessonNumber}` : "Practice"}
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
        key={deckId}
        deckId={deckId}
        cards={dueQuery.data}
        title={deckName ?? "Review"}
        deckCardCount={cardsQuery.data?.length}
        deckCards={cardsQuery.data}
        deckCardsError={cardsQuery.error}
        onRetryDeckCards={() => void cardsQuery.refetch()}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      <main className="mx-auto max-w-2xl px-6 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {renderContent()}
      </main>
    </div>
  );
}

export default Study;
