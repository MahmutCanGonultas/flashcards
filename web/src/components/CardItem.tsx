import type { Card as CardModel } from "../types";
import type { DeckTheme } from "../lib/themes";
import { parseBack, posLabel } from "../lib/cardBack";
import { PencilIcon, TrashIcon } from "./icons";
import SpeakButton from "./SpeakButton";

type CardItemProps = {
  card: CardModel;
  theme: DeckTheme;
  onEdit: () => void;
  onDelete: () => void;
};

/** Due now (vermilion), back tomorrow (gilt), or safely later (moss). */
type ScheduleTier = "due" | "soon" | "later";

/**
 * Turns the card's SM-2 state into something a person can read, colour-coded
 * by how far out the next review is -- not by the card's decorative theme --
 * so a glance at a row of cards actually shows which ones are personally
 * further along, instead of a rainbow that means nothing.
 */
function scheduleInfo(card: CardModel): { label: string; tier: ScheduleTier } {
  if (card.repetitions === 0) return { label: "Yeni", tier: "due" };

  const dayMs = 24 * 60 * 60 * 1000;
  const remaining = new Date(card.due_date).getTime() - Date.now();
  if (remaining <= 0) return { label: "Tekrar vakti", tier: "due" };

  const days = Math.ceil(remaining / dayMs);
  const label = days === 1 ? "Yarın tekrar" : `${days} gün sonra tekrar`;
  return { label, tier: days <= 1 ? "soon" : "later" };
}

const TIER_CLASSES: Record<ScheduleTier, string> = {
  due: "bg-accent/10 text-accent",
  soon: "bg-gilt/15 text-gilt-ink",
  later: "bg-moss/10 text-moss",
};

const SCHEDULE_TITLE =
  "Bu kelimeye özel hesaplandı — ne kadar iyi bilirsen o kadar geç karşına çıkar.";

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-xl text-graphite transition hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30";

/** One flashcard on the deck page: the front, a perforation, then the back. */
function CardItem({ card, theme, onEdit, onDelete }: CardItemProps) {
  const { pos, text, emoji } = parseBack(card.back);
  const schedule = scheduleInfo(card);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] ${theme.itemSurface} p-6 pl-7 ring-1 ${theme.ring} ${theme.shadow} transition-transform duration-150 hover:-translate-y-0.5`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${theme.bar}`} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            title={SCHEDULE_TITLE}
            className={`inline-block rounded-full ${TIER_CLASSES[schedule.tier]} px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide`}
          >
            {schedule.label}
          </span>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h3 className="break-words text-lg font-extrabold leading-snug text-ink">
              {card.front}
            </h3>
            {pos && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-graphite ring-1 ring-rule">
                {posLabel(pos)}
              </span>
            )}
            <SpeakButton text={card.front} size="sm" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Kartı düzenle: ${card.front}`}
            className={iconButton}
          >
            <PencilIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Kartı sil: ${card.front}`}
            className={`${iconButton} hover:text-accent`}
          >
            <TrashIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="my-4 border-t-2 border-dashed border-rule" />

      <div className="flex items-center gap-3">
        {emoji && (
          <span className="text-3xl leading-none" aria-hidden="true">
            {emoji}
          </span>
        )}
        <p className="min-w-0 flex-1 whitespace-pre-line break-words leading-relaxed text-ink">
          {text}
        </p>
      </div>

      {card.example_sentence && (
        <p className="mt-3 break-words border-l-2 border-rule pl-3 text-sm italic leading-relaxed text-graphite">
          {card.example_sentence}
        </p>
      )}

      {card.mnemonic && (
        <details className="mt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-bold text-gilt-ink [&::-webkit-details-marker]:hidden hover:text-ink">
            <span aria-hidden="true">💡</span> Hafıza ipucu
          </summary>
          <p className="mt-1.5 break-words rounded-xl bg-paper-deep/50 p-3 text-sm leading-relaxed text-ink">
            {card.mnemonic}
          </p>
        </details>
      )}
    </article>
  );
}

export default CardItem;
