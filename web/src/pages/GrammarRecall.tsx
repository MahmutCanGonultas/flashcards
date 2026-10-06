import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import Rich from "../components/Rich";
import SpeakButton from "../components/SpeakButton";
import { ChevronDownIcon } from "../components/icons";
import { CATALOG, LEVELS } from "../content/grammar/catalog";
import { RECALL } from "../content/grammar/recall";
import type { Recall, TopicMeta } from "../content/grammar/types";
import { familyStyle } from "../lib/palette";
import { plain } from "../lib/rich";
import { markDone } from "../lib/dailyDone";

/** One topic's card opened: the rules to keep, the examples that show them, the one trap. */
function RecallBody({ topic, recall }: { topic: TopicMeta; recall: Recall }) {
  return (
    <div className="animate-rise-in px-4 pb-4">
      <ol className="space-y-2">
        {recall.points.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[15px] font-bold leading-snug text-ink">
            <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-(--c) text-[11px] font-black text-white">
              {i + 1}
            </span>
            <span className="min-w-0">
              <Rich text={point} />
            </span>
          </li>
        ))}
      </ol>
      <ul className="mt-3.5 space-y-2">
        {recall.examples.map((example, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-2xl bg-(--c-soft) px-3.5 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold leading-snug text-ink">
                <Rich text={example.en} />
              </span>
              <span className="mt-0.5 block text-[13px] font-semibold leading-snug text-graphite">
                <Rich text={example.tr} />
              </span>
            </span>
            <SpeakButton text={plain(example.en)} size="sm" />
          </li>
        ))}
      </ul>
      {recall.trap && (
        <div className="mt-3.5 grid gap-1.5 text-[15px] font-bold leading-snug">
          <p className="rounded-2xl bg-berry-soft px-3.5 py-2 text-ink">
            <span className="mr-1.5 font-black text-berry-ink">✗</span>
            <Rich text={recall.trap.wrong} />
          </p>
          <p className="rounded-2xl bg-grass-soft px-3.5 py-2 text-ink">
            <span className="mr-1.5 font-black text-grass-ink">✓</span>
            <Rich text={recall.trap.right} />
          </p>
        </div>
      )}
      <Link to={`/gramer/${topic.slug}`} viewTransition className="mt-3.5 inline-block text-[13px] font-black uppercase tracking-[0.08em] text-(--c-ink)">
        Konunun tamamı →
      </Link>
    </div>
  );
}

/**
 * Hatırla — grammar as something to glance at: every topic as a coloured
 * card that opens to the few rules worth keeping, the examples that show
 * them and the one trap. ?konu=slug opens that one (today's reminder).
 */
function GrammarRecall() {
  const [params] = useSearchParams();
  const asked = params.get("konu");
  const [open, setOpen] = useState<string | null>(asked);

  useEffect(() => {
    // Looking at a reminder is the day's grammar step done.
    markDone("grammar");
    if (asked) document.getElementById(`hatirla-${asked}`)?.scrollIntoView({ block: "start" });
  }, [asked]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        <Link to="/gramer" viewTransition className="-m-2 inline-block p-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
          ← Gramer
        </Link>
        <h1 className="mt-2 text-[32px] font-black leading-[1.05] tracking-[-0.02em] text-ink">Hatırla</h1>
        <p className="mt-1 text-[15px] font-bold text-graphite">Her konudan akılda kalması gerekenler. Dokun, aç, bak.</p>

        {LEVELS.map((level) => {
          const topics = CATALOG.filter((topic) => topic.level === level.key && RECALL[topic.slug]);
          if (topics.length === 0) return null;
          return (
            <section key={level.key} style={familyStyle(level.tone)} className="mt-7" aria-labelledby={`level-${level.key}`}>
              <h2 id={`level-${level.key}`} className="flex items-baseline gap-2 text-[13px] font-black uppercase tracking-[0.12em] text-(--c-ink)">
                {/* English upper-cased by English rules: BEGINNER, not BEGİNNER. */}
                <span lang="en">{level.title}</span>
                <span className="font-bold normal-case tracking-normal text-graphite">{level.titleTr}</span>
              </h2>
              <ul className="mt-2.5 space-y-2.5">
                {topics.map((topic) => {
                  const isOpen = open === topic.slug;
                  return (
                    <li key={topic.slug} id={`hatirla-${topic.slug}`} className={`scroll-mt-20 overflow-hidden rounded-[20px] border-2 bg-white ${isOpen ? "border-(--c) shadow-[0_3px_0_0_var(--c)]" : "border-rule shadow-[0_2px_0_0_var(--color-rule)]"}`}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? null : topic.slug)}
                        className="flex w-full items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
                      >
                        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-(--c-soft) text-[22px]">
                          {topic.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-black leading-tight text-ink">{topic.title}</span>
                          <span className="mt-0.5 block text-[13px] font-bold text-graphite">{topic.titleTr}</span>
                        </span>
                        <ChevronDownIcon className={`h-5 w-5 shrink-0 text-(--c-ink) transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && <RecallBody topic={topic} recall={RECALL[topic.slug]} />}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </main>
      <AppTabs />
    </div>
  );
}

export default GrammarRecall;
