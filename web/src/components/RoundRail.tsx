import { CheckIcon } from "./icons";

export type RailStage = { id: string; label: string };

type RoundRailProps = {
  stages: RailStage[];
  /** Index of the stage in progress; everything before it reads as done. */
  activeIndex: number;
};

/**
 * The acts of a lesson, so it's obvious that being shown a word now means
 * being asked about it shortly. Without this, the teaching screens look like
 * the whole lesson and the quiz arrives as a surprise. The acts behind you
 * fold into a tick, so the rail fits a phone's header at every point.
 */
function RoundRail({ stages, activeIndex }: RoundRailProps) {
  return (
    <ol className="flex min-w-0 items-center gap-1.5 overflow-hidden">
      {stages.map((stage, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;
        if (isDone) {
          return (
            <li key={stage.id} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-deep text-ink">
              <CheckIcon className="h-3 w-3" />
              <span className="sr-only">{stage.label} bitti</span>
            </li>
          );
        }
        return (
          <li
            key={stage.id}
            aria-current={isActive ? "step" : undefined}
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] transition sm:px-2.5 sm:text-[11px] sm:tracking-[0.18em] ${
              isActive ? "bg-grass text-white" : "text-graphite ring-2 ring-inset ring-rule"
            }`}
          >
            {stage.label}
          </li>
        );
      })}
    </ol>
  );
}

export default RoundRail;
