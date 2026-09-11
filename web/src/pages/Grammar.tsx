import { useState } from "react";
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
      <div className="rounded-3xl bg-gradient-to-b from-white to-emerald-50 p-6 text-center ring-2 ring-emerald-100 animate-[pop-in_220ms_ease-out]">
        <Mascot mood={score === items.length ? "happy" : "idle"} size={72} className="mx-auto" />
        <p className="mt-2 text-2xl font-extrabold text-stone-800">
          {score} / {items.length}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {score === items.length
            ? "All three. The rule is yours."
            : "Have another look at the rules above, then carry on."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 ring-2 ring-violet-100">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-violet-500">
        Quick check · {index + 1} of {items.length}
      </p>
      <p className="mt-2 text-lg font-extrabold leading-snug text-stone-800">{item.question}</p>
      <div className="mt-3 space-y-2">
        {item.options.map((option, i) => {
          const state =
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
              disabled={picked !== null}
              onClick={() => choose(i)}
              className={`w-full rounded-2xl px-4 py-3 text-left font-bold transition ${
                state === "idle"
                  ? "bg-stone-50 text-stone-800 ring-1 ring-stone-200 hover:bg-violet-50 hover:ring-violet-200"
                  : state === "right"
                    ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400"
                    : state === "wrong"
                      ? "bg-rose-100 text-rose-800 ring-2 ring-rose-400"
                      : "bg-stone-50 text-stone-300 ring-1 ring-stone-100"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-3 animate-[fade-in_200ms]">
          <p className={`text-sm ${picked === item.answer ? "text-emerald-700" : "text-rose-700"}`}>
            {item.explain}
          </p>
          <Button size="sm" className="mt-3" onClick={next}>
            {index + 1 >= items.length ? "Finish" : "Next"}
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

  if (!deckId || !unitId) return <Navigate to="/decks" replace />;

  const unit = unitsQuery.data?.find((u) => String(u.id) === unitId);
  const note = unit?.grammar ?? null;

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pb-40 pt-8">
        <Link
          to={`/decks/${deckId}`}
          className="-m-2 inline-flex items-center gap-1.5 p-2 font-medium text-stone-500 transition hover:text-stone-800"
        >
          <span aria-hidden="true">←</span> Back to the path
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
              title="Couldn't load the grammar note"
              message="Check your connection and try again."
              onRetry={() => void unitsQuery.refetch()}
            />
          </div>
        )}
        {unitsQuery.isSuccess && (!unit || !note) && (
          <div className="mt-6">
            <ErrorState title="No grammar note here" message="This unit doesn't have one yet." />
          </div>
        )}

        {unit && note && (
          <>
            {/* Tonton opens with the hook, as a speech bubble. */}
            <div className="mt-6 flex items-end gap-3">
              <Mascot mood="happy" size={88} className="shrink-0" />
              <div className="relative min-w-0 flex-1 rounded-3xl rounded-bl-md bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700">
                  Unit {unit.position} · {unit.title}{unit.title_tr && ` (${unit.title_tr})`} · {unit.level}
                </p>
                <p className="mt-1 text-base font-semibold leading-relaxed text-amber-900">
                  {note.hook}
                </p>
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-stone-800">
              {note.title_en}
            </h1>
            <p className="text-base font-semibold text-stone-500">{note.title_tr}</p>

            <ol className="mt-5 space-y-3">
              {note.rules.map((rule, i) => (
                <li key={i} className="rounded-3xl bg-white p-4 ring-1 ring-stone-200">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-extrabold text-violet-700">
                      {i + 1}
                    </span>
                    <p className="text-[15px] leading-relaxed text-stone-700">{rule.rule}</p>
                  </div>
                  <div className="mt-3 rounded-2xl bg-violet-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-extrabold leading-snug text-violet-800">
                        {rule.example_en}
                      </p>
                      <SpeakButton text={rule.example_en} size="sm" />
                    </div>
                    <p className="mt-1 text-sm text-violet-600">{rule.example_tr}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600">
                ⚠️ Watch out
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-rose-900">{note.watch_out}</p>
            </div>

            <div className="mt-3 flex items-start gap-2">
              <Mascot mood="idle" size={44} className="shrink-0" />
              <div className="min-w-0 flex-1 rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700">
                  💡 Memory trick
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-amber-900">{note.memory_trick}</p>
              </div>
            </div>

            <div className="mt-6">
              <MiniQuiz items={note.quiz} />
            </div>

            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200/70 bg-[#FDF9F3]/95 backdrop-blur">
              <div className="mx-auto flex max-w-2xl flex-col gap-2 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row">
                {unit.dialogue ? (
                  <Button
                    size="lg"
                    fullWidth
                    onClick={() => navigate(`/decks/${deckId}/units/${unit.id}/dialogue`)}
                  >
                    💬 On to the dialogue
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    fullWidth
                    onClick={() => navigate(`/decks/${deckId}/units/${unit.id}/test`)}
                  >
                    🎯 Take the unit test
                  </Button>
                )}
                <LinkButton to={`/decks/${deckId}`} variant="ghost">
                  Later
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
