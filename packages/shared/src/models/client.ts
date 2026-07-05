import type { ClientType, PreferredLanguage } from "../enums";

export interface ClientSummary {
  id: string;
  fullName: string;
  phone: string;
}

export interface Client {
  id: string;
  orgId: string;
  fullName: string;
  phone: string;
  type: ClientType;
  email?: string | null;
  address?: string | null;
  companyName?: string | null;
  notes?: string | null;
  preferredLanguage?: PreferredLanguage | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
