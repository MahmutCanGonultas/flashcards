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
 */
const STATE_CLASSES: Record<VisualState, string> = {
  idle: "bg-white text-stone-800 ring-2 ring-stone-200 shadow-[0_4px_0_0_var(--color-stone-200)] transition-transform duration-100 hover:-translate-y-0.5 hover:bg-stone-50 active:translate-y-[3px] active:shadow-none",
  correct: "pointer-events-none bg-emerald-500 text-white ring-2 ring-emerald-600 shadow-[0_4px_0_0_var(--color-emerald-700)] scale-[1.02]",
  wrong: "pointer-events-none bg-rose-500 text-white ring-2 ring-rose-600 shadow-[0_4px_0_0_var(--color-rose-700)] scale-[1.02]",
  reveal: "pointer-events-none bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400",
  muted: "pointer-events-none bg-white text-stone-300 ring-2 ring-stone-100",
};

const KEY_HINTS = ["1", "2", "3", "4"];

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
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-lg font-extrabold ${STATE_CLASSES[state]}`}
          >
            <span
              aria-hidden="true"
              className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold sm:flex ${
                state === "idle"
                  ? "bg-stone-100 text-stone-400"
                  : state === "muted"
                    ? "bg-stone-50 text-stone-200"
                    : "bg-white/25 text-white"
              } ${state === "reveal" ? "bg-emerald-200 text-emerald-700" : ""}`}
            >
              {KEY_HINTS[index]}
            </span>

            <span className="min-w-0 flex-1 break-words">{option.text}</span>

            {(state === "correct" || state === "reveal") && (
              <span aria-hidden="true" className="shrink-0 text-xl">
                ✅{option.emoji ? ` ${option.emoji}` : ""}
              </span>
            )}
            {state === "wrong" && (
              <span aria-hidden="true" className="shrink-0 text-xl">
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
