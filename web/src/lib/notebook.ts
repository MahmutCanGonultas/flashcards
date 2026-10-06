import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Card, Deck } from "../types";

/**
 * Defterim: the words the learner writes down themselves, apart from the
 * programme. A deck of its own (kind 'notebook'), made on first use; its
 * cards are kept and looked at, never scheduled, and never counted in the
 * programme's numbers.
 */

export function useNotebookDeck() {
  return useQuery({
    queryKey: ["notebookDeck"],
    queryFn: () => api.post<{ deck: Deck }>("/decks/notebook", {}).then((r) => r.deck),
    staleTime: Infinity,
  });
}

export function useNotebookCards(deck: Deck | undefined) {
  return useQuery({
    queryKey: ["cards", String(deck?.id ?? "")],
    queryFn: () => api.get<{ cards: Card[] }>(`/decks/${deck!.id}/cards`).then((r) => r.cards),
    enabled: Boolean(deck),
  });
}

export type NotebookWord = { front: string; meaning: string; example: string; exampleTr: string; note: string };

export function useAddNotebookWord(deck: Deck | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (word: NotebookWord) =>
      api.post<{ card: Card }>(`/decks/${deck!.id}/cards`, {
        front: word.front.trim(),
        back: word.meaning.trim(),
        exampleSentence: word.example.trim() || null,
        exampleTr: word.exampleTr.trim() || null,
        mnemonic: word.note.trim() || null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards", String(deck?.id ?? "")] }),
  });
}

export function useDeleteNotebookWord(deck: Deck | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: number) => api.delete(`/decks/${deck!.id}/cards/${cardId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards", String(deck?.id ?? "")] }),
  });
}
