import type { ReactNode } from "react";
import type { Card } from "../types";
import { tintStyle } from "../lib/tint";

type CoverProps = {
  card: Card;
  /** The small caps over the top-left: what is being asked. */
  label: string;
  /** Top-right: "3 / 8". */
  counter?: string;
  /**
   * A letter set huge and faint in the corner — the word's initial on a card
   * that shows the word. Left off wherever it would give the answer away.
   */
  ornament?: string | null;
  className?: string;
  children: ReactNode;
};

/**
 * A card's face: the word's own colour deepened to a cover, a masthead line
 * printed in from the left, and the content set in paper-white type.
 */
function Cover({ card, label, counter, ornament, className = "", children }: CoverProps) {
  return (
    <div
      style={tintStyle(card)}
      className={`relative isolate flex flex-col overflow-hidden rounded-[20px] cover-ground px-5 pb-5 pt-4 text-paper-lift shadow-cover ring-1 ring-inset ring-paper-lift/10 ${className}`}
    >
      {ornament && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[0.18em] -right-[0.06em] -z-10 select-none text-[260px] font-black leading-none tracking-[-0.06em] text-paper-lift/[0.07]"
        >
          {ornament}
        </span>
      )}
      <div className="flex items-baseline justify-between text-[10px] font-extrabold uppercase tracking-[0.24em] text-paper-lift/75 tabular-nums">
        <span className="min-w-0 pr-4">
          <span className="block truncate">{label}</span>
          <span aria-hidden="true" className="mt-1 block h-[2px] w-7 bg-paper-lift/70 animate-bar-print [animation-delay:200ms]" />
        </span>
        {counter && <span className="shrink-0">{counter}</span>}
      </div>
      {children}
    </div>
  );
}

export default Cover;
