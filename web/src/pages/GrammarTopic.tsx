import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import TontonLine from "../components/TontonLine";
import Mascot from "../components/Mascot";
import SpeakButton from "../components/SpeakButton";
import ErrorState from "../components/ErrorState";
import Rich from "../components/Rich";
import { AlertIcon, BulbIcon } from "../components/icons";
import Stars from "../components/Stars";
import { CATALOG, levelOf } from "../content/grammar/catalog";
import { topicOf } from "../content/grammar";
import type { Example, Formula, Glance, Mistake, Section, Table } from "../content/grammar/types";
import { starsFor, useGrammarProgress } from "../lib/grammar";
import { familyStyle } from "../lib/palette";
import { plain } from "../lib/rich";

const reducedMotion = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: reducedMotion() ? "0ms" : `${ms}ms` });

const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });

/** The colours of this page, spelled out once at the top. */
function Legend({ legend }: { legend: { focus?: string; partner?: string; extra?: string } }) {
  const items = [
    legend.partner && { cls: "bg-ocean-soft text-ocean-ink", text: legend.partner },
    legend.focus && { cls: "bg-grass-soft text-grass-ink", text: legend.focus },
    legend.extra && { cls: "bg-tangerine-soft text-tangerine-ink", text: legend.extra },
  ].filter(Boolean) as { cls: string; text: string }[];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 bg-paper-deep px-4 py-2.5">
      <span className="text-[12px] font-black uppercase tracking-[0.1em] text-graphite">Renkler</span>
      {items.map((item) => (
        <span key={item.text} className={`rounded-md px-2 py-0.5 text-[13px] font-black ${item.cls}`}>
          {item.text}
        </span>
      ))}
    </div>
  );
}

/**
 * A table with a header row in the level's colour and banded rows. Cells
 * wrap so every column stays on a phone's screen; only a table too wide to
 * wrap scrolls sideways.
 */
function GrammarTable({ table }: { table: Table }) {
  const wide = table.head.length >= 4;
  return (
    <figure className="mt-3">
      <div className="overflow-x-auto rounded-2xl border-2 border-rule">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-(--c) text-white">
              {table.head.map((cell, i) => (
                <th key={i} scope="col" className={`py-2 align-bottom font-black uppercase tracking-[0.04em] ${wide ? "px-2 text-[11px]" : "px-2.5 text-[11px]"}`}>
                  <Rich text={cell} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r} className={r % 2 === 1 ? "bg-paper-deep" : "bg-white"}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`py-2 align-top leading-snug text-ink ${wide ? "px-2 text-[13px]" : "px-2.5 text-[14px]"} ${c === 0 ? "font-extrabold" : "font-semibold"}`}
                  >
                    <Rich text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.caption && <figcaption className="mt-1.5 px-1 text-[13px] font-semibold text-graphite">{table.caption}</figcaption>}
    </figure>
  );
}

/** One example: the English in colour with a speaker, its Turkish under it in a quieter voice. */
function ExampleLine({ example }: { example: Example }) {
  return (
    <li className="flex items-start gap-2.5 px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-bold leading-[1.5] text-ink wrap-break-word">
          <Rich text={example.en} />
        </p>
        <p className="mt-0.5 text-[14px] font-semibold leading-snug text-graphite wrap-break-word">
          <Rich text={example.tr} />
        </p>
      </div>
      <SpeakButton text={plain(example.en)} size="sm" className="!h-9 !w-9" />
    </li>
  );
}

/** How each block of a formula looks: the same colours the marks use, as bricks. */
const BRICK: Record<Formula["parts"][number]["role"], string> = {
  partner: "border-ocean bg-ocean-soft text-ocean-ink shadow-[0_2px_0_0_var(--color-ocean)]",
  focus: "border-grass bg-grass-soft text-grass-ink shadow-[0_2px_0_0_var(--color-grass)]",
  extra: "border-tangerine bg-tangerine-soft text-tangerine-ink shadow-[0_2px_0_0_var(--color-tangerine)]",
  plain: "border-rule bg-white text-ink shadow-[0_2px_0_0_var(--color-rule)]",
};

