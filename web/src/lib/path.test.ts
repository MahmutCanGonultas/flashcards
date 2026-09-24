import { describe, expect, it } from "vitest";
import { buildPath, pathStats } from "./path";
import { buildReviewPlan } from "./lessonPlan";
import { popLines } from "./tonton";
import { makeCard } from "./testCards";

// A course word the reset left due "now" although the path hasn't reached it, next to one met and due.
const past = "2026-09-24T13:40:57.563Z";
const unmet = (id: number, front: string, lesson: number) => makeCard({ id, front, lesson, deck_id: 43, due_date: past });
const met = (id: number, front: string, lesson: number) => makeCard({ id, front, lesson, deck_id: 43, repetitions: 1, interval: 1, due_date: past });
const course = [unmet(60, "however", 61), unmet(61, "although", 61), met(62, "because", 60), unmet(530, "hello", 1)];

describe("a course word the path hasn't reached", () => {
  it("is no review, whatever its date says", () => {
    const units = buildPath(course);
    expect(pathStats(units).dueNow).toBe(1);
    expect(units.flatMap((u) => u.lessons).find((l) => l.number === 61)?.due).toBe(0);
    expect(units.flatMap((u) => u.lessons).find((l) => l.number === 60)?.due).toBe(1);
  });

  it("is never met in a review round; a plain deck's added card still is", () => {
    const added = makeCard({ id: 900, front: "added", due_date: past });
    expect(buildReviewPlan([...course, added]).map((s) => `${s.kind}:${"cardId" in s ? s.cardId : ""}`)).toEqual(["quiz:62", "meet:900", "quiz:900"]);
  });

  it("isn't counted by Tonton, nor talked about before it is met", () => {
    const lines = popLines({ cards: course, personal: [makeCard({ id: 1281, front: "commit" })], streak: 0 }).map((l) => l.text);
    expect(lines).toContain("Kursta 1 kelime tekrar bekliyor. Kısa bir tur?");
    expect(lines.some((text) => text.includes("'commit'"))).toBe(false);
    const later = popLines({ cards: [], personal: [makeCard({ id: 1281, front: "commit", repetitions: 1, interval: 1 })], streak: 0 }).map((l) => l.text);
    expect(later.some((text) => text.includes("'commit'"))).toBe(true);
  });
});
