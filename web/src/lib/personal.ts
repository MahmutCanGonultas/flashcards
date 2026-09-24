import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Card, Deck, ReviewQuality } from "../types";

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

/** Fresh whenever the app comes back to the front, like the day's plan (lib/plan.ts). */
export function usePersonalCards(deck: Deck | undefined) {
  return useQuery({
    queryKey: ["cards", String(deck?.id ?? "")],
    queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deck!.id}/cards`).then((r) => r.cards),
    enabled: Boolean(deck),
    refetchOnWindowFocus: true,
  });
}

/**
 * The last seven days of one deck: graded reviews and how each went
 * (remembered is knew + hard, for older builds), and the typed exercises
 * with how many were right.
 */
export type DeckStats = { reviews: number; knew?: number; hard?: number; missed?: number; remembered: number; typed?: number; typedRight?: number };

export function useDeckStats(deck: Deck | undefined) {
  return useQuery({
    queryKey: ["deckStats", String(deck?.id ?? "")],
    queryFn: () => api.get<{ lastWeek: DeckStats }>(`/decks/${deck!.id}/stats`).then((r) => r.lastWeek),
    enabled: Boolean(deck),
  });
}

/** Where an answer that doesn't move the schedule was given. */
export type PracticePhase = "learn-step" | "relearn" | "filler" | "practice" | "exercise" | "drill";

export type PracticeAnswer = {
  cardId: number;
  quality: ReviewQuality;
  kind: string;
  phase: PracticePhase;
  direction?: "fwd" | "rev";
  thinkMs?: number;
};

/**
 * Logs an answer the schedule doesn't count — a new word's learning steps,
 * a missed word's repeats, the exercises, the drill — so the week's numbers
 * can tell them apart from the graded reviews. Fire and forget: the card is
 * never touched, and a lost log costs nothing but a row.
 */
export function usePractice(deckId: number | string) {
  return useMutation({
    mutationFn: ({ cardId, ...body }: PracticeAnswer) => api.post<{ ok: true }>(`/decks/${deckId}/cards/${cardId}/practice`, body),
    retry: 1,
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
      // A new word joins the queue behind today's.
      queryClient.invalidateQueries({ queryKey: ["plan", String(deckId)] });
      queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });
}
