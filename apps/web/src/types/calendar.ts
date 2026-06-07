import type {
  HearingPurpose,
  HearingStatus,
  ImportantDateType,
} from "@splexa-group/shared/enums";

export interface CalendarHearing {
  id: string;
  caseId: string;
  date: string;
  purpose: HearingPurpose | null;
  status: HearingStatus;
  notes: string | null;
  case: { id: string; title: string };
}

export interface CalendarImportantDate {
  id: string;
  caseId: string;
  dateType: ImportantDateType;
  date: string;
  description: string | null;
  case: { id: string; title: string };
}

export type CalendarEventKind = "hearing" | "important-date";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  caseId: string;
  caseTitle: string;
  date: string;
  label: string;
  status?: HearingStatus;
}

export type CalendarEventMap = Map<string, CalendarEvent[]>;
