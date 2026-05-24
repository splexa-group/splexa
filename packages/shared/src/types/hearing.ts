import type { HearingPurpose, HearingStatus } from "../enums";

export interface HearingSummary {
  id: string;
  caseId: string;
  orgId: string;
  date: string;
  purpose?: HearingPurpose | null;
  status: HearingStatus;
  notes?: string | null;
  nextDate?: string | null;
  adjournmentReason?: string | null;
  judgePresent?: string | null;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HearingDetail extends HearingSummary {
  case: {
    id: string;
    title: string;
    client: { id: string; fullName: string };
  };
}
