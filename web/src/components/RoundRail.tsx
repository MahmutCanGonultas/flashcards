import { CheckIcon } from "./icons";

export type RailStage = { id: string; label: string };

type RoundRailProps = {
  stages: RailStage[];
  /** Index of the stage in progress; everything before it reads as done. */
  activeIndex: number;
};

/**
 * The three acts of a lesson, so it's obvious that being shown a word now
 * means being asked about it shortly. Without this, the teaching screens look
 * like the whole lesson and the quiz arrives as a surprise.
 */
function RoundRail({ stages, activeIndex }: RoundRailProps) {
  return (
    <div className="flex items-center gap-1.5">
      {stages.map((stage, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;
        return (
          <span
            key={stage.id}
            aria-current={isActive ? "step" : undefined}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-widest transition ${
              isActive
                ? "bg-violet-500 text-white"
                : isDone
                  ? "bg-violet-100 text-violet-600"
                  : "text-stone-400 ring-1 ring-stone-200"
            }`}
          >
            {isDone && <CheckIcon className="h-3 w-3" />}
            {stage.label}
          </span>
        );
      })}
    </div>
  );
}

export default RoundRail;
