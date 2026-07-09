/**
 * Pastel palettes cycled per item across the app.
 * Every class is written out in full so Tailwind can find it while scanning.
 */
export type DeckTheme = {
  bg: string;
  ring: string;
  icon: string;
  text: string;
  soft: string;
};

export const themes: DeckTheme[] = [
  {
    bg: "bg-violet-100",
    ring: "ring-violet-200",
    icon: "bg-violet-500",
    text: "text-violet-700",
    soft: "bg-violet-200/60",
  },
  {
    bg: "bg-sky-100",
    ring: "ring-sky-200",
    icon: "bg-sky-500",
    text: "text-sky-700",
    soft: "bg-sky-200/60",
  },
  {
    bg: "bg-rose-100",
    ring: "ring-rose-200",
    icon: "bg-rose-500",
    text: "text-rose-700",
    soft: "bg-rose-200/60",
  },
  {
    bg: "bg-emerald-100",
    ring: "ring-emerald-200",
    icon: "bg-emerald-500",
    text: "text-emerald-700",
    soft: "bg-emerald-200/60",
  },
  {
    bg: "bg-amber-100",
    ring: "ring-amber-200",
    icon: "bg-amber-500",
    text: "text-amber-700",
    soft: "bg-amber-200/60",
  },
  {
    bg: "bg-fuchsia-100",
    ring: "ring-fuchsia-200",
    icon: "bg-fuchsia-500",
    text: "text-fuchsia-700",
    soft: "bg-fuchsia-200/60",
  },
];

export const themeFor = (index: number): DeckTheme =>
  themes[((index % themes.length) + themes.length) % themes.length];
