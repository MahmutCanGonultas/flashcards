import { useDeferredValue, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import TontonLine from "../components/TontonLine";
import PersonalCardSheet from "../components/PersonalCardSheet";
import { WordRow } from "../components/WordList";
import { PlusIcon, SearchIcon, XIcon } from "../components/icons";
import { usePersonalCards, usePersonalDeck } from "../lib/personal";
import { FILTERS, SORTS, browse, filterCounts, groupCards, matchRanges, type Filter, type Sort } from "../lib/wordBrowser";

/** Rows shown before "Daha fazla göster": a phone screen and a half. */
const PAGE = 40;

const isFilter = (v: string | null): v is Filter => FILTERS.some((f) => f.key === v);
const isSort = (v: string | null): v is Sort => SORTS.some((s) => s.key === v);

/** The query's letters picked out in yellow, wherever they sit in the text. */
function highlighter(query: string) {
  if (!query.trim()) return undefined;
  return (text: string): ReactNode => {
    const ranges = matchRanges(text, query);
    if (ranges.length === 0) return text;
    const out: ReactNode[] = [];
    let at = 0;
    ranges.forEach(([start, end], i) => {
      if (start > at) out.push(text.slice(at, start));
      out.push(
        <mark key={i} className="rounded-[4px] bg-sunny-soft px-px text-ink">
          {text.slice(start, end)}
        </mark>,
      );
      at = end;
    });
    if (at < text.length) out.push(text.slice(at));
    return out;
  };
}

/**
 * Kelimelerim — every word the learner has added, made to hold hundreds:
 * search over everything a card says, a filter per stage with its count,
 * three orders with headings, and the list cut into pages. The choices
 * live in the address, so coming back from a word keeps them.
 */
function Kelimelerim() {
  const [params, setParams] = useSearchParams();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const deck = deckQuery.data;
  const cards = cardsQuery.data;

  const query = params.get("q") ?? "";
  const filter: Filter = isFilter(params.get("f")) ? (params.get("f") as Filter) : "all";
  const sort: Sort = isSort(params.get("s")) ? (params.get("s") as Sort) : "next";
  // Typing stays instant; the list catches up a frame later.
  const deferredQuery = useDeferredValue(query);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "" || (key === "f" && value === "all") || (key === "s" && value === "next")) next.delete(key);
      else next.set(key, value);
    }
    setLimit(PAGE);
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => (cards ? filterCounts(cards) : null), [cards]);
  const results = useMemo(() => (cards ? browse(cards, { query: deferredQuery, filter, sort }) : []), [cards, deferredQuery, filter, sort]);
  const shown = results.slice(0, limit);
  const groups = groupCards(shown, sort);
  // A heading counts its whole group, not just the rows shown so far.
  const totals = useMemo(() => new Map(groupCards(results, sort).map((g) => [g.key, g.cards.length])), [results, sort]);
  const mark = highlighter(deferredQuery);
  const due = counts?.due ?? 0;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        <Link to="/kartlar" viewTransition className="-m-2 inline-block p-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
          ← Kartlarım
        </Link>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[32px] font-black leading-[1.05] tracking-[-0.02em] text-ink">Kelimelerim</h1>
            <p className="mt-1 text-[15px] font-bold text-graphite">
              {!cards ? "Yükleniyor…" : `${cards.length} kelime${due > 0 ? ` · ${due} tekrar bekliyor` : ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => deck && setIsAddOpen(true)}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border-2 border-rule bg-white px-3.5 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
          >
            <PlusIcon className="h-4 w-4" />
            Ekle
          </button>
        </div>

        {/* Search: the English, the Turkish, a sentence, a chunk — all of it. */}
        <div className="relative mt-5">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-hare" />
          <label htmlFor="word-search" className="sr-only">
            Kelimelerinde ara
          </label>
          <input
            id="word-search"
            type="search"
            value={query}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Kelime, anlam ya da cümle ara"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="w-full rounded-2xl border-2 border-rule bg-paper-deep py-3.5 pl-12 pr-12 text-[17px] font-bold text-ink outline-none transition-colors placeholder:font-semibold placeholder:text-hare focus:border-ocean focus:bg-white [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Aramayı temizle"
              onClick={() => update({ q: null })}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-hare hover:text-graphite"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters: one per stage, each with its count; the row scrolls sideways on a phone. */}
        <div className="-mx-5 mt-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div role="group" aria-label="Süz" className="flex w-max gap-2 pb-1">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = counts?.[f.key] ?? 0;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ f: f.key })}
                  className={`flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3.5 text-[14px] font-extrabold transition-colors ${
                    active ? "border-ocean bg-ocean-soft text-ocean-ink" : count === 0 ? "border-rule bg-white text-hare" : "border-rule bg-white text-graphite hover:bg-paper-deep"
                  }`}
                >
                  {f.label}
                  <span className={`min-w-5 rounded-full px-1.5 text-center text-[12px] font-black tabular-nums ${active ? "bg-ocean text-white" : "bg-paper-deep text-graphite"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order. */}
        <div role="radiogroup" aria-label="Sırala" className="mt-3 grid grid-cols-3 rounded-2xl border-2 border-rule bg-paper-deep p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={sort === s.key}
              onClick={() => update({ s: s.key })}
              className={`min-h-9 rounded-xl text-[13px] font-extrabold transition-colors ${sort === s.key ? "bg-white text-ink shadow-[0_2px_0_0_var(--color-rule)]" : "text-graphite hover:text-ink"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {deckQuery.isError || cardsQuery.isError ? (
          <div className="mt-8">
            <ErrorState
              title="Kelimelerin yüklenemedi"
              message="Bağlantını kontrol edip tekrar dene."
              onRetry={() => {
                void deckQuery.refetch();
                void cardsQuery.refetch();
              }}
            />
          </div>
        ) : !deck || !cards ? (
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <TontonLine className="mt-8" size={60}>
            Henüz kelimen yok. Dizide, sokakta, toplantıda duyduğun ilk kelimeyi ekle; gerisini ben ayarlarım.
          </TontonLine>
        ) : results.length === 0 ? (
          <div className="mt-8">
            <TontonLine size={60} mood="think">
              {query.trim() ? `“${query.trim()}” için bir şey bulamadım.` : "Bu süzgeçte şu an kelime yok."} Başka türlü aramayı dene.
            </TontonLine>
            <button
              type="button"
              onClick={() => update({ q: null, f: null })}
              className="mt-4 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink"
            >
              Aramayı temizle
            </button>
          </div>
        ) : (
          <>
            <p className="mt-5 text-[13px] font-bold text-graphite" aria-live="polite">
              {results.length === cards.length ? `${results.length} kelimenin hepsi` : `${results.length} kelime bulundu`}
            </p>
            {groups.map((group) => (
              <section key={group.key} aria-label={group.label} className="mt-3">
                <h2 className="sticky top-[calc(4rem+2px+env(safe-area-inset-top))] z-[5] -mx-5 flex items-baseline justify-between bg-white px-5 py-2 text-[13px] font-black uppercase tracking-[0.1em] text-graphite">
                  <span>{group.label}</span>
                  <span className="tabular-nums">{totals.get(group.key) ?? group.cards.length}</span>
                </h2>
                <ul className="divide-y-2 divide-paper-deep">
                  {group.cards.map((card) => (
                    <li key={card.id}>
                      <WordRow deckId={deck.id} card={card} mark={mark} query={deferredQuery} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {results.length > shown.length && (
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="mt-5 flex min-h-[50px] w-full items-center justify-center rounded-2xl border-2 border-rule bg-white text-[14px] font-black uppercase tracking-[0.08em] text-ocean-ink shadow-edge press"
              >
                Daha fazla göster · {results.length - shown.length}
              </button>
            )}
          </>
        )}
      </main>

      <PersonalCardSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} deckId={deck?.id} />
      <AppTabs />
    </div>
  );
}

export default Kelimelerim;
