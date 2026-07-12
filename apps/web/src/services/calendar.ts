import { GET } from "@/api/http";
import type { CalendarEvent } from "@/types/calendar";

export const calendarApi = {
  listEvents: (from: string, to: string) =>
    GET<{ events: CalendarEvent[] }>("/calendar", { params: { from, to } }).then(
      (r) => r.events,
    ),
};
