import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import TontonSays from "../components/TontonSays";
import ReminderCard from "../components/ReminderCard";
import PersonalCardSheet from "../components/PersonalCardSheet";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import { usePersonalCards, usePersonalDeck } from "../lib/personal";
import { useStreak } from "../lib/streak";
import { homeLines } from "../lib/tonton";
import { primeSpeech } from "../lib/speech";
import { isDue } from "../lib/path";
import { parseBack, posLabel } from "../lib/cardBack";
import type { Card } from "../types";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The dateline: today, the streak, and seven ticks — lit where the run covers them. */
function Dateline() {
  const { data } = useStreak();
  const streak = data?.streak ?? 0;
  const last = data?.lastStudyDate ?? null;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const lastIndex = last ? days.findIndex((d) => localISO(d) === last) : -1;
  const lit = (i: number) => lastIndex !== -1 && i <= lastIndex && lastIndex - i < streak;
  return (
    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
      <span>
        {DAY_LABELS[today.getDay()]}, {today.getDate()} {MONTHS[today.getMonth()]} · seri {streak} gün
      </span>
      <ol className="flex gap-[5px]" aria-label="Son yedi gün">
        {days.map((d, i) => (
          <li
            key={i}
            aria-label={`${DAY_LABELS[d.getDay()]}${lit(i) ? ", çalışıldı" : ""}`}
            className={`h-[7px] w-[7px] rounded-full ${lit(i) ? "bg-ink" : i === 6 ? "bg-transparent ring-[1.5px] ring-inset ring-accent" : "bg-ink/15"}`}
          />
        ))}
      </ol>
    </div>
  );
}

/** The newsstand: the cards that are waiting, as three covers. */
function Newsstand({ cards }: { cards: Card[] }) {
  const due = cards.filter(isDue);
  const shown = (due.length > 0 ? [...due, ...cards.filter((c) => !isDue(c))] : [...cards].sort((a, b) => b.id - a.id)).slice(0, 3);
  const extra = due.length - 3;
  return (
    <div className="mt-5 grid grid-cols-3 gap-2">
      {shown.map((card, i) => {
        const { emoji } = parseBack(card.back);
        return (
          <div
            key={card.id}
            className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink shadow-[0_10px_24px_-14px_rgba(27,24,21,0.6)] animate-[node-in_360ms_ease-out_both]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {card.image_url ? (
              <div className="absolute inset-0 flex items-start justify-center">
                <img src={card.image_url} alt="" className="h-auto max-h-full min-h-[62%] w-full object-cover object-center" />
              </div>
            ) : (
              <span aria-hidden="true" className="absolute inset-x-0 top-6 text-center text-4xl">
                {emoji ?? "🃏"}
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent px-2.5 pb-2 pt-6 text-[12px] font-black leading-tight text-paper">
              {card.front}
            </span>
            {i === 2 && extra > 0 && (
              <span className="absolute inset-0 grid place-items-center bg-ink/55 text-[22px] font-black text-paper">+{extra}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** When this card next comes back, for the contents list. */
function scheduleLabel(card: Card): { text: string; due: boolean } {
  if (isDue(card)) return { text: card.repetitions === 0 ? "Yeni" : "Tekrar", due: true };
  const days = Math.ceil((new Date(card.due_date).getTime() - Date.now()) / 86_400_000);
  return { text: days <= 1 ? "Yarın" : `${days} gün`, due: false };
}

/**
 * Kartlarım — the front page of the printed half. A dateline, a headline
 * saying what's waiting, the covers on the newsstand, one ink button,
 * Tonton's column, and the contents: every word, one line each.
 */
function Kartlar() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const streak = useStreak().data?.streak ?? 0;
  const cards = cardsQuery.data;
  const deck = deckQuery.data;
  const total = cards?.length ?? 0;
  const due = cards ? cards.filter(isDue).length : 0;
  const sorted = cards ? [...cards].sort((a, b) => Number(isDue(b)) - Number(isDue(a)) || b.id - a.id) : [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-6 pb-28 pt-7">
        <Dateline />

        <h1 className="mt-3.5 max-w-[280px] text-[34px] font-black leading-[1.02] tracking-[-0.02em] text-ink">
          {!cards ? "Kartların" : total === 0 ? "Henüz kart yok" : due > 0 ? `${due} kart seni bekliyor` : "Bugünlük tamam"}
        </h1>
        <p className="mt-2 text-[15px] font-semibold leading-[1.45] text-graphite">
          {!cards
            ? "Kelimelerin yükleniyor."
            : total === 0
              ? "İlk kelimeni ekle; ne zaman soracağımı ben ayarlarım."
              : due > 0
                ? `Toplam ${total} kelime. Ne kadar iyi bilirsen o kadar seyrek gelir.`
                : `Toplam ${total} kelime. Sıradakiler yarından itibaren.`}
        </p>

        {cards && total > 0 && <Newsstand cards={cards} />}

        <div className="mt-4 flex items-center gap-3.5">
          {deck && total > 0 && (
            <Link
              to={`/decks/${deck.id}/flashcards${due > 0 ? "" : "?mode=all"}`}
              onClick={primeSpeech}
              className="flex min-h-[54px] flex-1 items-center justify-center rounded-2xl bg-ink text-[13px] font-black uppercase tracking-[0.12em] text-paper transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
            >
              {due > 0 ? `Tekrar et · ${due}` : "Hepsini gözden geçir"}
            </Link>
          )}
          <button
            type="button"
            onClick={() => deck && setIsAddOpen(true)}
            className={`text-[13px] font-extrabold text-ink underline decoration-accent/60 underline-offset-4 ${total === 0 ? "flex min-h-[54px] flex-1 items-center justify-center rounded-2xl bg-ink text-paper no-underline uppercase tracking-[0.12em]" : ""}`}
          >
            + Kelime ekle
          </button>
        </div>

        <TontonSays variant="column" size={60} className="mt-8" lines={homeLines({ cards: [], due: 0, streak, personal: cards ?? [] })} />

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
          <div className="mt-9 space-y-3">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          total > 0 && (
            <section className="mt-9">
              <div className="flex items-baseline justify-between border-b border-ink pb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink">
                <span>Kelimeler</span>
                <span className="text-graphite">{total}</span>
              </div>
              <ul className="divide-y divide-ink/10">
                {sorted.map((card) => {
                  const { pos, text, emoji } = parseBack(card.back);
                  const schedule = scheduleLabel(card);
                  return (
                    <li key={card.id}>
                      <Link
                        to={`/decks/${deck.id}/words/${card.id}`}
                        className="grid grid-cols-[56px_1fr_auto] items-center gap-3.5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                      >
                        {card.image_url ? (
                          <img src={card.image_url} alt="" className="h-14 w-14 rounded-lg bg-ink object-cover" />
                        ) : (
                          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink/5 text-2xl">
                            {emoji ?? "🃏"}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-[17px] font-extrabold leading-tight text-ink">
                            {card.front}
                            {pos && <span className="ml-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-graphite">{posLabel(pos)}</span>}
                          </p>
                          <p className="mt-0.5 truncate text-[14px] text-graphite">{text}</p>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-[0.14em] tabular-nums ${schedule.due ? "text-accent" : "text-graphite"}`}>
                          {schedule.text}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )
        )}

        <div className="mt-7">
          <ReminderCard variant="line" />
        </div>
      </main>

      <PersonalCardSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} deckId={deck?.id} />
      <AppTabs />
    </div>
  );
}

export default Kartlar;
