import type { ClientType } from "@splexa-group/shared/enums";

export interface ClientSearchResult {
  id: string;
  fullName: string;
  phone: string;
  type: ClientType;
}

export interface ClientListResponse {
  data: ClientSearchResult[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateClientInput {
  fullName?: string;
  phone?: string;
  type?: ClientType;
  email?: string;
  address?: string;
  companyName?: string;
  notes?: string;
}
