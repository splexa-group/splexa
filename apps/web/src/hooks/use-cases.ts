import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { casesApi } from "@/services/cases";
import type { CaseFilters, CreateCaseInput, UpdateCaseInput } from "@/types/cases";
import { useRouter } from "next/navigation";

export const caseKeys = {
  all: ["cases"] as const,
  list: (f: CaseFilters) => ["cases", "list", f] as const,
  detail: (id: string) => ["cases", "detail", id] as const,
};

export function useCases(filters: CaseFilters = {}) {
  return useQuery({
    queryKey: caseKeys.list(filters),
    queryFn: () => casesApi.list(filters),
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => casesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCaseInput) => casesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Case created successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create case"),
  });
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCaseInput) => casesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(id) });
      qc.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Case updated successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save"),
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) => casesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Case deleted successfully");
      router.push("/cases");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete case"),
  });
}
