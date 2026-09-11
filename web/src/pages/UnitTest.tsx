import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card, UnitRecord } from "../types";
import { parseBack } from "../lib/cardBack";
import {
  buildQuizOptions,
  buildWordOptions,
  type QuizOption,
} from "../lib/quiz";
import { blankOut, BLANK } from "../lib/sentence";
import { hasStarted } from "../lib/path";
import { useUnits, useRecordUnitResult, UNIT_PASS_MARK } from "../lib/units";
import { speakAuto } from "../lib/speech";
import {
  playCorrect,
  playIncorrect,
  playUnitPassed,
  playUnitFailed,
} from "../lib/sound";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import QuizOptions from "../components/QuizOptions";
import Mascot from "../components/Mascot";
import SpeakButton from "../components/SpeakButton";
import Confetti from "../components/Confetti";

type Format = "meaning" | "context" | "reverse";

type Question = {
  card: Card;
  format: Format;
  options: QuizOption[];
  blanked: string | null;
};

const QUESTIONS_PER_FORMAT = 5;
const KEY_TO_OPTION: Record<string, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Fifteen questions over the unit's fifteen words, five in each format.
 * The Turkish-to-English round is the hard one: recognising a meaning is
 * easy, producing the word from the meaning is what actually knowing it
 * looks like. Every word appears exactly once.
 */
function buildTest(unitCards: Card[], pool: Card[]): Question[] {
  const cards = shuffle(unitCards);
  const questions: Question[] = [];

  cards.forEach((card, index) => {
    const slot = Math.floor(index / QUESTIONS_PER_FORMAT);
    let format: Format =
      slot === 0 ? "meaning" : slot === 1 ? "context" : "reverse";

    const blanked =
      format === "context" && card.example_sentence
        ? blankOut(card.example_sentence, card.front)
        : null;
    // A word that can't be blanked out of its sentence is asked the hard way instead.
    if (format === "context" && !blanked) format = "reverse";

    // Distractors come from this unit first: the test is telling its
    // fifteen words apart, not spotting the one word you've seen before.
    const build = { mates: unitCards, mateLimit: 3 };
    const options =
      format === "meaning"
        ? buildQuizOptions(card, pool, build)
        : buildWordOptions(card, pool, build);
    if (!options) return;

    questions.push({ card, format, options, blanked: blanked?.text ?? null });
  });

  return shuffle(questions);
}

