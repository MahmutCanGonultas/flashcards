import type { Card } from "../types";
import { STAGE_LABEL, stageOf, strengthOf } from "../lib/memory";
import { STAGE_BG } from "../lib/stageStyle";

type StrengthBarsProps = {
  card: Pick<Card, "repetitions" | "interval">;
  /** On a coloured cover: the lit bars in white, the rest faint. */
  onDark?: boolean;
  /** "lg" for a word's own page. */
  size?: "sm" | "lg";
  className?: string;
};

const HEIGHTS = {
  sm: ["h-[5px]", "h-[8px]", "h-[11px]", "h-[14px]"],
  lg: ["h-[8px]", "h-[13px]", "h-[18px]", "h-[23px]"],
};

/**
 * How firmly a word is held, drawn like signal strength: four bars, lit up
 * to its stage in that stage's colour.
 */
function StrengthBars({ card, onDark = false, size = "sm", className = "" }: StrengthBarsProps) {
  const lit = strengthOf(card);
  const stage = stageOf(card);
  const width = size === "lg" ? "w-[5px]" : "w-[3px]";
  return (
    <span role="img" aria-label={`Hafıza: ${STAGE_LABEL[stage]}`} className={`inline-flex items-end gap-[2px] ${className}`}>
      {HEIGHTS[size].map((height, i) => (
        <span
          key={height}
          className={`${width} rounded-full ${height} ${i < lit ? (onDark ? "bg-white" : STAGE_BG[stage]) : onDark ? "bg-white/30" : "bg-rule"}`}
        />
      ))}
    </span>
  );
}

export default StrengthBars;
