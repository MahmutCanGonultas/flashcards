import { describe, expect, it } from "vitest";
import {
  buildDrill,
  buildExercises,
  buildSession,
  captionFor,
  cardFor,
  checkAnswer,
  chunkGaps,
  directionOf,
  editDistance,
  EXERCISE_LIMIT,
  exerciseFor,
  exerciseOrder,
  insertLater,
  labelFor,
  letterPattern,
  normalizeAnswer,
  ownGap,
  placeApart,
  placeLater,
  repeatOf,
  retryOf,
  sentenceGaps,
  skipStep,
  TYPED_KINDS,
  wantsOwnSentence,
  type Exercise,
  type Kind,
} from "./practice";
import { learnerDay } from "./day";
import { chunksOf, linesOf } from "./senses";
import { consider, makeCard } from "./testCards";

const NOW = Date.parse("2026-09-23T09:00:00.000Z");
const HOUR = 3_600_000;
const TODAY = learnerDay(NOW);
const YESTERDAY = learnerDay(NOW - 24 * HOUR);
const iso = (t: number) => new Date(t).toISOString();

const commit = makeCard({
  id: 1281,
  front: "commit",
  senses: [
    {
      pos: "verb",
      meaning: "kendini adamak",
      example_en: "Look, I'm committed to this project, even if it means late nights.",
      example_tr: "Bak, bu projeye kendimi adadım.",
    },
    { pos: "verb", meaning: "işlemek (suç)", example_en: "Nobody could believe he had committed fraud.", example_tr: "Kimse dolandırıcılık yaptığına inanamadı." },
  ],
  collocations: [
    { en: "commit a crime", tr: "suç işlemek" },
    { en: "be fully committed to sth", tr: "kendini tamamen adamak" },
  ],
});

describe("skipStep", () => {
  const plan = [
    { key: "1:0", cardId: 1, kind: "recall" as const, graded: true, attempt: 0 },
    { key: "2:0", cardId: 2, kind: "produce" as const, graded: true, attempt: 0 },
    { key: "3:0", cardId: 3, kind: "cloze" as const, graded: true, attempt: 0 },
  ];

  it("puts a passed card at the end of the round once, still graded", () => {
    const once = skipStep(plan, 0);
    expect(once.map((s) => s.key)).toEqual(["1:0", "2:0", "3:0", "1:0:skip"]);
    expect(once[3]).toMatchObject({ cardId: 1, graded: true, skipped: true });
    // passed again: it leaves the round and stays due
    expect(skipStep(once, 3)).toBe(once);
  });

  it("lets the last card go instead of asking it again at once", () => {
    expect(skipStep(plan, 2)).toBe(plan);
  });
});

describe("normalizeAnswer", () => {
  it("forgives case, accents, curly apostrophes, punctuation and spacing", () => {
    expect(normalizeAnswer("  Concern. ")).toBe("concern");
    expect(normalizeAnswer("It’s  FINE!")).toBe("it's fine");
    expect(normalizeAnswer("cliché")).toBe("cliche");
    expect(normalizeAnswer("well-being")).toBe("well being");
  });

  it("reads a Turkish keyboard's dotless and dotted capital i as i", () => {
    expect(normalizeAnswer("İNTERESTİNG")).toBe("interesting");
    expect(normalizeAnswer("ınterestıng")).toBe("interesting");
  });
});

describe("editDistance", () => {
  it("counts a swap of neighbours as one edit", () => {
    expect(editDistance("comitted", "committed")).toBe(1);
    expect(editDistance("teh", "the")).toBe(1);
    expect(editDistance("concern", "concern")).toBe(0);
    expect(editDistance("approach", "reproach")).toBe(2);
  });
});

