import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

/**
 * The learner's grammar progress: per topic, the best quiz score (0–100)
 * and how many times it was practised. The topics themselves ship with the
 * app (content/grammar); only these numbers live on the server.
 */

export type TopicProgress = { best: number; attempts: number; updatedAt: string };
export type GrammarProgress = Record<string, TopicProgress>;

type Row = { topic: string; best: number; attempts: number; updated_at: string };
const fromRow = (row: Row): TopicProgress => ({ best: row.best, attempts: row.attempts, updatedAt: row.updated_at });

export function useGrammarProgress() {
  return useQuery({
    queryKey: ["grammarProgress"],
    queryFn: () =>
      api.get<{ progress: Row[] }>("/grammar/progress").then((r) => Object.fromEntries(r.progress.map((row) => [row.topic, fromRow(row)])) as GrammarProgress),
    staleTime: 60_000,
  });
}

export function useSaveGrammarScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { topic: string; score: number }) => api.post<{ progress: Row }>("/grammar/progress", input).then((r) => r.progress),
    retry: 2,
    onSuccess: (row) => {
      queryClient.setQueryData<GrammarProgress>(["grammarProgress"], (old) => ({ ...(old ?? {}), [row.topic]: fromRow(row) }));
    },
  });
}

/** Stars for a best score: one for finishing, two from 70, three from 90. */
export function starsFor(best: number | undefined): 0 | 1 | 2 | 3 {
  if (best === undefined) return 0;
  if (best >= 90) return 3;
  if (best >= 70) return 2;
  return 1;
}
