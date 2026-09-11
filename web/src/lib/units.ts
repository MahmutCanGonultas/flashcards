import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { UnitRecord } from "../types";

/** Score, out of 100, that passes a unit test. Mirrors the server's mark. */
export const UNIT_PASS_MARK = 80;

export function useUnits(deckId: string) {
  return useQuery({
    queryKey: ["units", deckId],
    queryFn: () =>
      api.get<{ units: UnitRecord[] }>(`/decks/${deckId}/units`).then((r) => r.units),
    enabled: deckId !== "",
  });
}

type UnitResultResponse = {
  score: number;
  passed: boolean;
  bestScore: number | null;
  everPassed: boolean;
};

/** Records one attempt at a unit's test; the server decides pass or fail. */
export function useRecordUnitResult(deckId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, score }: { unitId: number; score: number }) =>
      api.post<UnitResultResponse>(`/decks/${deckId}/units/${unitId}/result`, { score }),
    retry: 2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", deckId] });
    },
  });
}

type PlacementResponse = { level: string; skippedUnits: number; startUnit: number | null };

/** Opens the path up to the first unit of `level`; A1 changes nothing. */
export function useRecordPlacement(deckId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (level: string) =>
      api.post<PlacementResponse>(`/decks/${deckId}/placement`, { level }),
    retry: 2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", deckId] });
    },
  });
}
