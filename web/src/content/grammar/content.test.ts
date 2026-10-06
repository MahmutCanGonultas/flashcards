import { describe, expect, it } from "vitest";
import { CATALOG, LEVELS } from "./catalog";
import { BODIES, TOPICS } from "./index";
import { RECALL } from "./recall";
import { plain } from "../../lib/rich";
import { isRight, prepare, wordsOf } from "../../lib/grammarQuiz";

/** Every string a topic holds, with where it sits, for the checks that apply to all text. */
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  return [];
}

describe("grammar content", () => {
  it("has a page for every topic in the list, and nothing else", () => {
    expect(Object.keys(BODIES).sort()).toEqual(CATALOG.map((t) => t.slug).sort());
    expect(TOPICS).toHaveLength(24);
    expect(new Set(CATALOG.map((t) => t.slug)).size).toBe(CATALOG.length);
    for (const level of LEVELS) expect(CATALOG.some((t) => t.level === level.key)).toBe(true);
  });

  it("closes every colour mark it opens", () => {
    for (const topic of TOPICS) {
      for (const [path, text] of strings(topic)) {
        expect(plain(text), `${topic.slug}.${path}`).not.toMatch(/[{}[\]<>]|\*\*|~~/);
      }
    }
  });

  it("never names a teacher", () => {
    expect(JSON.stringify(TOPICS)).not.toMatch(/serdar|hoca/i);
  });

  it("gives every topic enough to read and to practise", () => {
    for (const topic of TOPICS) {
      expect(topic.intro.length, topic.slug).toBeGreaterThan(40);
      expect(topic.sections.length, topic.slug).toBeGreaterThanOrEqual(3);
      expect(topic.mistakes.length, topic.slug).toBeGreaterThanOrEqual(3);
      expect(topic.quiz.length, topic.slug).toBeGreaterThanOrEqual(10);
      expect(new Set(topic.quiz.map((q) => q.kind)).size, `${topic.slug}: mixes question kinds`).toBe(3);
      const titles = topic.sections.map((s) => s.title);
      expect(new Set(titles).size, `${topic.slug}: section titles`).toBe(titles.length);
      for (const section of topic.sections) {
        expect(Boolean(section.body || section.table || section.examples?.length), `${topic.slug} / ${section.title}`).toBe(true);
        for (const row of section.table?.rows ?? []) expect(row.length, `${topic.slug} / ${section.title}: row width`).toBe(section.table!.head.length);
      }
    }
  });

  // One case per topic, so a failure names it: one idea, a few patterns as real sentences, Turkish beside English.
  it.each(TOPICS.map((topic) => [topic.slug, topic] as const))("shows %s at a glance", (_, topic) => {
    const glance = topic.glance;
    expect(glance, `${topic.slug}: glance`).toBeDefined();
    if (!glance) return;
    expect(glance.idea.length, `${topic.slug}: idea`).toBeGreaterThan(30);
    expect(plain(glance.idea).length, `${topic.slug}: idea is one or two sentences`).toBeLessThanOrEqual(190);
    expect(glance.formulas.length, `${topic.slug}: formulas`).toBeGreaterThanOrEqual(1);
    expect(glance.formulas.length, `${topic.slug}: formulas`).toBeLessThanOrEqual(3);
    expect(new Set(glance.formulas.map((f) => f.label)).size, `${topic.slug}: formula labels`).toBe(glance.formulas.length);
    for (const formula of glance.formulas) {
      const where = `${topic.slug} / ${formula.label}`;
      expect(formula.parts.length, `${where}: parts`).toBeGreaterThanOrEqual(2);
      expect(formula.parts.length, `${where}: parts`).toBeLessThanOrEqual(5);
      // The bricks are spoken as one sentence, so they must make one.
      const sentence = formula.parts.map((part) => part.text).join(" ");
      expect(sentence, `${where}: a sentence`).toMatch(/^[A-Z0-9].*[.?!]$/);
      for (const part of formula.parts) {
        expect(part.text, `${where}: no marks inside a brick`).not.toMatch(/[{}[\]<>]|\*\*|~~/);
        expect(part.text.length, `${where}: "${part.text}" fits a brick`).toBeLessThanOrEqual(16);
        expect((part.name ?? "").length, `${where}: "${part.name}" fits under a brick`).toBeLessThanOrEqual(16);
      }
    }
    expect(glance.compare.length, `${topic.slug}: compare`).toBeGreaterThanOrEqual(2);
    expect(glance.compare.length, `${topic.slug}: compare`).toBeLessThanOrEqual(3);
  });

  it("asks questions that can be answered, and only one way", () => {
    for (const topic of TOPICS) {
      for (const [i, q] of topic.quiz.entries()) {
        const where = `${topic.slug} #${i + 1}`;
        if (q.kind === "choice") {
          expect(q.answer, where).toBeGreaterThanOrEqual(0);
          expect(q.answer, where).toBeLessThan(q.options.length);
          expect(new Set(q.options.map((o) => plain(o).toLowerCase())).size, `${where}: options differ`).toBe(q.options.length);
        }
        if (q.kind === "type") {
          expect(q.prompt, `${where}: has a gap`).toMatch(/_{3}/);
          expect(q.answer.length, where).toBeGreaterThan(0);
        }
        if (q.kind === "order") {
          const words = wordsOf(q.answer);
          expect(words.length, where).toBeGreaterThanOrEqual(3);
          // A distractor that is also in the sentence would make two tiles look alike for no reason.
          for (const extra of q.extra ?? []) expect(words.map((w) => w.toLowerCase()), `${where}: extra "${extra}"`).not.toContain(extra.toLowerCase());
          // The tiles really do build the answer.
          const [item] = prepare(topic.slug, [q]);
          const built = words.map((w) => item.tiles!.indexOf(w)).map((n) => item.tiles![n]);
          expect(isRight(item, { built }), where).toBe(true);
        }
        expect(q.explain.length, `${where}: explains`).toBeGreaterThan(3);
      }
    }
  });

  it("gives every topic a Hatırla card: a few rules, a few examples, one trap, every mark closed", () => {
    expect(Object.keys(RECALL).sort()).toEqual(CATALOG.map((t) => t.slug).sort());
    for (const [slug, recall] of Object.entries(RECALL)) {
      expect(recall.points.length, `${slug}: points`).toBeGreaterThanOrEqual(3);
      expect(recall.points.length, `${slug}: points`).toBeLessThanOrEqual(5);
      expect(recall.examples.length, `${slug}: examples`).toBeGreaterThanOrEqual(2);
      expect(recall.examples.length, `${slug}: examples`).toBeLessThanOrEqual(4);
      for (const [path, text] of strings(recall)) expect(plain(text), `${slug}.${path}`).not.toMatch(/[{}[\]<>]|\*\*|~~/);
    }
    expect(JSON.stringify(RECALL)).not.toMatch(/serdar|hoca/i);
  });
});
