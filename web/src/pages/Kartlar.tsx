import { Link } from "react-router-dom";
import Header from "../components/Header";
import AppTabs from "../components/AppTabs";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import Mascot from "../components/Mascot";
import { BookIcon } from "../components/icons";
import { usePersonalCards, usePersonalDeck } from "../lib/personal";
import { primeSpeech } from "../lib/speech";
import { hasStarted, isDue } from "../lib/path";
import { cardMinutes, usePlan, type DailyPlan } from "../lib/plan";
import { byNextReview, dueInDays } from "../lib/memory";
import { learnerDayStart } from "../lib/day";
import { dayName, greeting, howLong, inWords, todayPieces, type Piece } from "../lib/talk";
import { tintStyle } from "../lib/tint";
import type { Card } from "../types";

/** Entrance delays vanish under reduced motion: the keyframes already collapse, the delays would not. */
const delay = (ms: number) => ({ animationDelay: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "0ms" : `${ms}ms` });

/** The word on the top card, as big as its width allows (a black letter is about 0.58em wide). */
const wordSize = (word: string) => `min(46px, ${(100 / (0.6 * Math.max(word.length, 1))).toFixed(1)}cqw)`;

/** The weekday a few learner days from now (0 = Sunday), read at noon so the hour never tips it. */
const weekdayIn = (days: number) => new Date(learnerDayStart(Date.now(), days) + 12 * 3_600_000).getDay();

const BUTTON = "face flex min-h-[58px] w-full items-center justify-center rounded-2xl text-[18px] font-black text-white shadow-button press-3d focus-visible:outline-none focus-visible:ring-4";

/** Today's cards in the order the round meets them: the new words, then the reviews soonest due. */
function todaysCards(cards: Card[], plan: DailyPlan): { fresh: Card[]; reviews: Card[] } {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const fresh = plan.newIds.map((id) => byId.get(id)).filter((card): card is Card => card !== undefined);
  return { fresh, reviews: byNextReview(cards.filter((card) => hasStarted(card) && isDue(card))) };
}

/** A sentence with its English words in their own colours. */
function Said({ pieces, cards }: { pieces: Piece[]; cards: Card[] }) {
  const byFront = new Map(cards.map((card) => [card.front, card]));
  return (
    <>
      {pieces.map((piece, i) => {
        const card = piece.word ? byFront.get(piece.text) : undefined;
        return card ? (
          <span key={i} style={tintStyle(card)} className="text-(--tint-ink)">
            {piece.text}
          </span>
        ) : (
          <span key={i}>{piece.text}</span>
        );
      })}
    </>
  );
}

/** The day's cards as a real pile: the first word on top in its own colour, two more fanned out behind it. A tap starts the round. */
function Pile({ cards, to }: { cards: Card[]; to: string }) {
  const [top, ...behind] = cards;
  return (
    <Link to={to} onClick={primeSpeech} aria-label="Başlayalım" className="group relative mx-auto mt-8 block aspect-[4/5] w-[min(56vw,230px)] animate-rise-spring focus-visible:outline-none">
      {behind
        .slice(0, 2)
        .reverse()
        .map((card, i, all) => (
          <span
            key={card.id}
            aria-hidden="true"
            style={tintStyle(card)}
            className={`absolute inset-0 rounded-[26px] cover-ground opacity-90 shadow-[0_6px_0_0_rgba(0,0,0,0.08)] transition-transform duration-300 ${
              i === all.length - 1 ? "-translate-x-6 -rotate-[8deg] group-hover:-rotate-[11deg]" : "translate-x-6 rotate-[7deg] group-hover:rotate-[10deg]"
            }`}
          />
        ))}
      <span style={tintStyle(top)} className="@container absolute inset-0 flex items-center justify-center rounded-[26px] cover-ground p-4 text-white shadow-[0_8px_0_0_rgba(0,0,0,0.12)] transition-transform duration-150 group-active:scale-[0.97]">
        <span className="text-center font-black leading-[0.95] tracking-[-0.02em] [text-shadow:0_3px_0_rgba(0,0,0,0.14)] wrap-break-word" style={{ fontSize: wordSize(top.front) }}>
          {top.front}
        </span>
      </span>
    </Link>
  );
}

/**
 * Önümüzdeki günler: which words come back on which day, by name, so the
 * learner sees the rhythm without counting bars.
 */
