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
      <span className="font-extrabold underline decoration-[var(--tint)] decoration-[2px] underline-offset-4">{parts.match}</span>
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

/** The pattern ("~ about sth") set as a chip, so it reads as notation, not prose. */
function Pattern({ text }: { text: string }) {
  return <span className="inline-block rounded bg-paper-deep/50 px-1.5 py-0.5 font-mono text-[12px] text-graphite">{text}</span>;
}

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite";
const SPEAK = "bg-paper-lift text-ink ring-1 ring-rule";

/**
 * The dictionary entry, set like a magazine page: hairline-divided senses
 * hanging off a numeral in the word's own ink, the pattern as a chip, one
 * real sentence with the headword underlined and its Turkish beneath; then
 * the chunks the word lives in, its family, and the one trap — which
 * Tonton delivers. Senses arrive one after another; the rest is just there.
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
            <span className="text-[11px] font-black tabular-nums tint-text">{i + 1}</span>
            <span className="font-semibold">{m}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div>
      {senses.length > 0 ? (
        <ol className="divide-y divide-rule">
          {senses.map((sense, i) => (
            <li
              key={i}
              className="grid grid-cols-[28px_1fr] gap-x-3 py-4 first:pt-1 animate-rise-in"
              style={delay(Math.min(i, 4) * 60)}
            >
              <span className="pt-1 text-[13px] font-black tabular-nums tint-text">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-[18px] font-extrabold leading-snug text-ink">
                  {sense.meaning}
                  {sense.pos && mixedTypes && (
                    <span className="ml-2 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.16em] text-graphite">
                      {posLabel(sense.pos)}
                    </span>
                  )}
                </p>
                {sense.pattern && (
                  <p className="mt-1.5">
                    <Pattern text={sense.pattern} />
                  </p>
                )}
                {sense.example_en && (
                  <div className="mt-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[17px] leading-[1.5] text-ink wrap-break-word">
                        <Highlighted sentence={sense.example_en} headword={card.front} />
                      </p>
                      {sense.example_tr && (
                        <p className="mt-1 text-[14px] leading-[1.5] text-graphite wrap-break-word">
                          <TurkishLine sentence={sense.example_tr} meaning={sense.meaning} />
                        </p>
                      )}
                    </div>
                    <SpeakButton text={sense.example_en} size="sm" className={SPEAK} />
                  </div>
                )}
                {sense.note && <p className="mt-2 text-[13px] leading-relaxed text-graphite">{sense.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="py-1 animate-rise-in">
          <p className="text-[20px] font-extrabold leading-snug text-ink">{meaning}</p>
          {card.example_sentence && (
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[17px] leading-[1.5] text-ink wrap-break-word">
                  <Highlighted sentence={card.example_sentence} headword={card.front} />
                </p>
                {card.example_tr && (
                  <p className="mt-1 text-[14px] leading-[1.5] text-graphite wrap-break-word">
                    <TurkishLine sentence={card.example_tr} meaning={meaning} />
                  </p>
                )}
              </div>
              <SpeakButton text={card.example_sentence} size="sm" className={SPEAK} />
            </div>
          )}
          {card.example2 && (
            <div className="mt-3 border-t border-rule pt-3">
              <p className="text-[17px] leading-[1.5] text-ink wrap-break-word">
                <Highlighted sentence={card.example2} headword={card.front} />
              </p>
              {card.example2_tr && (
                <p className="mt-1 text-[14px] leading-[1.5] text-graphite wrap-break-word">
                  <TurkishLine sentence={card.example2_tr} meaning={meaning} />
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {card.collocations && card.collocations.length > 0 && (
        <section className="mt-5 border-t border-rule pt-2">
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
        <section className="mt-5 border-t border-rule pt-2">
          <p className={KICKER}>Aynı aileden</p>
          <ul className="mt-2 space-y-1.5">
            {card.related.map((r, i) => (
              <li key={`${r.word}-${i}`} className="flex flex-wrap items-baseline gap-x-2 text-[15px] leading-snug">
                <span className="font-extrabold text-ink">{r.word}</span>
                {r.pos && <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-moss">{posLabel(r.pos)}</span>}
                <span className="text-graphite">{r.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The trap is Tonton's column: a tip in gilt, not an error in vermilion. */}
      {card.watch_out && (
        <section className="mt-6 flex items-start gap-3.5 rounded-xl border-l-2 border-rule bg-paper-deep/50 p-4">
          <Mascot size={44} lively={false} className="shrink-0" />
          <blockquote className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gilt-ink">Dikkat</p>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{card.watch_out}</p>
            <cite className="mt-1.5 block text-[10px] font-extrabold uppercase not-italic tracking-[0.18em] text-graphite">— Tonton</cite>
          </blockquote>
        </section>
      )}

      {card.mnemonic && card.lesson === null && (
        <section className="mt-5 border-t border-rule pt-2">
          <p className={KICKER}>Senin notun</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-graphite">{card.mnemonic}</p>
        </section>
      )}
    </div>
  );
}

export default WordCardBack;
