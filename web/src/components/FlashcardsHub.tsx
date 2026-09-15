import type { Card, Deck } from "../types";
import { isDue } from "../lib/path";
import { parseBack } from "../lib/cardBack";
import Button from "./Button";
import { primeSpeech } from "../lib/speech";
import LinkButton from "./LinkButton";
import Skeleton from "./Skeleton";

type FlashcardsHubProps = {
  deck: Deck | undefined;
  cards: Card[] | undefined;
  onAdd: () => void;
};

/** When the next card comes back, in words. */
function nextDueLabel(cards: Card[]): string | null {
  const future = cards.map((c) => new Date(c.due_date).getTime()).filter((t) => t > Date.now());
  if (future.length === 0) return null;
  const ms = Math.min(...future) - Date.now();
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60_000))} dk sonra`;
  if (hours < 24) return `${Math.round(hours)} saat sonra`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yarın" : `${days} gün sonra`;
}

/**
 * The flashcards part of the home screen: the learner's own words, how many
 * are waiting, and the one button that matters. Independent of the course.
 */
function FlashcardsHub({ deck, cards, onAdd }: FlashcardsHubProps) {
  const total = cards?.length ?? 0;
  const due = cards ? cards.filter(isDue).length : 0;
  const next = cards ? nextDueLabel(cards) : null;

  return (
    <section
      aria-labelledby="flashcards-heading"
      className="relative overflow-hidden rounded-3xl bg-white p-5 text-stone-800 ring-1 ring-stone-200 shadow-[0_10px_30px_-18px_rgba(28,25,23,0.4)]"
    >
      {/* The pile itself, in the corner: the cards that are waiting, fanned
          out with their own pictures. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-3 -top-2 h-32 w-32">
        {(cards && cards.length > 0 ? [...cards].filter(isDue).concat(cards.filter((c) => !isDue(c))).slice(0, 3) : []).map((card, i, list) => {
          const { emoji } = parseBack(card.back);
          const rotate = [-14, 2, 16][i] ?? 0;
          return (
            <div
              key={card.id}
              className="absolute right-6 top-4 h-24 w-[4.5rem] overflow-hidden rounded-xl bg-white shadow-lg ring-2 ring-white"
              style={{ transform: `rotate(${rotate}deg) translateX(${(i - (list.length - 1) / 2) * 14}px)`, zIndex: i, opacity: 0.95 }}
            >
              {card.image_url ? (
                <img src={card.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-violet-100 text-3xl">{emoji ?? "🃏"}</span>
              )}
            </div>
          );
        })}
        {(!cards || cards.length === 0) && (
          <>
            <div className="absolute right-6 top-4 h-24 w-[4.5rem] rotate-[-14deg] rounded-xl bg-stone-100" />
            <div className="absolute right-6 top-4 h-24 w-[4.5rem] rotate-[8deg] rounded-xl bg-stone-200" />
          </>
        )}
      </div>

      <div className="relative pr-28">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Kelime kartların</p>
        <h2 id="flashcards-heading" className="mt-1 text-2xl font-extrabold tracking-tight">
          {!cards ? (
            <Skeleton className="h-8 w-40 rounded-full" />
          ) : total === 0 ? (
            "Henüz kart yok"
          ) : due > 0 ? (
            `${due} kart seni bekliyor`
          ) : (
            "Bugünlük tamam ✅"
          )}
        </h2>
        <p className="mt-1 text-sm font-semibold text-stone-500">
          {!cards
            ? " "
            : total === 0
              ? "İlk kelimeni ekle; hatırlatmayı ben yaparım."
              : due > 0
                ? `Toplam ${total} kelime · ne kadar iyi bilirsen o kadar seyrek gelir.`
                : next
                  ? `Toplam ${total} kelime · sıradaki ${next}.`
                  : `Toplam ${total} kelime.`}
        </p>
      </div>

      <div className="relative">
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {deck && total > 0 && (
            <LinkButton to={`/decks/${deck.id}/flashcards${due > 0 ? "" : "?mode=all"}`} onClick={primeSpeech}>
              {due > 0 ? `🃏 Tekrar et (${due})` : "🃏 Hepsini gözden geçir"}
            </LinkButton>
          )}
          <Button variant="secondary" onClick={onAdd}>
            ✍️ Kelime ekle
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FlashcardsHub;
