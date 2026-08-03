import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { importantDatesApi } from "@/services/important-dates";
import { casesApi } from "@/services/cases";
import { caseKeys } from "@/hooks/use-cases";
import type { CreateImportantDateInput, UpdateImportantDateInput } from "@/types/important-dates";

export function useImportantDates(caseId: string) {
  return useQuery({
    queryKey: caseKeys.detail(caseId),
    queryFn: () => casesApi.getById(caseId),
    enabled: !!caseId,
    select: (data) => data.importantDates,
  });
}

export function useCreateImportantDate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateImportantDateInput) => importantDatesApi.create(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Date added successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add date"),
  });
}

export function useUpdateImportantDate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dateId, data }: { dateId: string; data: UpdateImportantDateInput }) =>
      importantDatesApi.update(caseId, dateId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Date updated successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update date"),
  });
}

export function useDeleteImportantDate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dateId: string) => importantDatesApi.delete(caseId, dateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Date deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete date"),
  });
}
