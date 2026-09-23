export type ButtonVariant =
  | "go"
  | "pop"
  | "blue"
  | "ink"
  | "outline"
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "softDanger"
  | "softWarning"
  | "softInfo"
  | "softSuccess";

export type ButtonSize = "sm" | "md" | "lg";

/**
 * Chunky buttons: a solid colour on a darker band of itself, or a white
 * key with a grey border and ledge. Pressing one sinks it onto its edge.
 * `pointer-events-none` while disabled stops the hover state firing on a
 * button that can't be clicked; a disabled button is grey, not faded.
 */
const base =
  "inline-flex items-center justify-center gap-2 select-none " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-paper " +
  "disabled:pointer-events-none";

const caps = "uppercase tracking-[0.08em] text-[15px] font-black";

/** A solid colour: the forward action. */
const solid = (colours: string) => `${colours} text-white shadow-button press-3d face ${caps} disabled:bg-rule disabled:text-hare disabled:shadow-none`;
/** White with a grey border and a ledge of the same grey. */
const white = (text: string) =>
  `bg-white ${text} border-2 border-rule shadow-edge press hover:bg-paper-deep focus-visible:ring-ocean/40 ${caps} disabled:text-hare`;

const go = solid("bg-grass focus-visible:ring-grass/40");
const pop = white("text-ocean-ink");

const variantClasses: Record<ButtonVariant, string> = {
  go,
  pop,
  blue: solid("bg-ocean focus-visible:ring-ocean/40"),
  // The older names: every "ink" key is the green forward button now, every outline the white one.
  ink: go,
  primary: go,
  outline: white("text-ink"),
  secondary: white("text-ink"),

  danger: solid("bg-berry focus-visible:ring-berry/40"),

  ghost: `text-ocean-ink hover:bg-ocean-soft focus-visible:ring-ocean/30 font-extrabold uppercase tracking-[0.08em] text-[13px] transition-colors`,

  // The study grades: white keys whose label and rule carry the verdict's colour.
  softDanger: white("text-berry-ink"),
  softWarning: white("text-tangerine-ink"),
  softInfo: white("text-ink"),
  softSuccess: white("text-grass-ink"),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 py-2 rounded-xl !text-[13px]",
  md: "min-h-[50px] px-5 py-3 rounded-2xl",
  lg: "min-h-[54px] px-6 py-3.5 rounded-2xl",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  fullWidth = false,
): string {
  return `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""}`;
}
