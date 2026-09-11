export type Deck = {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
};

export type Card = {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  /** Optional grouping label, e.g. "Day 3" for a multi-day program deck. */
  tag: string | null;
  /** Optional: `front` used in a sentence. */
  example_sentence: string | null;
  /** Optional photo -- only set for cards where a real image helps (concrete nouns). */
  image_url: string | null;
  /** Optional memory aid, usually the word's root/etymology. */
  mnemonic: string | null;
  /** Optional lesson number. A deck whose cards carry these renders as a path. */
  lesson: number | null;
  /** The unit this card's lesson belongs to, for path-organised decks. */
  unit_id: number | null;
  ease_factor: number;
  interval: number;
  repetitions: number;
  due_date: string;
  created_at: string;
};

/** The SM-2 grades the study screen exposes. The backend accepts 0-5. */
export type ReviewQuality = 1 | 3 | 4 | 5;

export type DialogueLine = { speaker: string; en: string; tr: string };

export type GrammarRule = { rule: string; example_en: string; example_tr: string };
export type GrammarQuiz = { question: string; options: string[]; answer: number; explain: string };

/** One short grammar note per unit, written in Tonton's voice. */
export type GrammarNote = {
  unit: number;
  title_en: string;
  title_tr: string;
  hook: string;
  rules: GrammarRule[];
  watch_out: string;
  memory_trick: string;
  quiz: GrammarQuiz[];
};

export type Dialogue = { title: string; lines: DialogueLine[] };

/** One themed stretch of a deck's path, with this learner's test history. */
export type UnitRecord = {
  id: number;
  position: number;
  title: string;
  /** The title in the learner's language, shown beside the English one. */
  title_tr: string | null;
  /** CEFR level of the unit's words: "A1", "A2", "B1"... */
  level: string | null;
  dialogue: Dialogue | null;
  grammar: GrammarNote | null;
  /** Whether the learner has ever passed this unit's test — or placed past it. */
  passed: boolean;
  /** Skipped by the placement test rather than earned. */
  placed: boolean;
  /** Best real test score; placement doesn't count. */
  best_score: number | null;
  attempts: number;
};
