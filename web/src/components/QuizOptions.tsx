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
 * Four white keys with a grey border and ledge; the verdict turns a key
 * green or red, border and wash together, the way every answer here does.
 */
const STATE_CLASSES: Record<VisualState, string> = {
  idle: "border-rule bg-white text-ink shadow-edge press hover:bg-paper-deep",
  correct: "pointer-events-none border-grass bg-grass-soft text-grass-ink shadow-[0_2px_0_0_var(--color-grass)] animate-ring-pulse",
  wrong: "pointer-events-none border-berry bg-berry-soft text-berry-ink shadow-[0_2px_0_0_var(--color-berry)] animate-[shake_320ms]",
  reveal: "pointer-events-none border-grass bg-white text-grass-ink",
  muted: "pointer-events-none border-rule bg-white text-hare",
};

/* The small index at the left edge: the keyboard hint, and what makes four sheets read as a list. */
const INDEX_CLASSES: Record<VisualState, string> = {
  idle: "border-rule text-hare",
  correct: "border-current",
  wrong: "border-current",
  reveal: "border-current",
  muted: "border-rule text-hare",
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
            className={`relative flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-lg font-extrabold ${STATE_CLASSES[state]}`}
          >
            {state === "correct" && (
              <span aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2">
                {SPARKS.map((spark, i) => (
                  <span
                    key={i}
                    className="absolute h-2.5 w-2.5 rounded-full bg-sunny animate-[spark_650ms_ease-out_forwards]"
                    style={{ "--dx": spark.dx, "--dy": spark.dy, animationDelay: `${i * 30}ms` } as React.CSSProperties}
                  />
                ))}
              </span>
            )}
            <span
              aria-hidden="true"
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 text-[13px] font-black tabular-nums ${INDEX_CLASSES[state]}`}
            >
              {KEY_HINTS[index]}
            </span>

            <span className="min-w-0 flex-1 break-words">{option.text}</span>

            {(state === "correct" || state === "reveal") && (
              <span aria-hidden="true" className="shrink-0 text-xl font-black text-grass-ink">
                ✓{option.emoji ? ` ${option.emoji}` : ""}
              </span>
            )}
            {state === "wrong" && (
              <span aria-hidden="true" className="shrink-0 text-xl font-black text-berry-ink">
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
