import { describe, expect, it } from "vitest";
import { dayName, greeting, howLong, inWords, listOf, todayPieces } from "./talk";

const say = (pieces: { text: string }[]) => pieces.map((p) => p.text).join("");

describe("talk", () => {
  it("says small numbers in words", () => {
    expect(inWords(3)).toBe("üç");
    expect(inWords(10)).toBe("on");
    expect(inWords(14)).toBe("14");
  });

  it("names words the way a person lists them", () => {
    expect(listOf(["invest"])).toBe("invest");
    expect(listOf(["invest", "hamper"])).toBe("invest ve hamper");
    expect(listOf(["invest", "hamper", "occupy"])).toBe("invest, hamper ve occupy");
    expect(listOf(["a", "b", "c", "d", "e"])).toBe("a, b, c ve iki kelime daha");
  });

  it("tells the day in one sentence, in the round's order, the new words by name", () => {
    expect(say(todayPieces([], ["invest", "hamper", "occupy"]))).toBe("Bugün invest, hamper ve occupy ile tanışacaksın.");
    expect(say(todayPieces(["invest", "hamper"], []))).toBe("Bugün invest ve hamper tekrar gelecek.");
    expect(say(todayPieces(["a", "b", "c", "d", "e"], ["face"]))).toBe("Bugün face ile tanışacaksın; ayrıca beş kelime tekrar gelecek.");
    expect(say(todayPieces(["hamper", "invest"], ["occupy"]))).toBe("Bugün occupy ile tanışacaksın; ayrıca hamper ve invest tekrar gelecek.");
    expect(todayPieces([], ["face", "desert"]).filter((p) => p.word).map((p) => p.text)).toEqual(["face", "desert"]);
  });

  it("greets for the hour, the night running until four", () => {
    expect(greeting(8)).toBe("Günaydın");
    expect(greeting(14)).toBe("İyi günler");
    expect(greeting(20)).toBe("İyi akşamlar");
    expect(greeting(2)).toBe("İyi geceler");
  });

  it("says how long without a stopwatch", () => {
    expect(howLong(4)).toBe("Birkaç dakikanı alır.");
    expect(howLong(11)).toBe("Yaklaşık on dakikanı alır.");
  });

  it("names the day", () => {
    expect(dayName(1, 2)).toBe("Yarın");
    expect(dayName(3, 4)).toBe("Perşembe");
  });
});