function Upcoming({ cards, newTomorrow }: { cards: Card[]; newTomorrow: number }) {
  const met = cards.filter(hasStarted);
  const rows: { label: string; words: Card[]; extra: string | null }[] = [];
  for (let day = 1; day <= 7 && rows.length < 4; day++) {
    const words = met.filter((card) => dueInDays(card) === day);
    const fresh = day === 1 ? newTomorrow : 0;
    if (words.length === 0 && fresh === 0) continue;
    rows.push({ label: dayName(day, weekdayIn(day)), words, extra: fresh > 0 ? `${words.length > 0 ? "+ " : ""}${inWords(fresh)} yeni kelime` : null });
  }
  const shownDays = new Set(rows.length > 0 ? met.filter((card) => rows.some((row) => row.words.includes(card))).map((card) => card.id) : []);
  const later = met.filter((card) => dueInDays(card) > 0 && !shownDays.has(card.id)).length;
  if (rows.length === 0 && later === 0) return null;
  return (
    <section aria-labelledby="upcoming-heading" className="card-3d mt-10 rounded-[22px] p-4 animate-rise-in" style={delay(240)}>
      <div className="flex items-baseline justify-between">
        <h2 id="upcoming-heading" className="text-[17px] font-black text-ink">
          Önümüzdeki günler
        </h2>
        <Link to="/kelimelerim" viewTransition className="-m-2 p-2 text-[14px] font-extrabold text-ocean-ink">
          Kelimeler →
        </Link>
      </div>
      <ul className="mt-3 divide-y-2 divide-paper-deep">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-3 py-2.5">
            <span className="w-24 shrink-0 pt-0.5 text-[15px] font-black text-ink">{row.label}</span>
            <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {row.words.slice(0, 4).map((card) => (
                <span key={card.id} style={tintStyle(card)} className="rounded-full bg-(--tint-soft) px-2.5 py-0.5 text-[14px] font-black text-(--tint-ink)">
                  {card.front}
                </span>
              ))}
              {row.words.length > 4 && <span className="py-0.5 text-[14px] font-bold text-graphite">+{row.words.length - 4}</span>}
              {row.extra && <span className="py-0.5 text-[14px] font-bold text-graphite">{row.extra}</span>}
            </span>
          </li>
        ))}
        {later > 0 && (
          <li className="flex items-start gap-3 py-2.5">
            <span className="w-24 shrink-0 text-[15px] font-black text-ink">Daha sonra</span>
            <span className="text-[14px] font-bold text-graphite">{inWords(later)} kelime</span>
          </li>
        )}
      </ul>
      <p className="mt-2 text-[14px] font-semibold leading-snug text-graphite">Bildiğin kelime her seferinde biraz daha geç gelir; bilemediğin ertesi gün yine gelir.</p>
    </section>
  );
}

/** What tomorrow brings, said plainly, for the evening when today is done. */
function tomorrowPieces(cards: Card[], newTomorrow: number): Piece[] {
  const met = cards.filter(hasStarted);
  const back = met.filter((card) => dueInDays(card) === 1).map((card) => card.front);
  const named = (words: string[]): Piece[] =>
    words.flatMap((word, i) => [...(i === 0 ? [] : [{ text: i === words.length - 1 ? " ve " : ", " }]), { text: word, word: true }]);
  if (back.length > 0) {
    const pieces: Piece[] = [{ text: "Yarın " }, ...(back.length <= 3 ? named(back) : [{ text: `${inWords(back.length)} kelime` }]), { text: " tekrar gelecek" }];
    return [...pieces, { text: newTomorrow > 0 ? `, bir de ${inWords(newTomorrow)} yeni kelime var.` : "." }];
  }
  if (newTomorrow > 0) return [{ text: `Yarın ${inWords(newTomorrow)} yeni kelimeyle tanışacaksın.` }];
  const next = met.map(dueInDays).filter((d) => d > 1).sort((a, b) => a - b)[0];
  if (next !== undefined) return [{ text: `Sıradaki tekrar ${next <= 7 ? `${dayName(next, weekdayIn(next))} günü` : `${inWords(next)} gün sonra`}.` }];
  return [{ text: "Şimdilik bekleyen bir şey yok." }];
}

/**
 * Kartlar, the way in: a greeting, today in one plain sentence with the
 * words named, the pile and one button; when the day is done, what
 * tomorrow brings. Then the coming days, word by word.
 */
