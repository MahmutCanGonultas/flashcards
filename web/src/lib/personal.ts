import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Card, Deck } from "../types";

/**
 * The learner's own words: a deck the server creates on first use,
 * reviewed on its own schedule (independent of the course) and mentioned
 * in Tonton's chatter. Everything here is per user.
 */

export function usePersonalDeck() {
  return useQuery({
    queryKey: ["personalDeck"],
    queryFn: () => api.post<{ deck: Deck }>("/decks/personal", {}).then((r) => r.deck),
    staleTime: Infinity,
  });
}

export function usePersonalCards(deck: Deck | undefined) {
  return useQuery({
    queryKey: ["cards", String(deck?.id ?? "")],
    queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deck!.id}/cards`).then((r) => r.cards),
    enabled: Boolean(deck),
  });
}

/** The last seven days of one deck: graded reviews, and how many were remembered. */
export function useDeckStats(deck: Deck | undefined) {
  return useQuery({
    queryKey: ["deckStats", String(deck?.id ?? "")],
    queryFn: () => api.get<{ lastWeek: { reviews: number; remembered: number } }>(`/decks/${deck!.id}/stats`).then((r) => r.lastWeek),
    enabled: Boolean(deck),
  });
}

export type Suggestion = {
  front: string;
  meaning_tr: string;
  pos: string;
  example_en: string;
  example_tr: string;
  example2_en: string;
  example2_tr: string;
  topic: string;
  topic_tr: string;
};

/** Everything a word needs, written by the server from the word alone. */
export function useSuggestCard(deckId: number | undefined) {
  return useMutation({
    mutationFn: (input: { word: string; note?: string | null }) =>
      api.post<{ suggestion: Suggestion }>(`/decks/${deckId}/cards/suggest`, input).then((r) => r.suggestion),
  });
}

export type NewPersonalCard = {
  front: string;
  back: string;
  tag: string | null;
  exampleSentence: string | null;
  exampleTr: string | null;
  example2: string | null;
  example2Tr: string | null;
  mnemonic: string | null;
};

export function useCreatePersonalCard(deckId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: NewPersonalCard) => api.post<{ card: Card }>(`/decks/${deckId}/cards`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", String(deckId)] });
      queryClient.invalidateQueries({ queryKey: ["dueCards", String(deckId)] });
      queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });
}
