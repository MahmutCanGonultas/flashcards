import { useDeferredValue, useMemo, useState } from "react";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import Sheet from "../components/Sheet";
import SpeakButton from "../components/SpeakButton";
import MeaningText from "../components/MeaningText";
import { SearchIcon, XIcon } from "../components/icons";
import { usePersonalCards, usePersonalDeck } from "../lib/personal";
import { hasStarted } from "../lib/path";
import { dueInDays } from "../lib/memory";
import { coreGloss } from "../lib/senses";
import { fold } from "../lib/wordBrowser";
import { LADDER, posText, whenText } from "../lib/round";
import { learnerDayStart } from "../lib/day";
import { tintStyle } from "../lib/tint";
import type { Card } from "../types";

/** The groups the list is cut into, by when the words come back. */
const GROUPS: { key: string; label: string; test: (days: number) => boolean }[] = [
  { key: "today", label: "Bugün", test: (d) => d === 0 },
  { key: "tomorrow", label: "Yarın", test: (d) => d === 1 },
  { key: "week", label: "Bu hafta", test: (d) => d >= 2 && d <= 7 },
  { key: "later", label: "Daha sonra", test: (d) => d > 7 },
];

/** "Bugün", "Yarın", "3 gün", "2 hafta": short enough for the end of a row. */
const shortWhen = (days: number) => (days === 0 ? "Bugün" : whenText(days).replace(" sonra", ""));

/** The weekday and date a word comes back on: "Cuma, 10 Ekim". */
const dateOf = (days: number) =>
  new Date(learnerDayStart(Date.now(), days) + 8 * 3_600_000).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

