import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Card, Deck } from "../types";

/**
 * The learner's own words: a deck the server creates on first use, whose
 * cards are folded into every course lesson's recap and into Tonton's
 * chatter. Everything here is per user.
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

export type Suggestion = {
  front: string;
  meaning_tr: string;
  pos: string;
  emoji: string;
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
  imageUrl: string | null;
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

/**
 * A photo from the phone, shrunk on the phone: the longest side to 900px,
 * JPEG, so an upload is ~100KB rather than the 4MB a camera produces.
 */
export async function shrinkImage(file: File): Promise<{ mime: string; data: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { mime: "image/jpeg", data: dataUrl.slice(dataUrl.indexOf(",") + 1) };
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const shrunk = await shrinkImage(file);
      return api.post<{ url: string }>("/images", shrunk).then((r) => r.url);
    },
  });
}
