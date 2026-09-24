import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { learnerDay } from "./day";

type StreakResponse = { streak: number; lastStudyDate: string | null };

/**
 * Today where the learner actually is — the server runs on UTC — and on
 * the learner's day: a round finished at 00:30 counts for the evening before.
 */
const localDate = (): string => learnerDay();

export function useStreak() {
  return useQuery({
    queryKey: ["streak"],
    queryFn: () => api.get<StreakResponse>("/streak"),
    staleTime: 60_000,
  });
}

/** Call once a round is actually finished, to extend the run. */
export function useRecordStudyDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<StreakResponse>("/streak", { localDate: localDate() }),
    retry: 2,
    onSuccess: (data) => {
      queryClient.setQueryData(["streak"], data);
    },
  });
}
