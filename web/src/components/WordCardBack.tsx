import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Card, Sense } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { tierOf } from "../lib/senses";
import { locateTurkish, splitOnWord } from "../lib/sentence";
import { parseWatchOut } from "../lib/watchOut";
import { familyAt, familyStyle, posFamily, type Family } from "../lib/palette";
import SpeakButton from "./SpeakButton";
import Mascot from "./Mascot";
import { AlertIcon, ChevronDownIcon, FamilyIcon, LinkIcon, QuoteIcon } from "./icons";
import MeaningText from "./MeaningText";

type WordCardBackProps = {
  card: Card;
  /** "compact" is a deck row: meanings only. Everything else gets the full entry. */
  variant?: "full" | "compact" | "flat";
};

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });


/** A part of speech as a small coloured pill. */
export function PosPill({ pos, className = "" }: { pos: string | null | undefined; className?: string }) {
  if (!pos) return null;
  return (
    <span style={familyStyle(posFamily(pos))} className={`inline-block rounded-full bg-(--c-soft) px-2.5 py-0.5 text-[12px] font-black lowercase text-(--c-ink) ${className}`}>
      {posLabel(pos)}
    </span>
  );
}

/** The headword inside a sentence, lit in the surrounding colour (`--c`: a family's, or the word's own tint). */
export function Lit({ sentence, headword, solid = true }: { sentence: string; headword: string; solid?: boolean }) {
  const parts = splitOnWord(sentence, headword);
  if (!parts) return <>{sentence}</>;
  return (
    <>
      {parts.before}
      <span
        className={
          solid
            ? "rounded-md bg-(--c) px-1 font-black text-white [box-decoration-break:clone]"
            : "font-black text-(--c-ink) underline decoration-(--c) decoration-[3px] underline-offset-4"
        }
      >
        {parts.match}
      </span>
      {parts.after}
    </>
  );
}

/** A sentence's Turkish with the word's counterpart picked out in the colour's ink. */
export function TurkishLit({ sentence, meaning }: { sentence: string; meaning: string }) {
  const at = locateTurkish(sentence, meaning);
  if (!at) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, at.start)}
      <span className="font-black text-(--c-ink)">{sentence.slice(at.start, at.end)}</span>
      {sentence.slice(at.end)}
    </>
  );
}

/**
 * One sentence as a soft bubble in the surrounding colour: the English in
 * charcoal with the word lit up, a speaker, and the Turkish underneath in
 * grey with its counterpart in the colour's ink — three voices, three
 * colours, never one grey block.
 */
export function ExampleBubble({ en, tr, headword, meaning, size = "md" }: { en: string; tr?: string | null; headword: string; meaning: string; size?: "sm" | "md" }) {
  return (
    <div className="rounded-2xl bg-(--c-soft) px-3.5 py-3">
      <div className="flex items-start gap-2.5">
        <p className={`min-w-0 flex-1 font-bold leading-[1.5] text-ink wrap-break-word ${size === "sm" ? "text-[15px]" : "text-[17px]"}`}>
          <Lit sentence={en} headword={headword} />
        </p>
        <SpeakButton text={en} size="sm" className="!h-9 !w-9 !bg-white !text-(--c-ink) !ring-0 shadow-[0_2px_0_0_rgba(0,0,0,0.08)]" />
      </div>
      {tr && (
        <p className={`mt-1.5 font-semibold leading-[1.45] text-graphite wrap-break-word ${size === "sm" ? "text-[13px]" : "text-[15px]"}`}>
          <TurkishLit sentence={tr} meaning={meaning} />
        </p>
      )}
    </div>
  );
}

/** "consider sth · consider + V-ing": each pattern as its own chip. */
function Patterns({ text }: { text: string }) {
  const parts = text
    .split(/\s·\s/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {parts.map((p, i) => (
        <span key={i} className="rounded-lg border-2 border-(--c-soft) bg-white px-2 py-0.5 font-mono text-[13px] font-bold text-(--c-ink)">
          {p}
        </span>
      ))}
    </div>
  );
}

