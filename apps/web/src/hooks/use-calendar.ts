import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { calendarApi } from "@/services/calendar";
import { getMonthGridRange, buildEventMap } from "@/utils/calendar";
import type { CalendarEventMap } from "@/types/calendar";

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (year: number, month: number) => ["calendar", "events", year, month] as const,
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

  const query = useQuery({
    queryKey: calendarKeys.events(year, month),
    queryFn: () => calendarApi.listEvents(gridFrom, gridTo),
  });

  const eventMap = useMemo(() => buildEventMap(query.data), [query.data]);

  return {
    eventMap,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: useCallback(() => {
      query.refetch();
    }, [query]),
  };
}
