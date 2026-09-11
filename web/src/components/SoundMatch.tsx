import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../types";
import { parseBack } from "../lib/cardBack";
import { speak, speechSupported, isSpeechMuted } from "../lib/speech";
import { playMatch, playIncorrect } from "../lib/sound";
import { SpeakerIcon } from "./icons";

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

  const tileClass = (id: number, picked: boolean) => {
    if (matched.has(id)) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700 opacity-40";
    }
    if (wrongPair?.includes(id)) {
      return "border-rose-300 bg-rose-50 text-rose-700 animate-[shake_320ms]";
    }
    if (picked) {
      return "border-violet-400 bg-violet-50 text-violet-800 -translate-y-0.5";
    }
    return "border-stone-200 bg-white text-stone-700 hover:border-violet-200";
  };

  return (
    <div className="mt-5">
      <p className="text-center text-xl font-extrabold tracking-tight text-stone-800">
        {audible ? "Tap what you hear." : "Tap the pairs."}
      </p>
      <p className="mt-1 text-center text-sm text-stone-500">
        {audible ? "Match each sound to its meaning." : "Match each word to its meaning."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="space-y-3">
          {sounds.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => tapSound(card)}
              disabled={matched.has(card.id)}
              className={`flex w-full items-center gap-2 rounded-2xl border-2 p-3 text-left font-extrabold transition ${tileClass(
                card.id,
                pickedSound === card.id,
              )}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs text-violet-600">
                {index + 1}
              </span>
              {audible && !matched.has(card.id) ? (
                <SpeakerIcon className="h-5 w-5 shrink-0 text-violet-500" />
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
              disabled={matched.has(card.id)}
              className={`w-full rounded-2xl border-2 p-3 text-left text-sm font-bold transition ${tileClass(
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
