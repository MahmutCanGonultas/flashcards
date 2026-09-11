import type { Card } from "../types";
import { parseBack } from "../lib/cardBack";
import { splitOnWord } from "../lib/sentence";
import SpeakButton from "./SpeakButton";
import Mascot from "./Mascot";

type MeetBodyProps = {
  card: Card;
  /**
   * "screen" is the teaching step, where this is the whole page.
   * "panel" is the same content shown again inside the feedback panel after a
   * wrong answer — the moment a re-explanation is worth most.
   */
  variant?: "screen" | "panel";
};

/**
 * Everything known about one word: what it means, what it looks like, how it
 * behaves in a sentence, and how to remember it.
 *
 * Deliberately one component used in both places. A learner who gets a word
 * wrong should see the *same* explanation they were taught from, not a
 * different, smaller one — recognising it is part of the repair.
 *
 * Every block is present or absent as a whole. There is no placeholder frame,
 * no grey box and no reserved empty slot: 43% of the deck has no picture at
 * all, and a gap where an image should be reads as breakage.
 */
function MeetBody({ card, variant = "screen" }: MeetBodyProps) {
  const { text, emoji } = parseBack(card.back);
  const isPanel = variant === "panel";

  // "ama, ancak" — lead with the primary sense, keep the rest quieter.
  const [primarySense, ...otherSenses] = text.split(",").map((part) => part.trim());
  const hasVisual = Boolean(card.image_url || emoji);

  const sentenceParts = card.example_sentence
    ? splitOnWord(card.example_sentence, card.front)
    : null;

  return (
    <div className={isPanel ? "space-y-2.5" : "space-y-3"}>
      {/* What it means. */}
      <div
        className={
          isPanel
            ? "rounded-2xl bg-white/70 p-3 text-center ring-1 ring-rose-200"
            : "rounded-3xl bg-white p-5 text-center ring-2 ring-violet-200"
        }
      >
        {hasVisual && !isPanel && (
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover ring-1 ring-stone-200"
              />
            ) : (
              <span aria-hidden="true" className="text-5xl leading-none">
                {emoji}
              </span>
            )}
          </div>
        )}

        <p
          className={`font-extrabold leading-snug text-violet-700 break-words ${
            isPanel ? "text-xl" : hasVisual ? "text-2xl" : "text-3xl"
          }`}
        >
          {primarySense}
        </p>
        {otherSenses.length > 0 && (
          <p
            className={`mt-1 font-semibold text-violet-500 break-words ${
              isPanel ? "text-sm" : "text-base"
            }`}
          >
            {otherSenses.join(", ")}
          </p>
        )}
      </div>

      {/* How it behaves in a real sentence. */}
      {card.example_sentence && (
        <div
          className={
            isPanel
              ? "rounded-2xl bg-white/70 p-3 ring-1 ring-rose-200"
              : "rounded-2xl bg-white p-4 ring-1 ring-stone-200"
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
              In a sentence
            </span>
            <SpeakButton text={card.example_sentence} size="sm" />
          </div>
          <p className="mt-1 text-base leading-relaxed text-stone-700 break-words">
            {sentenceParts ? (
              <>
                {sentenceParts.before}
                <strong className="font-extrabold text-violet-600 underline decoration-violet-200 decoration-2 underline-offset-4">
                  {sentenceParts.match}
                </strong>
                {sentenceParts.after}
              </>
            ) : (
              card.example_sentence
            )}
          </p>
        </div>
      )}

      {/* How to remember it. Open, never folded away behind a disclosure —
          a memory tip nobody opens does nothing. */}
      {card.mnemonic && (
        <div className="flex items-start gap-2">
          <Mascot mood="idle" size={40} className="shrink-0" />
          <div className="min-w-0 flex-1 rounded-2xl bg-amber-50 p-3.5 ring-1 ring-amber-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
              Tonton
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-amber-900 break-words">
              {card.mnemonic}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetBody;
