import type { Card as CardModel } from "../types";
import type { DeckTheme } from "../lib/themes";
import { parseBack } from "../lib/cardBack";
import { PencilIcon, TrashIcon } from "./icons";
import SpeakButton from "./SpeakButton";

type CardItemProps = {
  card: CardModel;
  theme: DeckTheme;
  onEdit: () => void;
  onDelete: () => void;
};

type ScheduleTier = "new" | "learning" | "known";

/**
 * Turns the card's SM-2 state into something a person can read, colour-coded
 * by how far out the next review is -- not by the card's decorative theme --
 * so a glance at a row of cards actually shows which ones are personally
 * further along, instead of a rainbow that means nothing.
 */
function scheduleInfo(card: CardModel): { label: string; tier: ScheduleTier } {
  if (card.repetitions === 0) return { label: "New", tier: "new" };

  const dayMs = 24 * 60 * 60 * 1000;
  const remaining = new Date(card.due_date).getTime() - Date.now();
  if (remaining <= 0) return { label: "Due now", tier: "new" };

  const days = Math.ceil(remaining / dayMs);
  const label = days === 1 ? "Reviews tomorrow" : `Reviews in ${days}d`;
  return { label, tier: days < 10 ? "learning" : "known" };
}

const TIER_CLASSES: Record<ScheduleTier, string> = {
  new: "bg-amber-100 text-amber-700 ring-amber-200",
  learning: "bg-sky-100 text-sky-700 ring-sky-200",
  known: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const SCHEDULE_TITLE =
  "Calculated for this word specifically — the better you know it, the longer until it comes back.";

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-900/5 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300";

/** One flashcard on the deck page: the front, a perforation, then the back. */
function CardItem({ card, theme, onEdit, onDelete }: CardItemProps) {
  const { pos, text, emoji } = parseBack(card.back);
  const schedule = scheduleInfo(card);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl ${theme.itemSurface} p-6 pl-7 ring-2 ${theme.ringSoft} shadow-[0_4px_0_0_var(--color-stone-100)] transition-transform duration-150 hover:-translate-y-0.5`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${theme.bar}`} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            title={SCHEDULE_TITLE}
            className={`inline-block rounded-full ${TIER_CLASSES[schedule.tier]} px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ring-1`}
          >
            {schedule.label}
          </span>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h3 className="text-lg font-extrabold leading-snug text-stone-800 break-words">
              {card.front}
            </h3>
            {pos && (
              <span className="rounded-full bg-stone-900/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                {pos}
              </span>
            )}
            <SpeakButton text={card.front} size="sm" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
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

      <div className="flex items-center gap-3">
        {emoji && (
          <span className="text-3xl leading-none" aria-hidden="true">
            {emoji}
          </span>
        )}
        <p className="min-w-0 flex-1 text-stone-600 leading-relaxed break-words whitespace-pre-line">
          {text}
        </p>
      </div>
    </article>
  );
}

export default CardItem;
