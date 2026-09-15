import { Link } from "react-router-dom";
import type { Card, Deck } from "../types";
import { parseBack } from "../lib/cardBack";
import { isDue } from "../lib/path";
import Button from "./Button";
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
  const recent = cards ? [...cards].sort((a, b) => b.id - a.id).slice(0, 6) : [];
  const next = cards ? nextDueLabel(cards) : null;

  return (
    <section
      aria-labelledby="flashcards-heading"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-600 p-5 text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.6)]"
    >
      {/* A fan of cards in the corner, so the section looks like what it is. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 opacity-25">
        <div className="h-28 w-20 rotate-[18deg] rounded-xl bg-white" />
        <div className="absolute left-3 top-2 h-28 w-20 rotate-[6deg] rounded-xl bg-white" />
      </div>

      <div className="relative">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/70">Kelime kartların</p>
        <h2 id="flashcards-heading" className="mt-1 text-2xl font-extrabold tracking-tight">
          {!cards ? (
            <Skeleton className="h-8 w-40 rounded-full bg-white/30" />
          ) : total === 0 ? (
            "Henüz kart yok"
          ) : due > 0 ? (
            `${due} kart seni bekliyor`
          ) : (
            "Bugünlük tamam ✅"
          )}
        </h2>
        <p className="mt-1 text-sm font-semibold text-white/80">
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

        {recent.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {recent.map((card) => {
              const { emoji } = parseBack(card.back);
              return (
                <li key={card.id} className={`rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${isDue(card) ? "bg-white text-violet-700 ring-white" : "bg-white/15 text-white ring-white/30"}`}>
                  {emoji ? `${emoji} ` : ""}
                  {card.front}
                </li>
              );
            })}
            {total > recent.length && (
              <li className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-extrabold text-white/80 ring-1 ring-white/30">
                +{total - recent.length}
              </li>
            )}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {deck && total > 0 && (
            <LinkButton
              to={`/decks/${deck.id}/flashcards${due > 0 ? "" : "?mode=all"}`}
              className="!bg-none !bg-white !text-violet-700 !shadow-[0_4px_0_0_rgba(0,0,0,0.18)]"
            >
              {due > 0 ? `🃏 Tekrar et (${due})` : "🃏 Hepsini gözden geçir"}
            </LinkButton>
          )}
          <Button variant="secondary" className="!bg-white/15 !text-white !ring-white/40 !shadow-none hover:!bg-white/25" onClick={onAdd}>
            ✍️ Kelime ekle
          </Button>
          {deck && total > 0 && (
            <Link to={`/decks/${deck.id}`} className="self-center text-sm font-bold text-white/80 underline-offset-4 hover:underline sm:ml-auto">
              Tüm kartlar →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default FlashcardsHub;
