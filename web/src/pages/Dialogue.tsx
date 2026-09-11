import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useUnits } from "../lib/units";
import { speak, speechSupported } from "../lib/speech";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import Mascot from "../components/Mascot";
import { SpeakerIcon } from "../components/icons";

/** Two voices, two colours, so the eye tracks who is talking without reading names. */
const SPEAKER_STYLES = [
  { chip: "bg-violet-100 text-violet-700", bubble: "bg-white ring-violet-100", side: "items-start" },
  { chip: "bg-sky-100 text-sky-700", bubble: "bg-sky-50 ring-sky-100", side: "items-end" },
];

/**
 * The unit's conversation: every word from its lessons, used by two people
 * who mean it. Read it, hear it line by line or straight through, and see
 * the Turkish underneath — then the unit test is next door.
 */
function Dialogue() {
  const { deckId = "", unitId = "" } = useParams<{ deckId: string; unitId: string }>();
  const navigate = useNavigate();
  const unitsQuery = useUnits(deckId);

  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const [showTurkish, setShowTurkish] = useState(true);
  // Set while "Play all" is running, so a tap elsewhere can stop the chain.
  const chainRef = useRef(0);

  useEffect(() => {
    return () => {
      chainRef.current += 1;
      if (speechSupported) window.speechSynthesis.cancel();
    };
  }, []);

  if (!deckId || !unitId) return <Navigate to="/decks" replace />;

  const unit = unitsQuery.data?.find((u) => String(u.id) === unitId);
  const speakers = unit?.dialogue
    ? [...new Set(unit.dialogue.lines.map((line) => line.speaker))]
    : [];
  const styleFor = (speaker: string) =>
    SPEAKER_STYLES[Math.max(0, speakers.indexOf(speaker)) % SPEAKER_STYLES.length];

  const playLine = (index: number) => {
    if (!unit?.dialogue) return;
    chainRef.current += 1;
    setPlayingLine(index);
    void speak(unit.dialogue.lines[index].en, {
      rate: 0.88,
      onEnd: () => setPlayingLine((current) => (current === index ? null : current)),
    });
  };

  const playAll = () => {
    if (!unit?.dialogue) return;
    const lines = unit.dialogue.lines;
    const token = ++chainRef.current;
    const step = (index: number) => {
      if (token !== chainRef.current || index >= lines.length) {
        if (token === chainRef.current) setPlayingLine(null);
        return;
      }
      setPlayingLine(index);
      void speak(lines[index].en, {
        rate: 0.88,
        onEnd: () => window.setTimeout(() => step(index + 1), 450),
      });
    };
    step(0);
  };

  const stopAll = () => {
    chainRef.current += 1;
    if (speechSupported) window.speechSynthesis.cancel();
    setPlayingLine(null);
  };

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
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-20 w-full rounded-3xl" />
          </div>
        )}

        {unitsQuery.isError && (
          <div className="mt-6">
            <ErrorState
              title="Couldn't load the dialogue"
              message="Check your connection and try again."
              onRetry={() => void unitsQuery.refetch()}
            />
          </div>
        )}

        {unitsQuery.isSuccess && (!unit || !unit.dialogue) && (
          <div className="mt-6">
            <ErrorState
              title="No dialogue here"
              message="This unit doesn't have a conversation yet."
            />
          </div>
        )}

        {unit?.dialogue && (
          <>
            <div className="mt-6 flex items-center gap-4">
              <Mascot mood="idle" size={64} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                  Unit {unit.position} · {unit.level} · Dialogue
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-800">
                  {unit.dialogue.title}
                </h1>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {speechSupported &&
                (playingLine === null ? (
                  <Button size="sm" onClick={playAll}>
                    <SpeakerIcon className="h-4 w-4" /> Play all
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={stopAll}>
                    ■ Stop
                  </Button>
                ))}
              <button
                type="button"
                onClick={() => setShowTurkish((v) => !v)}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-50"
              >
                {showTurkish ? "Hide Turkish" : "Show Turkish"}
              </button>
            </div>

            <ol className="mt-6 space-y-3">
              {unit.dialogue.lines.map((line, index) => {
                const style = styleFor(line.speaker);
                const isPlaying = playingLine === index;
                return (
                  <li key={index} className={`flex flex-col ${style.side}`}>
                    <button
                      type="button"
                      onClick={() => playLine(index)}
                      aria-label={`Hear: ${line.en}`}
                      className={`max-w-[88%] rounded-3xl p-4 text-left ring-2 transition ${style.bubble} ${
                        isPlaying ? "ring-violet-400 shadow-[0_0_0_4px_var(--color-violet-100)]" : ""
                      }`}
                    >
                      <span
                        className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${style.chip}`}
                      >
                        {line.speaker}
                      </span>
                      <p className="flex items-start gap-2 text-lg font-bold leading-snug text-stone-800">
                        <span className="min-w-0 flex-1 break-words">{line.en}</span>
                        {speechSupported && (
                          <SpeakerIcon
                            className={`mt-1 h-4 w-4 shrink-0 ${
                              isPlaying ? "animate-pulse text-violet-600" : "text-stone-300"
                            }`}
                          />
                        )}
                      </p>
                      {showTurkish && (
                        <p className="mt-1 text-sm leading-relaxed text-stone-500 break-words">
                          {line.tr}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200/70 bg-[#FDF9F3]/95 backdrop-blur">
              <div className="mx-auto flex max-w-2xl flex-col gap-2 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row">
                <Button
                  size="lg"
                  fullWidth
                  onClick={() => navigate(`/decks/${deckId}/units/${unit.id}/test`)}
                >
                  🎯 Take the unit test
                </Button>
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

export default Dialogue;