describe("checkAnswer", () => {
  it("marks the exact form right", () => {
    expect(checkAnswer("committed", "committed", "commit")).toEqual({ grade: 5, tone: "right" });
    expect(checkAnswer(" Committed ", "committed", "commit").grade).toBe(5);
  });

  it("gives the right word in another form a 4", () => {
    expect(checkAnswer("commit", "committed", "commit")).toEqual({ grade: 4, tone: "form" });
    expect(checkAnswer("commits", "committed", "commit").tone).toBe("form");
  });

  it("forgives a small slip with a 3", () => {
    expect(checkAnswer("comitted", "committed", "commit")).toEqual({ grade: 3, tone: "slip" });
    expect(checkAnswer("establsh", "establish", "establish").tone).toBe("slip");
  });

  it("does not forgive slips in short words", () => {
    expect(checkAnswer("trent", "trend", "trend").grade).toBe(3);
    expect(checkAnswer("tred", "tren", "tren").grade).toBe(1);
  });

  it("marks another word wrong — a relative of the word included", () => {
    expect(checkAnswer("worry", "concern", "concern")).toEqual({ grade: 1, tone: "wrong" });
    expect(checkAnswer("commitment", "committed", "commit").grade).toBe(1);
    expect(checkAnswer("", "concern", "concern").grade).toBe(1);
  });

  it("caps a hinted answer at 3", () => {
    expect(checkAnswer("concern", "concern", "concern", { hinted: true })).toEqual({ grade: 3, tone: "right" });
  });
});

describe("gaps", () => {
  it("cuts the inflected form out of the card's sentences, up to the tier asked", () => {
    const gaps = sentenceGaps(commit, 2);
    expect(gaps.map((g) => g.answer)).toEqual(["committed", "committed"]);
    expect(gaps[0].before).toBe("Look, I'm ");
    expect(gaps[0].translation).toBe("Bak, bu projeye kendimi adadım.");
    expect(sentenceGaps(commit, 1)).toHaveLength(1);
  });

  it("cuts the word out of its chunks, with the chunk's Turkish as the cue", () => {
    expect(chunkGaps(commit, 1)).toEqual([{ before: "", answer: "commit", after: " a crime", translation: "suç işlemek" }]);
    expect(chunkGaps(commit, 2)).toHaveLength(2);
  });

  it("uses the learner's own sentence only when the word is in it", () => {
    expect(ownGap({ ...commit, my_sentence: "I committed to running every morning." })?.answer).toBe("committed");
    expect(ownGap({ ...commit, my_sentence: "I promised to run." })).toBeNull();
    expect(ownGap(commit)).toBeNull();
  });
});

describe("directionOf / cardFor / repeatOf", () => {
  it("asks from the Turkish on every other success", () => {
    expect([0, 1, 2, 3, 4].map((repetitions) => directionOf({ repetitions }))).toEqual(["fwd", "fwd", "rev", "fwd", "rev"]);
  });

  it("is the word and its meaning, graded as asked", () => {
    const young = { ...commit, repetitions: 3, interval: 7 };
    expect(cardFor(young, true)).toEqual({ key: "1281:0", cardId: 1281, kind: "recall", graded: true, attempt: 0, direction: "fwd" });
    expect(cardFor(young, false).graded).toBe(false);
  });

  it("is the Turkish to the word at the second success, still graded", () => {
    expect(cardFor({ ...commit, repetitions: 2, interval: 3 }, true)).toMatchObject({ kind: "reverse", direction: "rev", graded: true });
  });

  it("brings the sentence along for a word not learned the day it was met, and for a leech", () => {
    expect(cardFor({ ...commit, repetitions: 0, interval: 1, lapses: 1 }, true)).toMatchObject({ kind: "recall", support: true });
    expect(cardFor({ ...commit, repetitions: 1, interval: 1, lapses: 3 }, true)).toMatchObject({ support: true });
    expect(cardFor({ ...commit, repetitions: 1, interval: 1, lapses: 1 }, true).support).toBeUndefined();
  });

  it("asks a missed card again the same way round, never graded", () => {
    const missed = cardFor({ ...commit, repetitions: 2, interval: 3 }, true);
    expect(repeatOf(missed, 1, true)).toMatchObject({ kind: "reverse", direction: "rev", graded: false, attempt: 1, support: true, relearn: true });
    expect(repeatOf(cardFor(commit, true), 2, false)).toMatchObject({ kind: "recall", support: false, key: "1281:again:2" });
  });

  it("never asks the reverse card by typing", () => {
    expect(TYPED_KINDS.has("reverse")).toBe(false);
  });
});

