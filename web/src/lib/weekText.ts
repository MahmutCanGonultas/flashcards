import { useQuery } from "@tanstack/react-query";
import { loadWeekText } from "../content/weeks";
import { usePersonalCards, usePersonalDeck } from "./personal";
import { wordsOfWeek } from "./programme";

/** One week's text, loaded once and kept: it never changes. */
export function useWeekText(week: number) {
  return useQuery({ queryKey: ["weekText", week], queryFn: () => loadWeekText(week), staleTime: Infinity, enabled: Number.isInteger(week) && week > 0 });
}

/** The week's own words, as their fronts, to light up in its texts. */
export function useWeekWords(week: number): string[] {
  const deck = usePersonalDeck();
  const cards = usePersonalCards(deck.data);
  return wordsOfWeek(cards.data ?? [], week).map((card) => card.front);
}
