export type ButtonVariant =
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
 * Printed buttons: a solid ink key, or a sheet of paper with a tan rule
 * round it. Pressing one sinks it a pixel; nothing slides or glows.
 * `pointer-events-none` while disabled stops the hover state firing on a
 * button that can't be clicked.
 */
const base =
  "inline-flex items-center justify-center gap-2 font-extrabold tracking-tight select-none " +
  "transition-transform duration-100 " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-paper " +
  "disabled:opacity-55 disabled:pointer-events-none";

const press = "active:scale-[0.98] active:translate-y-px";
const caps = "uppercase tracking-[0.12em] text-[13px] font-black";

/** Solid ink, the one loud thing on a page. */
const ink = `bg-ink text-paper-lift shadow-button hover:bg-ink/92 focus-visible:ring-ink/30 ${press} ${caps}`;
/** Its paper twin: lifted stock, tan rule. */
const outline = `bg-paper-lift text-ink ring-1 ring-inset ring-rule shadow-print hover:bg-paper-deep/40 focus-visible:ring-ink/30 ${press} ${caps}`;

const variantClasses: Record<ButtonVariant, string> = {
  ink,
  outline,
  // The course half still asks for these names; they wear the same print.
  primary: ink,
  secondary: outline,

  danger: `bg-accent text-paper-lift shadow-button hover:bg-accent/92 focus-visible:ring-accent/30 ${press} ${caps}`,

  ghost: `text-graphite hover:text-ink hover:bg-ink/5 focus-visible:ring-ink/30 font-bold ${press}`,

  // The study grades: paper with the verdict's colour in the ring and label.
  softDanger: `bg-paper-lift text-accent ring-[1.5px] ring-inset ring-accent/60 shadow-print hover:bg-paper-deep/40 focus-visible:ring-accent/30 ${press}`,
  softWarning: `bg-paper-lift text-gilt-ink ring-[1.5px] ring-inset ring-gilt/70 shadow-print hover:bg-paper-deep/40 focus-visible:ring-gilt/40 ${press}`,
  softInfo: `bg-paper-lift text-ink ring-1 ring-inset ring-rule shadow-print hover:bg-paper-deep/40 focus-visible:ring-ink/30 ${press}`,
  softSuccess: `bg-paper-lift text-moss ring-[1.5px] ring-inset ring-moss/60 shadow-print hover:bg-paper-deep/40 focus-visible:ring-moss/30 ${press}`,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 py-2 text-sm rounded-xl",
  md: "px-5 py-3 rounded-2xl",
  lg: "px-6 py-4 text-lg rounded-2xl",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  fullWidth = false,
): string {
  return `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""}`;
}