/** Every sentence a sense carries: its main one, then the extras. */
function sentencesOfSense(sense: Sense): { en: string; tr: string | null }[] {
  const lines: { en: string; tr: string | null }[] = [];
  const seen = new Set<string>();
  const add = (en?: string | null, tr?: string | null) => {
    const text = en?.trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    lines.push({ en: text, tr: tr?.trim() || null });
  };
  add(sense.example_en, sense.example_tr);
  for (const e of sense.examples ?? []) add(e.en, e.tr);
  return lines;
}

/** One sense as its own card in its own colour: number, part of speech, meaning, definition, patterns, sentences. */
function SenseCard({ sense, index, headword, showPos }: { sense: Sense; index: number; headword: string; showPos: boolean }) {
  const sentences = sentencesOfSense(sense);
  return (
    <li style={{ ...familyStyle(familyAt(index)), ...delay(Math.min(index, 4) * 70) } as CSSProperties} className="card-3d rounded-[22px] p-4 animate-rise-in">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-(--c) text-[15px] font-black text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]">{index + 1}</span>
        {showPos && <PosPill pos={sense.pos} />}
      </div>
      <p className="mt-2.5 text-[20px] font-black leading-snug text-ink">
        <MeaningText text={sense.meaning} />
      </p>
      {sense.definition && <p className="mt-1 text-[15px] font-semibold italic leading-snug text-(--c-ink)">“{sense.definition}”</p>}
      {sense.pattern && <Patterns text={sense.pattern} />}
      {sentences.length > 0 && (
        <div className="mt-3 space-y-2">
          {sentences.map((line) => (
            <ExampleBubble key={line.en} en={line.en} tr={line.tr} headword={headword} meaning={sense.meaning} />
          ))}
        </div>
      )}
      {sense.note && <p className="mt-2.5 text-[14px] font-semibold leading-relaxed text-graphite">{sense.note}</p>}
    </li>
  );
}

