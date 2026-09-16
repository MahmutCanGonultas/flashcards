import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { locateTurkish, splitOnWord } from "../lib/sentence";
import SpeakButton from "./SpeakButton";
import Mascot from "./Mascot";

type WordCardBackProps = {
  card: Card;
  /** "compact" is a deck row: meanings only. Everything else gets the full entry. */
  variant?: "full" | "compact" | "flat";
};

function Highlighted({ sentence, headword }: { sentence: string; headword: string }) {
  const parts = splitOnWord(sentence, headword);
  if (!parts) return <>{sentence}</>;
  return (
    <>
      {parts.before}
      <span className="font-extrabold underline decoration-accent decoration-2 underline-offset-4">{parts.match}</span>
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
      <span className="font-bold text-ink">{sentence.slice(at.start, at.end)}</span>
      {sentence.slice(at.end)}
    </>
  );
}

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";

/**
 * The dictionary entry, set like a magazine page: hairline-divided senses
 * hanging off an accent numeral, the pattern set plain, one real sentence
 * with the headword underlined and its Turkish beneath; then the chunks
 * the word lives in, its family, and the one trap — which Tonton delivers.
 */
function WordCardBack({ card, variant = "full" }: WordCardBackProps) {
  const { text: meaning } = parseBack(card.back);
  const senses = card.senses ?? [];
  const compact = variant === "compact";
  const mixedTypes = new Set(senses.map((s) => s.pos ?? "")).size > 1;

  if (compact) {
    return (
      <ol className="space-y-1">
        {(senses.length > 0 ? senses.map((s) => s.meaning) : [meaning]).map((m, i) => (
          <li key={i} className="grid grid-cols-[20px_1fr] gap-x-2 text-[14px] leading-snug text-ink">
            <span className="text-[11px] font-black tabular-nums text-accent">{i + 1}</span>
            <span className="font-semibold">{m}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div>
      {senses.length > 0 ? (
        <ol className="divide-y divide-ink/10">
          {senses.map((sense, i) => (
            <li key={i} className="grid grid-cols-[28px_1fr] gap-x-3 py-4 first:pt-1">
              <span className="pt-1 text-[13px] font-black tabular-nums text-accent">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-[18px] font-extrabold leading-snug text-ink">
                  {sense.meaning}
                  {sense.pos && mixedTypes && (
                    <span className="ml-2 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.16em] text-graphite">
                      {posLabel(sense.pos)}
                    </span>
                  )}
                </p>
                {sense.pattern && <p className="mt-1 font-mono text-[12.5px] leading-snug text-graphite">{sense.pattern}</p>}
                {sense.example_en && (
                  <div className="mt-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[17px] leading-[1.5] text-ink break-words">
                        <Highlighted sentence={sense.example_en} headword={card.front} />
                      </p>
                      {sense.example_tr && (
                        <p className="mt-1 text-[14px] leading-[1.5] text-graphite break-words">
                          <TurkishLine sentence={sense.example_tr} meaning={sense.meaning} />
                        </p>
                      )}
                    </div>
                    <SpeakButton text={sense.example_en} size="sm" className="!bg-transparent !text-ink ring-1 ring-ink/15" />
                  </div>
                )}
                {sense.note && <p className="mt-2 text-[13px] leading-relaxed text-graphite">{sense.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="py-1">
          <p className="text-[20px] font-extrabold leading-snug text-ink">{meaning}</p>
          {card.example_sentence && (
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[17px] leading-[1.5] text-ink break-words">
                  <Highlighted sentence={card.example_sentence} headword={card.front} />
                </p>
                {card.example_tr && (
                  <p className="mt-1 text-[14px] leading-[1.5] text-graphite break-words">
                    <TurkishLine sentence={card.example_tr} meaning={meaning} />
                  </p>
                )}
              </div>
              <SpeakButton text={card.example_sentence} size="sm" className="!bg-transparent !text-ink ring-1 ring-ink/15" />
            </div>
          )}
          {card.example2 && (
            <div className="mt-3 border-t border-ink/10 pt-3">
              <p className="text-[17px] leading-[1.5] text-ink break-words">
                <Highlighted sentence={card.example2} headword={card.front} />
              </p>
              {card.example2_tr && (
                <p className="mt-1 text-[14px] leading-[1.5] text-graphite break-words">
                  <TurkishLine sentence={card.example2_tr} meaning={meaning} />
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {card.collocations && card.collocations.length > 0 && (
        <section className="mt-5 border-t border-ink pt-2">
          <p className={KICKER}>Sık kalıplar</p>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {card.collocations.map((c, i) => (
              <li key={`${c.en}-${i}`} className="leading-snug">
                <span className="block text-[15px] font-extrabold text-ink">{c.en}</span>
                <span className="block text-[13px] text-graphite">{c.tr}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {card.related && card.related.length > 0 && (
        <section className="mt-5 border-t border-ink/10 pt-2">
          <p className={KICKER}>Aynı aileden</p>
          <ul className="mt-2 space-y-1.5">
            {card.related.map((r, i) => (
              <li key={`${r.word}-${i}`} className="flex flex-wrap items-baseline gap-x-2 text-[15px] leading-snug">
                <span className="font-extrabold text-ink">{r.word}</span>
                {r.pos && <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-graphite">{posLabel(r.pos)}</span>}
                <span className="text-graphite">{r.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The trap is Tonton's column. */}
      {card.watch_out && (
        <section className="mt-6 flex items-start gap-3.5">
          <Mascot size={44} lively={false} className="shrink-0" />
          <blockquote className="min-w-0 border-l-2 border-accent pl-3.5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">Dikkat</p>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{card.watch_out}</p>
            <cite className="mt-1.5 block text-[10px] font-extrabold uppercase not-italic tracking-[0.18em] text-graphite">— Tonton</cite>
          </blockquote>
        </section>
      )}

      {card.mnemonic && card.lesson === null && (
        <section className="mt-5 border-t border-ink/10 pt-2">
          <p className={KICKER}>Senin notun</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-graphite">{card.mnemonic}</p>
        </section>
      )}
    </div>
  );
}

export default WordCardBack;
