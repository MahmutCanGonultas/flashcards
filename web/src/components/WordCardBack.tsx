import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { locateTurkish, splitOnWord } from "../lib/sentence";
import SpeakButton from "./SpeakButton";

type WordCardBackProps = {
  card: Card;
  /** "full" is the flashcard's back; "compact" is the row on the deck page. */
  variant?: "full" | "compact";
};

function Highlighted({ sentence, headword }: { sentence: string; headword: string }) {
  const parts = splitOnWord(sentence, headword);
  if (!parts) return <>{sentence}</>;
  return (
    <>
      {parts.before}
      <mark className="rounded-md bg-violet-100 px-1 py-0.5 font-extrabold text-violet-800">{parts.match}</mark>
      {parts.after}
    </>
  );
}

function TurkishLine({ sentence, meaning }: { sentence: string; meaning: string }) {
  const at = locateTurkish(sentence, meaning);
  if (!at) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, at.start)}
      <span className="font-bold text-violet-700">{sentence.slice(at.start, at.end)}</span>
      {sentence.slice(at.end)}
    </>
  );
}

/**
 * Everything a word means, laid out the way a good dictionary entry is —
 * but only what the learner needs: each sense with the pattern it lives
 * in and one real sentence (English, then Turkish), the words that grow
 * from it, and the one mistake to avoid. A card without senses falls back
 * to its meaning line and example sentences.
 */
function WordCardBack({ card, variant = "full" }: WordCardBackProps) {
  const { text: meaning } = parseBack(card.back);
  const senses = card.senses ?? [];
  const compact = variant === "compact";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {senses.length > 0 ? (
        <ol className={compact ? "space-y-2" : "space-y-3"}>
          {senses.map((sense, i) => (
            <li key={i} className={`rounded-2xl bg-white ${compact ? "p-3" : "p-4"} ring-1 ring-stone-200`}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-extrabold text-violet-700">
                  {i + 1}
                </span>
                {sense.pos && (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                    {posLabel(sense.pos)}
                  </span>
                )}
                <p className={`min-w-0 font-extrabold leading-snug text-stone-800 ${compact ? "text-[15px]" : "text-lg"}`}>
                  {sense.meaning}
                </p>
              </div>
              {sense.pattern && (
                <p className="mt-1.5 inline-block rounded-lg bg-violet-50 px-2 py-1 font-mono text-[13px] font-bold text-violet-700 ring-1 ring-violet-100">
                  {sense.pattern}
                </p>
              )}
              {sense.example_en && !compact && (
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[16px] leading-relaxed text-stone-800 break-words">
                      <Highlighted sentence={sense.example_en} headword={card.front} />
                    </p>
                    {sense.example_tr && (
                      <p className="mt-0.5 text-[14px] leading-relaxed text-stone-500 break-words">
                        <TurkishLine sentence={sense.example_tr} meaning={sense.meaning} />
                      </p>
                    )}
                  </div>
                  <SpeakButton text={sense.example_en} size="sm" />
                </div>
              )}
              {sense.note && !compact && (
                <p className="mt-2 text-[13px] leading-relaxed text-stone-500">{sense.note}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className={`rounded-2xl bg-white ${compact ? "p-3" : "p-4"} ring-1 ring-stone-200`}>
          <p className={`font-extrabold leading-snug text-stone-800 ${compact ? "text-[15px]" : "text-xl"}`}>{meaning}</p>
          {card.example_sentence && !compact && (
            <div className="mt-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[16px] leading-relaxed text-stone-800 break-words">
                  <Highlighted sentence={card.example_sentence} headword={card.front} />
                </p>
                {card.example_tr && (
                  <p className="mt-0.5 text-[14px] leading-relaxed text-stone-500 break-words">
                    <TurkishLine sentence={card.example_tr} meaning={meaning} />
                  </p>
                )}
              </div>
              <SpeakButton text={card.example_sentence} size="sm" />
            </div>
          )}
          {card.example2 && !compact && (
            <div className="mt-2 border-t border-dashed border-stone-200 pt-2">
              <p className="text-[16px] leading-relaxed text-stone-800 break-words">
                <Highlighted sentence={card.example2} headword={card.front} />
              </p>
              {card.example2_tr && (
                <p className="mt-0.5 text-[14px] leading-relaxed text-stone-500 break-words">
                  <TurkishLine sentence={card.example2_tr} meaning={meaning} />
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Words that grow from this one. */}
      {card.related && card.related.length > 0 && (
        <div className={`rounded-2xl bg-sky-50 ${compact ? "p-3" : "p-4"} ring-1 ring-sky-100`}>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-sky-700">Aynı aileden</p>
          <ul className="mt-1.5 space-y-1">
            {card.related.map((r, i) => (
              <li key={`${r.word}-${i}`} className="flex flex-wrap items-baseline gap-x-2 text-[15px]">
                <span className="font-extrabold text-stone-800">{r.word}</span>
                {r.pos && <span className="text-[11px] font-bold uppercase tracking-wide text-stone-400">{posLabel(r.pos)}</span>}
                <span className="text-stone-600">{r.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.watch_out && !compact && (
        <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600">⚠️ Dikkat</p>
          <p className="mt-1 text-[15px] leading-relaxed text-rose-900">{card.watch_out}</p>
        </div>
      )}

      {/* The learner's own note: their memory of the word. */}
      {card.mnemonic && card.lesson === null && !compact && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700">Senin notun</p>
          <p className="mt-1 text-[15px] leading-relaxed text-amber-900">{card.mnemonic}</p>
        </div>
      )}
    </div>
  );
}

export default WordCardBack;
