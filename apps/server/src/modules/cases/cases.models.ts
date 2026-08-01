import { CaseType, ClientType, RelationType } from "@splexa-group/shared/enums";

export interface CreateCaseData {
  orgId: string;
  createdBy: string;
  title: string;
  caseNumber?: string;
  caseType?: CaseType;
}

export interface CaseClientData {
  fullName: string;
  phone: string;
  type: ClientType;
  email?: string;
  address?: string;
  companyName?: string;
  notes?: string;
  relationType?: RelationType;
  relationName?: string;
  dateOfBirth?: Date;
  occupation?: string;
  orgId: string;
  createdBy: string;
}
