import {
  CaseStage,
  CaseStatus,
  CaseType,
  CourtType,
  PartyRole,
  Priority,
} from "@splexa-group/shared/enums";

export interface OppositeParty {
  name: string;
  role: PartyRole;
  advocateName?: string;
  advocatePhone?: string;
  address?: string;
}

export interface ClientSummary {
  id: string;
  fullName: string;
  phone: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  caseNumber: string | null;
  status: CaseStatus;
  priority: Priority | null;
  courtName: string | null;
  nextHearingDate: string | null;
  clientRole: PartyRole | null;
  client: ClientSummary | null;
}

export interface CaseDetail {
  id: string;
  orgId: string;
  title: string;
  clientId: string | null;
  clientRole: PartyRole | null;
  caseNumber: string | null;
  caseType: CaseType | null;
  filingDate: string | null;
  courtName: string | null;
  courtType: CourtType | null;
  courtState: string | null;
  courtCity: string | null;
  benchNumber: string | null;
  judgeName: string | null;
  judgeDesignation: string | null;
  status: CaseStatus;
  stage: CaseStage | null;
  priority: Priority | null;
  description: string | null;
  oppositeParties: OppositeParty[] | null;
  tags: string[] | null;
  nextHearingDate: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    fullName: string;
    phone: string;
    type: string;
    email: string | null;
    address: string | null;
    companyName: string | null;
    notes: string | null;
  } | null;
}

export interface CaseListResponse {
  data: CaseSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CaseFilters {
  search?: string;
  status?: CaseStatus;
  priority?: Priority;
  courtType?: CourtType;
  sortBy?: "hearingDate" | "createdAt";
  page?: number;
  limit?: number;
}

export interface CreateCaseInput {
  title: string;
  clientRole?: PartyRole;
  clientId?: string;
  newClient?: { fullName: string; phone: string; type: string };
  caseNumber?: string;
  caseType?: CaseType;
  filingDate?: string;
  courtName?: string;
  courtType?: CourtType;
  courtState?: string;
  courtCity?: string;
  benchNumber?: string;
  judgeName?: string;
  judgeDesignation?: string;
  description?: string;
  status?: CaseStatus;
  stage?: CaseStage;
  priority?: Priority;
  oppositeParties?: OppositeParty[];
}

export interface UpdateCaseInput {
  title?: string;
  clientRole?: PartyRole;
  caseNumber?: string;
  caseType?: CaseType;
  filingDate?: string;
  courtName?: string;
  courtType?: CourtType;
  courtState?: string;
  courtCity?: string;
  benchNumber?: string;
  judgeName?: string;
  judgeDesignation?: string;
  status?: CaseStatus;
  stage?: CaseStage;
  description?: string;
  priority?: Priority;
  oppositeParties?: OppositeParty[];
  tags?: string[];
}
