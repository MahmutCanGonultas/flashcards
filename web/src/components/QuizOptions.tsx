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

const STATE_CLASSES: Record<VisualState, string> = {
  idle: "bg-white ring-2 ring-emerald-200 text-stone-800 hover:bg-emerald-50 hover:ring-emerald-300",
  correct: "bg-emerald-500 ring-2 ring-emerald-600 text-white",
  wrong: "bg-rose-500 ring-2 ring-rose-600 text-white",
  reveal: "bg-emerald-100 ring-2 ring-emerald-400 text-emerald-700",
  muted: "bg-white ring-2 ring-stone-200 text-stone-400",
};

/** The 4-option "pick the meaning" test that replaces self-graded review. */
function QuizOptions({ options, selectedIndex, onSelect }: QuizOptionsProps) {
  return (
    <div className="mt-4 w-full space-y-2">
      {options.map((option, index) => {
        const state = stateFor(option, index, selectedIndex);
        return (
          <button
            key={index}
            type="button"
            disabled={selectedIndex !== null}
            onClick={(event) => {
              // Sits inside the flip-card's own click-to-flip wrapper.
              event.stopPropagation();
              onSelect(index);
            }}
            className={`flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left font-bold transition duration-200 disabled:cursor-default ${
              index === selectedIndex ? "scale-[1.03]" : ""
            } ${STATE_CLASSES[state]}`}
          >
            <span className="break-words">{option.text}</span>
            {(state === "correct" || state === "reveal") && (
              <span aria-hidden="true" className="shrink-0">
                ✅{option.emoji ? ` ${option.emoji}` : ""}
              </span>
            )}
            {state === "wrong" && (
              <span aria-hidden="true" className="shrink-0">
                ❌
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default QuizOptions;
