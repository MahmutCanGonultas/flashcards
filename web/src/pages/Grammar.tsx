import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useUnits } from "../lib/units";
import { playCorrect, playIncorrect, playLessonComplete } from "../lib/sound";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import Mascot from "../components/Mascot";
import SpeakButton from "../components/SpeakButton";
import type { GrammarQuiz } from "../types";

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

/* The rules rise in one after another the first time the note opens; on a
   later visit in the same session the page is simply there. */
let composed = false;
const STAGGER_MS = 40;
const STAGGER_CAP = 8;

type OptionState = "idle" | "right" | "wrong" | "muted";

/*
 * One system for answer rows, matching the test screens: a sheet with a
 * hairline down the left and a small index, ink for the pick, moss for
 * the right answer, vermilion for the wrong one. Colour is never
 * transitioned (see QuizOptions for the iOS Safari reason).
 */
const OPTION_CLASSES: Record<OptionState, string> = {
  idle: "border-rule bg-white text-ink shadow-edge press",
  right: "pointer-events-none border-grass bg-grass-soft text-grass-ink animate-ring-pulse",
  wrong: "pointer-events-none border-berry bg-berry-soft text-berry-ink animate-[shake_320ms_ease-in-out]",
  muted: "pointer-events-none border-rule bg-white text-hare",
};

/**
 * A three-question check at the end of a grammar note. Not graded, not
 * stored — it's there so the rule gets used once before it's forgotten.
 */