/** One word: its colour, the word and what it is, its meaning, and when it comes back. */
function Row({ card, onOpen }: { card: Card; onOpen: () => void }) {
  const pos = posText(card);
  const met = hasStarted(card);
  const days = dueInDays(card);
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30">
      <span aria-hidden="true" style={tintStyle(card)} className="h-3 w-3 shrink-0 rounded-full bg-(--tint)" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[17px] font-black text-ink">{card.front}</span>
          {pos && <span className="shrink-0 text-[12px] font-bold text-hare">{pos.split(" · ")[1] ?? pos}</span>}
        </span>
        <span className="mt-0.5 block truncate text-[14px] font-semibold text-graphite">{coreGloss(card)}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-black ${!met ? "bg-paper-deep text-hare" : days === 0 ? "bg-grass-soft text-grass-ink" : "bg-paper-deep text-graphite"}`}>
        {met ? shortWhen(days) : "Sırada"}
      </span>
    </button>
  );
}

/**
 * Where a word is on its way: the gaps 1, 3, 7 days and then weeks, the
 * ones passed in green, the one it is waiting through in blue, and the
 * date it comes back.
 */
function WordSheetBody({ card }: { card: Card }) {
  const pos = posText(card);
  const met = hasStarted(card);
  const days = dueInDays(card);
  const steps = [...LADDER.map((d) => `${d} gün`), "haftalar"];
  // The gap the word is waiting through now: after its first day it is on "1 gün".
  const at = Math.min(Math.max(card.repetitions, 1) - 1, steps.length - 1);
  return (
    <div className="pb-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {pos && <p className="text-[14px] font-bold text-graphite">{pos}</p>}
          <p className="mt-1 wrap-break-word text-[28px] font-black leading-tight text-ink">
            <MeaningText text={coreGloss(card)} />
          </p>
        </div>
        <SpeakButton text={card.front} size="md" />
      </div>

      <div className="mt-5 rounded-2xl bg-paper-deep p-4">
        {met ? (
          <>
            <p className="text-[13px] font-black uppercase tracking-[0.1em] text-graphite">Sonraki tekrar</p>
            <p className="mt-1 text-[20px] font-black text-ink">{days === 0 ? "Bugün" : whenText(days)}</p>
            {days > 0 && <p className="text-[14px] font-bold text-graphite">{dateOf(days)}</p>}
            <ol className="mt-4 flex items-center gap-1" aria-label="Tekrar aralıkları">
              {steps.map((step, i) => {
                const passed = i < at;
                const current = i === at;
                return (
                  <li key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span className={`h-2.5 w-full rounded-full ${passed ? "bg-grass" : current ? "bg-ocean" : "bg-rule"}`} />
                    <span className={`text-[11px] font-black ${passed ? "text-grass-ink" : current ? "text-ocean-ink" : "text-hare"}`}>{step}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-[13px] font-semibold leading-snug text-graphite">
              Her bildiğinde bir basamak ilerler, ara uzar. Bilemezsen yarın tekrar gelir.
              {(card.lapses ?? 0) > 0 && ` Şimdiye kadar ${card.lapses} kez unuttun.`}
            </p>
          </>
        ) : (
          <p className="text-[15px] font-bold text-graphite">Bu kelime sırada. Sırası gelince Kartlar'da yeni kelime olarak çıkacak.</p>
        )}
      </div>
    </div>
  );
}

/**
 * Kelimeler: the words already met, grouped by when they come back, each
 * with its meaning and part of speech. A search finds any word, the ones
 * still waiting in the programme too. A tap shows where the word is on
 * its way and the date it comes back.
 */
function Kelimelerim() {
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const cards = cardsQuery.data;
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const deferred = useDeferredValue(query);

  const met = useMemo(() => (cards ?? []).filter(hasStarted), [cards]);
  const queued = (cards?.length ?? 0) - met.length;
  const found = useMemo(() => {
    const words = fold(deferred.trim()).split(/\s+/).filter(Boolean);
    if (words.length === 0 || !cards) return null;
    return cards.filter((card) => {
      const text = fold(`${card.front} ${coreGloss(card)}`);
      return words.every((w) => text.includes(w));
    });
  }, [cards, deferred]);
  const groups = useMemo(() => {
    const sorted = [...met].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime() || a.front.localeCompare(b.front));
    return GROUPS.map((group) => ({ ...group, cards: sorted.filter((card) => group.test(dueInDays(card))) })).filter((group) => group.cards.length > 0);
  }, [met]);
  const open = cards?.find((card) => card.id === openId) ?? null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">
        <h1 className="text-[32px] font-black leading-[1.05] tracking-[-0.02em] text-ink">Kelimeler</h1>
        <p className="mt-1 text-[15px] font-bold text-graphite">
          {!cards ? "Yükleniyor…" : `${met.length} kelime öğreniyorsun${queued > 0 ? ` · ${queued} sırada` : ""}`}
        </p>

        <div className="relative mt-5">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-hare" />
          <label htmlFor="word-search" className="sr-only">
            Kelime ara
          </label>
          <input
            id="word-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kelime ya da anlam ara"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="w-full rounded-2xl border-2 border-rule bg-paper-deep py-3.5 pl-12 pr-12 text-[17px] font-bold text-ink outline-none transition-colors placeholder:font-semibold placeholder:text-hare focus:border-ocean focus:bg-white [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" aria-label="Aramayı temizle" onClick={() => setQuery("")} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-hare hover:text-graphite">
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {deckQuery.isError || cardsQuery.isError ? (
          <div className="mt-8">
            <ErrorState title="Kelimeler yüklenemedi" message="Bağlantını kontrol edip tekrar dene." onRetry={() => void cardsQuery.refetch()} />
          </div>
        ) : !cards ? (
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : found ? (
          <section aria-label="Arama sonuçları" className="mt-4">
            <p className="text-[13px] font-bold text-graphite" aria-live="polite">
              {found.length === 0 ? "Bir şey bulunamadı." : `${found.length} kelime`}
            </p>
            <ul className="divide-y-2 divide-paper-deep">
              {found.slice(0, 60).map((card) => (
                <li key={card.id}>
                  <Row card={card} onOpen={() => setOpenId(card.id)} />
                </li>
              ))}
            </ul>
          </section>
        ) : met.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-paper-deep p-4 text-[15px] font-bold text-graphite">Henüz hiçbir kelimeyle tanışmadın. İlk kelimeler Kartlar'da seni bekliyor.</p>
        ) : (
          groups.map((group) => (
            <section key={group.key} aria-label={group.label} className="mt-5">
              <h2 className="sticky top-[calc(4rem+2px+env(safe-area-inset-top))] z-[5] -mx-5 flex items-baseline justify-between bg-white px-5 py-2 text-[13px] font-black uppercase tracking-[0.1em] text-graphite">
                <span>{group.label}</span>
                <span className="tabular-nums">{group.cards.length}</span>
              </h2>
              <ul className="divide-y-2 divide-paper-deep">
                {group.cards.map((card) => (
                  <li key={card.id}>
                    <Row card={card} onOpen={() => setOpenId(card.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>

      <Sheet isOpen={open !== null} onClose={() => setOpenId(null)} title={open?.front ?? ""} style={open ? tintStyle(open) : undefined}>
        {open && <WordSheetBody card={open} />}
      </Sheet>
      <AppTabs />
    </div>
  );
}

export default Kelimelerim;
