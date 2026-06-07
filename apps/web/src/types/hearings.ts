import type { HearingPurpose, HearingStatus } from "@splexa-group/shared/enums";

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

export interface CreateHearingInput {
  date: string;
  time?: string;
  purpose?: HearingPurpose;
  status?: HearingStatus;
  notes?: string;
  judgePresent?: string;
}

export interface UpdateHearingInput {
  date?: string;
  time?: string;
  purpose?: HearingPurpose;
  status?: HearingStatus;
  notes?: string;
  nextDate?: string;
  adjournmentReason?: string;
  judgePresent?: string;
}
