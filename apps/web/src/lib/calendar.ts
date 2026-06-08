import {
  format,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { HearingPurpose, ImportantDateType } from "@splexa-group/shared/enums";

export function getMonthGridDays(year: number, month: number): Date[] {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getMonthGridRange(
  year: number,
  month: number,
): { gridFrom: string; gridTo: string } {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const start = new Date(gridStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(gridEnd);
  end.setHours(23, 59, 59, 999);

  return { gridFrom: start.toISOString(), gridTo: end.toISOString() };
}
import type {
  CalendarEvent,
  CalendarEventMap,
  CalendarHearing,
  CalendarImportantDate,
} from "@/types/calendar";

const HEARING_PURPOSE_LABELS: Record<HearingPurpose, string> = {
  [HearingPurpose.Arguments]: "Arguments",
  [HearingPurpose.Evidence]: "Evidence",
  [HearingPurpose.CrossExamination]: "Cross Examination",
  [HearingPurpose.Order]: "Order",
  [HearingPurpose.Mention]: "Mention",
  [HearingPurpose.Settlement]: "Settlement",
  [HearingPurpose.Miscellaneous]: "Miscellaneous",
};

const IMPORTANT_DATE_TYPE_LABELS: Record<ImportantDateType, string> = {
  [ImportantDateType.HearingDate]: "Hearing Date",
  [ImportantDateType.Limitation]: "Limitation",
  [ImportantDateType.BailExpiry]: "Bail Expiry",
  [ImportantDateType.StayExpiry]: "Stay Expiry",
  [ImportantDateType.AppealDeadline]: "Appeal Deadline",
  [ImportantDateType.InjunctionValidity]: "Injunction Validity",
  [ImportantDateType.Other]: "Other",
};

function toLocalDateKey(isoString: string): string {
  return format(new Date(isoString), "yyyy-MM-dd");
}

export function buildEventMap(
  hearings: CalendarHearing[] | undefined,
  importantDates: CalendarImportantDate[] | undefined,
): CalendarEventMap {
  const map: CalendarEventMap = new Map();

  function push(key: string, event: CalendarEvent) {
    const existing = map.get(key) ?? [];
    map.set(key, [...existing, event]);
  }

  for (const h of hearings ?? []) {
    push(toLocalDateKey(h.date), {
      id: h.id,
      kind: "hearing",
      caseId: h.caseId,
      caseTitle: h.case.title,
      date: h.date,
      label: h.purpose ? HEARING_PURPOSE_LABELS[h.purpose] : "Hearing",
      status: h.status,
      time: h.time,
      courtName: h.case.courtName,
    });
  }

  for (const d of importantDates ?? []) {
    push(toLocalDateKey(d.date), {
      id: d.id,
      kind: "important-date",
      caseId: d.caseId,
      caseTitle: d.case.title,
      date: d.date,
      label: IMPORTANT_DATE_TYPE_LABELS[d.dateType],
      description: d.description,
    });
  }

  return map;
}

export function filterEventMap(
  eventMap: CalendarEventMap,
  search: string,
): CalendarEventMap {
  if (!search.trim()) return eventMap;

  const q = search.trim().toLowerCase();
  const result: CalendarEventMap = new Map();

  for (const [key, events] of eventMap) {
    const matching = events.filter((e) =>
      e.caseTitle.toLowerCase().includes(q),
    );
    if (matching.length > 0) result.set(key, matching);
  }

  return result;
}
