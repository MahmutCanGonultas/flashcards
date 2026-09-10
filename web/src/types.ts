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
  ease_factor: number;
  interval: number;
  repetitions: number;
  due_date: string;
  created_at: string;
};

/** The SM-2 grades the study screen exposes. The backend accepts 0-5. */
export type ReviewQuality = 1 | 3 | 4 | 5;
