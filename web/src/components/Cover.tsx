import type { ReactNode } from "react";
import type { Card } from "../types";
import { tintStyle } from "../lib/tint";

type CoverProps = {
  card: Card;
  /** The label over the top-left: what is being asked. */
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
 * A card's face: the word's own bright colour with a soft light across it
 * and a darker band along the foot (the 3D edge); what is being asked and
 * where the round is, quietly at the top; the content in white type.
 */
function Cover({ card, label, counter, ornament, className = "", children }: CoverProps) {
  return (
    <div style={tintStyle(card)} className={`relative isolate flex flex-col overflow-hidden rounded-[28px] cover-ground px-5 pb-6 pt-5 text-white ${className}`}>
      {ornament && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[0.2em] -right-[0.04em] -z-10 select-none text-[250px] font-black leading-none tracking-[-0.06em] text-white/[0.13]"
        >
          {ornament}
        </span>
      )}
      <div className="flex items-center justify-between gap-3 tabular-nums">
        <span data-cover-label className="min-w-0 truncate text-[11px] font-black uppercase tracking-[0.16em] text-white/80">{label}</span>
        {counter && <span className="shrink-0 text-[11px] font-black tracking-[0.1em] text-white/70">{counter}</span>}
      </div>
      {children}
    </div>
  );
}

export default Cover;
