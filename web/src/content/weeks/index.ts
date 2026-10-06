/**
 * Each programme week's two texts, shipped with the app like the grammar:
 * a reading (Friday) built from the week's words and the ones before, and a
 * Turkish text to translate (Saturday). Every English line stays inside the
 * learner's grammar list. One JSON file per week, loaded when it's opened.
 */
export type WeekLine = { en: string; tr: string };

export type WeekText = {
  week: number;
  theme_tr: string;
  reading: { title: string; lines: WeekLine[] };
  translation: { title: string; lines: WeekLine[] };
};

const files = import.meta.glob<WeekText>("./week-*.json", { import: "default" });

const keyOf = (week: number) => `./week-${String(week).padStart(2, "0")}.json`;

export const hasWeekText = (week: number) => keyOf(week) in files;

export async function loadWeekText(week: number): Promise<WeekText | null> {
  const load = files[keyOf(week)];
  return load ? load() : null;
}
