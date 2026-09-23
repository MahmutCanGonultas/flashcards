/**
 * Five bright colours cycled per unit across the course half — orange,
 * sky, red, blue, green — each on a small tile, a bar or a badge. The
 * cards underneath are always the same white, so a row of units reads as
 * one page, not a rainbow.
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
    icon: "bg-[#e07c00]",
    text: "text-[#e07c00]",
    badge: "bg-[#e07c00] text-white",
    bar: "bg-[#e07c00]",
    soft: "text-[#e07c00]/25",
    stroke: "#e07c00",
  },
  {
    ...paper,
    icon: "bg-[#1899d6]",
    text: "text-[#1899d6]",
    badge: "bg-[#1899d6] text-white",
    bar: "bg-[#1899d6]",
    soft: "text-[#1899d6]/25",
    stroke: "#1899d6",
  },
  {
    ...paper,
    icon: "bg-[#ea2b2b]",
    text: "text-[#ea2b2b]",
    badge: "bg-[#ea2b2b] text-white",
    bar: "bg-[#ea2b2b]",
    soft: "text-[#ea2b2b]/25",
    stroke: "#ea2b2b",
  },
  {
    ...paper,
    icon: "bg-[#2b70c9]",
    text: "text-[#2b70c9]",
    badge: "bg-[#2b70c9] text-white",
    bar: "bg-[#2b70c9]",
    soft: "text-[#2b70c9]/25",
    stroke: "#2b70c9",
  },
  {
    ...paper,
    icon: "bg-[#58a700]",
    text: "text-[#58a700]",
    badge: "bg-[#58a700] text-white",
    bar: "bg-[#58a700]",
    soft: "text-[#58a700]/25",
    stroke: "#58a700",
  },
];

export const themeFor = (index: number): DeckTheme =>
  themes[((index % themes.length) + themes.length) % themes.length];
