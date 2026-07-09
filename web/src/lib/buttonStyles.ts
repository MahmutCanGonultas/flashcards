export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "warning"
  | "info"
  | "success"
  | "ghost"
  | "dark";

export type ButtonSize = "sm" | "md" | "lg";

/**
 * Duolingo-style pressable buttons: a solid shadow underneath that compresses
 * as the button is pushed down. `pointer-events-none` while disabled keeps the
 * hover state from firing on a button that can't be clicked.
 */
const base =
  "inline-flex items-center justify-center gap-2 font-bold transition-all select-none " +
  "focus-visible:outline-none focus-visible:ring-4 disabled:opacity-60 disabled:pointer-events-none";

const pressable = "hover:translate-y-0.5 active:translate-y-1 active:shadow-none";

/** Shades are picked so bold label text stays legible on the fill. */
const variantClasses: Record<ButtonVariant, string> = {
  primary: `bg-violet-500 hover:bg-violet-600 text-white focus-visible:ring-violet-300 ${pressable} shadow-[0_4px_0_0_var(--color-violet-700)] hover:shadow-[0_2px_0_0_var(--color-violet-700)]`,
  secondary: `bg-white hover:bg-stone-50 text-stone-700 ring-2 ring-stone-200 focus-visible:ring-stone-300 ${pressable} shadow-[0_4px_0_0_var(--color-stone-200)] hover:shadow-[0_2px_0_0_var(--color-stone-200)]`,
  danger: `bg-rose-500 hover:bg-rose-600 text-white focus-visible:ring-rose-300 ${pressable} shadow-[0_4px_0_0_var(--color-rose-700)] hover:shadow-[0_2px_0_0_var(--color-rose-700)]`,
  warning: `bg-amber-400 hover:bg-amber-500 text-amber-950 focus-visible:ring-amber-300 ${pressable} shadow-[0_4px_0_0_var(--color-amber-600)] hover:shadow-[0_2px_0_0_var(--color-amber-600)]`,
  info: `bg-sky-600 hover:bg-sky-700 text-white focus-visible:ring-sky-300 ${pressable} shadow-[0_4px_0_0_var(--color-sky-800)] hover:shadow-[0_2px_0_0_var(--color-sky-800)]`,
  success: `bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-300 ${pressable} shadow-[0_4px_0_0_var(--color-emerald-800)] hover:shadow-[0_2px_0_0_var(--color-emerald-800)]`,
  ghost:
    "text-stone-500 hover:text-stone-800 hover:bg-stone-100 focus-visible:ring-stone-300 font-medium",
  dark: "bg-slate-900 hover:bg-slate-800 text-white focus-visible:ring-slate-400 font-medium",
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
