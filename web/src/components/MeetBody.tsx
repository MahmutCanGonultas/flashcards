import type { Card } from "../types";
import { parseBack } from "../lib/cardBack";
import { locateTurkish, splitOnWord } from "../lib/sentence";
import SpeakButton from "./SpeakButton";
import Mascot from "./Mascot";

type MeetBodyProps = {
  card: Card;
  /**
   * "screen" is the teaching step: Tonton says the sentence, that's the lesson.
   * "panel" is the same word shown again inside the feedback panel after a
   * wrong answer — meaning and sentence, compact.
   */
  variant?: "screen" | "panel";
};

function Sentence({
  sentence,
  headword,
  emphasis,
}: {
  sentence: string;
  headword: string;
  emphasis: string;
}) {
  const parts = splitOnWord(sentence, headword);
  if (!parts) return <>{sentence}</>;
  return (
    <>
      {parts.before}
      <mark className={`rounded-md px-1 py-0.5 font-extrabold ${emphasis}`}>{parts.match}</mark>
      {parts.after}
    </>
  );
}

function TurkishSentence({ sentence, meaning, emphasis }: { sentence: string; meaning: string; emphasis: string }) {
  const at = locateTurkish(sentence, meaning);
  if (!at) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, at.start)}
      <span className={`font-bold ${emphasis}`}>{sentence.slice(at.start, at.end)}</span>
      {sentence.slice(at.end)}
    </>
  );
}

/**
 * The word in a real sentence, said by Tonton, with the Turkish underneath
 * so a beginner can actually read it. Nothing else: no roots, no lecture —
 * the sentence is the memory.
 */
function MeetBody({ card, variant = "screen" }: MeetBodyProps) {
  const { text: meaning } = parseBack(card.back);

  if (variant === "panel") {
    return (
      <div className="rounded-2xl bg-paper-lift p-3 ring-1 ring-rule">
        <p className="text-lg font-extrabold leading-snug text-ink break-words">
          {card.front} <span className="font-bold text-graphite">— {meaning}</span>
        </p>
        {card.example_sentence && (
          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] leading-relaxed text-ink break-words">
                <Sentence sentence={card.example_sentence} headword={card.front} emphasis="bg-gilt/20 text-ink" />
              </p>
              {card.example_tr && (
                <p className="mt-0.5 text-sm leading-relaxed text-graphite break-words">
                  <TurkishSentence sentence={card.example_tr} meaning={meaning} emphasis="text-ink" />
                </p>
              )}
            </div>
            <SpeakButton text={card.example_sentence} size="sm" />
          </div>
        )}
      </div>
    );
  }

  // A word of the learner's own carries the note they wrote about it: that
  // is their memory of it, so it's shown; the course's old root notes are not.
  const ownNote = card.lesson === null && card.mnemonic ? card.mnemonic : null;

  if (!card.example_sentence && !ownNote) return null;

  return (
    <div className="flex items-end gap-2.5">
      <Mascot mood="happy" size={64} className="shrink-0" />
      {/* His bubble is a sheet lying on the page, his violet rule down the
          left edge the only sign it's him talking. */}
      <div className="relative min-w-0 flex-1 rounded-2xl border-l-2 border-tonton bg-paper-lift p-4 ring-1 ring-rule shadow-bubble paper-grain">
        {ownNote && (
          <p className="mb-2 rounded-2xl bg-gilt/10 px-3 py-2 text-[15px] leading-relaxed text-ink ring-1 ring-gilt/40">
            <span className="mr-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-gilt-ink">Senin notun</span>
            {ownNote}
          </p>
        )}
        {card.example_sentence && (
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-[19px] font-semibold leading-relaxed text-ink break-words">
              <Sentence sentence={card.example_sentence} headword={card.front} emphasis="bg-gilt/20 text-ink" />
            </p>
            <SpeakButton text={card.example_sentence} size="md" />
          </div>
        )}
        {card.example_tr && (
          <p className="mt-1.5 text-[15px] leading-relaxed text-graphite break-words">
            <TurkishSentence sentence={card.example_tr} meaning={meaning} emphasis="text-ink" />
          </p>
        )}
        {/* The second angle on the same word: a different scene, so the
            word isn't welded to one sentence. */}
        {card.example2 && (
          <div className="mt-3 border-t border-dashed border-rule pt-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-[17px] font-semibold leading-relaxed text-ink break-words">
                <Sentence sentence={card.example2} headword={card.front} emphasis="bg-gilt/20 text-ink" />
              </p>
              <SpeakButton text={card.example2} size="sm" />
            </div>
            {card.example2_tr && (
              <p className="mt-1 text-[14px] leading-relaxed text-graphite break-words">
                <TurkishSentence sentence={card.example2_tr} meaning={meaning} emphasis="text-ink" />
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeetBody;
