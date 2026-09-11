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
  /** Left edge accent on a card item. */
  bar: string;
  /** Decorative artwork colour, used with fill-current. */
  soft: string;
  /** SVG stroke for the trail between path nodes. */
  stroke: string;
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
    bar: "bg-violet-400",
    soft: "text-violet-300",
    stroke: "stroke-violet-400",
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
    bar: "bg-sky-400",
    soft: "text-sky-300",
    stroke: "stroke-sky-400",
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
    bar: "bg-rose-400",
    soft: "text-rose-300",
    stroke: "stroke-rose-400",
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
    bar: "bg-emerald-400",
    soft: "text-emerald-300",
    stroke: "stroke-emerald-400",
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
    bar: "bg-amber-400",
    soft: "text-amber-300",
    stroke: "stroke-amber-400",
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
    bar: "bg-fuchsia-400",
    soft: "text-fuchsia-300",
    stroke: "stroke-fuchsia-400",
  },
  {
    deckSurface: "bg-gradient-to-br from-teal-50 via-teal-100 to-teal-200",
    itemSurface: "bg-gradient-to-br from-white to-teal-50",
    ring: "ring-teal-200",
    ringSoft: "ring-teal-100",
    shadow: "shadow-[0_5px_0_0_var(--color-teal-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-teal-200)]",
    icon: "bg-gradient-to-br from-teal-500 to-teal-600",
    text: "text-teal-700",
    badge: "bg-teal-600",
    bar: "bg-teal-400",
    soft: "text-teal-300",
    stroke: "stroke-teal-400",
  },
  {
    deckSurface: "bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200",
    itemSurface: "bg-gradient-to-br from-white to-indigo-50",
    ring: "ring-indigo-200",
    ringSoft: "ring-indigo-100",
    shadow: "shadow-[0_5px_0_0_var(--color-indigo-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-indigo-200)]",
    icon: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    text: "text-indigo-700",
    badge: "bg-indigo-600",
    bar: "bg-indigo-400",
    soft: "text-indigo-300",
    stroke: "stroke-indigo-400",
  },
  {
    deckSurface: "bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200",
    itemSurface: "bg-gradient-to-br from-white to-orange-50",
    ring: "ring-orange-200",
    ringSoft: "ring-orange-100",
    shadow: "shadow-[0_5px_0_0_var(--color-orange-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-orange-200)]",
    icon: "bg-gradient-to-br from-orange-400 to-orange-500",
    text: "text-orange-700",
    badge: "bg-orange-600",
    bar: "bg-orange-400",
    soft: "text-orange-300",
    stroke: "stroke-orange-400",
  },
  {
    deckSurface: "bg-gradient-to-br from-cyan-50 via-cyan-100 to-cyan-200",
    itemSurface: "bg-gradient-to-br from-white to-cyan-50",
    ring: "ring-cyan-200",
    ringSoft: "ring-cyan-100",
    shadow: "shadow-[0_5px_0_0_var(--color-cyan-200)]",
    hoverShadow: "hover:shadow-[0_9px_0_0_var(--color-cyan-200)]",
    icon: "bg-gradient-to-br from-cyan-500 to-cyan-600",
    text: "text-cyan-700",
    badge: "bg-cyan-600",
    bar: "bg-cyan-400",
    soft: "text-cyan-300",
    stroke: "stroke-cyan-400",
  },
];

export const themeFor = (index: number): DeckTheme =>
  themes[((index % themes.length) + themes.length) % themes.length];
