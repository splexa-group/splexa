import type { ClientType, PreferredLanguage } from "@splexa-group/shared/enums";

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  type: ClientType;
  email: string | null;
  address: string | null;
  companyName: string | null;
  notes: string | null;
  preferredLanguage: PreferredLanguage | null;
}

export interface CreateClientInput {
  fullName: string;
  phone: string;
  type: ClientType;
  email?: string;
  address?: string;
  companyName?: string;
  notes?: string;
  preferredLanguage?: PreferredLanguage;
}

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
  preferredLanguage?: PreferredLanguage;
}