/** A pattern as one sentence in coloured bricks, what goes in each slot under it, and a speaker for the sentence. */
function FormulaRow({ formula }: { formula: Formula }) {
  const sentence = formula.parts.map((part) => part.text).join(" ");
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        {/* Not upper-cased: the page is Turkish, and English words in a label would come out as "WİLL". */}
        <p className="text-[13px] font-extrabold text-(--c-ink)">{formula.label}</p>
        <SpeakButton text={sentence} size="sm" className="!h-8 !w-8 -my-1" />
      </div>
      <p className="sr-only">
        {sentence} ({formula.parts.filter((part) => part.name).map((part) => `${part.text}: ${part.name}`).join(", ")})
      </p>
      <div aria-hidden="true" className="mt-1.5 flex flex-wrap items-start gap-x-1 gap-y-2.5">
        {formula.parts.map((part, i) => (
          <span key={i} className="flex flex-col items-center">
            <span className={`whitespace-nowrap rounded-xl border-2 px-2.5 py-1 text-[16px] font-black leading-tight max-[359px]:px-2 max-[359px]:text-[15px] ${BRICK[part.role]}`}>{part.text}</span>
            {part.name && <span className="mt-1 whitespace-nowrap text-[11px] font-bold leading-none text-graphite">{part.name}</span>}
          </span>
        ))}
      </div>
    </li>
  );
}

/**
 * Bir bakışta: the topic whole before its parts. The idea in a sentence,
 * the patterns as bricks, Turkish beside English, and what the colours mean.
 */
function GlanceCard({ glance, legend }: { glance: Glance; legend?: { focus?: string; partner?: string; extra?: string } }) {
  return (
    <section aria-labelledby="glance-heading" className="card-3d mt-5 overflow-hidden rounded-[22px] animate-rise-in">
      <div className="bg-(--c-soft) px-4 pb-3.5 pt-3">
        <h2 id="glance-heading" className="text-[12px] font-black uppercase tracking-[0.12em] text-(--c-ink)">
          Bir bakışta
        </h2>
        <p className="mt-1 text-[17px] font-black leading-[1.4] text-ink">
          <Rich text={glance.idea} />
        </p>
      </div>
      <ul className="divide-y-2 divide-dashed divide-rule px-4 pb-4 pt-3.5">
        {glance.formulas.map((formula) => (
          <FormulaRow key={formula.label} formula={formula} />
        ))}
      </ul>
      <div className="border-t-2 border-rule px-4 py-4">
        <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-graphite">Türkçede · İngilizcede</h3>
        <ul className="mt-2.5 divide-y-2 divide-white overflow-hidden rounded-2xl bg-paper-deep">
          {glance.compare.map((pair) => (
            <li key={pair.en} className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-2.5 gap-y-1 px-3 py-2.5">
              <span className="rounded-md bg-white px-1.5 py-px text-[11px] font-black tracking-[0.06em] text-graphite">TR</span>
              <span className="text-[15px] font-semibold leading-snug text-graphite wrap-break-word">
                <Rich text={pair.tr} />
              </span>
              <span className="rounded-md bg-(--c) px-1.5 py-px text-[11px] font-black tracking-[0.06em] text-white">EN</span>
              <span className="text-[16px] font-black leading-snug text-ink wrap-break-word">
                <Rich text={pair.en} />
              </span>
            </li>
          ))}
        </ul>
        {glance.compareNote && (
          <p className="mt-2.5 text-[14px] font-bold leading-snug text-graphite">
            <Rich text={glance.compareNote} />
          </p>
        )}
      </div>
      {legend && <Legend legend={legend} />}
    </section>
  );
}

/** The page's parts as chips, to jump straight to one. */
function PageIndex({ sections, mistakes }: { sections: Section[]; mistakes: boolean }) {
  const chip =
    "press flex min-h-[34px] items-center gap-1.5 rounded-full border-2 border-rule bg-white py-0.5 pl-1 pr-3 text-left text-[13px] font-extrabold leading-tight text-ink shadow-[0_2px_0_0_var(--color-rule)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30";
  return (
    <nav aria-label="Bu sayfada" className="mt-6">
      <p className="text-[12px] font-black uppercase tracking-[0.12em] text-graphite">Bu sayfada</p>
      <ol className="mt-2 flex flex-wrap gap-1.5">
        {sections.map((section, i) => (
          <li key={section.title}>
            <button type="button" onClick={() => jumpTo(`bolum-${i + 1}`)} className={chip}>
              <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--c) text-[12px] font-black text-white">
                {i + 1}
              </span>
              {section.title}
            </button>
          </li>
        ))}
        {mistakes && (
          <li>
            <button type="button" onClick={() => jumpTo("hatalar")} className={chip}>
              <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-berry text-[12px] font-black text-white">
                ✗
              </span>
              Hatayı bul
            </button>
          </li>
        )}
      </ol>
    </nav>
  );
}

