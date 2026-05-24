import type {
  CaseStage,
  CaseStatus,
  CaseType,
  CourtType,
  PartyRole,
  Priority,
} from "../enums";
import type { Client, ClientSummary } from "./client";
import type { HearingSummary } from "./hearing";
import type { ImportantDateSummary } from "./important-date";

export interface OppositeParty {
  name: string;
  role: PartyRole;
  advocateName?: string;
  advocatePhone?: string;
  address?: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  caseNumber?: string | null;
  status: CaseStatus;
  priority?: Priority | null;
  courtName?: string | null;
  nextHearingDate?: string | null;
  clientRole: PartyRole;
  client: ClientSummary;
}

export interface CaseDetail {
  id: string;
  orgId: string;
  title: string;
  clientId: string;
  clientRole: PartyRole;
  caseNumber?: string | null;
  caseType?: CaseType | null;
  filingDate?: string | null;
  courtName?: string | null;
  courtType?: CourtType | null;
  courtState?: string | null;
  courtCity?: string | null;
  benchNumber?: string | null;
  judgeName?: string | null;
  judgeDesignation?: string | null;
  judgeUpdatedAt?: string | null;
  status: CaseStatus;
  stage?: CaseStage | null;
  priority?: Priority | null;
  oppositeParties?: OppositeParty[] | null;
  notes?: string | null;
  tags?: string[] | null;
  nextHearingDate?: string | null;
  assignedTo?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  client: Client;
  hearings: HearingSummary[];
  importantDates: ImportantDateSummary[];
}
