import { GET } from "@/api/http";
import type { CalendarHearing, CalendarImportantDate } from "@/types/calendar";

export const calendarApi = {
  hearings: (from: string, to: string) =>
    GET<{ hearings: CalendarHearing[]; total: number }>("/hearings", {
      params: { from, to, limit: 100 },
    }).then((r) => ({ data: r.hearings, total: r.total })),

  importantDates: (from: string, to: string) =>
    GET<{ importantDates: CalendarImportantDate[]; total: number }>("/important-dates", {
      params: { from, to, limit: 200 },
    }).then((r) => ({ data: r.importantDates, total: r.total })),
};
