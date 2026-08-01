import type {
  HearingPurpose,
  HearingStatus,
  ImportantDateType,
} from "@splexa-group/shared/enums";
import type { CalendarEvent } from "@splexa-group/shared/models";

import { calendarRepository } from "./calendar.repository";
import { CalendarEventsQuery } from "./calendar.schema";

export const calendarService = {
  async listEvents(
    orgId: string,
    query: CalendarEventsQuery,
  ): Promise<CalendarEvent[]> {
    const { hearings, importantDates } = await calendarRepository.listEvents(
      orgId,
      query.from,
      query.to,
    );

    const events: CalendarEvent[] = [
      ...hearings.map(
        (hearing): CalendarEvent => ({
          kind: "hearing",
          id: hearing.id,
          caseId: hearing.caseId,
          caseTitle: hearing.case.title,
          courtName: hearing.case.courtName,
          date: hearing.date.toISOString(),
          time: hearing.time,
          purpose: hearing.purpose as HearingPurpose | null,
          status: hearing.status as HearingStatus,
          notes: hearing.notes,
        }),
      ),
      ...importantDates.map(
        (date): CalendarEvent => ({
          kind: "important-date",
          id: date.id,
          caseId: date.caseId,
          caseTitle: date.case.title,
          date: date.date.toISOString(),
          dateType: date.dateType as ImportantDateType,
          description: date.description,
        }),
      ),
    ];

    return events.sort((a, b) => a.date.localeCompare(b.date));
  },
};
