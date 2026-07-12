import type { HearingStatus } from "@splexa-group/shared/enums";
import type { CalendarEvent } from "@splexa-group/shared/models";

export type { CalendarEvent };

export type CalendarEventKind = "hearing" | "important-date";

export interface CalendarDisplayEvent {
  id: string;
  kind: CalendarEventKind;
  caseId: string;
  caseTitle: string;
  date: string;
  label: string;
  status?: HearingStatus;
  time?: string | null;
  courtName?: string | null;
  description?: string | null;
}

export type CalendarEventMap = Map<string, CalendarDisplayEvent[]>;
