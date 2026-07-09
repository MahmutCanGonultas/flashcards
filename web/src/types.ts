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
  ease_factor: number;
  interval: number;
  repetitions: number;
  due_date: string;
  created_at: string;
};

/** The SM-2 grades the study screen exposes. The backend accepts 0-5. */
export type ReviewQuality = 1 | 3 | 4 | 5;
