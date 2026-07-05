import type { HearingPurpose, HearingStatus } from "../enums";

// Hearing as returned nested inside a CaseDetail response
export interface Hearing {
  id: string;
  caseId: string;
  date: string;
  time: string | null;
  purpose: HearingPurpose | null;
  status: HearingStatus;
  notes: string | null;
  nextDate: string | null;
  adjournmentReason: string | null;
  judgePresent: string | null;
  createdAt: string;
  updatedAt: string;
}

// Hearing as returned by hearing list endpoints (adds org/audit fields)
export interface HearingSummary extends Hearing {
  orgId: string;
  addedBy: string;
}

// Hearing as returned by the hearing detail endpoint (adds parent case context)
export interface HearingDetail extends HearingSummary {
  case: {
    id: string;
    title: string;
    courtName: string | null;
    client: { id: string; fullName: string };
  };
}
