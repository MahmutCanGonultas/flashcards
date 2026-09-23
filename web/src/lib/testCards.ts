import type { Card } from "../types";

/** A card as the API returns it, with only what a test cares about overridden. */
export function makeCard(overrides: Partial<Card> & Pick<Card, "id" | "front">): Card {
  return {
    deck_id: 49,
    back: "(verb) kendini adamak",
    tag: null,
    example_sentence: null,
    example_tr: null,
    example2: null,
    example2_tr: null,
    mnemonic: null,
    senses: null,
    related: null,
    watch_out: null,
    collocations: null,
    tint: null,
    my_sentence: null,
    lesson: null,
    unit_id: null,
    ease_factor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    reviewed_at: null,
    due_date: "2026-09-23T06:00:00.000Z",
    created_at: "2026-09-16T09:00:00.000Z",
    ...overrides,
  };
}
