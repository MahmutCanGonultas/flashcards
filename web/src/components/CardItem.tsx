import type { Card as CardModel } from "../types";
import type { DeckTheme } from "../lib/themes";
import Card from "./Card";
import Button from "./Button";

type CardItemProps = {
  card: CardModel;
  theme: DeckTheme;
  onEdit: () => void;
  onDelete: () => void;
};

/** One flashcard on the deck page: the front, a divider, then the back. */
function CardItem({ card, theme, onEdit, onDelete }: CardItemProps) {
  return (
    <Card theme={theme} className="p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 font-extrabold text-stone-800 break-words">
          {card.front}
        </h3>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            aria-label={`Edit card: ${card.front}`}
          >
            <span aria-hidden="true">✏️</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            aria-label={`Delete card: ${card.front}`}
          >
            <span aria-hidden="true">🗑️</span>
          </Button>
        </div>
      </div>

      <div className="my-4 h-px bg-stone-900/10" />

      <p className="text-stone-600 break-words whitespace-pre-line">{card.back}</p>
    </Card>
  );
}

export default CardItem;
