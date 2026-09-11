import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Card, UnitRecord } from "../types";
import { parseBack } from "../lib/cardBack";
import { buildWordOptions, type QuizOption } from "../lib/quiz";
import { useUnits, useRecordPlacement } from "../lib/units";
import { playCorrect, playIncorrect, playUnitPassed } from "../lib/sound";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import QuizOptions from "../components/QuizOptions";
import Mascot from "../components/Mascot";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_NAMES: Record<Level, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper intermediate",
  C1: "Advanced",
};

const QUESTIONS_PER_LEVEL = 6;
const PASS_PER_LEVEL = 5;
const KEY_TO_OPTION: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };

type Question = { level: Level; card: Card; options: QuizOption[] };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Six Turkish-to-English questions per level, distractors from the same
 * level so a word can't be picked out just for looking harder than the
 * others. Every level is prepared up front; the session walks them in
 * order and stops at the first one that isn't passed.
 */
function buildLadder(cards: Card[], units: UnitRecord[]): Record<Level, Question[]> {
  const levelOfUnit = new Map(units.map((unit) => [unit.id, unit.level]));
  const ladder = {} as Record<Level, Question[]>;

  for (const level of LEVELS) {
    const pool = cards.filter((card) => levelOfUnit.get(card.unit_id ?? -1) === level);
    // Spread the sample across the level's units instead of clustering in one.
    const byUnit = new Map<number, Card[]>();
    for (const card of shuffle(pool)) {
      const list = byUnit.get(card.unit_id!) ?? [];
      list.push(card);
      byUnit.set(card.unit_id!, list);
    }
    const picked: Card[] = [];
    const buckets = shuffle([...byUnit.values()]);
    let round = 0;
    while (picked.length < QUESTIONS_PER_LEVEL && buckets.some((b) => b.length > round)) {
      for (const bucket of buckets) {
        if (picked.length >= QUESTIONS_PER_LEVEL) break;
        if (bucket[round]) picked.push(bucket[round]);
      }
      round += 1;
    }

    ladder[level] = picked
      .map((card) => ({ level, card, options: buildWordOptions(card, pool) }))
      .filter((q): q is Question => q.options !== null);
  }
  return ladder;
}

