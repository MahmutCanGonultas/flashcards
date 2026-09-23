import type { Card } from "../types";
import { STAGE_LABEL, stageOf, strengthOf } from "../lib/memory";
import { STAGE_BG } from "../lib/stageStyle";

type StrengthBarsProps = {
  card: Pick<Card, "repetitions" | "interval">;
  /** On a dark cover: the lit bars in paper, the rest faint. */
  onDark?: boolean;
  className?: string;
};

const HEIGHTS = ["h-[5px]", "h-[8px]", "h-[11px]", "h-[14px]"];

/**
 * How firmly a word is held, drawn like signal strength: four bars, lit up
 * to its stage in that stage's ink.
 */
function StrengthBars({ card, onDark = false, className = "" }: StrengthBarsProps) {
  const lit = strengthOf(card);
  const stage = stageOf(card);
  return (
    <span role="img" aria-label={`Hafıza: ${STAGE_LABEL[stage]}`} className={`inline-flex items-end gap-[2px] ${className}`}>
      {HEIGHTS.map((height, i) => (
        <span
          key={height}
          className={`w-[3px] rounded-full ${height} ${i < lit ? (onDark ? "bg-paper-lift/90" : STAGE_BG[stage]) : onDark ? "bg-paper-lift/20" : "bg-rule"}`}
        />
      ))}
    </span>
  );
}

export default StrengthBars;
