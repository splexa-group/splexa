import type {
  HearingPurpose,
  HearingStatus,
  ImportantDateType,
} from "../enums";

export interface CalendarHearingEvent {
  kind: "hearing";
  id: string;
  caseId: string;
  caseTitle: string;
  courtName: string | null;
  date: string;
  time: string | null;
  purpose: HearingPurpose | null;
  status: HearingStatus;
}

export interface CalendarImportantDateEvent {
  kind: "important-date";
  id: string;
  caseId: string;
  caseTitle: string;
  date: string;
  dateType: ImportantDateType;
  description: string | null;
}

export type CalendarEvent = CalendarHearingEvent | CalendarImportantDateEvent;
