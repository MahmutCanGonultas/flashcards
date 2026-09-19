import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../types";
import { parseBack } from "../lib/cardBack";
import { speak, speechSupported, isSpeechMuted } from "../lib/speech";
import { playMatch, playIncorrect } from "../lib/sound";
import { SpeakerIcon } from "./icons";
import TontonLine from "./TontonLine";

type SoundMatchProps = {
  cards: Card[];
  /** Fires once, when every pair has been matched. */
  onComplete: () => void;
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const WRONG_FLASH_MS = 320;

/**
 * Hear each new word and put it with its meaning.
 *
 * Nothing here is graded and nothing is written to the schedule — this is
 * contact, not measurement. Its job is that every word gets heard at least
 * once with attention on it, before the questions start.
 *
 * The last pair is arithmetically free. That's accepted: by then the point
 * (hearing all three) has already been served.
 */
function SoundMatch({ cards, onComplete }: SoundMatchProps) {
  // Silent devices can't play the "which one did you hear" game, so the tiles
  // just show the words and it degrades into plain matching.
  const [audible] = useState(() => speechSupported && !isSpeechMuted());

  const [sounds] = useState(() => shuffle(cards));
  const [meanings] = useState(() => shuffle(cards));

  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [pickedSound, setPickedSound] = useState<number | null>(null);
  const [pickedMeaning, setPickedMeaning] = useState<number | null>(null);
  const [wrongPair, setWrongPair] = useState<number[] | null>(null);

  const flashTimer = useRef<number | undefined>(undefined);
  const announced = useRef(false);

  useEffect(() => {
    return () => window.clearTimeout(flashTimer.current);
  }, []);

  const resolve = useCallback(
    (soundId: number, meaningId: number) => {
      if (soundId === meaningId) {
        playMatch();
        setPickedSound(null);
        setPickedMeaning(null);
        const next = new Set(matched).add(soundId);
        setMatched(next);
        if (next.size === cards.length && !announced.current) {
          announced.current = true;
          onComplete();
        }
        return;
      }

      playIncorrect();
      setWrongPair([soundId, meaningId]);
      flashTimer.current = window.setTimeout(() => {
        setWrongPair(null);
        setPickedSound(null);
        setPickedMeaning(null);
      }, WRONG_FLASH_MS);
    },
    [cards.length, matched, onComplete],
  );

  const tapSound = (card: Card) => {
    if (matched.has(card.id) || wrongPair) return;
    // An explicit tap is consent, so this plays even when auto-speech is muted.
    void speak(card.front);
    if (pickedMeaning !== null) {
      setPickedSound(card.id);
      resolve(card.id, pickedMeaning);
      return;
    }
    setPickedSound(card.id);
  };

  const tapMeaning = (card: Card) => {
    if (matched.has(card.id) || wrongPair) return;
    if (pickedSound !== null) {
      setPickedMeaning(card.id);
      resolve(pickedSound, card.id);
      return;
    }
    setPickedMeaning(card.id);
  };

  // Loose sheets on the page: picked lifts and takes an ink ring, a wrong
  // pair flushes vermilion for a beat, a matched pair sinks into the paper.
  const tileClass = (id: number, picked: boolean) => {
    if (matched.has(id)) {
      return "pointer-events-none bg-paper-deep/60 text-graphite ring-1 ring-rule/60 opacity-60";
    }
    if (wrongPair?.includes(id)) {
      return "bg-accent/8 text-accent ring-2 ring-accent animate-[shake_320ms]";
    }
    if (picked) {
      return "bg-paper-lift text-ink ring-2 ring-ink -translate-y-0.5 shadow-print";
    }
    return "bg-paper-lift text-ink ring-1 ring-rule shadow-print hover:-translate-y-0.5";
  };

  return (
    <div className="mt-4">
      <TontonLine mood={wrongPair ? "sad" : matched.size === cards.length ? "happy" : "idle"} size={52}>
        {audible ? "Bir sese dokun, sonra anlamına. Kulaklar açık! 👂" : "Bir kelimeye dokun, sonra anlamına."}
      </TontonLine>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="space-y-3">
          {sounds.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => tapSound(card)}
              aria-disabled={matched.has(card.id)}
              className={`flex w-full items-center gap-2 rounded-2xl p-3 text-left font-extrabold transition-transform duration-100 active:scale-[0.98] ${tileClass(
                card.id,
                pickedSound === card.id,
              )}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-deep text-xs text-graphite">
                {index + 1}
              </span>
              {audible && !matched.has(card.id) ? (
                <SpeakerIcon className="h-5 w-5 shrink-0 text-ink" />
              ) : (
                <span className="min-w-0 break-words">{card.front}</span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {meanings.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => tapMeaning(card)}
              aria-disabled={matched.has(card.id)}
              className={`w-full rounded-2xl p-3 text-left text-sm font-bold transition-transform duration-100 active:scale-[0.98] ${tileClass(
                card.id,
                pickedMeaning === card.id,
              )}`}
            >
              <span className="break-words">{parseBack(card.back).text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SoundMatch;