describe("labelFor / captionFor", () => {
  const step = (over: Partial<Exercise>): Exercise => ({ key: "1:x", cardId: 1, kind: "recall", graded: false, attempt: 0, ...over });

  it("counts a new word's asks and names a card that is back", () => {
    expect(labelFor(step({ learn: 1 }))).toBe("Yeni · 1/3");
    expect(labelFor(step({ learn: 2 }))).toBe("Yeni · 2/3");
    expect(labelFor(step({ learn: 3, kind: "reverse" }))).toBe("İngilizcesi ne? · 3/3");
    expect(labelFor(step({ learn: 1, attempt: 1 }))).toBe("Bir daha");
    expect(labelFor(step({ attempt: 2 }))).toBe("Bir daha");
    expect(labelFor(step({ kind: "reverse" }))).toBe("İngilizcesi ne?");
  });

  it("asks for the answer aloud before the turn, and holds each grade to one standard", () => {
    const at = (over: Partial<Parameters<typeof captionFor>[0]>) => captionFor({ kind: "recall", attempt: 0, flipped: false, ...over });
    expect(at({})).toBe("Türkçesini sesli söyle, sonra çevir.");
    expect(at({ kind: "listen" })).toBe("Dinle, anlamını sesli söyle, sonra çevir.");
    expect(at({ attempt: 1 })).toBe("Bir daha: sesli söyle, sonra çevir.");
    expect(at({ attempt: 1, support: true })).toBe("Cümle yardım etsin: anlamını sesli söyle, sonra çevir.");
    expect(at({ kind: "reverse" })).toBe("İngilizcesini sesli söyle, sonra çevir.");
    expect(at({ rushed: true })).toBe("Acele yok: önce sesli söyle, sonra çevir.");
    expect(at({ flipped: true })).toBe("Büyük yazan anlam çevirmeden geldiyse: Bildim.");
    expect(at({ flipped: true, kind: "reverse" })).toBe("Kelime çevirmeden geldiyse Bildim; -ing, -s farkı sorun değil.");
    expect(at({ flipped: true, rushed: true })).toBe("Büyük yazan anlam çevirmeden geldiyse: Bildim.");
  });
});

