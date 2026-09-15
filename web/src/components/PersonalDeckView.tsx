import type { Card } from "../types";
import { parseBack, posLabel } from "../lib/cardBack";
import { isDue } from "../lib/path";
import Button from "./Button";
import LinkButton from "./LinkButton";
import SpeakButton from "./SpeakButton";
import WordCardBack from "./WordCardBack";
import { PencilIcon, TrashIcon } from "./icons";

type PersonalDeckViewProps = {
  deckId: string;
  cards: Card[];
  onAdd: () => void;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
};

function scheduleLabel(card: Card): { text: string; className: string } {
  if (isDue(card)) return { text: card.repetitions === 0 ? "Yeni" : "Tekrar vakti", className: "bg-amber-100 text-amber-700 ring-amber-200" };
  const days = Math.ceil((new Date(card.due_date).getTime() - Date.now()) / 86_400_000);
  return {
    text: days <= 1 ? "Yarın" : `${days} gün sonra`,
    className: days < 10 ? "bg-sky-100 text-sky-700 ring-sky-200" : "bg-emerald-100 text-emerald-700 ring-emerald-200",
  };
}

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-900/5 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300";

/** The learner's own deck: the pile, one rich row per word, and the buttons that matter. */
function PersonalDeckView({ deckId, cards, onAdd, onEdit, onDelete }: PersonalDeckViewProps) {
  const due = cards.filter(isDue).length;
  const sorted = [...cards].sort((a, b) => Number(isDue(b)) - Number(isDue(a)) || b.id - a.id);

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        {cards.length > 0 && (
          <LinkButton to={`/decks/${deckId}/flashcards${due > 0 ? "" : "?mode=all"}`}>
            {due > 0 ? `🃏 Tekrar et (${due})` : "🃏 Hepsini gözden geçir"}
          </LinkButton>
        )}
        {cards.length > 0 && due > 0 && (
          <LinkButton to={`/decks/${deckId}/flashcards?mode=all`} variant="secondary">
            Hepsi
          </LinkButton>
        )}
        <Button variant="secondary" onClick={onAdd}>
          ✍️ Kelime ekle
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-8 text-center ring-2 ring-stone-100">
          <p className="text-4xl" aria-hidden="true">
            🃏
          </p>
          <p className="mt-2 text-lg font-extrabold text-stone-800">Henüz kart yok</p>
          <p className="mt-1 text-sm text-stone-500">İlk kelimeni ekle; ne zaman soracağımı ben ayarlarım.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {sorted.map((card) => {
            const { pos, emoji } = parseBack(card.back);
            const schedule = scheduleLabel(card);
            return (
              <li key={card.id} className="rounded-3xl bg-white p-4 ring-2 ring-stone-100 shadow-[0_4px_0_0_var(--color-stone-100)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {card.image_url ? (
                      <img src={card.image_url} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-stone-200" />
                    ) : emoji ? (
                      <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
                        {emoji}
                      </span>
                    ) : null}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-xl font-extrabold leading-snug text-stone-800 break-words">{card.front}</h3>
                        {pos && (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                            {posLabel(pos)}
                          </span>
                        )}
                        <SpeakButton text={card.front} size="sm" />
                      </div>
                      <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ring-1 ${schedule.className}`}>
                        {schedule.text}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button type="button" aria-label={`${card.front} kartını düzenle`} className={iconButton} onClick={() => onEdit(card)}>
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label={`${card.front} kartını sil`} className={`${iconButton} hover:!text-rose-600`} onClick={() => onDelete(card)}>
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <WordCardBack card={card} variant="compact" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default PersonalDeckView;
