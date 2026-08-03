import {
  CaseStage,
  CaseStatus,
  CaseType,
  CourtType,
  PartyRole,
  Priority,
} from "@splexa-group/shared/enums";
import type {
  CaseDetail,
  CaseSummary,
  ClientSummary,
  OppositeParty,
  PaginatedResult,
} from "@splexa-group/shared/models";

export type { CaseDetail, CaseSummary, ClientSummary, OppositeParty };

export type CaseListResponse = PaginatedResult<CaseSummary>;

export interface CaseFilters {
  search?: string;
  status?: CaseStatus;
  caseType?: CaseType;
  clientId?: string;
  page?: number;
  limit?: number;
}

export interface CreateCaseInput {
  title: string;
  caseNumber?: string;
  caseType?: CaseType;
}

export interface UpdateCaseInput {
  title?: string;
  clientId?: string;
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
