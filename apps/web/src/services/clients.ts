import { GET, PATCH } from "@/api/http";
import type { ClientListResponse, UpdateClientInput } from "@/types/clients";

export const clientsApi = {
  search: (query: string) =>
    GET<ClientListResponse>("/clients", { params: { search: query, limit: 10 } }),

  update: (id: string, data: UpdateClientInput) =>
    PATCH<void>(`/clients/${id}`, data),
};
