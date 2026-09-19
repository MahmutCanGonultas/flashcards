import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useUnits } from "../lib/units";
import { speak, speechSupported } from "../lib/speech";
import { playReveal } from "../lib/sound";
import Header from "../components/Header";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import TontonLine from "../components/TontonLine";
import { SpeakerIcon } from "../components/icons";

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

/**
 * Two voices on one stock: the first speaks from a raised sheet on the left,
 * the second from a recessed band on the right, so the eye tracks who is
 * talking without reading names — and nothing on the page is blue.
 */
const SPEAKER_STYLES = [
  { bubble: "bg-paper-lift shadow-print", side: "items-start" },
  { bubble: "bg-paper-deep/60", side: "items-end" },
];

/* The lines rise in one after another the first time the dialogue opens;
   on a later visit in the same session the page is simply there. */
let composed = false;
const STAGGER_MS = 40;
const STAGGER_CAP = 8;

/**
 * The unit's conversation: every word from its lessons, used by two people
 * who mean it. Read it, hear it line by line or straight through, and see
 * the Turkish underneath — then the unit test is next door.
 */
function Dialogue() {
  const { deckId = "", unitId = "" } = useParams<{ deckId: string; unitId: string }>();
  const navigate = useNavigate();
  const unitsQuery = useUnits(deckId);
  const animate = !composed;

  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const [showTurkish, setShowTurkish] = useState(true);
  // Set while "Play all" is running, so a tap elsewhere can stop the chain.
  const chainRef = useRef(0);

  useEffect(() => {
    composed = true;
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
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-20 w-full rounded-3xl" />
          </div>
        )}

        {unitsQuery.isError && (
          <div className="mt-6">
            <ErrorState
              title="Diyalog yüklenemedi"
              message="Bağlantını kontrol edip tekrar dene."
              onRetry={() => void unitsQuery.refetch()}
            />
          </div>
        )}

        {unitsQuery.isSuccess && (!unit || !unit.dialogue) && (
          <div className="mt-6">
            <ErrorState
              title="Burada diyalog yok"
              message="Bu ünitenin henüz diyaloğu yok."
            />
          </div>
        )}

        {unit?.dialogue && (
          <>
            <div className={`mt-6 ${animate ? "animate-rise-in" : ""}`}>
              <p className={KICKER}>
                Ünite {unit.position} · {unit.title}{unit.title_tr && ` (${unit.title_tr})`} · {unit.level}
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-ink">
                {unit.dialogue.title}
              </h1>
            </div>
            <TontonLine className={`mt-4 ${animate ? "animate-rise-in [animation-delay:40ms]" : ""}`} mood="happy" size={56}>
              Elif ile Tom konuşuyor — bu ünitenin kelimeleri bu sohbetin içinde. Önce dinle, sonra istediğin satıra dokunup bir daha dinle. 🎧
            </TontonLine>

            <div className={`mt-5 flex flex-wrap items-center gap-2 ${animate ? "animate-rise-in [animation-delay:80ms]" : ""}`}>
              {speechSupported &&
                (playingLine === null ? (
                  <Button variant="ink" size="sm" onClick={playAll}>
                    <SpeakerIcon className="h-4 w-4" /> Hepsini dinle
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={stopAll}>
                    ■ Durdur
                  </Button>
                ))}
              <button
                type="button"
                onClick={() => {
                  playReveal();
                  setShowTurkish((v) => !v);
                }}
                className="min-h-11 rounded-full bg-paper-lift px-3.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite ring-1 ring-rule transition hover:text-ink active:scale-[0.98]"
              >
                {showTurkish ? "Türkçeyi gizle" : "Türkçeyi göster"}
              </button>
            </div>

            <ol className="mt-6 space-y-3">
              {unit.dialogue.lines.map((line, index) => {
                const style = styleFor(line.speaker);
                const isPlaying = playingLine === index;
                const staggered = animate && index < STAGGER_CAP;
                return (
                  <li
                    key={index}
                    className={`flex flex-col ${style.side} ${staggered ? "animate-rise-in" : ""}`}
                    style={staggered ? { animationDelay: `${120 + index * STAGGER_MS}ms` } : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => playLine(index)}
                      aria-label={`Dinle: ${line.en}`}
                      className={`max-w-[88%] rounded-3xl p-4 text-left ring-1 transition-[transform,box-shadow] duration-100 active:scale-[0.98] ${style.bubble} ${
                        isPlaying ? "ring-ink" : "ring-rule"
                      }`}
                    >
                      <span className={`mb-1 block ${KICKER}`}>{line.speaker}</span>
                      <p className="flex items-start gap-2 text-lg font-bold leading-snug text-ink">
                        <span className="min-w-0 flex-1 break-words">{line.en}</span>
                        {speechSupported && (
                          <SpeakerIcon
                            className={`mt-1 h-4 w-4 shrink-0 ${
                              isPlaying ? "animate-pulse text-ink" : "text-rule"
                            }`}
                          />
                        )}
                      </p>
                      {showTurkish && (
                        <p className="mt-1 text-sm leading-relaxed text-graphite break-words">
                          {line.tr}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-paper/95 backdrop-blur">
              <div className="mx-auto flex max-w-2xl flex-col gap-2 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row">
                <Button
                  variant="ink"
                  size="lg"
                  fullWidth
                  className="shadow-button"
                  onClick={() => navigate(`/decks/${deckId}/units/${unit.id}/test`)}
                >
                  Ünite testine gir
                </Button>
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

export default Dialogue;
