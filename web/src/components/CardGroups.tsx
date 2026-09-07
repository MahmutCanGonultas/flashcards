import { useState } from "react";
import type { Card as CardModel } from "../types";
import { themeFor } from "../lib/themes";
import CardItem from "./CardItem";
import { ChevronDownIcon } from "./icons";

type CardGroupsProps = {
  cards: CardModel[];
  onEdit: (card: CardModel) => void;
  onDelete: (card: CardModel) => void;
};

type Bucket = { key: string; label: string; cards: CardModel[] };
type BucketStatus = "done" | "active" | "locked";

function isDueNow(card: CardModel): boolean {
  return new Date(card.due_date).getTime() <= Date.now();
}

/** Groups by `tag` (e.g. "Day 3"); untagged cards land in one trailing bucket. */
function bucketize(cards: CardModel[]): Bucket[] {
  const tagged = new Map<string, CardModel[]>();
  const untagged: CardModel[] = [];

  for (const card of cards) {
    if (card.tag) {
      if (!tagged.has(card.tag)) tagged.set(card.tag, []);
      tagged.get(card.tag)!.push(card);
    } else {
      untagged.push(card);
    }
  }

  // Nothing tagged (every deck before this feature, and most decks after
  // it too) -- one untitled bucket, which CardGroups renders as a flat grid.
  if (tagged.size === 0) {
    return [{ key: "__all__", label: "", cards }];
  }

  const buckets: Bucket[] = Array.from(tagged.entries()).map(([tag, tagCards]) => ({
    key: tag,
    label: tag,
    cards: tagCards,
  }));

  // "Day 2" before "Day 10": compare the number inside the label, not the text.
  buckets.sort((a, b) => {
    const na = Number(a.label.match(/\d+/)?.[0]);
    const nb = Number(b.label.match(/\d+/)?.[0]);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.label.localeCompare(b.label);
  });

  if (untagged.length > 0) {
    buckets.push({ key: "__untagged__", label: "Other cards", cards: untagged });
  }

  return buckets;
}

function bucketStatus(bucket: Bucket): BucketStatus {
  const due = bucket.cards.filter(isDueNow).length;
  const studied = bucket.cards.filter((c) => c.repetitions > 0).length;
  if (due === 0 && studied === bucket.cards.length) return "done";
  if (due > 0) return "active";
  return "locked";
}

const statusDot: Record<BucketStatus, string> = {
  done: "bg-emerald-400",
  active: "bg-violet-500",
  locked: "bg-stone-200",
};

function CardGrid({
  cards,
  onEdit,
  onDelete,
}: {
  cards: CardModel[];
  onEdit: (card: CardModel) => void;
  onDelete: (card: CardModel) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((card, index) => (
        <CardItem
          key={card.id}
          card={card}
          theme={themeFor(index)}
          onEdit={() => onEdit(card)}
          onDelete={() => onDelete(card)}
        />
      ))}
    </div>
  );
}

/**
 * Flat grid when no card carries a tag. Once cards are tagged ("Day 3", ...)
 * this switches to a collapsible accordion instead, so a multi-week program
 * reads as chapters instead of dumping every card on the page at once.
 */
function CardGroups({ cards, onEdit, onDelete }: CardGroupsProps) {
  const buckets = bucketize(cards);
  const isFlat = buckets.length === 1 && buckets[0].key === "__all__";

  // Default to whichever bucket has cards due today (or the first one),
  // computed once from this component's first mount -- DeckDetail only
  // mounts it once `cards` has actually loaded, so the buckets here are
  // already the real ones, not a placeholder. Clicking a header afterwards
  // just moves `openKey`; it never gets reset back to this default.
  const [openKey, setOpenKey] = useState<string | null>(() => {
    if (isFlat) return null;
    const active = buckets.find((b) => b.cards.some(isDueNow)) ?? buckets[0];
    return active?.key ?? null;
  });

  if (isFlat) {
    return <CardGrid cards={cards} onEdit={onEdit} onDelete={onDelete} />;
  }

  const dayBuckets = buckets.filter((b) => b.key !== "__untagged__");

  return (
    <div>
      {dayBuckets.length > 1 && (
        <div
          className="mb-5 flex gap-1"
          role="img"
          aria-label={`Program progress: ${dayBuckets.filter((b) => bucketStatus(b) === "done").length} of ${dayBuckets.length} days done`}
        >
          {dayBuckets.map((bucket) => (
            <span
              key={bucket.key}
              title={bucket.label}
              className={`h-2.5 flex-1 rounded-full ${statusDot[bucketStatus(bucket)]}`}
            />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {buckets.map((bucket) => {
          const dueCards = bucket.cards.filter(isDueNow);
          const due = dueCards.length;
          const newDue = dueCards.filter((c) => c.repetitions === 0).length;
          const reviewDue = due - newDue;
          const isOpen = openKey === bucket.key;

          const status = bucketStatus(bucket);

          return (
            <div
              key={bucket.key}
              className="overflow-hidden rounded-3xl bg-white ring-2 ring-stone-100 shadow-[0_4px_0_0_var(--color-stone-100)]"
            >
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : bucket.key)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {status === "done" && (
                    <span aria-hidden="true" className="shrink-0 text-base leading-none">
                      ✅
                    </span>
                  )}
                  <span className="font-extrabold text-stone-800">{bucket.label}</span>
                  <span className="shrink-0 text-sm font-medium text-stone-400">
                    {bucket.cards.length} {bucket.cards.length === 1 ? "card" : "cards"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  {due > 0 && (
                    <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-extrabold text-white">
                      {newDue > 0 && reviewDue > 0
                        ? `${newDue} new · ${reviewDue} review`
                        : newDue > 0
                          ? `${newDue} new`
                          : `${reviewDue} review`}
                    </span>
                  )}
                  <ChevronDownIcon
                    className={`h-5 w-5 text-stone-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="border-t-2 border-stone-100 p-5">
                  <CardGrid cards={bucket.cards} onEdit={onEdit} onDelete={onDelete} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CardGroups;
