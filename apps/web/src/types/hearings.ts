import type { HearingPurpose, HearingStatus } from "@splexa-group/shared/enums";

export interface Hearing {
  id: string;
  caseId: string;
  date: string;
  purpose: HearingPurpose | null;
  status: HearingStatus;
  notes: string | null;
  nextDate: string | null;
  adjournmentReason: string | null;
  judgePresent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHearingInput {
  date: string;
  purpose?: HearingPurpose;
  notes?: string;
  judgePresent?: string;
}

export interface UpdateHearingInput {
  date?: string;
  purpose?: HearingPurpose;
  status?: HearingStatus;
  notes?: string;
  nextDate?: string;
  adjournmentReason?: string;
  judgePresent?: string;
}
