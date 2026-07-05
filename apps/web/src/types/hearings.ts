import type { HearingPurpose, HearingStatus } from "@splexa-group/shared/enums";
import type { Hearing } from "@splexa-group/shared/models";

export type { Hearing };

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
