import { describe, expect, it } from "vitest";
import { parseWatchOut } from "./watchOut";

describe("parseWatchOut", () => {
  it("splits the wrong sentence, the right one and the reason", () => {
    expect(parseWatchOut("✗ I'm considering to move → ✓ I'm considering moving. Consider'dan sonraki fiil hep -ing alır.")).toEqual({
      wrong: "I'm considering to move",
      right: "I'm considering moving",
      note: "Consider'dan sonraki fiil hep -ing alır.",
    });
  });

  it("keeps a question mark that belongs to the example", () => {
    expect(parseWatchOut("✗ Is there available a room? → ✓ Is there a room available? 'available' genellikle isimden SONRA gelir (rooms available). İsimden önce nadiren.")).toEqual({
      wrong: "Is there available a room?",
      right: "Is there a room available?",
      note: "'available' genellikle isimden SONRA gelir (rooms available). İsimden önce nadiren.",
    });
  });

  it("reads a reason that comes first", () => {
    expect(parseWatchOut("Türkçe '-e yaklaşmak' diye fiile 'to' ekleme: ✗ approach to the station → ✓ approach the station. 'to' yalnızca isimde: an approach TO sth.")).toEqual({
      wrong: "approach to the station",
      right: "approach the station",
      note: "Türkçe '-e yaklaşmak' diye fiile 'to' ekleme. 'to' yalnızca isimde: an approach TO sth.",
    });
  });

  it("leaves unmarked text as the reason", () => {
    expect(parseWatchOut("Bu kelimeyi 'make' ile karıştırma.")).toEqual({ wrong: null, right: null, note: "Bu kelimeyi 'make' ile karıştırma." });
  });
});
