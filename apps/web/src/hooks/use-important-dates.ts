import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { importantDatesApi } from "@/services/important-dates";
import type {
  CreateImportantDateInput,
  UpdateImportantDateInput,
} from "@/types/important-dates";

export const importantDateKeys = {
  byCase: (caseId: string) => ["important-dates", "case", caseId] as const,
};

export function useImportantDates(caseId: string) {
  return useQuery({
    queryKey: importantDateKeys.byCase(caseId),
    queryFn: () => importantDatesApi.listByCaseId(caseId),
    enabled: !!caseId,
  });
}

export function useCreateImportantDate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateImportantDateInput) =>
      importantDatesApi.create(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: importantDateKeys.byCase(caseId) });
      toast.success("Date added");
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
      qc.invalidateQueries({ queryKey: importantDateKeys.byCase(caseId) });
      toast.success("Date updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update date"),
  });
}

export function useDeleteImportantDate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dateId: string) => importantDatesApi.delete(caseId, dateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: importantDateKeys.byCase(caseId) });
      toast.success("Date deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete date"),
  });
}
