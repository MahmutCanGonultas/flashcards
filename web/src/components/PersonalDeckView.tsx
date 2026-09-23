import type { Card } from "../types";
import { isDue } from "../lib/path";
import Button from "./Button";
import LinkButton from "./LinkButton";
import WordList from "./WordList";
import { primeSpeech } from "../lib/speech";

type PersonalDeckViewProps = {
  deckId: string;
  cards: Card[];
  onAdd: () => void;
  /** The review/add buttons; off where a hub above already has them. */
  showActions?: boolean;
};

/**
 * The learner's own words, as a contents list: the same list the front
 * page prints, so the two read as one book. Each row opens the word's page
 * — that's where the sentences are. The cards themselves are behind
 * "Tekrar et".
 */
function PersonalDeckView({ deckId, cards, onAdd, showActions = true }: PersonalDeckViewProps) {
  const due = cards.filter(isDue).length;

  return (
    <div className="mt-5">
      {showActions && (
      <div className="flex flex-wrap items-center gap-2">
        {cards.length > 0 && (
          <LinkButton to={`/decks/${deckId}/flashcards${due > 0 ? "" : "?mode=all"}`} variant="ink" onClick={primeSpeech}>
            {due > 0 ? `Tekrar et (${due})` : "Serbest alıştırma"}
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
          <WordList deckId={deckId} cards={cards} />
        </>
      )}
    </div>
  );
}

export default PersonalDeckView;
