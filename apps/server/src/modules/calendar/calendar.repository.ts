import { Prisma } from "@prisma/client";
import { ImportantDateType } from "@splexa-group/shared/enums";

import { MAX_CALENDAR_EVENTS_PER_TYPE } from "@/constants/misc";
import { prisma } from "@/db/client";
import { hearingCalendarSelect } from "@/db/selects/hearing.select";
import { importantDateCalendarSelect } from "@/db/selects/important-date.select";
import { parseDate } from "@/utils/date";

export const calendarRepository = {
  async listEvents(orgId: string, from: string, to: string) {
    const dateRange: Prisma.DateTimeFilter = { gte: parseDate(from), lte: parseDate(to) };

    const [hearings, importantDates] = await Promise.all([
      prisma.hearing.findMany({
        where: { orgId, deletedAt: null, date: dateRange },
        select: hearingCalendarSelect,
        orderBy: { date: "asc" },
        take: MAX_CALENDAR_EVENTS_PER_TYPE,
      }),
      prisma.importantDate.findMany({
        where: {
          orgId,
          deletedAt: null,
          dateType: { not: ImportantDateType.HEARING_DATE },
          date: dateRange,
        },
        select: importantDateCalendarSelect,
        orderBy: { date: "asc" },
        take: MAX_CALENDAR_EVENTS_PER_TYPE,
      }),
    ]);

    return { hearings, importantDates };
  },
};