describe("exerciseFor", () => {
  const ctx = { day: 20354, speech: true, now: NOW };
  const all = (card: typeof commit, days = 12, speech = true) => Array.from({ length: days }, (_, day) => exerciseFor(card, { day, speech, now: NOW }));
  const kinds = (card: typeof commit, speech = true) => [...new Set(all(card, 12, speech).map((e) => e.kind))].sort();

  it("finds a word met today in its sentence with the Turkish open, or in its core chunk", () => {
    const today = consider({ repetitions: 1, interval: 1, introduced_on: TODAY });
    expect(kinds(today)).toEqual(["chunk", "cloze"]);
    expect(all(today).filter((e) => e.kind === "cloze").every((e) => e.openTranslation)).toBe(true);
    expect(all(today).filter((e) => e.kind === "chunk").every((e) => e.gap?.translation === "taşınmayı düşünmek")).toBe(true);
  });

  it("has a word still learning from an earlier day produced too, its Turkish behind a tap", () => {
    for (const card of [consider({ repetitions: 1, interval: 1, introduced_on: YESTERDAY }), consider({ repetitions: 0, interval: 1, introduced_on: YESTERDAY })]) {
      expect(kinds(card)).toEqual(["chunk", "cloze", "produce"]);
      expect(all(card).some((e) => e.kind === "cloze" && e.openTranslation)).toBe(false);
    }
  });

  it("keeps a learning word to its core sense", () => {
    const learning = consider({ repetitions: 1, interval: 1, introduced_on: YESTERDAY });
    const lines = linesOf(learning, 1).map((l) => l.en);
    const chunks = chunksOf(learning, 1).map((c) => c.en);
    for (const e of all(learning, 40)) {
      const text = e.gap ? `${e.gap.before}${e.gap.answer}${e.gap.after}` : null;
      if (e.kind === "cloze") expect(lines).toContain(text);
      if (e.kind === "chunk") expect(chunks).toContain(text);
    }
  });

  it("opens the second sense's sentences and chunks from the third success on", () => {
    const held = consider({ repetitions: 3, interval: 7, introduced_on: "2026-09-01" });
    const texts = all(held, 40).map((e) => (e.gap ? `${e.gap.before}${e.gap.answer}${e.gap.after}` : ""));
    expect(texts.some((t) => t === "I consider Ali a good friend." || t === "My parents consider English very important." || t === "consider an offer")).toBe(true);
    expect(texts).not.toContain("Consider the traffic, and leave home early.");
    expect(texts).not.toContain("consider your options");
  });

  it("makes a word that holds be produced, heard, and put in the learner's own sentence", () => {
    const young = consider({ repetitions: 3, interval: 7, introduced_on: "2026-09-01", my_sentence: "I'm considering a new phone." });
    expect(kinds(young)).toEqual(["chunk", "cloze", "listen", "own", "produce"]);
    expect(kinds(young, false)).not.toContain("listen");
    expect(kinds({ ...young, my_sentence: null })).not.toContain("own");
  });

  it("is never graded and never the card itself", () => {
    for (const card of [commit, { ...commit, repetitions: 3, interval: 15 }, { ...commit, repetitions: 5, interval: 40 }]) {
      for (const e of all(card)) {
        expect(e.graded).toBe(false);
        expect(["recall", "reverse", "meet", "write"]).not.toContain(e.kind);
      }
    }
  });

  it("gives the same word the same question in the same round", () => {
    const young = { ...commit, repetitions: 2, interval: 6 };
    expect(exerciseFor(young, ctx)).toEqual(exerciseFor(young, ctx));
  });
});

describe("wantsOwnSentence", () => {
  it("is never offered on the day a word is met", () => {
    expect(wantsOwnSentence(consider({ repetitions: 1, interval: 1, introduced_on: TODAY }), NOW)).toBe(false);
    expect(wantsOwnSentence(consider({ repetitions: 1, interval: 1, introduced_on: YESTERDAY }), NOW)).toBe(true);
    expect(wantsOwnSentence(consider({ repetitions: 0, interval: 0 }), NOW)).toBe(false);
    expect(wantsOwnSentence(consider({ repetitions: 2, interval: 3, introduced_on: YESTERDAY, my_sentence: "I'm considering it." }), NOW)).toBe(false);
  });
});

