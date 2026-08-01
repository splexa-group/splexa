import {
  format,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { HearingPurpose, ImportantDateType } from "@splexa-group/shared/enums";
import type { CalendarEvent } from "@splexa-group/shared/models";
import type { CalendarDisplayEvent, CalendarEventMap } from "@/types/calendar";

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

const HEARING_PURPOSE_LABELS: Record<HearingPurpose, string> = {
  [HearingPurpose.ARGUMENTS]: "Arguments",
  [HearingPurpose.EVIDENCE]: "Evidence",
  [HearingPurpose.CROSS_EXAMINATION]: "Cross Examination",
  [HearingPurpose.ORDER]: "Order",
  [HearingPurpose.MENTION]: "Mention",
  [HearingPurpose.SETTLEMENT]: "Settlement",
  [HearingPurpose.MISCELLANEOUS]: "Miscellaneous",
};

const IMPORTANT_DATE_TYPE_LABELS: Record<ImportantDateType, string> = {
  [ImportantDateType.HEARING_DATE]: "Hearing Date",
  [ImportantDateType.LIMITATION]: "Limitation",
  [ImportantDateType.BAIL_EXPIRY]: "Bail Expiry",
  [ImportantDateType.STAY_EXPIRY]: "Stay Expiry",
  [ImportantDateType.APPEAL_DEADLINE]: "Appeal Deadline",
  [ImportantDateType.INJUNCTION_VALIDITY]: "Injunction Validity",
  [ImportantDateType.OTHER]: "Other",
};

function toLocalDateKey(isoString: string): string {
  return format(new Date(isoString), "yyyy-MM-dd");
}

export function buildEventMap(events: CalendarEvent[] | undefined): CalendarEventMap {
  const map: CalendarEventMap = new Map();

  function push(key: string, event: CalendarDisplayEvent) {
    const existing = map.get(key) ?? [];
    map.set(key, [...existing, event]);
  }

  for (const event of events ?? []) {
    if (event.kind === "hearing") {
      push(toLocalDateKey(event.date), {
        id: event.id,
        kind: "hearing",
        caseId: event.caseId,
        caseTitle: event.caseTitle,
        date: event.date,
        label: event.purpose ? HEARING_PURPOSE_LABELS[event.purpose] : "Hearing",
        status: event.status,
        time: event.time,
        courtName: event.courtName,
      });
    } else {
      push(toLocalDateKey(event.date), {
        id: event.id,
        kind: "important-date",
        caseId: event.caseId,
        caseTitle: event.caseTitle,
        date: event.date,
        label: IMPORTANT_DATE_TYPE_LABELS[event.dateType],
        description: event.description,
      });
    }
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