/** A wrong sentence to find the mistake in first; a tap shows where it was, the right one and why. */
function MistakeCard({ mistake }: { mistake: Mistake }) {
  const [shown, setShown] = useState(false);
  const wrong = (
    <>
      <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-berry text-[13px] font-black text-white">
        ✗
      </span>
      <span className="min-w-0 flex-1">
        <span className="sr-only">Yanlış: </span>
        {shown ? <Rich text={mistake.wrong} /> : plain(mistake.wrong)}
      </span>
    </>
  );
  return (
    <li className="card-3d rounded-[20px] p-3">
      {shown ? (
        <p className="flex items-start gap-2.5 rounded-xl bg-berry-soft px-3 py-2 text-[16px] font-bold leading-snug text-berry-ink">{wrong}</p>
      ) : (
        <button
          type="button"
          onClick={() => setShown(true)}
          className="flex w-full items-center gap-2.5 rounded-xl bg-berry-soft py-2 pl-3 pr-2 text-left text-[16px] font-bold leading-snug text-berry-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-berry/30"
        >
          {wrong}
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[13px] font-black text-berry-ink shadow-[0_2px_0_0_rgba(0,0,0,0.08)]">Göster</span>
        </button>
      )}
      {shown && (
        <div className="animate-rise-in">
          <p className="mt-2 flex items-start gap-2.5 rounded-xl bg-grass-soft px-3 py-2 text-[16px] font-black leading-snug text-grass-ink">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-grass text-[13px] font-black text-white">
              ✓
            </span>
            <span>
              <span className="sr-only">Doğru: </span>
              <Rich text={mistake.right} />
            </span>
          </p>
          <p className="mt-2 px-1 text-[14px] font-semibold leading-snug text-graphite">
            <Rich text={mistake.why} />
          </p>
        </div>
      )}
    </li>
  );
}

function SectionCard({ section, index }: { section: Section; index: number }) {
  return (
    <section id={`bolum-${index + 1}`} className="card-3d scroll-mt-20 rounded-[22px] p-4 animate-rise-in" style={delay(Math.min(index, 4) * 60)}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-(--c) text-[15px] font-black text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]">
          {index + 1}
        </span>
        <h2 className="text-[19px] font-black leading-tight text-ink">{section.title}</h2>
      </div>
      {section.body && (
        <p className="mt-2.5 text-[16px] font-semibold leading-[1.55] text-ink">
          <Rich text={section.body} />
        </p>
      )}
      {section.table && <GrammarTable table={section.table} />}
      {section.examples && section.examples.length > 0 && (
        <ul className="mt-3 divide-y-2 divide-(--c-soft) rounded-2xl border-2 border-(--c-soft)">
          {section.examples.map((example) => (
            <ExampleLine key={example.en} example={example} />
          ))}
        </ul>
      )}
      {section.note && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sunny-soft px-3 py-2.5 text-[14px] font-bold leading-snug text-ink">
          <BulbIcon className="mt-px h-5 w-5 shrink-0 text-sunny-deep" />
          <span>
            <Rich text={section.note} />
          </span>
        </p>
      )}
    </section>
  );
}

/**
 * One grammar topic, as a page to read before the quiz: the level's colour
 * behind the title, Tonton on why it matters, the topic at a glance (its
 * idea, its patterns as bricks, Turkish beside English), the sections (a
 * rule, a table, sentences with their Turkish, a note), the mistakes to
 * find, Tonton's trick, the green button to practise, then the topic's
 * Hatırla card and the next topic.
 */