describe("buildSession", () => {
  const due = "2026-09-23T06:00:00.000Z";
  const later = "2026-09-30T21:00:00.000Z";
  const fresh = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => makeCard({ id: 100 + i, front: `word${i}`, due_date: due }));
  const reviews = [1, 2, 3, 4, 5, 6].map((i) => makeCard({ id: 200 + i, front: `known${i}`, repetitions: 3, interval: 7, due_date: due }));
  const fillers = [1, 2, 3, 4, 5].map((i) => makeCard({ id: 300 + i, front: `later${i}`, repetitions: 3, interval: 7, due_date: later }));
  const letter = (id: number) => "ABCDEFGH"[id - 101];
  const name = (s: Exercise) =>
    s.kind === "meet"
      ? `M_${letter(s.cardId)}`
      : s.learn
        ? `${letter(s.cardId)}${s.learn}${s.kind === "reverse" ? "r" : ""}`
        : s.filler
          ? `f${s.cardId - 300}`
          : `r${s.cardId - 200}`;
  const round = (cards: typeof fresh, extra: typeof fillers = []) => buildSession(cards, { mode: "due", now: NOW, fillers: extra }).map(name).join(" ");

  it("spaces three new words out with nothing else to put between them", () => {
    expect(round(fresh.slice(0, 3))).toBe("M_A M_B M_C A1 B1 C1 A2 B2 C2 A3r B3r C3r");
  });

  it("keeps the gaps with words that aren't due, four at most, the soonest first", () => {
    expect(round(fresh.slice(0, 3), [...fillers].reverse())).toBe("M_A M_B M_C f1 A1 B1 C1 f2 f3 f4 A2 B2 C2 A3r B3r C3r");
  });

  it("puts the reviews in the gaps, one first to warm up", () => {
    expect(round([...reviews.slice(0, 3), ...fresh.slice(0, 3)])).toBe("r1 M_A M_B M_C r2 A1 B1 C1 r3 A2 B2 C2 A3r B3r C3r");
    expect(round([...reviews, ...fresh.slice(0, 3)])).toBe("r1 M_A M_B M_C r2 A1 B1 C1 r3 r4 r5 A2 B2 C2 r6 A3r B3r C3r");
  });

  it("works with two new words, or one", () => {
    expect(round(fresh.slice(0, 2))).toBe("M_A M_B A1 B1 A2 B2 A3r B3r");
    // the second ask could only come straight after the first: it is left out
    expect(round([...reviews.slice(0, 2), fresh[0]])).toBe("r1 M_A r2 A1 A3r");
  });

  it("meets three new words at most, whatever the server sends", () => {
    const plan = buildSession(fresh, { mode: "due", now: NOW });
    expect(plan.filter((s) => s.kind === "meet")).toHaveLength(3);
    expect(new Set(plan.map((s) => s.cardId))).toEqual(new Set([101, 102, 103]));
  });

  it("grades every review exactly once and no learning step", () => {
    const plan = buildSession([...reviews, ...fresh], { mode: "due", now: NOW, fillers });
    expect(plan.filter((s) => s.learn || s.kind === "meet" || s.filler).every((s) => !s.graded)).toBe(true);
    expect(plan.filter((s) => s.graded).map((s) => s.cardId).sort()).toEqual([201, 202, 203, 204, 205, 206]);
    expect(new Set(plan.map((s) => s.key)).size).toBe(plan.length);
  });

  it("is only ever flips: no exercise is mixed in, whatever the word's stage", () => {
    const mature = makeCard({ ...commit, id: 400, repetitions: 5, interval: 40, due_date: due, my_sentence: "I committed to running." });
    const reverse = makeCard({ ...commit, id: 401, repetitions: 4, interval: 18, due_date: due });
    const plan = buildSession([mature, reverse, ...reviews, ...fresh], { mode: "due", now: NOW });
    expect(new Set(plan.map((s) => s.kind))).toEqual(new Set<Kind>(["meet", "recall", "reverse"]));
  });

  it("is just the reviews when there is no new word", () => {
    expect(round(reviews.slice(0, 3), fillers)).toBe("r1 r2 r3");
  });

  it("goes through the words already met, grading only the ones that are due", () => {
    const notYet = makeCard({ id: 300, front: "later", repetitions: 2, interval: 6, due_date: later });
    const plan = buildSession([reviews[0], notYet, fresh[0]], { mode: "all", now: NOW });
    expect(plan.map((s) => s.cardId)).toEqual([201, 300]);
    expect(plan.find((s) => s.cardId === 201)?.graded).toBe(true);
    expect(plan.find((s) => s.cardId === 300)).toMatchObject({ graded: false, kind: "reverse" });
  });
});

describe("placeLater", () => {
  const plan = [1, 2, 3, 4, 5, 6].map((id) => ({ key: `${id}:0`, cardId: id, kind: "recall" as const, graded: true, attempt: 0 }));
  const again = (cardId: number) => ({ key: `${cardId}:again`, cardId, kind: "recall" as const, graded: false, attempt: 1 });

  it("puts a step back the gap asked, or last", () => {
    expect(placeLater(plan, 0, again(1), 3).map((s) => s.cardId)).toEqual([1, 2, 3, 4, 1, 5, 6]);
    expect(placeLater(plan, 3, again(4), 5).map((s) => s.cardId)).toEqual([1, 2, 3, 4, 5, 6, 4]);
  });

  it("never puts a word next to itself", () => {
    expect(placeLater(plan, 5, again(6), 3)).toBe(plan);
    expect(placeLater(plan, 0, again(5), 3)).toBe(plan);
    expect(placeLater(plan, 0, again(4), 3)).toBe(plan);
  });
});

