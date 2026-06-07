import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";

import { calendarApi } from "@/services/calendar";
import type {
  CalendarEvent,
  CalendarEventMap,
  CalendarFilter,
  CalendarHearing,
  CalendarImportantDate,
} from "@/types/calendar";
import { HearingPurpose, ImportantDateType } from "@splexa-group/shared/enums";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const calendarKeys = {
  all: ["calendar"] as const,
  hearings: (year: number, month: number) =>
    ["calendar", "hearings", year, month] as const,
  importantDates: (year: number, month: number) =>
    ["calendar", "important-dates", year, month] as const,
};

// ─── Date utilities ───────────────────────────────────────────────────────────

export function getGridDays(year: number, month: number): Date[] {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getGridRange(
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

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Label maps ───────────────────────────────────────────────────────────────

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

// ─── Event map builder ────────────────────────────────────────────────────────

function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  return toDateKey(d);
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

// ─── Filter helper ────────────────────────────────────────────────────────────

export function filterEventMap(
  eventMap: CalendarEventMap,
  filter: CalendarFilter,
  search: string,
): CalendarEventMap {
  if (filter === "all" && !search.trim()) return eventMap;

  const q = search.trim().toLowerCase();
  const result: CalendarEventMap = new Map();

  for (const [key, events] of eventMap) {
    const matching = events.filter((event) => {
      if (filter === "hearings" && event.kind !== "hearing") return false;
      if (filter === "important-dates" && event.kind !== "important-date")
        return false;
      if (q && !event.caseTitle.toLowerCase().includes(q)) return false;
      return true;
    });
    if (matching.length > 0) result.set(key, matching);
  }

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCalendarEvents(
  year: number,
  month: number,
): {
  eventMap: CalendarEventMap;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { gridFrom, gridTo } = getGridRange(year, month);

  const hearingsQuery = useQuery({
    queryKey: calendarKeys.hearings(year, month),
    queryFn: () => calendarApi.hearings(gridFrom, gridTo),
  });

  const datesQuery = useQuery({
    queryKey: calendarKeys.importantDates(year, month),
    queryFn: () => calendarApi.importantDates(gridFrom, gridTo),
  });

  // Both queries run in parallel — neither blocks the other.
  const eventMap = useMemo(
    () => buildEventMap(hearingsQuery.data?.data, datesQuery.data?.data),
    [hearingsQuery.data, datesQuery.data],
  );

  return {
    eventMap,
    isLoading: hearingsQuery.isLoading || datesQuery.isLoading,
    isError: hearingsQuery.isError || datesQuery.isError,
    refetch: () => {
      hearingsQuery.refetch();
      datesQuery.refetch();
    },
  };
}