function MiniQuiz({ items }: { items: GrammarQuiz[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const item = items[index];
  const done = index >= items.length;

  const choose = (i: number) => {
    if (picked !== null || !item) return;
    setPicked(i);
    if (i === item.answer) {
      playCorrect();
      setScore((s) => s + 1);
    } else {
      playIncorrect();
    }
  };

  const next = () => {
    setPicked(null);
    if (index + 1 >= items.length) playLessonComplete();
    setIndex((i) => i + 1);
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-paper-lift p-6 text-center ring-1 ring-rule shadow-print paper-grain animate-rise-spring">
        <Mascot mood={score === items.length ? "happy" : "idle"} size={72} className="mx-auto" />
        <p className="mt-2 text-2xl font-extrabold tabular-nums text-ink">
          {score} / {items.length}
        </p>
        <p className="mt-1 text-sm text-graphite">
          {score === items.length
            ? "Üçü de doğru! Kural artık senin."
            : "Yukarıdaki kurallara bir daha bak, sonra devam et."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-paper-lift p-5 ring-1 ring-rule shadow-print paper-grain">
      <p className={KICKER}>
        Hızlı kontrol · {index + 1}/{items.length}
      </p>
      <p className="mt-2 text-lg font-extrabold leading-snug text-ink">{item.question}</p>
      <div key={index} className="mt-3 space-y-2">
        {item.options.map((option, i) => {
          const state: OptionState =
            picked === null
              ? "idle"
              : i === item.answer
                ? "right"
                : i === picked
                  ? "wrong"
                  : "muted";
          return (
            <button
              key={i}
              type="button"
              aria-disabled={picked !== null}
              onClick={() => choose(i)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold ${OPTION_CLASSES[state]}`}
            >
              <span
                aria-hidden="true"
                className={`w-4 shrink-0 text-[11px] font-extrabold tabular-nums ${
                  state === "right" ? "text-moss" : state === "wrong" ? "text-accent" : "text-graphite"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 break-words">{option}</span>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-3 animate-[fade-in_200ms]">
          <p className="text-sm leading-relaxed text-ink">
            <span className={`font-extrabold ${picked === item.answer ? "text-moss" : "text-accent"}`}>
              {picked === item.answer ? "Doğru." : "Bu değil."}
            </span>{" "}
            {item.explain}
          </p>
          <Button variant="ink" size="sm" className="mt-3" onClick={next}>
            {index + 1 >= items.length ? "Bitir" : "Sonraki"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Grammar() {
  const { deckId = "", unitId = "" } = useParams<{ deckId: string; unitId: string }>();
  const navigate = useNavigate();
  const unitsQuery = useUnits(deckId);
  const animate = !composed;

  useEffect(() => {
    composed = true;
  }, []);

  if (!deckId || !unitId) return <Navigate to="/decks" replace />;

  const unit = unitsQuery.data?.find((u) => String(u.id) === unitId);
  const note = unit?.grammar ?? null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-40 pt-8">
        <Link
          to={`/decks/${deckId}`}
          className={`-m-2 inline-flex items-center gap-1.5 p-2 transition hover:text-ink ${KICKER}`}
        >
          <span aria-hidden="true">←</span> Patikaya dön
        </Link>

        {unitsQuery.isLoading && (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
        )}
        {unitsQuery.isError && (
          <div className="mt-6">
            <ErrorState
              title="Gramer notu yüklenemedi"
              message="Bağlantını kontrol edip tekrar dene."
              onRetry={() => void unitsQuery.refetch()}
            />
          </div>
        )}
        {unitsQuery.isSuccess && (!unit || !note) && (
          <div className="mt-6">
            <ErrorState title="Burada gramer notu yok" message="Bu ünitenin henüz gramer notu yok." />
          </div>
        )}

        {unit && note && (
          <>
            {/* Tonton opens with the hook, as a speech bubble. */}
            <div className={`mt-6 flex items-end gap-3 ${animate ? "animate-rise-in" : ""}`}>
              <Mascot mood="happy" size={88} className="shrink-0" />
              <div className="relative min-w-0 flex-1 rounded-3xl rounded-bl-md border-l-2 border-tonton bg-paper-lift p-4 ring-1 ring-rule shadow-bubble">
                <p className={KICKER}>
                  Ünite {unit.position} · {unit.title}{unit.title_tr && ` (${unit.title_tr})`} · {unit.level}
                </p>
                <p className="mt-1 text-base font-semibold leading-relaxed text-ink">
                  {note.hook}
                </p>
              </div>
            </div>

            <div className={animate ? "animate-rise-in [animation-delay:40ms]" : ""}>
              <p className={`mt-6 ${KICKER}`}>Gramer notu</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
                {note.title_en}
              </h1>
              <p className="text-base font-semibold text-graphite">{note.title_tr}</p>
            </div>

            {/* The rules as a ruled list: a numeral in the margin, the rule,
                then its example set off by a hairline like a quotation. */}
            <ol className="mt-5 divide-y divide-rule border-y border-rule">
              {note.rules.map((rule, i) => (
                <li
                  key={i}
                  className={`py-4 ${animate && i < STAGGER_CAP ? "animate-rise-in" : ""}`}
                  style={animate && i < STAGGER_CAP ? { animationDelay: `${80 + i * STAGGER_MS}ms` } : undefined}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-5 shrink-0 pt-0.5 text-[11px] font-extrabold tabular-nums text-graphite">
                      {i + 1}
                    </span>
                    <p className="text-[15px] leading-relaxed text-ink">{rule.rule}</p>
                  </div>
                  <div className="ml-8 mt-3 border-l-2 border-rule pl-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-extrabold leading-snug text-ink">
                        {rule.example_en}
                      </p>
                      <SpeakButton text={rule.example_en} size="sm" />
                    </div>
                    <p className="mt-1 text-sm text-graphite">{rule.example_tr}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* The trap: a recessed band, not a red box — the label carries the warning. */}
            <div className="mt-4 rounded-r-2xl border-l-2 border-rule bg-paper-deep/50 px-4 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gilt-ink">
                Dikkat
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink">{note.watch_out}</p>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <Mascot mood="idle" size={44} className="shrink-0" />
              <div className="min-w-0 flex-1 rounded-3xl rounded-bl-md border-l-2 border-tonton bg-paper-lift p-4 ring-1 ring-rule shadow-bubble">
                <p className={KICKER}>Hafıza hilesi</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink">{note.memory_trick}</p>
              </div>
            </div>

            <div className="mt-6">
              <MiniQuiz items={note.quiz} />
            </div>

            <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-rule bg-white">
              <div className="mx-auto flex max-w-2xl flex-col gap-2 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row">
                {unit.dialogue ? (
                  <Button
                    variant="ink"
                    size="lg"
                    fullWidth
                    className="shadow-button"
                    onClick={() => navigate(`/decks/${deckId}/units/${unit.id}/dialogue`)}
                  >
                    Diyaloğa geç
                  </Button>
                ) : (
                  <Button
                    variant="ink"
                    size="lg"
                    fullWidth
                    className="shadow-button"
                    onClick={() => navigate(`/decks/${deckId}/units/${unit.id}/test`)}
                  >
                    Ünite testine gir
                  </Button>
                )}
                <LinkButton to={`/decks/${deckId}`} variant="outline">
                  Sonra
                </LinkButton>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Grammar;
