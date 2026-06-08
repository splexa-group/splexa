import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { calendarApi } from "@/services/calendar";
import { getMonthGridRange, buildEventMap } from "@/lib/calendar";
import type { CalendarEventMap } from "@/types/calendar";

export const calendarKeys = {
  all: ["calendar"] as const,
  hearings: (year: number, month: number) =>
    ["calendar", "hearings", year, month] as const,
  importantDates: (year: number, month: number) =>
    ["calendar", "important-dates", year, month] as const,
};

export function useCalendarEvents(
  year: number,
  month: number,
): {
  eventMap: CalendarEventMap;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { gridFrom, gridTo } = getMonthGridRange(year, month);

  const hearingsQuery = useQuery({
    queryKey: calendarKeys.hearings(year, month),
    queryFn: () => calendarApi.hearings(gridFrom, gridTo),
  });

  const datesQuery = useQuery({
    queryKey: calendarKeys.importantDates(year, month),
    queryFn: () => calendarApi.importantDates(gridFrom, gridTo),
  });

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
