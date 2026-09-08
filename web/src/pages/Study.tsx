import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { Card, Deck, ReviewQuality } from "../types";
import { parseBack } from "../lib/cardBack";
import { buildQuizOptions } from "../lib/quiz";
import { speak } from "../lib/speech";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import SpeakButton from "../components/SpeakButton";
import QuizOptions from "../components/QuizOptions";

type ReviewInput = { cardId: number; quality: ReviewQuality };

/** The four SM-2 grades, in the order they appear on screen and on the keyboard. */
const RATINGS = [
  { label: "Again", emoji: "😵", quality: 1, variant: "softDanger" },
  { label: "Hard", emoji: "😖", quality: 3, variant: "softWarning" },
  { label: "Good", emoji: "🙂", quality: 4, variant: "softInfo" },
  { label: "Easy", emoji: "😎", quality: 5, variant: "softSuccess" },
] as const;

/** Number keys 1-4 map to the ratings above once the card is flipped. */
const KEY_TO_QUALITY: Record<string, ReviewQuality> = {
  "1": 1,
  "2": 3,
  "3": 4,
  "4": 5,
};

/** In quiz mode, number keys 1-4 instead pick that option (0-indexed). */
const KEY_TO_OPTION: Record<string, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
};

/** How long the picked answer stays highlighted before the next card loads. */
const QUIZ_ADVANCE_DELAY_MS = 1100;

const CARD_FACE =
  "[grid-area:1/1] [backface-visibility:hidden] flex min-h-[21rem] flex-col items-center justify-center rounded-3xl p-6 text-center sm:p-10";

function describeError(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

/** A pulsing placeholder shaped like the whole study column. */
function StudySkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-6 w-48 rounded-full" />
      <Skeleton className="mt-4 h-2.5 w-full rounded-full" />
      <Skeleton className="mt-6 min-h-[21rem] w-full rounded-3xl" />
      <Skeleton className="mt-6 h-14 w-full rounded-2xl" />
    </div>
  );
}

type StudySessionProps = {
  deckId: string;
  /** Snapshotted on mount; later changes to the due list are ignored on purpose. */
  cards: Card[];
  deckName?: string;
  /** Undefined while the deck's full card list is still loading, or if it failed. */
  deckCardCount?: number;
  /** The deck's full card list, used to draw multiple-choice distractors from. */
  deckCards?: Card[];
  deckCardsError: unknown;
  onRetryDeckCards: () => void;
};

/**
 * Drives one pass over the cards that were due when the session started.
 *
 * Reviewing a card pushes its due_date into the future, so a refetch of
 * ["dueCards"] returns a shorter list. Reading the live query data would make
 * the deck shift underneath us and skip cards, so the queue is snapshotted once
 * here and never re-read. That is also why the caches are refreshed only when
 * the session is left, rather than after every review.
 */
