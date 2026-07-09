export type ButtonVariant =
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
 * Duolingo-style pressable buttons: a solid slab of colour sits under the
 * button and compresses as it is pushed down. `pointer-events-none` while
 * disabled stops the hover state firing on a button that can't be clicked.
 */
const base =
  "inline-flex items-center justify-center gap-2 font-extrabold tracking-tight select-none " +
  "transition-[transform,box-shadow,background-color] duration-100 " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDF9F3] " +
  "disabled:opacity-55 disabled:pointer-events-none";

/** Pressed: sink onto the slab until it disappears. */
const press = "hover:-translate-y-0.5 active:translate-y-[3px]";

/** Solid fills get a hairline of light on top so they read as a physical key. */
const gloss = "ring-1 ring-inset ring-white/25";

const variantClasses: Record<ButtonVariant, string> = {
  primary: `bg-gradient-to-b from-violet-500 to-violet-600 hover:from-violet-500 hover:to-violet-500 text-white ${gloss} focus-visible:ring-violet-300 ${press} shadow-[0_4px_0_0_var(--color-violet-700)] hover:shadow-[0_5px_0_0_var(--color-violet-700)] active:shadow-[0_1px_0_0_var(--color-violet-700)]`,

  secondary: `bg-white hover:bg-stone-50 text-stone-700 ring-2 ring-stone-200 focus-visible:ring-stone-300 ${press} shadow-[0_4px_0_0_var(--color-stone-200)] hover:shadow-[0_5px_0_0_var(--color-stone-200)] active:shadow-[0_1px_0_0_var(--color-stone-200)]`,

  danger: `bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-500 text-white ${gloss} focus-visible:ring-rose-300 ${press} shadow-[0_4px_0_0_var(--color-rose-700)] hover:shadow-[0_5px_0_0_var(--color-rose-700)] active:shadow-[0_1px_0_0_var(--color-rose-700)]`,

  ghost:
    "text-stone-500 hover:text-stone-800 hover:bg-stone-900/5 focus-visible:ring-stone-300 font-bold",

  // The four study grades. Kept light so the study screen stays calm; the
  // colour lives in the ring, the label and the emoji rather than a loud fill.
  softDanger: `bg-white text-rose-700 ring-2 ring-rose-200 hover:bg-rose-50 focus-visible:ring-rose-300 ${press} shadow-[0_4px_0_0_var(--color-rose-200)] hover:shadow-[0_5px_0_0_var(--color-rose-200)] active:shadow-[0_1px_0_0_var(--color-rose-200)]`,

  softWarning: `bg-white text-amber-700 ring-2 ring-amber-200 hover:bg-amber-50 focus-visible:ring-amber-300 ${press} shadow-[0_4px_0_0_var(--color-amber-200)] hover:shadow-[0_5px_0_0_var(--color-amber-200)] active:shadow-[0_1px_0_0_var(--color-amber-200)]`,

  softInfo: `bg-white text-sky-700 ring-2 ring-sky-200 hover:bg-sky-50 focus-visible:ring-sky-300 ${press} shadow-[0_4px_0_0_var(--color-sky-200)] hover:shadow-[0_5px_0_0_var(--color-sky-200)] active:shadow-[0_1px_0_0_var(--color-sky-200)]`,

  softSuccess: `bg-white text-emerald-700 ring-2 ring-emerald-200 hover:bg-emerald-50 focus-visible:ring-emerald-300 ${press} shadow-[0_4px_0_0_var(--color-emerald-200)] hover:shadow-[0_5px_0_0_var(--color-emerald-200)] active:shadow-[0_1px_0_0_var(--color-emerald-200)]`,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-xl",
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