describe("exerciseOrder / buildExercises", () => {
  const word = (id: number, over: Parameters<typeof consider>[0]) => consider({ id, repetitions: 2, interval: 3, introduced_on: "2026-09-01", ...over });
  const between1 = word(1, { repetitions: 1, interval: 1, reviewed_at: iso(NOW - 30 * HOUR), due_date: iso(NOW + 20 * HOUR) });
  const between2 = word(2, { reviewed_at: iso(NOW - 30 * HOUR), due_date: iso(NOW + 44 * HOUR) });
  const metToday = word(3, { repetitions: 1, interval: 1, introduced_on: TODAY, reviewed_at: iso(NOW - HOUR), due_date: iso(NOW + 20 * HOUR) });
  const longAgo = word(4, { repetitions: 5, interval: 40, reviewed_at: iso(NOW - 20 * 24 * HOUR), due_date: iso(NOW + 20 * 24 * HOUR) });
  const lessLongAgo = word(5, { reviewed_at: iso(NOW - 30 * HOUR), due_date: iso(NOW + 10 * 24 * HOUR) });
  const onCardsToday = word(6, { reviewed_at: iso(NOW - 2 * HOUR), due_date: iso(NOW + 3 * 24 * HOUR) });
  const focused = word(7, { reviewed_at: iso(NOW - HOUR), due_date: iso(NOW + 6 * 24 * HOUR) });
  const everyone = [onCardsToday, lessLongAgo, longAgo, metToday, between2, between1, focused];

  it("ranks the words asked for, the days between reviews, today's new words, the rest, today's cards", () => {
    expect(exerciseOrder(everyone, { now: NOW, focusIds: [7] }).map((c) => c.id)).toEqual([7, 1, 2, 3, 4, 5, 6]);
    expect(exerciseOrder(everyone, { now: NOW }).map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("puts a word due now and not yet on the cards last: its review comes first", () => {
    const dueNow = word(8, { repetitions: 1, interval: 1, reviewed_at: iso(NOW - 30 * HOUR), due_date: iso(NOW - 5 * HOUR) });
    expect(exerciseOrder([dueNow, ...everyone], { now: NOW }).map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // Asked for by name, it still comes first.
    expect(exerciseOrder([dueNow, ...everyone], { now: NOW, focusIds: [8] })[0].id).toBe(8);
  });

  it("never takes a word not yet met, and grades nothing", () => {
    const brandNew = [1, 2].map((i) => consider({ id: 600 + i }));
    const plan = buildExercises([...brandNew, ...everyone], { speech: false, now: NOW });
    expect(plan.some((s) => s.cardId > 600)).toBe(false);
    expect(plan.every((s) => !s.graded && !["recall", "reverse", "meet"].includes(s.kind))).toBe(true);
    expect(new Set(plan.map((s) => s.key)).size).toBe(plan.length);
  });

  it("keeps a round to ten words", () => {
    const many = Array.from({ length: 20 }, (_, i) => word(700 + i, {}));
    expect(buildExercises(many, { speech: false, now: NOW })).toHaveLength(EXERCISE_LIMIT);
  });

  it("asks each of a few words twice, two ways, all the first asks first", () => {
    const three = [11, 12, 13].map((id) => word(id, { repetitions: 1, interval: 1, introduced_on: TODAY, reviewed_at: iso(NOW - HOUR) }));
    const plan = buildExercises(three, { speech: false, now: NOW });
    expect(plan.map((s) => s.cardId)).toEqual([11, 12, 13, 11, 12, 13]);
    for (const id of [11, 12, 13]) {
      const asked = plan.filter((s) => s.cardId === id).map((s) => s.kind);
      expect(new Set(asked).size).toBe(2);
    }
  });
});

describe("retryOf", () => {
  it("asks a missed exercise again once, as the same question with the Turkish open, ungraded", () => {
    const held = { ...commit, repetitions: 3, interval: 15 };
    const first = Array.from({ length: 12 }, (_, day) => exerciseFor(held, { day, speech: false, now: NOW })).find((e) => e.kind === "cloze")!;
    const again = retryOf(first);
    expect(first.openTranslation).toBeUndefined();
    expect(again).toMatchObject({ kind: "cloze", cardId: first.cardId, gap: first.gap, attempt: 1, graded: false, openTranslation: true });
    expect(again!.key).not.toBe(first.key);
    // missed again: the round moves on
    expect(retryOf(again!)).toBeNull();
  });
});

describe("buildDrill", () => {
  it("asks one word every way its content allows, never graded", () => {
    const drill = buildDrill({ ...commit, repetitions: 3, interval: 15, my_sentence: "I committed to running." });
    expect(drill.map((s) => s.kind)).toEqual(["cloze", "produce", "chunk", "cloze"]);
    expect(drill.every((s) => !s.graded && TYPED_KINDS.has(s.kind))).toBe(true);
    expect(new Set(drill.map((s) => s.key)).size).toBe(drill.length);
  });

  it("keeps to the core sense while the word is learning", () => {
    const learning = consider({ repetitions: 1, interval: 1 });
    const drill = buildDrill(learning);
    const core = linesOf(learning, 1).map((l) => l.en);
    const clozes = drill.filter((s) => s.kind === "cloze").map((s) => `${s.gap!.before}${s.gap!.answer}${s.gap!.after}`);
    expect(clozes).toEqual(core);
    expect(drill.find((s) => s.kind === "chunk")?.gap?.translation).toBe("taşınmayı düşünmek");
  });
});

describe("insertLater", () => {
  it("puts a step back three steps on, or last", () => {
    expect(insertLater(["a", "b", "c", "d", "e", "f"], 0, "X")).toEqual(["a", "b", "c", "d", "X", "e", "f"]);
    expect(insertLater(["a", "b"], 1, "X")).toEqual(["a", "b", "X"]);
  });
});

describe("placeApart", () => {
  // The first day: three words, two exercises each (A1 B1 C1 A2 B2 C2).
  const plan = [1, 2, 3, 1, 2, 3].map((id, i) => ({ key: `${id}:ex${i < 3 ? "" : "2"}`, cardId: id, kind: "cloze" as const, graded: false, attempt: 0 }));
  const retry = (cardId: number) => ({ key: `${cardId}:ex:again`, cardId, kind: "cloze" as const, graded: false, attempt: 1 });
  const order = (p: Exercise[]) => p.map((s) => `${s.cardId}${s.attempt ? "r" : ""}`).join(" ");

  it("never puts a missed exercise back next to the same word's other one", () => {
    expect(order(placeApart(plan, 0, retry(1)))).toBe("1 2 3 1 2 1r 3");
    expect(order(placeApart(plan, 1, retry(2)))).toBe("1 2 3 1 2 3 2r");
    // No room after the word's second exercise: before it instead, never straight after the miss.
    expect(order(placeApart(plan, 2, retry(3)))).toBe("1 2 3 1 3r 2 3");
  });

  it("keeps the retry, last, when there is nowhere else", () => {
    const one = plan.slice(0, 1);
    expect(order(placeApart(one, 0, retry(1)))).toBe("1 1r");
    expect(order(placeApart(plan, 5, retry(3)))).toBe("1 2 3 1 2 3 3r");
  });

  it("puts it three steps on when that is clear of the word", () => {
    const long = [1, 2, 3, 4, 5, 6].map((id) => ({ key: `${id}:ex`, cardId: id, kind: "cloze" as const, graded: false, attempt: 0 }));
    expect(order(placeApart(long, 0, retry(1)))).toBe("1 2 3 4 1r 5 6");
  });
});

describe("letterPattern", () => {
  it("shows a dot per letter, spaces kept, and the revealed letters", () => {
    expect(letterPattern("concern")).toBe("•••••••");
    expect(letterPattern("concern", 1)).toBe("c••••••");
    expect(letterPattern("give up", 1)).toBe("g••• ••");
  });
});
