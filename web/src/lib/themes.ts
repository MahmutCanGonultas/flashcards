/**
 * Pastel palettes cycled per item across the app.
 *
 * Every value is a complete Tailwind class string. Tailwind scans source text
 * for whole class names, so these must never be assembled from fragments.
 */
export type DeckTheme = {
  /** Deck tile background. */
  deckSurface: string;
  /** Card/list-item background: barely tinted, so long text stays readable. */
  itemSurface: string;
  ring: string;
  ringSoft: string;
  /** Pressable stack shadow, and its taller hover state. */
  shadow: string;
  hoverShadow: string;
  /** Icon tile fill. */
  icon: string;
  /** Accent text on a tinted surface. */
  text: string;
  /** Solid accent for a small badge with white text. */
  badge: string;
  /** Quiet accent chip. */
  chip: string;
  /** Left edge accent on a card item. */
  bar: string;
  /** Decorative artwork colour, used with fill-current. */
  soft: string;
};

export const themes: DeckTheme[] = [
  {
    deckSurface: "bg-gradient-to-br from-violet-50 via-violet-100 to-violet-200",
    itemSurface: "bg-gradient-to-br from-white to-violet-50",
    ring: "ring-violet-200",
    ringSoft: "ring-violet-100",
    shadow: "shadow-[0_5px_0_0_var(--color-violet-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-violet-200)]",
    icon: "bg-gradient-to-br from-violet-500 to-violet-600",
    text: "text-violet-700",
    badge: "bg-violet-600",
    chip: "bg-violet-100 text-violet-700 ring-violet-200",
    bar: "bg-violet-400",
    soft: "text-violet-300",
  },
  {
    deckSurface: "bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200",
    itemSurface: "bg-gradient-to-br from-white to-sky-50",
    ring: "ring-sky-200",
    ringSoft: "ring-sky-100",
    shadow: "shadow-[0_5px_0_0_var(--color-sky-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-sky-200)]",
    icon: "bg-gradient-to-br from-sky-500 to-sky-600",
    text: "text-sky-700",
    badge: "bg-sky-600",
    chip: "bg-sky-100 text-sky-700 ring-sky-200",
    bar: "bg-sky-400",
    soft: "text-sky-300",
  },
  {
    deckSurface: "bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200",
    itemSurface: "bg-gradient-to-br from-white to-rose-50",
    ring: "ring-rose-200",
    ringSoft: "ring-rose-100",
    shadow: "shadow-[0_5px_0_0_var(--color-rose-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-rose-200)]",
    icon: "bg-gradient-to-br from-rose-500 to-rose-600",
    text: "text-rose-700",
    badge: "bg-rose-600",
    chip: "bg-rose-100 text-rose-700 ring-rose-200",
    bar: "bg-rose-400",
    soft: "text-rose-300",
  },
  {
    deckSurface: "bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200",
    itemSurface: "bg-gradient-to-br from-white to-emerald-50",
    ring: "ring-emerald-200",
    ringSoft: "ring-emerald-100",
    shadow: "shadow-[0_5px_0_0_var(--color-emerald-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-emerald-200)]",
    icon: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    text: "text-emerald-700",
    badge: "bg-emerald-600",
    chip: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    bar: "bg-emerald-400",
    soft: "text-emerald-300",
  },
  {
    deckSurface: "bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200",
    itemSurface: "bg-gradient-to-br from-white to-amber-50",
    ring: "ring-amber-200",
    ringSoft: "ring-amber-100",
    shadow: "shadow-[0_5px_0_0_var(--color-amber-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-amber-200)]",
    icon: "bg-gradient-to-br from-amber-400 to-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-600",
    chip: "bg-amber-100 text-amber-800 ring-amber-200",
    bar: "bg-amber-400",
    soft: "text-amber-300",
  },
  {
    deckSurface: "bg-gradient-to-br from-fuchsia-50 via-fuchsia-100 to-fuchsia-200",
    itemSurface: "bg-gradient-to-br from-white to-fuchsia-50",
    ring: "ring-fuchsia-200",
    ringSoft: "ring-fuchsia-100",
    shadow: "shadow-[0_5px_0_0_var(--color-fuchsia-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-fuchsia-200)]",
    icon: "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600",
    text: "text-fuchsia-700",
    badge: "bg-fuchsia-600",
    chip: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
    bar: "bg-fuchsia-400",
    soft: "text-fuchsia-300",
  },
];

export const themeFor = (index: number): DeckTheme =>
  themes[((index % themes.length) + themes.length) % themes.length];
