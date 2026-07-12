import type { HearingPurpose, HearingStatus, ImportantDateType } from "@splexa-group/shared/enums";
import type { CalendarEvent } from "@splexa-group/shared/models";

import { calendarRepository } from "./calendar.repository";
import { ListCalendarEventsQuery } from "./calendar.schema";

export const calendarService = {
  async listEvents(orgId: string, query: ListCalendarEventsQuery): Promise<CalendarEvent[]> {
    const { hearings, importantDates } = await calendarRepository.listEvents(
      orgId,
      query.from,
      query.to,
    );

    const events: CalendarEvent[] = [
      ...hearings.map(
        (h): CalendarEvent => ({
          kind: "hearing",
          id: h.id,
          caseId: h.caseId,
          caseTitle: h.case.title,
          courtName: h.case.courtName,
          date: h.date.toISOString(),
          time: h.time,
          purpose: h.purpose as HearingPurpose | null,
          status: h.status as HearingStatus,
        }),
      ),
      ...importantDates.map(
        (d): CalendarEvent => ({
          kind: "important-date",
          id: d.id,
          caseId: d.caseId,
          caseTitle: d.case.title,
          date: d.date.toISOString(),
          dateType: d.dateType as ImportantDateType,
          description: d.description,
        }),
      ),
    ];

    return events.sort((a, b) => a.date.localeCompare(b.date));
  },
};
