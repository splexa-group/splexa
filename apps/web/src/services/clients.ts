import { GET, PATCH, POST } from "@/api/http";
import type { Client } from "@splexa-group/shared/models";
import type { ClientListResponse, CreateClientInput, UpdateClientInput } from "@/types/clients";

export const clientsApi = {
  search: (query: string) =>
    GET<{ clients: ClientListResponse["data"]; total: number; page: number; limit: number }>(
      "/clients",
      { params: { search: query, limit: 10 } },
    ).then((r) => ({ data: r.clients, total: r.total, page: r.page, limit: r.limit })),

  create: (data: CreateClientInput) =>
    POST<{ client: Client }>("/clients", data).then((r) => r.client),

  update: (id: string, data: UpdateClientInput) =>
    PATCH<{ client: Client }>(`/clients/${id}`, data).then((r) => r.client),
};
