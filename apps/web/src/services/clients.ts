import { GET } from "@/api/http";
import type { ClientListResponse } from "@/types/clients";

export const clientsApi = {
  search: (query: string) =>
    GET<ClientListResponse>("/clients", { params: { search: query, limit: 10 } }),
};
