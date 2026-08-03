import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { clientsApi } from "@/services/clients";
import { casesApi } from "@/services/cases";
import { caseKeys } from "@/hooks/use-cases";
import type { ClientFilters, CreateClientInput, UpdateClientInput } from "@/types/clients";

export const clientKeys = {
  all: ["clients"] as const,
  list: (f: ClientFilters) => ["clients", "list", f] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

export function useClientSearch(query: string) {
  return useQuery({
    queryKey: ["clients", "search", query],
    queryFn: () => clientsApi.search(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => clientsApi.list(filters),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientInput) => clientsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      toast.success("Client created successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create client"),
  });
}

export function useAddClientToCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientInput) => casesApi.addClient(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Client added successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add client"),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; caseId?: string; data: UpdateClientInput }) =>
      clientsApi.update(id, data),
    onSuccess: (_, { caseId }) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      if (caseId) {
        qc.invalidateQueries({ queryKey: ["cases", "detail", caseId] });
      }
      toast.success("Client updated successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save"),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Client deleted successfully");
      router.push("/clients");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete client"),
  });
}
