import { Prisma } from "@prisma/client";
import {
  CaseStage,
  CaseStatus,
  CaseType,
  ClientType,
  CourtType,
  PartyRole,
  Priority,
} from "@splexa-group/shared/enums";

export interface CreateCaseData {
  orgId: string;
  createdBy: string;
  title: string;
  description?: string;
  clientId?: string;
  clientRole?: PartyRole;
  caseNumber?: string;
  caseType?: CaseType;
  filingDate?: Date;
  courtName?: string;
  courtType?: CourtType;
  courtState?: string;
  courtCity?: string;
  benchNumber?: string;
  judgeName?: string;
  judgeDesignation?: string;
  status?: CaseStatus;
  stage?: CaseStage;
  priority?: Priority;
  oppositeParties?: Prisma.InputJsonValue;
  tags?: string[];
  assignedTo?: string | null;
}

export interface CreateCaseWithNewClientData extends Omit<CreateCaseData, "clientId"> {
  newClient: {
    fullName: string;
    phone: string;
    type: ClientType;
  };
}
