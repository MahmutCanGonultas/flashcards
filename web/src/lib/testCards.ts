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

/** A rich card shaped like the learner's own "consider": a core sense, a second one, one for the word's page. */
export const consider = (overrides: Partial<Card> = {}): Card =>
  makeCard({
    id: 3001,
    front: "consider",
    back: "(verb) (yapmayı) düşünmek",
    senses: [
      {
        pos: "verb",
        tier: 1,
        gloss: "(yapmayı) düşünmek",
        meaning: "(yapmayı) düşünmek, değerlendirmek",
        example_en: "We're considering moving to Izmir next year.",
        example_tr: "Seneye İzmir'e taşınmayı düşünüyoruz.",
        examples: [{ en: "I'm considering a new job in Izmir.", tr: "İzmir'de yeni bir işi düşünüyorum." }],
      },
      {
        pos: "verb",
        tier: 2,
        gloss: "… olarak görmek",
        meaning: "saymak, … olarak görmek",
        example_en: "I consider Ali a good friend.",
        example_tr: "Ali'yi iyi bir arkadaş olarak görüyorum.",
        examples: [{ en: "My parents consider English very important.", tr: "Annemle babam İngilizceyi çok önemli görüyor." }],
      },
      {
        pos: "verb",
        tier: 3,
        meaning: "hesaba katmak",
        example_en: "Consider the traffic, and leave home early.",
        example_tr: "Trafiği hesaba kat ve evden erken çık.",
      },
    ],
    collocations: [
      { en: "consider moving", tr: "taşınmayı düşünmek", sense: 0 },
      { en: "consider an offer", tr: "bir teklifi değerlendirmek", sense: 1 },
      { en: "consider your options", tr: "seçeneklerini iyice düşünmek", sense: 2 },
    ],
    // What the importer puts on the card itself: ignored while the senses carry sentences.
    example_sentence: "We're considering moving to Izmir next year.",
    example2: "I'm considering a new job in Izmir.",
    ...overrides,
  });