/** A section's heading: a small coloured badge with its icon, the name, a count. */
export function SectionHead({ icon, family, title, count }: { icon: ReactNode; family: Family; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5" style={familyStyle(family)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--c) text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]">{icon}</span>
      <h2 className="text-[19px] font-black text-ink">{title}</h2>
      {count !== undefined && <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[12px] font-black tabular-nums text-graphite">{count}</span>}
    </div>
  );
}

/** The one trap: the wrong sentence in red, the right one in green, why underneath — Tonton's warning. */
export function TrapCard({ text }: { text: string }) {
  const trap = parseWatchOut(text);
  return (
    <section className="rounded-[22px] border-2 border-sunny bg-sunny-soft p-4 shadow-[0_2px_0_0_var(--color-sunny)]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-sunny text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.12)]">
          <AlertIcon className="h-5 w-5" />
        </span>
        <h2 className="flex-1 text-[19px] font-black text-ink">Dikkat</h2>
        <Mascot size={46} mood="think" lively={false} className="-my-3 shrink-0" />
      </div>
      {trap.wrong && trap.right && (
        <div className="mt-3 space-y-2">
          <p className="flex items-start gap-2.5 rounded-2xl bg-white px-3 py-2.5 text-[16px] font-bold leading-snug text-berry-ink">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-berry text-[13px] font-black text-white">
              ✗
            </span>
            <span className="min-w-0">
              <span className="sr-only">Yanlış: </span>
              {trap.wrong}
            </span>
          </p>
          <p className="flex items-start gap-2.5 rounded-2xl bg-white px-3 py-2.5 text-[16px] font-black leading-snug text-grass-ink">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-grass text-[13px] font-black text-white">
              ✓
            </span>
            <span className="min-w-0">
              <span className="sr-only">Doğru: </span>
              {trap.right}
            </span>
          </p>
        </div>
      )}
      {trap.note && <p className="mt-3 text-[15px] font-semibold leading-relaxed text-ink">{trap.note}</p>}
    </section>
  );
}

/**
 * The dictionary entry, in colour: every sense its own card in its own
 * colour, its sentences as soft bubbles with the word lit up and the
 * Turkish in a second voice; then the chunks the word lives in, its
 * family, and the one trap. The senses the cards never ask (tier 3) wait
 * folded under "Diğer anlamlar", so the ones being learned lead.
 */
function WordCardBack({ card, variant = "full" }: WordCardBackProps) {
  const [othersOpen, setOthersOpen] = useState(false);
  const { text: meaning, pos } = parseBack(card.back);
  const senses: Sense[] =
    card.senses && card.senses.length > 0
      ? card.senses
      : [
          {
            pos,
            meaning,
            example_en: card.example_sentence,
            example_tr: card.example_tr,
            examples: card.example2 ? [{ en: card.example2, tr: card.example2_tr }] : null,
          },
        ];
  const mixedTypes = new Set(senses.map((s) => s.pos ?? "")).size > 1;

  if (variant === "compact") {
    return (
      <ol className="space-y-1">
        {senses.map((s, i) => (
          <li key={i} style={familyStyle(familyAt(i))} className="grid grid-cols-[20px_1fr] gap-x-2 text-[14px] leading-snug text-ink">
            <span className="text-[12px] font-black tabular-nums text-(--c-ink)">{i + 1}</span>
            <span className="font-bold">
              <MeaningText text={s.meaning} noteClassName="font-semibold text-graphite" />
            </span>
          </li>
        ))}
      </ol>
    );
  }

  const numbered = senses.map((sense, i) => ({ sense, i }));
  const taught = numbered.filter(({ sense, i }) => tierOf(sense, i) < 3);
  const others = numbered.filter(({ sense, i }) => tierOf(sense, i) === 3);

  return (
    <div className="space-y-7">
      <section>
        <SectionHead icon={<QuoteIcon className="h-5 w-5" />} family="ocean" title="Anlamlar" count={senses.length} />
        <ol className="mt-3 space-y-3.5">
          {taught.map(({ sense, i }) => (
            <SenseCard key={i} sense={sense} index={i} headword={card.front} showPos={mixedTypes || i === 0} />
          ))}
        </ol>
        {others.length > 0 && (
          <>
            <button
              type="button"
              aria-expanded={othersOpen}
              onClick={() => setOthersOpen((open) => !open)}
              className="mt-3.5 flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-rule bg-white px-3.5 text-[12px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
            >
              Diğer anlamlar · {others.length}
              <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${othersOpen ? "rotate-180" : ""}`} />
            </button>
            {othersOpen && (
              <ol className="mt-3.5 space-y-3.5">
                {others.map(({ sense, i }) => (
                  <SenseCard key={i} sense={sense} index={i} headword={card.front} showPos={mixedTypes} />
                ))}
              </ol>
            )}
          </>
        )}
      </section>

      {card.collocations && card.collocations.length > 0 && (
        <section>
          <SectionHead icon={<LinkIcon className="h-5 w-5" />} family="tangerine" title="Sık kalıplar" count={card.collocations.length} />
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {card.collocations.map((c, i) => (
              <li key={`${c.en}-${i}`} style={familyStyle(familyAt(i + 2))} className="rounded-2xl border-2 border-(--c-soft) bg-white px-3.5 py-2.5">
                <span className="block text-[16px] font-black leading-snug text-(--c-ink)">
                  <Lit sentence={c.en} headword={card.front} solid={false} />
                </span>
                <span className="mt-0.5 block text-[14px] font-semibold leading-snug text-graphite">{c.tr}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {card.related && card.related.length > 0 && (
        <section>
          <SectionHead icon={<FamilyIcon className="h-5 w-5" />} family="teal" title="Aynı aileden" count={card.related.length} />
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {card.related.map((r, i) => (
              <li key={`${r.word}-${i}`} className="card-3d min-w-0 rounded-2xl px-3 py-2.5">
                <span className="block wrap-break-word text-[16px] font-black leading-tight text-ink">{r.word}</span>
                <PosPill pos={r.pos} className="mt-1" />
                <span className="mt-1 block text-[13px] font-semibold leading-snug text-graphite">{r.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {card.watch_out && <TrapCard text={card.watch_out} />}
    </div>
  );
}

export default WordCardBack;