function TestSession({
  deckId,
  unit,
  unitCards,
  pool,
  skip,
  onRetry,
}: {
  deckId: string;
  unit: UnitRecord;
  unitCards: Card[];
  pool: Card[];
  /** Taking the test to skip the unit's lessons, not after them. */
  skip: boolean;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const record = useRecordUnitResult(deckId);
  // A skip test opens on a briefing: the learner hasn't seen the words and
  // needs to know what passing means before the first question speaks.
  const [briefed, setBriefed] = useState(!skip);

  // Built once at mount; a re-render must never reshuffle a live test.
  const [questions] = useState(() => buildTest(unitCards, pool));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const submittedRef = useRef(false);

  const question = questions[index];
  const finished = index >= questions.length;
  const score = Math.round((correct.length / questions.length) * 100);
  const passed = score >= UNIT_PASS_MARK;

  // Only the hard round is silent: hearing the word would give it away.
  useEffect(() => {
    if (briefed && question && question.format !== "reverse")
      speakAuto(question.card.front);
  }, [briefed, question]);

  const choose = useCallback(
    (optionIndex: number) => {
      if (!question || answer !== null) return;
      setAnswer(optionIndex);
      if (question.options[optionIndex].isCorrect) {
        playCorrect(streak + 1);
        setStreak(streak + 1);
        setCorrect((list) => [...list, question.card.id]);
      } else {
        playIncorrect();
        setStreak(0);
      }
    },
    [question, answer, streak],
  );

  const { mutate: submit } = record;
  const next = useCallback(() => {
    const isLast = index + 1 >= questions.length;
    if (isLast && !submittedRef.current) {
      // Sent from the tap that reveals the result, exactly once. The score is
      // recomputed here because `correct` for this answer has already landed.
      submittedRef.current = true;
      const finalScore = Math.round((correct.length / questions.length) * 100);
      if (finalScore >= UNIT_PASS_MARK) playUnitPassed();
      else playUnitFailed();
      submit(
        { unitId: unit.id, score: finalScore },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["units", deckId] }),
        },
      );
    }
    setAnswer(null);
    setIndex((i) => i + 1);
  }, [
    index,
    questions.length,
    correct.length,
    submit,
    unit.id,
    queryClient,
    deckId,
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || !question || !briefed) return;
      if (answer !== null) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          next();
        }
        return;
      }
      const i = KEY_TO_OPTION[event.key];
      if (i !== undefined && i < question.options.length) {
        event.preventDefault();
        choose(i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, answer, choose, next, briefed]);

  const missed = questions
    .filter((q) => !correct.includes(q.card.id))
    .map((q) => q.card);

  if (!briefed) {
    // The bottom bar sits outside the animated block: a transform on an
    // ancestor would pin `fixed` to it instead of to the viewport.
    return (
      <>
        <div className="animate-[pop-in_220ms_ease-out]">
          <Link
            to={`/decks/${deckId}`}
            className="-m-2 inline-flex items-center gap-1.5 p-2 font-medium text-stone-500 transition hover:text-stone-800"
          >
            <span aria-hidden="true">←</span> Back to the path
          </Link>
          <div className="mt-6 flex items-end gap-3">
            <Mascot mood="idle" size={88} className="shrink-0" />
            <div className="relative min-w-0 flex-1 rounded-3xl rounded-bl-md bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700">
                Test out · Unit {unit.position}
              </p>
              <p className="mt-1 text-base font-semibold leading-relaxed text-amber-900">
                Know these words already? Prove it and skip the lessons.
              </p>
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-stone-800">
            {unit.title}
            {unit.title_tr && (
              <span className="font-bold text-stone-400">
                {" "}
                ({unit.title_tr})
              </span>
            )}
          </h1>
          <ul className="mt-5 space-y-2">
            {[
              [
                "🎯",
                `${unitCards.length} questions, one per word — meaning, sentence and Turkish → English.`,
              ],
              [
                "✅",
                `Score ${UNIT_PASS_MARK}% or more and the unit counts as passed. The next one opens.`,
              ],
              [
                "🙂",
                "Score less and nothing changes — the lessons are waiting, and the test is here again once you've done them.",
              ],
            ].map(([icon, text]) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200"
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {icon}
                </span>
                <p className="text-[15px] leading-relaxed text-stone-700">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200/70 bg-[#FDF9F3]/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl flex-col gap-2 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row">
            <Button size="lg" fullWidth onClick={() => setBriefed(true)}>
              Start the test
            </Button>
            <LinkButton to={`/decks/${deckId}`} variant="ghost">
              Not yet
            </LinkButton>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {!finished && question && (
        <>
          <div className="flex items-center gap-3">
            <Link
              to={`/decks/${deckId}`}
              aria-label="Leave the test"
              className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 text-2xl leading-none text-stone-400 transition hover:bg-stone-900/5 hover:text-stone-700"
            >
              ×
            </Link>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-300"
                style={{
                  width: `${Math.round((index / questions.length) * 100)}%`,
                }}
              />
            </div>
            <span className="shrink-0 text-sm font-extrabold text-stone-400">
              {index + 1}/{questions.length}
            </span>
          </div>

          <p className="mt-5 text-center text-sm font-bold uppercase tracking-widest text-amber-600">
            Unit {unit.position} test ·{" "}
            {question.format === "meaning"
              ? "What does it mean?"
              : question.format === "context"
                ? "Which word is missing?"
                : "Which word is this?"}
          </p>

          <div key={index} className="animate-[step-in_180ms_ease-out]">
            <div className="mt-4 min-h-[9.25rem] rounded-3xl bg-gradient-to-br from-white via-amber-50 to-amber-100 p-6 text-center ring-2 ring-amber-200 shadow-[0_5px_0_0_var(--color-amber-200)] sm:p-8">
              {question.format === "context" && question.blanked ? (
                <p className="text-xl font-bold leading-relaxed text-stone-800 break-words sm:text-2xl">
                  {question.blanked.split(BLANK).map((piece, i, all) => (
                    <span key={i}>
                      {piece}
                      {i < all.length - 1 && (
                        <span className="mx-1 inline-block min-w-[4.5rem] border-b-4 border-amber-400 align-middle" />
                      )}
                    </span>
                  ))}
                </p>
              ) : question.format === "reverse" ? (
                <>
                  {parseBack(question.card.back).emoji && (
                    <p className="text-4xl leading-none" aria-hidden="true">
                      {parseBack(question.card.back).emoji}
                    </p>
                  )}
                  <p className="mt-2 text-3xl font-extrabold leading-snug tracking-tight text-stone-800 break-words sm:text-4xl">
                    {parseBack(question.card.back).text}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-stone-400">
                    in English
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-extrabold leading-snug tracking-tight text-stone-800 break-words sm:text-5xl">
                    {question.card.front}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {parseBack(question.card.back).pos && (
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                        {parseBack(question.card.back).pos}
                      </span>
                    )}
                    <SpeakButton text={question.card.front} size="md" />
                  </div>
                </>
              )}
            </div>

            <QuizOptions
              options={question.options}
              selectedIndex={answer}
              onSelect={choose}
            />
          </div>

          {answer !== null && (
            <div
              className={`fixed inset-x-0 bottom-0 z-20 animate-[slide-up_220ms_ease-out] border-t-2 ${
                question.options[answer].isCorrect
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="mx-auto max-w-2xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                <div className="flex items-center gap-3">
                  <Mascot
                    mood={question.options[answer].isCorrect ? "happy" : "sad"}
                    size={48}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-lg font-extrabold ${
                        question.options[answer].isCorrect
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {question.options[answer].isCorrect
                        ? "Correct."
                        : "Not this one."}
                    </p>
                    <p className="text-sm font-semibold text-stone-700 break-words">
                      {question.card.front} —{" "}
                      {parseBack(question.card.back).text}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  fullWidth
                  className="mt-3"
                  variant={
                    question.options[answer].isCorrect ? "primary" : "danger"
                  }
                  onClick={next}
                >
                  {index + 1 === questions.length ? "See my result" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {finished && passed && <Confetti />}
      {finished && (
        <div
          className={`relative overflow-hidden rounded-3xl p-8 text-center ring-2 animate-[pop-in_220ms_ease-out] sm:p-12 ${
            passed
              ? "bg-gradient-to-b from-white to-amber-50 ring-amber-200 shadow-[0_5px_0_0_var(--color-amber-200)]"
              : "bg-gradient-to-b from-white to-stone-50 ring-stone-200 shadow-[0_5px_0_0_var(--color-stone-200)]"
          }`}
        >
          <Mascot
            mood={passed ? "happy" : "sad"}
            size={132}
            className="mx-auto"
          />
          <p className="mt-3 text-sm font-bold uppercase tracking-widest text-stone-400">
            Unit {unit.position} · {unit.title}
            {unit.title_tr && ` (${unit.title_tr})`}
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-800">
            {passed
              ? skip
                ? "Tested out!"
                : "Unit passed!"
              : "Not this time."}
          </h2>
          <p
            className={`mt-4 text-6xl font-extrabold tabular-nums ${
              passed ? "text-amber-500" : "text-stone-400"
            }`}
          >
            {score}%
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {correct.length} of {questions.length} · pass mark {UNIT_PASS_MARK}%
          </p>

          {passed ? (
            <p className="mx-auto mt-5 max-w-sm text-stone-600">
              {skip
                ? "This unit counts as done and the next one is open. Its lessons stay on the map if you ever want them."
                : "The next unit is open. These words will keep coming back in your reviews — that's how they stay."}
            </p>
          ) : skip && missed.length > 0 ? (
            <p className="mx-auto mt-5 max-w-sm text-stone-600">
              Nothing lost —{" "}
              {missed.length === 1 ? "one word" : `${missed.length} words`} got
              away. Start this unit's lessons and they'll be yours in a few
              days.
            </p>
          ) : (
            missed.length > 0 && (
              <div className="mx-auto mt-5 max-w-sm text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Look at these again
                </p>
                <ul className="mt-2 space-y-1.5">
                  {missed.map((card) => (
                    <li
                      key={card.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200"
                    >
                      <span className="font-extrabold text-stone-800">
                        {card.front}
                      </span>
                      <span className="min-w-0 truncate text-sm text-stone-500">
                        {parseBack(card.back).text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {record.isError && (
            <p
              role="alert"
              className="mx-auto mt-5 max-w-sm rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-800 ring-1 ring-amber-200"
            >
              Your score couldn't be saved — check your connection and take the
              test again.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {passed ? (
              <Button size="lg" onClick={() => navigate(`/decks/${deckId}`)}>
                Continue
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={onRetry}>
                  Try again
                </Button>
                <LinkButton to={`/decks/${deckId}`} variant="ghost">
                  Back to the path
                </LinkButton>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function UnitTest() {
  const { deckId = "", unitId = "" } = useParams<{
    deckId: string;
    unitId: string;
  }>();
  const [searchParams] = useSearchParams();
  const skip = searchParams.get("skip") === "1";
  const unitsQuery = useUnits(deckId);
  const cardsQuery = useQuery({
    queryKey: ["cards", deckId],
    queryFn: () =>
      api.get<{ cards: Card[] }>(`/decks/${deckId}/cards`).then((r) => r.cards),
    enabled: deckId !== "",
  });
  // Bumped to remount the session, which is how "Try again" reshuffles.
  const [attempt, setAttempt] = useState(0);

  if (!deckId || !unitId) return <Navigate to="/decks" replace />;

  const unit = unitsQuery.data?.find((u) => String(u.id) === unitId);
  const unitCards = (cardsQuery.data ?? []).filter(
    (card) => String(card.unit_id) === unitId,
  );
  // The distractor pool prefers words the learner has met, and a fresh
  // learner has only met this unit's, so fall back to the whole deck.
  const learned = (cardsQuery.data ?? []).filter(hasStarted);
  const pool = learned.length >= 12 ? learned : (cardsQuery.data ?? []);

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-40 pt-8">
        {(unitsQuery.isLoading || cardsQuery.isLoading) && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        )}

        {(unitsQuery.isError || cardsQuery.isError) && (
          <ErrorState
            title="Couldn't load the test"
            message="Check your connection and try again."
            onRetry={() => {
              void unitsQuery.refetch();
              void cardsQuery.refetch();
            }}
          />
        )}

        {unitsQuery.isSuccess &&
          cardsQuery.isSuccess &&
          (!unit || unitCards.length === 0) && (
            <ErrorState
              title="No such unit"
              message="That unit isn't in this deck."
            />
          )}

        {unit && unitCards.length > 0 && (
          <TestSession
            key={`${unit.id}-${attempt}`}
            deckId={deckId}
            unit={unit}
            unitCards={unitCards}
            pool={pool}
            skip={skip}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        )}
      </main>
    </div>
  );
}

export default UnitTest;
