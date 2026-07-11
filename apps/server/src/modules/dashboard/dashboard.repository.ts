import { CaseStatus, HearingPurpose, HearingStatus, ImportantDateType, Priority } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";

import type { DashboardData } from "./dashboard.schema";

const CRITICAL_DATE_TYPES = [
  ImportantDateType.LIMITATION,
  ImportantDateType.BAIL_EXPIRY,
  ImportantDateType.STAY_EXPIRY,
  ImportantDateType.APPEAL_DEADLINE,
  ImportantDateType.INJUNCTION_VALIDITY,
] as const;

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export const dashboardRepository = {
  async getData(orgId: string): Promise<DashboardData> {
    const now        = new Date();
    const todayStart = startOfDay(now);
    const todayEnd   = endOfDay(now);
    const week7End   = endOfDay(addDays(now, 7));
    const week14End  = endOfDay(addDays(now, 14));
    const month30End = endOfDay(addDays(now, 30));

    const [
      activeCases,
      hearingsToday,
      hearingsThisWeek,
      upcomingDeadlinesCount,
      upcomingHearings,
      upcomingDeadlines,
      highPriorityCases,
    ] = await Promise.all([
      prisma.case.count({
        where: { orgId, status: CaseStatus.ACTIVE, deletedAt: null },
      }),

      prisma.hearing.count({
        where: {
          orgId,
          status: HearingStatus.SCHEDULED,
          date: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
        },
      }),

      prisma.hearing.count({
        where: {
          orgId,
          status: HearingStatus.SCHEDULED,
          date: { gte: todayStart, lte: week7End },
          deletedAt: null,
        },
      }),

      prisma.importantDate.count({
        where: {
          orgId,
          date: { gte: todayStart, lte: month30End },
          dateType: { in: [...CRITICAL_DATE_TYPES] },
          deletedAt: null,
        },
      }),

      prisma.hearing.findMany({
        where: {
          orgId,
          status: HearingStatus.SCHEDULED,
          date: { gte: todayStart, lte: week14End },
          deletedAt: null,
        },
        orderBy: { date: "asc" },
        take: 5,
        include: { case: { select: { title: true, courtName: true } } },
      }),

      prisma.importantDate.findMany({
        where: {
          orgId,
          date: { gte: todayStart, lte: month30End },
          dateType: { in: [...CRITICAL_DATE_TYPES] },
          deletedAt: null,
        },
        orderBy: { date: "asc" },
        take: 5,
        include: { case: { select: { title: true } } },
      }),

      prisma.case.findMany({
        where: { orgId, status: CaseStatus.ACTIVE, priority: Priority.HIGH, deletedAt: null },
        orderBy: [{ nextHearingDate: { sort: "asc", nulls: "last" } }],
        take: 5,
        select: { id: true, title: true, caseNumber: true, courtName: true, nextHearingDate: true },
      }),
    ]);

    return {
      stats: {
        activeCases,
        hearingsToday,
        hearingsThisWeek,
        upcomingDeadlines: upcomingDeadlinesCount,
      },
      upcomingHearings: upcomingHearings.map((h) => ({
        id:        h.id,
        caseId:    h.caseId,
        caseTitle: h.case.title,
        courtName: h.case.courtName,
        date:      h.date,
        time:      h.time,
        purpose:   h.purpose as HearingPurpose | null,
      })),
      upcomingDeadlines: upcomingDeadlines.map((d) => ({
        id:          d.id,
        caseId:      d.caseId,
        caseTitle:   d.case.title,
        dateType:    d.dateType as ImportantDateType,
        date:        d.date,
        description: d.description,
      })),
      highPriorityCases: highPriorityCases.map((c) => ({
        id:              c.id,
        title:           c.title,
        caseNumber:      c.caseNumber,
        courtName:       c.courtName,
        nextHearingDate: c.nextHearingDate,
      })),
    };
  },
};
