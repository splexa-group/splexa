import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hearingsApi } from "@/services/hearings";
import { casesApi } from "@/services/cases";
import { caseKeys } from "@/hooks/use-cases";
import type { CreateHearingInput, UpdateHearingInput } from "@/types/hearings";

export function useHearings(caseId: string) {
  return useQuery({
    queryKey: caseKeys.detail(caseId),
    queryFn: () => casesApi.getById(caseId),
    enabled: !!caseId,
    select: (data) => data.hearings,
  });
}

export function useCreateHearing(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHearingInput) => hearingsApi.create(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Hearing added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add hearing"),
  });
}

export function useUpdateHearing(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHearingInput }) =>
      hearingsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Hearing updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update hearing"),
  });
}

export function useDeleteHearing(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hearingsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Hearing deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete hearing"),
  });
}
