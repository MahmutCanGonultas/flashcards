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
import TontonLine from "../components/TontonLine";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_NAMES: Record<Level, string> = {
  A1: "Başlangıç",
  A2: "Temel",
  B1: "Orta",
  B2: "Orta üstü",
  C1: "İleri",
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
      <div className="rounded-3xl bg-paper-lift p-8 text-center ring-1 ring-rule shadow-print paper-grain animate-rise-in sm:p-12">
        <Mascot mood="idle" size={120} className="mx-auto" />
        <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
          Seviye testi
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
          Nereden başlamalısın?
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-ink/80">
          Patika A1'den C1'e uzanıyor. Sıfırdan başlayanlar ilk üniteden
          başlar. Biraz İngilizce biliyorsan beş dakikalık bir test seviyeni
          bulur ve patikayı oraya kadar açar.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="ink" size="lg" fullWidth className="shadow-button" onClick={() => setStarted(true)}>
            Seviyemi bul
          </Button>
          <LinkButton to={`/decks/${deckId}`} variant="outline">
            Baştan başla
          </LinkButton>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="rounded-3xl bg-paper-lift p-8 text-center ring-1 ring-rule shadow-print paper-grain animate-rise-spring sm:p-12">
        <Mascot mood="happy" size={120} className="mx-auto" />
        <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">Seviyen</p>
        {/* The level is the headline of this page: big, ink, with a moss rule drawn under it. */}
        <p className="relative mx-auto mt-1 inline-block text-6xl font-extrabold tracking-tight text-ink">
          {placed}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 -bottom-0.5 h-[3px] bg-moss animate-rule-draw [animation-delay:260ms]"
          />
        </p>
        <p className="mt-2 text-lg font-bold text-ink">{LEVEL_NAMES[placed]}</p>
        <p className="mx-auto mt-4 max-w-sm text-ink/80">
          {startUnit && skipped > 0 ? (
            <>
              <strong>Ünite {startUnit.position}: {startUnit.title}</strong> ile başlayacaksın.
              Öncesindeki {skipped} ünite geçilmiş sayılacak — kelimelerini sonradan
              eklersen tekrarlarında yine karşına çıkarlar.
            </>
          ) : (
            <>En baştan başlayacaksın — sağlam bir temel için en iyi yer.</>
          )}
        </p>
        {record.isError && (
          <p role="alert" className="mx-auto mt-4 max-w-sm rounded-2xl bg-accent/8 p-3 text-sm font-semibold text-accent ring-1 ring-accent/30">
            Seviyen kaydedilemedi — bağlantını kontrol edip tekrar dene.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="ink" size="lg" fullWidth className="shadow-button" onClick={confirm} disabled={record.isPending}>
            {placed === "A1" ? "Baştan başla" : `${placed}'den başla`}
          </Button>
          {placed !== "A1" && (
            <LinkButton to={`/decks/${deckId}`} variant="outline">
              Yine de A1'den başla
            </LinkButton>
          )}
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <ErrorState
        title="Test için yeterli kelime yok"
        message="Bu destede henüz her seviye için yeterli içerik yok."
      />
    );
  }

  const meaning = parseBack(question.card.back);

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          to={`/decks/${deckId}`}
          aria-label="Testten çık"
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 text-2xl leading-none text-graphite transition hover:bg-ink/5 hover:text-ink"
        >
          ×
        </Link>
        {/* One pill per level: cleared in ink, the one in play ringed gilt, the rest bare track. */}
        <div className="flex flex-1 items-center gap-1.5">
          {LEVELS.map((l, i) => (
            <span
              key={l}
              className={`h-2 flex-1 rounded-full transition ${
                i < levelIndex ? "bg-grass" : i === levelIndex ? "bg-gilt" : "bg-rule"
              }`}
            />
          ))}
        </div>
        <span className="shrink-0 text-sm font-extrabold tabular-nums text-graphite">
          {index + 1}/{questions.length}
        </span>
      </div>

      <p className="mt-5 text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
        Seviye {level} · {LEVEL_NAMES[level]}
      </p>

      <div key={`${level}-${index}`} className="animate-[step-in_180ms_ease-out]">
        <div className="mt-4 min-h-[9.25rem] rounded-3xl bg-paper-lift p-6 text-center ring-1 ring-rule shadow-print paper-grain sm:p-8">
          {meaning.emoji && (
            <p className="text-4xl leading-none" aria-hidden="true">
              {meaning.emoji}
            </p>
          )}
          <p className="mt-2 text-3xl font-extrabold leading-snug tracking-tight text-ink break-words sm:text-4xl">
            {meaning.text}
          </p>
        </div>
        <TontonLine className="mt-4" mood={answer === null ? "think" : question.options[answer].isCorrect ? "happy" : "sad"}>
          İngilizcesi hangisi?
        </TontonLine>
        <QuizOptions options={question.options} selectedIndex={answer} onSelect={choose} />
        {answer === null && (
          <p className="mt-5 text-center text-xs font-medium text-graphite">
            Bir cevaba dokun · 1-4 tuşları · bilmiyor musun? Tahmin et, geç.
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
    <div className="min-h-screen">
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
            title="Test yüklenemedi"
            message="Bağlantını kontrol edip tekrar dene."
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