function Kartlar() {
  const deckQuery = usePersonalDeck();
  const cardsQuery = usePersonalCards(deckQuery.data);
  const planQuery = usePlan(deckQuery.data);
  const deck = deckQuery.data;
  const cards = cardsQuery.data;
  const plan = planQuery.data;
  const hello = greeting(new Date().getHours());

  if (deckQuery.isError || cardsQuery.isError || planQuery.isError) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
          <ErrorState
            title="Kartların yüklenemedi"
            message="Bağlantını kontrol edip tekrar dene."
            onRetry={() => {
              void deckQuery.refetch();
              void cardsQuery.refetch();
              void planQuery.refetch();
            }}
          />
        </main>
        <AppTabs />
      </div>
    );
  }

  const today = cards && plan ? todaysCards(cards, plan) : { fresh: [], reviews: [] };
  const count = plan ? plan.reviewsDue + plan.newIds.length : 0;
  const anyMet = cards?.some(hasStarted) ?? false;
  const newTomorrow = plan?.tomorrow.new ?? 0;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-6">
        {!deck || !cards || !plan ? (
          <>
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="mt-3 h-16 w-full rounded-xl" />
            <Skeleton className="mx-auto mt-8 aspect-[4/5] w-[min(56vw,230px)] rounded-[26px]" />
            <Skeleton className="mt-8 h-[58px] w-full rounded-2xl" />
          </>
        ) : cards.length === 0 ? (
          // No words at all: a fresh start, the new ones not added yet.
          <section className="animate-rise-in">
            <p className="text-[16px] font-bold text-graphite">{hello}</p>
            <h1 className="mt-1 text-[28px] font-black leading-[1.2] text-ink">Kelimeler yolda.</h1>
            <p className="mt-2 text-[16px] font-semibold leading-snug text-graphite">Yeni kelimeler eklenince burada seni bekleyecek. Bu arada gramere göz atabilirsin.</p>
            <Mascot mood="think" size={120} className="mx-auto mt-8 block" />
            <Link to="/gramer" className={`${BUTTON} mt-8 gap-2 bg-ocean focus-visible:ring-ocean/40`}>
              <BookIcon className="h-5 w-5" />
              Gramere göz at
            </Link>
          </section>
        ) : count > 0 ? (
          <>
            <section className="animate-rise-in">
              <p className="text-[16px] font-bold text-graphite">{hello}</p>
              <h1 className="mt-1 text-[28px] font-black leading-[1.2] tracking-[-0.01em] text-ink">
                <Said pieces={todayPieces(today.reviews.map((c) => c.front), today.fresh.map((c) => c.front))} cards={cards} />
              </h1>
              <p className="mt-2 text-[15px] font-semibold text-graphite">
                {howLong(cardMinutes(plan.reviewsDue, plan.newIds.length))}
                {plan.paused && " Yeni kelimeler, tekrarlar biraz azalınca gelecek."}
              </p>
            </section>
            <Pile cards={[...today.fresh, ...today.reviews]} to="/tur" />
            <Link to="/tur" onClick={primeSpeech} style={delay(160)} className={`${BUTTON} mt-9 bg-grass animate-rise-in focus-visible:ring-grass/40`}>
              Başlayalım
            </Link>
            <Upcoming cards={cards} newTomorrow={newTomorrow} />
          </>
        ) : (
          <>
            <section className="animate-rise-in">
              <p className="text-[16px] font-bold text-graphite">{hello}</p>
              <h1 className="mt-1 text-[28px] font-black leading-[1.2] text-ink">{anyMet ? "Bugünlük bu kadar." : "Bugün yeni kelime yok."}</h1>
              <p className="mt-2 text-[17px] font-bold leading-snug text-ink">
                <Said pieces={tomorrowPieces(cards, newTomorrow)} cards={cards} />
              </p>
            </section>
            <Mascot mood="happy" size={120} className="mx-auto mt-8 block" />
            {anyMet && (
              <Link
                to="/tur?serbest=1"
                onClick={primeSpeech}
                className="mt-8 flex min-h-[54px] w-full items-center justify-center rounded-2xl border-2 border-rule bg-white text-[16px] font-black text-ocean-ink shadow-[0_2px_0_0_var(--color-rule)] press focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
              >
                Bildiklerine bir göz at
              </Link>
            )}
            <Upcoming cards={cards} newTomorrow={newTomorrow} />
          </>
        )}
      </main>
      <AppTabs />
    </div>
  );
}

export default Kartlar;
