import { GET, PATCH, POST } from "@/api/http";
import type { ClientListResponse, CreateClientInput, UpdateClientInput } from "@/types/clients";

export const clientsApi = {
  search: (query: string) =>
    GET<ClientListResponse>("/clients", { params: { search: query, limit: 10 } }),

  create: (data: CreateClientInput) =>
    POST<{ id: string }>("/clients", data),

  update: (id: string, data: UpdateClientInput) =>
    PATCH<void>(`/clients/${id}`, data),
};