function StudySession({
  deckId,
  cards,
  deckName,
  deckCardCount,
  deckCards,
  deckCardsError,
  onRetryDeckCards,
}: StudySessionProps) {
  const queryClient = useQueryClient();

  const [queue] = useState(() => cards);
  // Snapshotted for the same reason `queue` is: distractors should come from
  // a fixed pool, not shift if the deck's card list refetches mid-session.
  const [deckCardPool] = useState(() => deckCards ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  // Index of the picked option this card, in quiz mode; null until chosen.
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  // Lets us skip the refresh entirely when the user leaves without reviewing.
  const didReviewRef = useRef(false);
  const advanceTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== undefined) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const currentCard = currentIndex < queue.length ? queue[currentIndex] : null;
  const finished = queue.length > 0 && currentIndex >= queue.length;

  // null when the pool is too small (or too repetitive) to draw 3 distinct
  // distractors from -- callers fall back to the plain self-graded reveal.
  // Depending on currentCard?.id (not the object) means this reshuffles
  // exactly once per card, not on every re-render.
  const quizOptions = useMemo(
    () => (currentCard ? buildQuizOptions(currentCard, deckCardPool) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentCard?.id, deckCardPool],
  );
  const canQuiz = quizOptions !== null;

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }: ReviewInput) =>
      api.post<{ card: Card }>(`/decks/${deckId}/cards/${cardId}/review`, { quality }),
    onSuccess: () => {
      didReviewRef.current = true;
      setIsFlipped(false);
      setQuizAnswer(null);
      setCurrentIndex((index) => index + 1);
    },
  });

  const { isPending: isReviewing, mutate: mutateReview } = reviewMutation;

  const rate = useCallback(
    (quality: ReviewQuality) => {
      if (!currentCard || isReviewing) return;
      mutateReview({ cardId: currentCard.id, quality });
    },
    [currentCard, isReviewing, mutateReview],
  );

  // Picking an option grades itself: right away is "Good", wrong is "Again".
  // The choice stays highlighted for a beat so the answer actually registers
  // before the next card replaces it.
  const selectQuizOption = useCallback(
    (index: number) => {
      if (!currentCard || isReviewing || quizAnswer !== null || !quizOptions) return;
      setQuizAnswer(index);
      const quality: ReviewQuality = quizOptions[index].isCorrect ? 4 : 1;
      advanceTimeoutRef.current = window.setTimeout(() => {
        mutateReview({ cardId: currentCard.id, quality });
      }, QUIZ_ADVANCE_DELAY_MS);
    },
    [currentCard, isReviewing, quizAnswer, quizOptions, mutateReview],
  );

  // Refresh the deck's other screens when this one is left, so the due counts
  // and card list they show reflect the reviews that just happened.
  useEffect(() => {
    return () => {
      if (didReviewRef.current) {
        queryClient.invalidateQueries({ queryKey: ["dueCards", deckId] });
        queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      }
    };
  }, [queryClient, deckId]);

  // Read the word aloud as soon as it becomes the current card — that's the
  // point where a learner is looking at English with no meaning shown yet.
  // Depending on currentCard?.id (not the object) means this fires exactly
  // once per card, not on every flip or re-render.
  useEffect(() => {
    if (currentCard) void speak(currentCard.front);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard?.id]);

  // Keyboard shortcuts: Space/Enter flips, then 1-4 rate the flipped card.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (!currentCard || isReviewing) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (!isFlipped) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setIsFlipped(true);
        }
        return;
      }

      if (canQuiz) {
        if (quizAnswer !== null) return; // already answered; auto-advance is pending
        const index = KEY_TO_OPTION[event.key];
        if (index !== undefined && quizOptions && index < quizOptions.length) {
          event.preventDefault();
          selectQuizOption(index);
        }
        return;
      }

      const quality = KEY_TO_QUALITY[event.key];
      if (quality) {
        event.preventDefault();
        rate(quality);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCard, isReviewing, isFlipped, rate, canQuiz, quizAnswer, quizOptions, selectQuizOption]);

  // Nothing was due when we started: say why, in the way that actually helps.
  if (queue.length === 0) {
    if (deckCardCount === undefined) {
      // Without the card count we can't tell "empty deck" from "caught up", so
      // if that lookup failed, say so rather than pulsing a skeleton forever.
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
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-emerald-50 ring-2 ring-emerald-100 shadow-[0_5px_0_0_var(--color-emerald-100)] p-10 sm:p-14 text-center">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <span className="absolute top-6 left-8 h-3 w-3 rounded-full bg-violet-300 animate-bounce" />
          <span className="absolute top-10 right-10 h-2 w-2 rounded-full bg-emerald-300" />
          <span className="absolute top-16 left-1/2 h-2.5 w-2.5 rounded-full bg-amber-300 animate-pulse" />
          <span className="absolute bottom-10 left-12 h-2 w-2 rounded-full bg-sky-300 animate-pulse" />
          <span className="absolute bottom-12 right-16 h-3 w-3 rounded-full bg-rose-300 animate-bounce" />
          <span className="absolute bottom-6 right-1/3 h-2 w-2 rounded-full bg-fuchsia-300" />
        </div>

        <div className="relative">
          <div className="text-6xl" aria-hidden="true">
            🎉
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-stone-800 tracking-tight">
            All done!
          </h2>
          <p className="mt-2 text-stone-500">You're caught up.</p>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 font-bold text-emerald-700 ring-1 ring-emerald-200">
            <span aria-hidden="true">✅</span>
            Reviewed {queue.length} {queue.length === 1 ? "card" : "cards"}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <LinkButton to={`/decks/${deckId}`}>Back to deck</LinkButton>
            <LinkButton to="/decks" variant="secondary">
              All decks
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  // `finished` and the empty check above cover every other case.
  if (!currentCard) {
    return <StudySkeleton />;
  }

  const retryReview = () => {
    const lastInput = reviewMutation.variables;
    if (lastInput) mutateReview(lastInput);
  };

  const { pos, text: answerText, emoji } = parseBack(currentCard.back);

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={`/decks/${deckId}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition hover:text-stone-800"
          >
            <span aria-hidden="true">←</span> Back to deck
          </Link>
          <span className="text-sm font-bold text-stone-500">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>

        <h1 className="mt-3 flex items-center gap-2 text-xl font-extrabold text-stone-800 tracking-tight">
          {deckName ?? "Study session"}
          <span aria-hidden="true">🧠</span>
        </h1>

        {/* One segment per card beats a bar that reads as empty on the first card. */}
        <div
          className="mt-3 flex gap-1.5"
          role="progressbar"
          aria-valuenow={currentIndex}
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-label="Cards reviewed"
        >
          {queue.map((card, index) => (
            <span
              key={card.id}
              className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${
                index < currentIndex
                  ? "bg-violet-500"
                  : index === currentIndex
                    ? "bg-violet-300"
                    : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Two static cards peek out behind the live one, so it reads as a deck. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-y-5 scale-[0.93] rounded-3xl bg-white ring-2 ring-stone-200/70"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-y-2.5 scale-[0.965] rounded-3xl bg-white ring-2 ring-stone-200/70"
        />

        {/* 3D flip. Arbitrary properties so we don't rely on Tailwind 3D utility names. */}
        <div
          className={`relative [perspective:1200px] ${isFlipped ? "" : "cursor-pointer"}`}
          onClick={() => setIsFlipped(true)}
        >
          <div
            className={`relative grid transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            {/* Front / Question */}
            <div
              className={`${CARD_FACE} bg-gradient-to-br from-white via-violet-50 to-violet-100 ring-2 ring-violet-200`}
            >
              <span className="rounded-full bg-violet-200/70 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-violet-700">
                Question
              </span>
              <p className="mt-6 text-2xl font-extrabold leading-snug text-stone-800 break-words sm:text-4xl">
                {currentCard.front}
              </p>
              <div className="mt-5 flex items-center gap-2">
                {pos && (
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-600 ring-1 ring-violet-200">
                    {pos}
                  </span>
                )}
                <SpeakButton text={currentCard.front} size="md" />
              </div>
            </div>

            {/* Back / Answer */}
            <div
              className={`${CARD_FACE} [transform:rotateY(180deg)] bg-gradient-to-br from-white via-emerald-50 to-emerald-100 ring-2 ring-emerald-200`}
              aria-hidden={!isFlipped}
            >
              <span className="rounded-full bg-emerald-200/70 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-700">
                {canQuiz ? "Pick the meaning" : "Answer"}
              </span>

              {canQuiz && quizOptions ? (
                <QuizOptions
                  options={quizOptions}
                  selectedIndex={quizAnswer}
                  onSelect={selectQuizOption}
                />
              ) : (
                <>
                  {emoji && (
                    <div className="mt-4 text-5xl leading-none" aria-hidden="true">
                      {emoji}
                    </div>
                  )}
                  {pos && (
                    <span className="mt-3 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-200">
                      {pos}
                    </span>
                  )}
                  <p
                    className={`${emoji ? "mt-2" : "mt-6"} text-2xl font-extrabold leading-snug text-stone-800 break-words sm:text-3xl`}
                  >
                    {answerText}
                  </p>
                  <SpeakButton text={currentCard.front} size="md" className="mt-4" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7">
        {!isFlipped ? (
          <Button size="lg" fullWidth onClick={() => setIsFlipped(true)}>
            Show answer
          </Button>
        ) : canQuiz ? (
          reviewMutation.isError && (
            <div
              role="alert"
              className="rounded-2xl bg-rose-100 p-4 text-center ring-2 ring-rose-200"
            >
              <p className="text-sm font-medium text-rose-700">
                {describeError(reviewMutation.error)}
              </p>
              <button
                type="button"
                onClick={retryReview}
                disabled={isReviewing}
                className="mt-2 text-sm font-bold text-rose-700 underline underline-offset-2 transition hover:text-rose-800 disabled:opacity-60"
              >
                Try again
              </button>
            </div>
          )
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATINGS.map((rating) => (
                <Button
                  key={rating.quality}
                  variant={rating.variant}
                  fullWidth
                  className="flex-col"
                  disabled={isReviewing}
                  isLoading={
                    isReviewing && reviewMutation.variables?.quality === rating.quality
                  }
                  onClick={() => rate(rating.quality)}
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    {rating.emoji}
                  </span>
                  {rating.label}
                </Button>
              ))}
            </div>

            {reviewMutation.isError && (
              <div
                role="alert"
                className="mt-4 rounded-2xl bg-rose-100 p-4 text-center ring-2 ring-rose-200"
              >
                <p className="text-sm font-medium text-rose-700">
                  {describeError(reviewMutation.error)}
                </p>
                <button
                  type="button"
                  onClick={retryReview}
                  disabled={isReviewing}
                  className="mt-2 text-sm font-bold text-rose-700 underline underline-offset-2 transition hover:text-rose-800 disabled:opacity-60"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-5 hidden text-center text-xs font-medium text-stone-500 sm:block">
          {!isFlipped
            ? "Click the card, or press Space, to flip"
            : canQuiz
              ? quizAnswer === null
                ? "Press 1-4 to choose"
                : ""
              : "1 Again · 2 Hard · 3 Good · 4 Easy"}
        </p>
      </div>
    </div>
  );
}

function Study() {
  // Falls back to "" so the hooks below always run in the same order.
  const { deckId = "" } = useParams<{ deckId: string }>();
  // ?mode=all: practice everything introduced so far, not just what's due
  // today -- a self-serve way to double-check older days haven't faded,
  // instead of only ever seeing a day's words once the algorithm brings
  // them back.
  const [searchParams] = useSearchParams();
  const isReviewAll = searchParams.get("mode") === "all";

  const dueQuery = useQuery({
    queryKey: ["dueCards", deckId],
    queryFn: () =>
      api
        .get<{ cards: Card[] }>(`/decks/${deckId}/cards/due`)
        .then((response) => response.cards),
    enabled: deckId !== "" && !isReviewAll,
    // The session snapshots this list, so it must never change underneath it:
    // no background refetch is allowed once the session is running.
    staleTime: Infinity,
    refetchOnMount: "always",
    refetchOnReconnect: false,
  });

  // Lets us tell "the deck is empty" apart from "nothing is due right now",
  // and doubles as the distractor pool for the multiple-choice quiz.
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

    if (isReviewAll) {
      if (cardsQuery.isError) {
        return (
          <ErrorState
            title="Couldn't start studying"
            message={describeError(cardsQuery.error)}
            onRetry={() => void cardsQuery.refetch()}
          />
        );
      }
      if (cardsQuery.isLoading || !cardsQuery.data) {
        return <StudySkeleton />;
      }

      // Everything that's ever been shown to the learner: already reviewed
      // at least once, or unlocked (due) even if never opened yet. A future
      // day's words that haven't come up yet stay excluded.
      const introduced = cardsQuery.data.filter(
        (card) => card.repetitions > 0 || new Date(card.due_date).getTime() <= Date.now(),
      );

      return (
        <StudySession
          key={`${deckId}-all`}
          deckId={deckId}
          cards={introduced}
          deckName={deckName}
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
    // while it refetches. Mounting the session on that stale data would
    // snapshot cards that were already reviewed, so wait for the fetch to
    // settle. Once mounted, nothing refetches this query, so the session is
    // never torn down mid-run. Also wait for the deck's full card list on its
    // first load only, so quiz mode doesn't flicker on for card 1 and off for
    // card 2 -- a failure past that point just leaves quiz mode off instead
    // of blocking the session.
    if (!dueQuery.data || dueQuery.isFetching || cardsQuery.isLoading) {
      return <StudySkeleton />;
    }

    return (
      <StudySession
        key={deckId}
        deckId={deckId}
        cards={dueQuery.data}
        deckName={deckName}
        deckCardCount={cardsQuery.data?.length}
        deckCards={cardsQuery.data}
        deckCardsError={cardsQuery.error}
        onRetryDeckCards={() => void cardsQuery.refetch()}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-10">{renderContent()}</main>
    </div>
  );
}

export default Study;
