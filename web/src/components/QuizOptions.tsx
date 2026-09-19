import type { QuizOption } from "../lib/quiz";

type QuizOptionsProps = {
  options: QuizOption[];
  /** null until the person picks one; then locked in until the next card. */
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

type VisualState = "idle" | "correct" | "wrong" | "reveal" | "muted";

function stateFor(option: QuizOption, index: number, selectedIndex: number | null): VisualState {
  if (selectedIndex === null) return "idle";
  if (index === selectedIndex) return option.isCorrect ? "correct" : "wrong";
  return option.isCorrect ? "reveal" : "muted";
}

/*
 * Colour is never transitioned and the settled options are made inert with
 * pointer-events rather than `disabled`: iOS Safari has been seen leaving a
 * tapped, then disabled, button painted in its pressed/answered colours
 * until something else on the page moves. Only the press itself animates.
 *
 * Four sheets of paper with one rule down the left edge; the rule takes
 * the verdict's colour (moss right, vermilion wrong) and the sheet barely
 * tints, so the answer is read from the edge, not from a slab of colour.
 */
const STATE_CLASSES: Record<VisualState, string> = {
  idle: "bg-paper-lift text-ink ring-1 ring-rule border-rule shadow-print transition-transform duration-100 hover:-translate-y-0.5 active:scale-[0.98]",
  correct: "pointer-events-none bg-moss/8 text-ink ring-1 ring-moss border-moss animate-ring-pulse",
  wrong: "pointer-events-none bg-accent/8 text-ink ring-1 ring-accent border-accent animate-[shake_320ms]",
  reveal: "pointer-events-none bg-paper-lift text-moss ring-1 ring-moss border-moss",
  muted: "pointer-events-none bg-paper-lift text-graphite/50 ring-1 ring-rule/60 border-rule/60",
};

/* The small index at the left edge: the keyboard hint, and what makes four sheets read as a list. */
const INDEX_CLASSES: Record<VisualState, string> = {
  idle: "text-graphite",
  correct: "text-moss",
  wrong: "text-accent",
  reveal: "text-moss",
  muted: "text-graphite/40",
};

const KEY_HINTS = ["1", "2", "3", "4"];
/* Where the five sparks of a right answer fly. */
const SPARKS = [
  { dx: "-34px", dy: "-26px" },
  { dx: "-10px", dy: "-40px" },
  { dx: "18px", dy: "-36px" },
  { dx: "38px", dy: "-18px" },
  { dx: "26px", dy: "10px" },
];

/** The four-option "pick the meaning" test that grades the review for you. */
function QuizOptions({ options, selectedIndex, onSelect }: QuizOptionsProps) {
  return (
    <div className="mt-5 space-y-3">
      {options.map((option, index) => {
        const state = stateFor(option, index, selectedIndex);
        return (
          <button
            key={index}
            type="button"
            aria-disabled={selectedIndex !== null}
            onClick={() => {
              if (selectedIndex === null) onSelect(index);
            }}
            className={`relative flex w-full items-center gap-3 rounded-2xl border-l-[3px] px-4 py-4 text-left text-lg font-extrabold ${STATE_CLASSES[state]}`}
          >
            {state === "correct" && (
              <span aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2">
                {SPARKS.map((spark, i) => (
                  <span
                    key={i}
                    className="absolute h-2.5 w-2.5 rounded-full bg-gilt animate-[spark_650ms_ease-out_forwards]"
                    style={{ "--dx": spark.dx, "--dy": spark.dy, animationDelay: `${i * 30}ms` } as React.CSSProperties}
                  />
                ))}
              </span>
            )}
            <span
              aria-hidden="true"
              className={`w-4 shrink-0 text-center text-[11px] font-extrabold tabular-nums ${INDEX_CLASSES[state]}`}
            >
              {KEY_HINTS[index]}
            </span>

            <span className="min-w-0 flex-1 break-words">{option.text}</span>

            {(state === "correct" || state === "reveal") && (
              <span aria-hidden="true" className="shrink-0 text-xl font-black text-moss">
                ✓{option.emoji ? ` ${option.emoji}` : ""}
              </span>
            )}
            {state === "wrong" && (
              <span aria-hidden="true" className="shrink-0 text-xl font-black text-accent">
                ✗
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default QuizOptions;
