import { CaseType } from "@splexa-group/shared/enums";

export interface CreateCaseData {
  orgId: string;
  createdBy: string;
  title: string;
  caseNumber?: string;
  caseType?: CaseType;
}
