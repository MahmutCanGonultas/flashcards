import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import TontonSays from "../components/TontonSays";
import ReminderCard from "../components/ReminderCard";
import PersonalCardSheet from "../components/PersonalCardSheet";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import StrengthBars from "../components/StrengthBars";
import WordList from "../components/WordList";
import { useDeckStats, usePersonalCards, usePersonalDeck } from "../lib/personal";
import { useStreak } from "../lib/streak";
import { homeLines } from "../lib/tonton";
import { primeSpeech } from "../lib/speech";
import { isDue } from "../lib/path";
import { STAGES, STAGE_LABEL, byNextReview, forecast, stageCounts, stageOf } from "../lib/memory";
import { STAGE_BG } from "../lib/stageStyle";
import { tintStyle } from "../lib/tint";
import type { Card } from "../types";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/**
 * The page composes itself once per app session — dateline, headline,
 * covers, column, one after another. Coming back from a word or a session
 * it's simply there; a front page that re-animates every visit is a tic.
 */
let composed = false;

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

const KICKER = "text-[11px] font-extrabold uppercase tracking-[0.18em]";

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
    <div className={`flex items-center justify-between ${KICKER} text-graphite`}>
      <span>
        {DAY_LABELS[today.getDay()]}, {today.getDate()} {MONTHS[today.getMonth()]} · seri {streak} gün
      </span>
      <ol className="flex gap-[5px]" aria-label="Son yedi gün">
        {days.map((d, i) => (
          <li
            key={i}
            aria-label={`${DAY_LABELS[d.getDay()]}${lit(i) ? ", çalışıldı" : ""}`}
            className={`h-[7px] w-[7px] rounded-full ${i === 6 ? "bg-ink ring-[1.5px] ring-inset ring-accent" : lit(i) ? "bg-ink" : "bg-rule"}`}
          />
        ))}
      </ol>
    </div>
  );
}

/**
 * The next three up, as covers in their own colours: the word set large,
 * its initial huge and faint behind it, its strength in the corner. Only
 * the English shows — the meaning is what the session will ask.
 */