function PlacementSession({
  deckId,
  cards,
  units,
}: {
  deckId: string;
  cards: Card[];
  units: UnitRecord[];
}) {
  const navigate = useNavigate();
  const record = useRecordPlacement(deckId);

  const [ladder] = useState(() => buildLadder(cards, units));
  const [levelIndex, setLevelIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  const [placed, setPlaced] = useState<Level | null>(null);
  const [started, setStarted] = useState(false);
  const advanceTimer = useRef<number | undefined>(undefined);

  const level = LEVELS[levelIndex];
  const questions = ladder[level] ?? [];
  const question = questions[index];

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  const finishLevel = useCallback(
    (correct: number) => {
      const passedLevel = correct >= PASS_PER_LEVEL;
      const isLast = levelIndex >= LEVELS.length - 1;
      if (!passedLevel) {
        // Didn't clear this level, so this is where they belong.
        setPlaced(level);
        return;
      }
      if (isLast) {
        playUnitPassed();
        setPlaced("C1");
        return;
      }
      setLevelIndex((i) => i + 1);
      setIndex(0);
      setCorrectInLevel(0);
    },
    [levelIndex, level],
  );

  const choose = useCallback(
    (optionIndex: number) => {
      if (!question || answer !== null) return;
      setAnswer(optionIndex);
      const isCorrect = question.options[optionIndex].isCorrect;
      if (isCorrect) playCorrect();
      else playIncorrect();
      const correct = correctInLevel + (isCorrect ? 1 : 0);
      setCorrectInLevel(correct);

      // A test, not a lesson: a short beat to see the answer, then on.
      advanceTimer.current = window.setTimeout(() => {
        setAnswer(null);
        if (index + 1 >= questions.length) finishLevel(correct);
        else setIndex((i) => i + 1);
      }, 750);
    },
    [question, answer, correctInLevel, index, questions.length, finishLevel],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || !question || answer !== null) return;
      const i = KEY_TO_OPTION[event.key];
      if (i !== undefined && i < question.options.length) {
        event.preventDefault();
        choose(i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, answer, choose]);

  const startUnit = placed ? units.find((unit) => unit.level === placed) : null;
  const skipped = startUnit ? units.filter((unit) => unit.position < startUnit.position).length : 0;

  const confirm = () => {
    if (!placed) return;
    record.mutate(placed, { onSuccess: () => navigate(`/decks/${deckId}`) });
  };

  if (!started) {
    return (
      <div className="rounded-3xl bg-gradient-to-b from-white to-violet-50 p-8 text-center ring-2 ring-violet-100 shadow-[0_5px_0_0_var(--color-violet-100)] animate-[pop-in_220ms_ease-out] sm:p-12">
        <Mascot mood="idle" size={120} className="mx-auto" />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-800">
          Where should you start?
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-stone-600">
          The path runs from A1 to C1. Complete beginners start at the first
          unit. If you already know some English, a five-minute test finds your
          level and opens the path up to it.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={() => setStarted(true)}>
            🎯 Find my level
          </Button>
          <LinkButton to={`/decks/${deckId}`} variant="ghost">
            Start from the beginning
          </LinkButton>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="rounded-3xl bg-gradient-to-b from-white to-amber-50 p-8 text-center ring-2 ring-amber-200 shadow-[0_5px_0_0_var(--color-amber-200)] animate-[pop-in_220ms_ease-out] sm:p-12">
        <Mascot mood="happy" size={120} className="mx-auto" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-stone-400">Your level</p>
        <p className="mt-1 text-6xl font-extrabold tracking-tight text-amber-500">{placed}</p>
        <p className="text-lg font-bold text-stone-700">{LEVEL_NAMES[placed]}</p>
        <p className="mx-auto mt-4 max-w-sm text-stone-600">
          {startUnit && skipped > 0 ? (
            <>
              You'll start at <strong>Unit {startUnit.position}: {startUnit.title}</strong>.
              The {skipped} units before it will be marked as passed — their words still
              turn up in your reviews if you ever add them.
            </>
          ) : (
            <>You'll start at the very beginning — the best place for a solid foundation.</>
          )}
        </p>
        {record.isError && (
          <p role="alert" className="mx-auto mt-4 max-w-sm rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
            Couldn't save your level — check your connection and try again.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={confirm} disabled={record.isPending}>
            {placed === "A1" ? "Start at the beginning" : `Start at ${placed}`}
          </Button>
          {placed !== "A1" && (
            <LinkButton to={`/decks/${deckId}`} variant="ghost">
              Start from A1 anyway
            </LinkButton>
          )}
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <ErrorState
        title="Not enough words for the test"
        message="This deck doesn't have enough content at every level yet."
      />
    );
  }

  const meaning = parseBack(question.card.back);

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          to={`/decks/${deckId}`}
          aria-label="Leave the test"
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 text-2xl leading-none text-stone-400 transition hover:bg-stone-900/5 hover:text-stone-700"
        >
          ×
        </Link>
        <div className="flex flex-1 items-center gap-1.5">
          {LEVELS.map((l, i) => (
            <span
              key={l}
              className={`h-3 flex-1 rounded-full transition ${
                i < levelIndex ? "bg-emerald-400" : i === levelIndex ? "bg-amber-400" : "bg-stone-200"
              }`}
            />
          ))}
        </div>
        <span className="shrink-0 text-sm font-extrabold text-stone-400">
          {index + 1}/{questions.length}
        </span>
      </div>

      <p className="mt-5 text-center text-sm font-bold uppercase tracking-widest text-amber-600">
        Level {level} · {LEVEL_NAMES[level]}
      </p>

      <div key={`${level}-${index}`} className="animate-[step-in_180ms_ease-out]">
        <div className="mt-4 min-h-[9.25rem] rounded-3xl bg-gradient-to-br from-white via-amber-50 to-amber-100 p-6 text-center ring-2 ring-amber-200 shadow-[0_5px_0_0_var(--color-amber-200)] sm:p-8">
          {meaning.emoji && (
            <p className="text-4xl leading-none" aria-hidden="true">
              {meaning.emoji}
            </p>
          )}
          <p className="mt-2 text-3xl font-extrabold leading-snug tracking-tight text-stone-800 break-words sm:text-4xl">
            {meaning.text}
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-stone-400">
            in English
          </p>
        </div>
        <QuizOptions options={question.options} selectedIndex={answer} onSelect={choose} />
        {answer === null && (
          <p className="mt-5 text-center text-xs font-medium text-stone-400">
            Tap an answer · keys 1-4 · don't know? Just guess and move on.
          </p>
        )}
      </div>
    </>
  );
}

function Placement() {
  const { deckId = "" } = useParams<{ deckId: string }>();
  const unitsQuery = useUnits(deckId);
  const cardsQuery = useQuery({
    queryKey: ["cards", deckId],
    queryFn: () =>
      api.get<{ cards: Card[] }>(`/decks/${deckId}/cards`).then((r) => r.cards),
    enabled: deckId !== "",
  });

  if (!deckId) return <Navigate to="/decks" replace />;

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        {(unitsQuery.isLoading || cardsQuery.isLoading) && (
          <div className="space-y-3">
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
        {unitsQuery.data && cardsQuery.data && (
          <PlacementSession deckId={deckId} cards={cardsQuery.data} units={unitsQuery.data} />
        )}
      </main>
    </div>
  );
}

export default Placement;
