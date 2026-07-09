import type { Card as CardModel } from "../types";
import type { DeckTheme } from "../lib/themes";
import { PencilIcon, TrashIcon } from "./icons";

type CardItemProps = {
  card: CardModel;
  theme: DeckTheme;
  onEdit: () => void;
  onDelete: () => void;
};

/** Turns the card's SM-2 state into something a person can read. */
function scheduleLabel(card: CardModel): string {
  if (card.repetitions === 0) return "New";

  const dayMs = 24 * 60 * 60 * 1000;
  const remaining = new Date(card.due_date).getTime() - Date.now();
  if (remaining <= 0) return "Due now";

  const days = Math.ceil(remaining / dayMs);
  return days === 1 ? "Due tomorrow" : `Due in ${days}d`;
}

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-900/5 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300";

/** One flashcard on the deck page: the front, a perforation, then the back. */
function CardItem({ card, theme, onEdit, onDelete }: CardItemProps) {
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl ${theme.itemSurface} p-6 pl-7 ring-2 ${theme.ringSoft} shadow-[0_4px_0_0_var(--color-stone-100)] transition-transform duration-150 hover:-translate-y-0.5`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${theme.bar}`} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full ${theme.chip} px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ring-1`}
          >
            {scheduleLabel(card)}
          </span>
          <h3 className="mt-2.5 text-lg font-extrabold leading-snug text-stone-800 break-words">
            {card.front}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit card: ${card.front}`}
            className={iconButton}
          >
            <PencilIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete card: ${card.front}`}
            className={`${iconButton} hover:text-rose-600`}
          >
            <TrashIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="my-4 border-t-2 border-dashed border-stone-900/10" />

      <p className="text-stone-600 leading-relaxed break-words whitespace-pre-line">
        {card.back}
      </p>
    </article>
  );
}

export default CardItem;
