import { GET } from "@/api/http";
import type { CalendarHearing, CalendarImportantDate } from "@/types/calendar";

interface CalendarPageResult<T> {
  data: T[];
  total: number;
}

export const calendarApi = {
  hearings: (from: string, to: string) =>
    GET<CalendarPageResult<CalendarHearing>>("/hearings", {
      params: { from, to, limit: 200 },
    }),

  importantDates: (from: string, to: string) =>
    GET<CalendarPageResult<CalendarImportantDate>>("/important-dates", {
      params: { from, to, limit: 200 },
    }),
};