function Covers({ cards, animate }: { cards: Card[]; animate: boolean }) {
  const shown = byNextReview(cards).slice(0, 3);
  const extra = cards.filter(isDue).length - 3;
  return (
    <div className="mt-5 grid grid-cols-3 gap-2">
      {shown.map((card, i) => (
        <div
          key={card.id}
          style={{ ...tintStyle(card), ...delay(120 + i * 60) }}
          className={`relative isolate flex aspect-[4/5] flex-col overflow-hidden rounded-xl cover-ground p-2.5 text-paper-lift shadow-cover ring-1 ring-inset ring-paper-lift/10 ${
            animate ? "animate-rise-spring" : ""
          }`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[0.2em] -right-[0.04em] -z-10 select-none text-[118px] font-black leading-none tracking-[-0.06em] text-paper-lift/[0.08]"
          >
            {card.front.charAt(0)}
          </span>
          <StrengthBars card={card} onDark className="self-end" />
          <span className="mt-auto text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper-lift/60">{STAGE_LABEL[stageOf(card)]}</span>
          <span className={`mt-0.5 wrap-break-word font-black leading-[1.02] tracking-[-0.01em] ${card.front.length > 9 ? "text-[15px]" : "text-[19px]"}`}>
            {card.front}
          </span>
          {i === 2 && extra > 0 && (
            <span className="absolute inset-0 grid place-items-center bg-ink/55 text-[24px] font-black text-paper-lift">+{extra}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Memory, made visible: how many words sit at each stage, what the next
 * seven days will ask for, and how the last seven went. The schedule is
 * the method; showing it is what makes a short daily session make sense.
 */
function Memory({ cards, stats }: { cards: Card[]; stats: { reviews: number; remembered: number } | undefined }) {
  const counts = stageCounts(cards);
  const total = cards.length;
  const week = forecast(cards);
  const peak = Math.max(1, ...week.map((d) => d.count));
  return (
    <section aria-labelledby="memory-heading" className="mt-9">
      <div className={`flex items-baseline justify-between border-b border-ink pb-2 ${KICKER} text-ink`}>
        <span id="memory-heading">Hafıza</span>
        <span className="text-graphite">{total} kelime</span>
      </div>

      <div className="mt-3.5 flex h-2.5 overflow-hidden rounded-full bg-rule/60" role="img" aria-label={STAGES.map((s) => `${STAGE_LABEL[s]} ${counts[s]}`).join(", ")}>
        {STAGES.map((stage) =>
          counts[stage] > 0 ? (
            <span key={stage} className={`h-full ${STAGE_BG[stage]} animate-rule-draw`} style={{ width: `${(counts[stage] / total) * 100}%` }} />
          ) : null,
        )}
      </div>
      <dl className="mt-3.5 grid grid-cols-4 gap-2">
        {STAGES.map((stage) => (
          <div key={stage} className="min-w-0">
            <span aria-hidden="true" className={`block h-1 w-5 rounded-full ${STAGE_BG[stage]}`} />
            <dt className="mt-2 text-[24px] font-black leading-none tabular-nums text-ink">{counts[stage]}</dt>
            <dd className="mt-1.5 truncate text-[10px] font-extrabold uppercase tracking-[0.08em] text-graphite">{STAGE_LABEL[stage]}</dd>
          </div>
        ))}
      </dl>

      <p className={`mt-6 ${KICKER} text-graphite`}>Önümüzdeki 7 gün</p>
      <ol className="mt-2.5 grid grid-cols-7 gap-1.5" aria-label="Önümüzdeki yedi günün tekrarları">
        {week.map((day) => (
          <li key={day.label} className="flex flex-col items-center gap-1.5" aria-label={`${day.label}: ${day.count} kelime`}>
            <span className={`text-[12px] font-black tabular-nums ${day.count === 0 ? "text-graphite/50" : day.today ? "text-accent" : "text-ink"}`}>{day.count}</span>
            <span className="flex h-12 w-full items-end justify-center">
              <span
                className={`w-full max-w-[26px] rounded-[4px] ${day.count === 0 ? "bg-rule/70" : day.today ? "bg-accent" : "bg-ink/80"}`}
                style={{ height: day.count === 0 ? 3 : `${Math.max(12, (day.count / peak) * 100)}%` }}
              />
            </span>
            <span className={`text-[10px] font-extrabold uppercase tracking-[0.08em] ${day.today ? "text-ink" : "text-graphite"}`}>{day.label}</span>
          </li>
        ))}
      </ol>

      {stats && stats.reviews > 0 && (
        <p className="mt-4 text-[14px] font-semibold leading-snug text-graphite">
          Son 7 gün: <span className="font-extrabold text-ink">{stats.reviews} tekrar</span> ·{" "}
          <span className="font-extrabold text-moss">%{Math.round((stats.remembered / stats.reviews) * 100)} hatırladın</span>
        </p>
      )}
    </section>
  );
}

/**
 * Kartlarım — the front page of the learner's own words. A dateline, a
 * headline saying what's waiting, the next covers, one ink button,
 * Tonton's column, the memory at a glance, and the contents.
 */
function Kartlar() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const statsQuery = useDeckStats(deckQuery.data);
  const streak = useStreak().data?.streak ?? 0;
  const cards = cardsQuery.data;
  const deck = deckQuery.data;
  const total = cards?.length ?? 0;
  const waiting = cards ? cards.filter(isDue) : [];
  const due = waiting.length;
  const fresh = waiting.filter((card) => stageOf(card) === "new").length;

  // Read once, on the first render of this visit; flipped after it.
  const [animate] = useState(() => !composed);
  useEffect(() => {
    composed = true;
  }, []);
  const rise = animate ? "animate-rise-in" : "";
  const at = (ms: number) => (animate ? delay(ms) : undefined);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-6 pb-28 pt-7">
        <div className={rise} style={at(0)}>
          <Dateline />
        </div>

        <h1 className={`mt-3.5 max-w-[300px] text-[34px] font-black leading-[1.02] tracking-[-0.02em] text-ink ${rise}`} style={at(40)}>
          {!cards ? (
            "Kartların"
          ) : total === 0 ? (
            "Henüz kart yok"
          ) : due > 0 ? (
            `${due} kelime seni bekliyor`
          ) : (
            <>
              Bugünlük{" "}
              <span className="relative">
                tamam
                {/* Done for the day: a moss rule drawn under the word. */}
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-0.5 h-[3px] bg-moss animate-rule-draw [animation-delay:260ms]" />
              </span>
            </>
          )}
        </h1>
        <p className={`mt-2 text-[15px] font-semibold leading-[1.45] text-graphite ${rise}`} style={at(80)}>
          {!cards
            ? "Kelimelerin yükleniyor."
            : total === 0
              ? "İlk kelimeni ekle; ne zaman soracağımı ben ayarlarım."
              : due > 0
                ? fresh > 0
                  ? `${fresh} yeni kelimeyle tanışacaksın, ${due - fresh} kelimeyi hatırlayacaksın.`
                  : "Ne kadar iyi bilirsen o kadar seyrek gelir; zorlandıkların sık."
                : "Sıradakiler takvimde. İstersen serbest alıştırma yap; takvim değişmez."}
        </p>

        {cards && total > 0 && <Covers cards={cards} animate={animate} />}

        <div className={`mt-4 flex items-center gap-3.5 ${rise}`} style={at(300)}>
          {deck && total > 0 && (
            <Link
              to={`/decks/${deck.id}/flashcards${due > 0 ? "" : "?mode=all"}`}
              onClick={primeSpeech}
              className="flex min-h-[54px] flex-1 items-center justify-center rounded-2xl bg-ink text-[13px] font-black uppercase tracking-[0.12em] text-paper-lift shadow-button transition-transform duration-100 active:translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
            >
              {due > 0 ? `Tekrar et · ${due}` : "Serbest alıştırma"}
            </Link>
          )}
          <button
            type="button"
            onClick={() => deck && setIsAddOpen(true)}
            className={`text-[13px] font-extrabold text-ink underline decoration-ink decoration-[1.5px] underline-offset-4 ${
              total === 0 ? "flex min-h-[54px] flex-1 items-center justify-center rounded-2xl bg-ink text-paper-lift no-underline uppercase tracking-[0.12em] shadow-button" : ""
            }`}
          >
            + Kelime ekle
          </button>
        </div>

        <div className={`mt-8 ${rise}`} style={at(360)}>
          <TontonSays variant="column" size={60} lines={homeLines({ cards: [], due: 0, streak, personal: cards ?? [] })} />
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
          <div className="mt-9 space-y-3">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          total > 0 && (
            <>
              <Memory cards={cards} stats={statsQuery.data} />
              <section className="mt-9">
                <div className={`flex items-baseline justify-between border-b border-ink pb-2 ${KICKER} text-ink`}>
                  <span>Kelimeler</span>
                  <span className="text-graphite">{total}</span>
                </div>
                {due > 0 && (
                  <p className="mt-2.5 text-[13px] font-semibold leading-snug text-graphite">
                    Sırası gelen kelimelerin anlamı tekrardan sonra açılır — önce hatırlamayı dene.
                  </p>
                )}
                <WordList
                  deckId={deck.id}
                  cards={cards}
                  rowClassName={(i) => (i < 8 ? rise : "")}
                  rowStyle={(i) => (i < 8 ? at(380 + i * 40) : undefined)}
                />
              </section>
            </>
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
