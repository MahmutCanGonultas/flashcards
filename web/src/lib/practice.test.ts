import { describe, expect, it } from "vitest";
import {
  buildDrill,
  buildExercises,
  buildSession,
  cardFor,
  checkAnswer,
  chunkGaps,
  editDistance,
  EXERCISE_LIMIT,
  exerciseFor,
  insertLater,
  letterPattern,
  normalizeAnswer,
  ownGap,
  retryOf,
  sentenceGaps,
  sentencesOf,
  skipStep,
  TYPED_KINDS,
} from "./practice";
import { makeCard } from "./testCards";

const NOW = Date.parse("2026-09-23T09:00:00.000Z");

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

describe("sentencesOf", () => {
  it("leads with each sense's main sentence and keeps the extra ones for later", () => {
    const card = makeCard({
      id: 7,
      front: "achieve",
      example_sentence: "Frances achieved great exam results.",
      senses: [
        {
          meaning: "başarmak",
          example_en: "She achieved her goal.",
          example_tr: "Hedefine ulaştı.",
          examples: [
            { en: "Frances achieved great exam results.", tr: "Frances harika sonuçlar elde etti." },
            { en: "You can achieve anything.", tr: null },
          ],
        },
        { meaning: "ulaşmak", example_en: "The factory achieved a 30% reduction.", example_tr: null },
      ],
    });
    expect(sentencesOf(card).map((l) => l.en)).toEqual([
      "She achieved her goal.",
      "The factory achieved a 30% reduction.",
      "Frances achieved great exam results.",
      "You can achieve anything.",
    ]);
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
  it("cuts the inflected form out of the card's sentences", () => {
    const gaps = sentenceGaps(commit);
    expect(gaps.map((g) => g.answer)).toEqual(["committed", "committed"]);
    expect(gaps[0].before).toBe("Look, I'm ");
    expect(gaps[0].translation).toBe("Bak, bu projeye kendimi adadım.");
  });

  it("cuts the word out of its chunks, with the chunk's Turkish as the cue", () => {
    expect(chunkGaps(commit)[0]).toEqual({ before: "", answer: "commit", after: " a crime", translation: "suç işlemek" });
  });

  it("uses the learner's own sentence only when the word is in it", () => {
    expect(ownGap({ ...commit, my_sentence: "I committed to running every morning." })?.answer).toBe("committed");
    expect(ownGap({ ...commit, my_sentence: "I promised to run." })).toBeNull();
    expect(ownGap(commit)).toBeNull();
  });
});

describe("cardFor", () => {
  it("is the word and its meaning, graded as asked", () => {
    const young = { ...commit, repetitions: 2, interval: 6 };
    expect(cardFor(young, true)).toEqual({ key: "1281:0", cardId: 1281, kind: "recall", graded: true, attempt: 0 });
    expect(cardFor(young, false).graded).toBe(false);
  });

  it("brings the sentence along for a word missed last time", () => {
    const missed = { ...commit, repetitions: 0, interval: 1, lapses: 1 };
    expect(cardFor(missed, true)).toMatchObject({ kind: "recall", support: true });
  });
});

describe("exerciseFor", () => {
  const ctx = { day: 20354, speech: true };
  const all = (card: typeof commit, days = 12, speech = true) => Array.from({ length: days }, (_, day) => exerciseFor(card, { day, speech }));

  it("eases a new or half-learned word in: its sentence with the Turkish open, or one of its phrases", () => {
    for (const card of [commit, { ...commit, repetitions: 1, interval: 1 }, { ...commit, repetitions: 0, interval: 1, lapses: 1 }]) {
      const asked = all(card);
      expect([...new Set(asked.map((e) => e.kind))].sort()).toEqual(["chunk", "cloze"]);
      expect(asked.filter((e) => e.kind === "cloze").every((e) => e.openTranslation)).toBe(true);
    }
  });

  it("makes a word that holds be produced", () => {
    const kinds = new Set(all({ ...commit, repetitions: 3, interval: 15 }).map((e) => e.kind));
    expect([...kinds].sort()).toEqual(["chunk", "cloze", "produce"]);
  });

  it("brings the learner's own sentence and listening in once a word is mature", () => {
    const mature = { ...commit, repetitions: 5, interval: 40, my_sentence: "I committed to running every morning." };
    const kinds = new Set(all(mature).map((e) => e.kind));
    expect(kinds.has("own")).toBe(true);
    expect(kinds.has("listen")).toBe(true);
    expect(all(mature, 12, false).some((e) => e.kind === "listen")).toBe(false);
  });

  it("is never graded and never the card itself", () => {
    for (const card of [commit, { ...commit, repetitions: 3, interval: 15 }, { ...commit, repetitions: 5, interval: 40 }]) {
      for (const e of all(card)) {
        expect(e.graded).toBe(false);
        expect(["recall", "meet", "write"]).not.toContain(e.kind);
      }
    }
  });

  it("gives the same word the same question in the same round", () => {
    const young = { ...commit, repetitions: 2, interval: 6 };
    expect(exerciseFor(young, ctx)).toEqual(exerciseFor(young, ctx));
  });
});

describe("buildSession", () => {
  const due = "2026-09-23T06:00:00.000Z";
  const later = "2026-09-30T21:00:00.000Z";
  const fresh = [1, 2, 3, 4].map((i) => makeCard({ id: 100 + i, front: `word${i}`, due_date: due }));
  const reviews = [1, 2].map((i) => makeCard({ id: 200 + i, front: `known${i}`, repetitions: 2, interval: 6, due_date: due }));

  it("meets new words in threes and asks each of them later, reviews in between", () => {
    const plan = buildSession([...reviews, ...fresh], { mode: "due", now: NOW });
    expect(plan.map((s) => `${s.kind}:${s.cardId}`)).toEqual([
      "recall:201",
      "meet:101",
      "meet:102",
      "meet:103",
      "recall:202",
      "recall:101",
      "recall:102",
      "recall:103",
      "meet:104",
      "recall:104",
    ]);
    // meeting is never graded; the check that follows is
    expect(plan.filter((s) => s.kind === "meet").every((s) => !s.graded)).toBe(true);
    expect(plan.filter((s) => s.kind === "recall").every((s) => s.graded)).toBe(true);
  });

  it("is only ever cards: no exercise is mixed in, whatever the word's stage", () => {
    const mature = makeCard({ ...commit, id: 400, repetitions: 5, interval: 40, due_date: due, my_sentence: "I committed to running." });
    const young = makeCard({ ...commit, id: 401, repetitions: 3, interval: 15, due_date: due });
    const plan = buildSession([mature, young, ...reviews, ...fresh], { mode: "due", now: NOW });
    expect(new Set(plan.map((s) => s.kind))).toEqual(new Set(["meet", "recall"]));
  });

  it("puts every due word in exactly once, graded", () => {
    const plan = buildSession([...reviews, ...fresh], { mode: "due", now: NOW });
    const graded = plan.filter((s) => s.graded).map((s) => s.cardId).sort();
    expect(graded).toEqual([101, 102, 103, 104, 201, 202]);
  });

  it("grades only the words that are due when going through all the cards", () => {
    const notYet = makeCard({ id: 300, front: "later", repetitions: 2, interval: 6, due_date: later });
    const plan = buildSession([reviews[0], notYet], { mode: "all", now: NOW });
    expect(plan.find((s) => s.cardId === 201)?.graded).toBe(true);
    expect(plan.find((s) => s.cardId === 300)?.graded).toBe(false);
  });
});

describe("buildExercises", () => {
  const met = [1, 2, 3].map((i) => makeCard({ ...commit, id: 500 + i, repetitions: 2, interval: 6 }));
  const fresh = [1, 2].map((i) => makeCard({ ...commit, id: 600 + i }));

  it("asks every word once, words already met first, and grades nothing", () => {
    const plan = buildExercises([...fresh, ...met], { speech: false, now: NOW });
    expect(plan.map((s) => s.cardId)).toEqual([501, 502, 503, 601, 602]);
    expect(plan.every((s) => !s.graded && s.kind !== "recall" && s.kind !== "meet")).toBe(true);
    expect(new Set(plan.map((s) => s.key)).size).toBe(plan.length);
  });

  it("keeps a round to a dozen words", () => {
    const many = Array.from({ length: 20 }, (_, i) => makeCard({ ...commit, id: 700 + i, repetitions: 2, interval: 6 }));
    expect(buildExercises(many, { speech: false, now: NOW })).toHaveLength(EXERCISE_LIMIT);
  });
});

describe("retryOf", () => {
  it("asks a missed exercise again once, as the same question with the Turkish open, ungraded", () => {
    const held = { ...commit, repetitions: 3, interval: 15 };
    const first = Array.from({ length: 12 }, (_, day) => exerciseFor(held, { day, speech: false })).find((e) => e.kind === "cloze")!;
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
    const drill = buildDrill({ ...commit, my_sentence: "I committed to running." });
    expect(drill.map((s) => s.kind)).toEqual(["cloze", "produce", "chunk", "cloze"]);
    expect(drill.every((s) => !s.graded && TYPED_KINDS.has(s.kind))).toBe(true);
    expect(new Set(drill.map((s) => s.key)).size).toBe(drill.length);
  });
});

describe("insertLater", () => {
  it("puts a missed word back three steps on, or last", () => {
    expect(insertLater(["a", "b", "c", "d", "e", "f"], 0, "X")).toEqual(["a", "b", "c", "d", "X", "e", "f"]);
    expect(insertLater(["a", "b"], 1, "X")).toEqual(["a", "b", "X"]);
  });
});

describe("letterPattern", () => {
  it("shows a dot per letter, spaces kept, and the revealed letters", () => {
    expect(letterPattern("concern")).toBe("•••••••");
    expect(letterPattern("concern", 1)).toBe("c••••••");
    expect(letterPattern("give up", 1)).toBe("g••• ••");
  });
});
