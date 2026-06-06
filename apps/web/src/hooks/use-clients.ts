import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientsApi } from "@/services/clients";
import { casesApi } from "@/services/cases";
import { caseKeys } from "@/hooks/use-cases";
import type { CreateClientInput, UpdateClientInput } from "@/types/clients";

export function useClientSearch(query: string) {
  return useQuery({
    queryKey: ["clients", "search", query],
    queryFn: () => clientsApi.search(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useAddClientToCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientInput) => casesApi.addClient(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Client added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add client"),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      caseId?: string;
      data: UpdateClientInput;
    }) => clientsApi.update(id, data),
    onSuccess: (_, { caseId }) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      if (caseId) {
        qc.invalidateQueries({ queryKey: ["cases", "detail", caseId] });
      }
      toast.success("Saved");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save"),
  });
}
