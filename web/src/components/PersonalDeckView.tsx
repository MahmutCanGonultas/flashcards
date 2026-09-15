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

function scheduleLabel(card: Card): { text: string; className: string } {
  if (isDue(card)) return { text: card.repetitions === 0 ? "Yeni" : "Tekrar vakti", className: "bg-amber-100 text-amber-700" };
  const days = Math.ceil((new Date(card.due_date).getTime() - Date.now()) / 86_400_000);
  return {
    text: days <= 1 ? "Yarın" : `${days} gün sonra`,
    className: days < 10 ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700",
  };
}

/**
 * The learner's own words, as a list: picture, word, meaning, when it's
 * next due. Each row opens the word's page — that's where the sentences
 * are. The cards themselves are behind "Tekrar et".
 */
function PersonalDeckView({ deckId, cards, onAdd, showActions = true }: PersonalDeckViewProps) {
  const due = cards.filter(isDue).length;
  const sorted = [...cards].sort((a, b) => Number(isDue(b)) - Number(isDue(a)) || b.id - a.id);

  return (
    <div className="mt-5">
      {showActions && (
      <div className="flex flex-wrap items-center gap-2">
        {cards.length > 0 && (
          <LinkButton to={`/decks/${deckId}/flashcards${due > 0 ? "" : "?mode=all"}`} onClick={primeSpeech}>
            {due > 0 ? `🃏 Tekrar et (${due})` : "🃏 Hepsini gözden geçir"}
          </LinkButton>
        )}
        <Button variant="secondary" onClick={onAdd}>
          ✍️ Kelime ekle
        </Button>
      </div>
      )}

      {cards.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-8 text-center ring-2 ring-stone-100">
          <p className="text-4xl" aria-hidden="true">
            🃏
          </p>
          <p className="mt-2 text-lg font-extrabold text-stone-800">Henüz kart yok</p>
          <p className="mt-1 text-sm text-stone-500">İlk kelimeni ekle; ne zaman soracağımı ben ayarlarım.</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
            Kelime sayfaları · {cards.length}
          </p>
          <ul className="mt-2 space-y-2">
            {sorted.map((card) => {
              const { pos, text, emoji } = parseBack(card.back);
              const schedule = scheduleLabel(card);
              return (
                <li key={card.id}>
                  <Link
                    to={`/decks/${deckId}/words/${card.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
                  >
                    {card.image_url ? (
                      <img src={card.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-3xl">
                        {emoji ?? "🃏"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-lg font-extrabold leading-snug text-stone-800 break-words">{card.front}</span>
                        {pos && <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{posLabel(pos)}</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold text-stone-600">{text}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${schedule.className}`}>
                        {schedule.text}
                      </span>
                    </div>
                    <span aria-hidden="true" className="text-stone-300">
                      ›
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
