/**
 * One name and one story line per CEFR level. The map used to colour
 * itself by level too; it is printed in one ink now, so only the words
 * remain.
 */
export type LevelTheme = {
  name: string;
  /** Where Elif and Tom are in their story at this level — the dialogues' arc. */
  story: string;
};

export const LEVELS: Record<string, LevelTheme> = {
  A1: { name: "Başlangıç", story: "Elif ve Tom okulda tanışıyor" },
  A2: { name: "Temel", story: "Aynı şehirde iki genç" },
  B1: { name: "Orta", story: "Üniversite yılları, bazen ayrı düşüyorlar" },
  B2: { name: "Orta üstü", story: "İlk gerçek işler, gerçek tartışmalar" },
  C1: { name: "İleri", story: "Eski dostlar, sivri diller" },
};

export const levelTheme = (level: string | null): LevelTheme => LEVELS[level ?? ""] ?? LEVELS.A1;
