import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

type StreakResponse = { streak: number; lastStudyDate: string | null };

/** Today where the learner actually is — the server runs on UTC. */
function localDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function useStreak() {
  return useQuery({
    queryKey: ["streak"],
    queryFn: () => api.get<StreakResponse>("/streak"),
    staleTime: 60_000,
  });
}

/** Call once a study session actually happens, to extend the run. */
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
