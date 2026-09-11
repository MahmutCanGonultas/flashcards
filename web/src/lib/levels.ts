/**
 * One colour per CEFR level, used for the line on the path map, the unit
 * plates and the level badges. Complete Tailwind class strings, never
 * assembled from fragments, so the scanner can see them.
 */
export type LevelTheme = {
  name: string;
  nameTr: string;
  /** Solid fill for done stations and the unit plate stripe. */
  fill: string;
  /** Ring colour for the current station. */
  ring: string;
  /** SVG stroke for the line. */
  stroke: string;
  /** Border for an optional (tested-out) station. */
  border: string;
  /** Outline for an open square stop. */
  outline: string;
  /** Text colour for words on the map. */
  text: string;
  /** Soft tint for backgrounds. */
  soft: string;
  /** Badge gradient. */
  badge: string;
  hex: string;
};

export const LEVELS: Record<string, LevelTheme> = {
  A1: {
    name: "Beginner",
    nameTr: "Başlangıç",
    fill: "bg-violet-500",
    ring: "ring-violet-500",
    stroke: "stroke-violet-500",
    border: "border-violet-400",
    outline: "outline-violet-400",
    text: "text-violet-700",
    soft: "bg-violet-50",
    badge: "from-violet-500 to-fuchsia-500",
    hex: "#8B5CF6",
  },
  A2: {
    name: "Elementary",
    nameTr: "Temel",
    fill: "bg-sky-500",
    ring: "ring-sky-500",
    stroke: "stroke-sky-500",
    border: "border-sky-400",
    outline: "outline-sky-400",
    text: "text-sky-700",
    soft: "bg-sky-50",
    badge: "from-sky-500 to-cyan-500",
    hex: "#0EA5E9",
  },
  B1: {
    name: "Intermediate",
    nameTr: "Orta",
    fill: "bg-emerald-500",
    ring: "ring-emerald-500",
    stroke: "stroke-emerald-500",
    border: "border-emerald-400",
    outline: "outline-emerald-400",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    badge: "from-emerald-500 to-teal-500",
    hex: "#10B981",
  },
  B2: {
    name: "Upper intermediate",
    nameTr: "Orta üstü",
    fill: "bg-amber-500",
    ring: "ring-amber-500",
    stroke: "stroke-amber-500",
    border: "border-amber-400",
    outline: "outline-amber-400",
    text: "text-amber-700",
    soft: "bg-amber-50",
    badge: "from-amber-400 to-orange-500",
    hex: "#F59E0B",
  },
  C1: {
    name: "Advanced",
    nameTr: "İleri",
    fill: "bg-rose-500",
    ring: "ring-rose-500",
    stroke: "stroke-rose-500",
    border: "border-rose-400",
    outline: "outline-rose-400",
    text: "text-rose-700",
    soft: "bg-rose-50",
    badge: "from-rose-500 to-pink-500",
    hex: "#F43F5E",
  },
};

export const levelTheme = (level: string | null): LevelTheme => LEVELS[level ?? ""] ?? LEVELS.A1;