function GrammarTopic() {
  const { slug = "" } = useParams<{ slug: string }>();
  const topic = topicOf(slug);
  const progress = useGrammarProgress();

  if (!topic) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
          <ErrorState title="Böyle bir konu yok" message="Listeye dönüp başka bir konu seç." />
          <Link to="/gramer" className="mt-4 inline-block text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
            ← Gramer
          </Link>
        </main>
        <AppTabs />
      </div>
    );
  }

  const level = levelOf(topic.level);
  const best = progress.data?.[topic.slug]?.best;
  const attempts = progress.data?.[topic.slug]?.attempts ?? 0;
  const next = CATALOG[CATALOG.findIndex((t) => t.slug === topic.slug) + 1];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5" style={familyStyle(level.tone)}>
        <Link to="/gramer" viewTransition className="-m-2 inline-block p-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
          ← Gramer
        </Link>

        <header className="relative isolate mt-3 overflow-hidden rounded-[28px] bg-(--c) px-5 pb-7 pt-4 text-white shadow-[inset_0_-6px_0_0_rgba(0,0,0,0.15)]">
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-2 -z-10 select-none text-[150px] leading-none opacity-25">
            {topic.emoji}
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[12px] font-black uppercase tracking-[0.08em]">{level.titleTr}</span>
            <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[12px] font-black">{topic.quiz.length} soru</span>
          </div>
          <span aria-hidden="true" className="mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-white text-[30px] shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.1)]">
            {topic.emoji}
          </span>
          <h1 className="mt-3 text-[36px] font-black leading-[1] tracking-[-0.02em]">{topic.title}</h1>
          <p className="mt-1.5 text-[18px] font-extrabold text-white/95">{topic.titleTr}</p>
          <div className="mt-3 flex items-center gap-2.5">
            <Stars count={starsFor(best)} size="h-6 w-6" dim="text-white/35" />
            {best !== undefined && (
              <span className="text-[13px] font-black text-white/90">
                En iyi %{best} · {attempts} deneme
              </span>
            )}
          </div>
        </header>

        <TontonLine className="mt-5" size={56}>
          {topic.intro}
        </TontonLine>

        {topic.glance ? (
          <GlanceCard glance={topic.glance} legend={topic.legend} />
        ) : (
          topic.legend && (
            <div className="mt-5 overflow-hidden rounded-2xl">
              <Legend legend={topic.legend} />
            </div>
          )
        )}

        <PageIndex sections={topic.sections} mistakes={topic.mistakes.length > 0} />

        <div className="mt-4 space-y-4">
          {topic.sections.map((section, i) => (
            <SectionCard key={section.title} section={section} index={i} />
          ))}
        </div>

        {topic.mistakes.length > 0 && (
          <section id="hatalar" className="mt-8 scroll-mt-20" aria-labelledby="mistakes-heading">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-berry text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]">
                <AlertIcon className="h-5 w-5" />
              </span>
              <h2 id="mistakes-heading" className="text-[19px] font-black text-ink">
                Hatayı bul
              </h2>
            </div>
            <p className="mt-1 text-[14px] font-bold leading-snug text-graphite">Her cümlede bir yanlış var. Önce kendin bul, sonra dokunup bak.</p>
            <ul className="mt-3 space-y-3">
              {topic.mistakes.map((m) => (
                <MistakeCard key={m.wrong} mistake={m} />
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 flex items-start gap-3 rounded-[22px] border-2 border-sunny bg-sunny-soft p-4 shadow-[0_2px_0_0_var(--color-sunny)]">
          <Mascot size={58} mood="happy" className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-black uppercase tracking-[0.1em] text-sunny-ink">Tonton'un hilesi</p>
            <p className="mt-1 text-[16px] font-bold leading-snug text-ink">
              <Rich text={topic.tip} />
            </p>
          </div>
        </section>

        <Link
          to={`/gramer/${topic.slug}/alistirma`}
          className="face mt-8 flex min-h-[58px] w-full items-center justify-center rounded-2xl bg-grass text-[16px] font-black uppercase tracking-[0.08em] text-white shadow-button press-3d focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-grass/40"
        >
          {best === undefined ? `Alıştırmaya başla · ${topic.quiz.length} soru` : "Bir daha alıştır"}
        </Link>

        <div className={`mt-4 grid gap-3 ${next ? "grid-cols-2" : ""}`}>
          <Link to={`/gramer/hatirla?konu=${topic.slug}`} viewTransition className="card-3d press flex flex-col rounded-[20px] px-3.5 py-3" style={familyStyle("plum")}>
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-(--c-ink)">Kısaca</span>
            <span className="mt-1 flex items-center gap-1.5 text-[16px] font-black leading-tight text-ink">
              <BulbIcon className="h-5 w-5 shrink-0 text-(--c)" />
              Hatırla kartı
            </span>
          </Link>
          {next && (
            <Link to={`/gramer/${next.slug}`} viewTransition className="card-3d press flex flex-col rounded-[20px] px-3.5 py-3">
              <span className="text-[11px] font-black uppercase tracking-[0.12em] text-graphite">Sonraki konu</span>
              <span className="mt-1 flex items-start gap-1.5 text-[16px] font-black leading-tight text-ink">
                <span aria-hidden="true">{next.emoji}</span>
                <span className="min-w-0">{next.title}</span>
              </span>
            </Link>
          )}
        </div>
      </main>
      <AppTabs />
    </div>
  );
}

export default GrammarTopic;
