import { Link } from "react-router-dom";
import type { Deck } from "../types";
import type { DeckTheme } from "../lib/themes";

type DeckCardProps = {
  deck: Deck;
  theme: DeckTheme;
};

function DeckCard({ deck, theme }: DeckCardProps) {
  return (
    <Link
      to={`/decks/${deck.id}`}
      className={`group relative ${theme.bg} rounded-3xl p-6 ring-2 ${theme.ring} hover:-translate-y-1 transition-transform overflow-hidden`}
    >
      <div
        className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full ${theme.soft}`}
      />

      <div className="relative">
        <div
          className={`w-14 h-14 rounded-2xl ${theme.icon} flex items-center justify-center shadow-sm`}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
            <rect
              x="4"
              y="6"
              width="12"
              height="14"
              rx="2.5"
              className="fill-white/50"
            />
            <rect
              x="8"
              y="4"
              width="12"
              height="14"
              rx="2.5"
              className="fill-white"
            />
          </svg>
        </div>

        <h3 className="font-extrabold text-lg text-stone-800 mt-5">
          {deck.name}
        </h3>
        <p className={`text-sm font-medium ${theme.text} mt-1`}>
          Ready to study
        </p>

        <div className="flex items-center gap-1.5 mt-5 font-bold text-stone-700">
          <span>Study</span>
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default DeckCard;
