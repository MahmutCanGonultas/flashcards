/**
 * Five warm inks cycled per item across the course half — terracotta,
 * slate, crimson, navy, moss — each used sparingly: a small tile, a bar,
 * a badge, never a panel. The surfaces underneath are always the same
 * paper, so a row of items reads as one printed page, not a rainbow.
 *
 * Every value is a complete Tailwind class string. Tailwind scans source text
 * for whole class names, so these must never be assembled from fragments.
 */
export type DeckTheme = {
  /** Deck tile background: a sheet lying on the page. */
  deckSurface: string;
  /** Card/list-item background: the same sheet, so long text stays readable. */
  itemSurface: string;
  ring: string;
  ringSoft: string;
  /** Pressable stack shadow, and its taller hover state. */
  shadow: string;
  hoverShadow: string;
  /** Icon tile fill: the one place the theme's ink is used solid. */
  icon: string;
  /** Accent text on paper. */
  text: string;
  /** Solid accent for a small badge with paper text. */
  badge: string;
  /** Left edge accent on a card item. */
  bar: string;
  /** Decorative artwork colour, used with fill-current. */
  soft: string;
  /** SVG stroke for the trail between path nodes: a hex, for the attribute. */
  stroke: string;
};

/* Shared by every theme: the paper does not change, only the ink. */
const paper = {
  deckSurface: "bg-paper-lift",
  itemSurface: "bg-paper-lift",
  ring: "ring-rule",
  ringSoft: "ring-rule/60",
  shadow: "shadow-[0_4px_0_0_var(--color-rule)]",
  hoverShadow: "hover:shadow-[0_6px_0_0_var(--color-rule)]",
};

export const themes: DeckTheme[] = [
  {
    ...paper,
    icon: "bg-[#c4713f]",
    text: "text-[#c4713f]",
    badge: "bg-[#c4713f] text-paper-lift",
    bar: "bg-[#c4713f]",
    soft: "text-[#c4713f]/25",
    stroke: "#c4713f",
  },
  {
    ...paper,
    icon: "bg-[#5e7a8e]",
    text: "text-[#5e7a8e]",
    badge: "bg-[#5e7a8e] text-paper-lift",
    bar: "bg-[#5e7a8e]",
    soft: "text-[#5e7a8e]/25",
    stroke: "#5e7a8e",
  },
  {
    ...paper,
    icon: "bg-[#a8232e]",
    text: "text-[#a8232e]",
    badge: "bg-[#a8232e] text-paper-lift",
    bar: "bg-[#a8232e]",
    soft: "text-[#a8232e]/25",
    stroke: "#a8232e",
  },
  {
    ...paper,
    icon: "bg-[#2e4a6b]",
    text: "text-[#2e4a6b]",
    badge: "bg-[#2e4a6b] text-paper-lift",
    bar: "bg-[#2e4a6b]",
    soft: "text-[#2e4a6b]/25",
    stroke: "#2e4a6b",
  },
  {
    ...paper,
    icon: "bg-[#3e7a5a]",
    text: "text-[#3e7a5a]",
    badge: "bg-[#3e7a5a] text-paper-lift",
    bar: "bg-[#3e7a5a]",
    soft: "text-[#3e7a5a]/25",
    stroke: "#3e7a5a",
  },
];

export const themeFor = (index: number): DeckTheme =>
  themes[((index % themes.length) + themes.length) % themes.length];
