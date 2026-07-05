import type { ClientType, PreferredLanguage } from "@splexa-group/shared/enums";
import type { Client, PaginatedResult } from "@splexa-group/shared/models";

export type { Client };

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

export type ClientListResponse = PaginatedResult<ClientSearchResult>;

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
