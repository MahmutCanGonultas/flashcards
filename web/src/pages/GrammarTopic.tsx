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
import { levelOf } from "../content/grammar/catalog";
import { topicOf } from "../content/grammar";
import type { Example, Section, Table } from "../content/grammar/types";
import { starsFor, useGrammarProgress } from "../lib/grammar";
import { familyStyle } from "../lib/palette";
import { plain } from "../lib/rich";

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

/** The colours of this page, spelled out once at the top. */
function Legend({ legend }: { legend: { focus?: string; partner?: string; extra?: string } }) {
  const items = [
    legend.partner && { cls: "bg-ocean-soft text-ocean-ink", text: legend.partner },
    legend.focus && { cls: "bg-grass-soft text-grass-ink", text: legend.focus },
    legend.extra && { cls: "bg-tangerine-soft text-tangerine-ink", text: legend.extra },
  ].filter(Boolean) as { cls: string; text: string }[];
  if (items.length === 0) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-paper-deep px-3.5 py-2.5">
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
    <li className="rounded-2xl border-2 border-(--c-soft) bg-white px-3.5 py-2.5">
      <div className="flex items-start gap-2.5">
        <p className="min-w-0 flex-1 text-[17px] font-bold leading-[1.55] text-ink wrap-break-word">
          <Rich text={example.en} />
        </p>
        <SpeakButton text={plain(example.en)} size="sm" className="!h-9 !w-9" />
      </div>
      <p className="mt-1 text-[14px] font-semibold leading-snug text-graphite wrap-break-word">
        <Rich text={example.tr} />
      </p>
    </li>
  );
}

function SectionCard({ section, index }: { section: Section; index: number }) {
  return (
    <section className="card-3d rounded-[22px] p-4 animate-rise-in" style={delay(Math.min(index, 4) * 60)}>
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
        <ul className="mt-3 space-y-2">
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
 * behind the title, Tonton on why it matters, what the colours mean, the
 * sections (a rule, a table, sentences with their Turkish, a note), the
 * mistakes people make, Tonton's trick, and the green button to practise.
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

        {topic.legend && <Legend legend={topic.legend} />}

        <div className="mt-5 space-y-4">
          {topic.sections.map((section, i) => (
            <SectionCard key={section.title} section={section} index={i} />
          ))}
        </div>

        {topic.mistakes.length > 0 && (
          <section className="mt-8" aria-labelledby="mistakes-heading">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-berry text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.15)]">
                <AlertIcon className="h-5 w-5" />
              </span>
              <h2 id="mistakes-heading" className="text-[19px] font-black text-ink">
                Sık yapılan hatalar
              </h2>
            </div>
            <ul className="mt-3 space-y-3">
              {topic.mistakes.map((m) => (
                <li key={m.wrong} className="card-3d rounded-[20px] p-3.5">
                  <p className="flex items-start gap-2.5 rounded-xl bg-berry-soft px-3 py-2 text-[16px] font-bold leading-snug text-berry-ink">
                    <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-berry text-[13px] font-black text-white">
                      ✗
                    </span>
                    <span>
                      <span className="sr-only">Yanlış: </span>
                      <Rich text={m.wrong} />
                    </span>
                  </p>
                  <p className="mt-2 flex items-start gap-2.5 rounded-xl bg-grass-soft px-3 py-2 text-[16px] font-black leading-snug text-grass-ink">
                    <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-grass text-[13px] font-black text-white">
                      ✓
                    </span>
                    <span>
                      <span className="sr-only">Doğru: </span>
                      <Rich text={m.right} />
                    </span>
                  </p>
                  <p className="mt-2 px-1 text-[14px] font-semibold leading-snug text-graphite">
                    <Rich text={m.why} />
                  </p>
                </li>
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
      </main>
      <AppTabs />
    </div>
  );
}

export default GrammarTopic;
