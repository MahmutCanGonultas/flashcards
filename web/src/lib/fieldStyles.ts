export function fieldClasses(hasError = false): string {
  return [
    "w-full px-4 py-3 rounded-xl border bg-stone-50 text-stone-900 placeholder-stone-400",
    "focus:outline-none focus:ring-2 focus:bg-white transition",
    hasError
      ? "border-rose-300 focus:ring-rose-500/40 focus:border-rose-500"
      : "border-stone-200 focus:ring-violet-500/40 focus:border-violet-500",
  ].join(" ");
}
