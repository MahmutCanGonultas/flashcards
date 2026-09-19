import { Link } from "react-router-dom";
import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { isDue } from "../lib/path";
import Button from "./Button";
import LinkButton from "./LinkButton";
import { primeSpeech } from "../lib/speech";

type PersonalDeckViewProps = {
  deckId: string;
  cards: Card[];
  onAdd: () => void;
  /** The review/add buttons; off where a hub above already has them. */
  showActions?: boolean;
};

/**
 * When the word comes back, in the three inks that mean something: vermilion
 * for now, gilt for tomorrow, moss for safely later.
 */
function scheduleLabel(card: Card): { text: string; className: string } {
  if (isDue(card)) return { text: card.repetitions === 0 ? "Yeni" : "Tekrar vakti", className: "text-accent" };
  const days = Math.ceil((new Date(card.due_date).getTime() - Date.now()) / 86_400_000);
  return days <= 1
    ? { text: "Yarın", className: "text-gilt-ink" }
    : { text: `${days} gün sonra`, className: "text-moss" };
}

/**
 * The learner's own words, as a contents list: picture, word, meaning, when
 * it's next due. The same list the front page prints, so the two halves
 * read as one book. Each row opens the word's page — that's where the
 * sentences are. The cards themselves are behind "Tekrar et".
 */
function PersonalDeckView({ deckId, cards, onAdd, showActions = true }: PersonalDeckViewProps) {
  const due = cards.filter(isDue).length;
  const sorted = [...cards].sort((a, b) => Number(isDue(b)) - Number(isDue(a)) || b.id - a.id);

  return (
    <div className="mt-5">
      {showActions && (
      <div className="flex flex-wrap items-center gap-2">
        {cards.length > 0 && (
          <LinkButton to={`/decks/${deckId}/flashcards${due > 0 ? "" : "?mode=all"}`} variant="ink" onClick={primeSpeech}>
            {due > 0 ? `Tekrar et (${due})` : "Hepsini gözden geçir"}
          </LinkButton>
        )}
        <Button variant="outline" onClick={onAdd}>
          Kelime ekle
        </Button>
      </div>
      )}

      {cards.length === 0 ? (
        <div className="mt-8 rounded-[28px] bg-paper-lift p-8 text-center ring-1 ring-rule shadow-print">
          <p className="text-4xl" aria-hidden="true">
            🃏
          </p>
          <p className="mt-2 text-lg font-extrabold text-ink">Henüz kart yok</p>
          <p className="mt-1 text-sm text-graphite">İlk kelimeni ekle; ne zaman soracağımı ben ayarlarım.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex items-end justify-between border-b-2 border-ink pb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-graphite">
            <span>Kelime sayfaları</span>
            <span className="tabular-nums">{cards.length}</span>
          </div>
          <ul className="divide-y divide-rule">
            {sorted.map((card) => {
              const { pos, text, emoji } = parseBack(card.back);
              const schedule = scheduleLabel(card);
              return (
                <li key={card.id}>
                  <Link
                    to={`/decks/${deckId}/words/${card.id}`}
                    className="-mx-2 flex items-center gap-3.5 rounded-xl px-2 py-3 transition-[background-color,transform] duration-100 active:scale-[0.99] active:bg-paper-deep/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
                  >
                    {card.image_url ? (
                      <img src={card.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-paper-deep text-3xl">
                        {emoji ?? "🃏"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="break-words text-lg font-extrabold leading-snug text-ink">{card.front}</span>
                        {pos && <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-graphite">{posLabel(pos)}</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold text-graphite">{text}</p>
                    </div>
                    <span className={`shrink-0 text-[11px] font-extrabold uppercase tracking-[0.18em] ${schedule.className}`}>
                      {schedule.text}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default PersonalDeckView;
