import { CaseStatus, HearingPurpose, HearingStatus, ImportantDateType, Priority } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";

import { DashboardData } from "./dashboard.models";

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

// A hearing's relevant upcoming date is `date` when SCHEDULED, or `nextDate` when ADJOURNED
// (`date` is then stale — the date it was adjourned from) — every "is this hearing in range
// X" query needs to check both, or adjourned hearings silently vanish from the dashboard.
function upcomingHearingWhere(orgId: string, gte: Date, lte: Date) {
  return {
    orgId,
    deletedAt: null,
    OR: [
      { status: HearingStatus.SCHEDULED, date: { gte, lte } },
      { status: HearingStatus.ADJOURNED, nextDate: { gte, lte } },
    ],
  };
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
      upcomingHearingCandidates,
      upcomingDeadlines,
      highPriorityCases,
    ] = await Promise.all([
      prisma.case.count({
        where: { orgId, status: CaseStatus.ACTIVE, deletedAt: null },
      }),

      prisma.hearing.count({
        where: upcomingHearingWhere(orgId, todayStart, todayEnd),
      }),

      prisma.hearing.count({
        where: upcomingHearingWhere(orgId, todayStart, week7End),
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
        where: upcomingHearingWhere(orgId, todayStart, week14End),
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

    // Can't ask Prisma to order by "whichever date field is relevant" directly, so the
    // candidate set above is unordered — resolve each hearing's effective date, then sort
    // and cap to 5 here.
    const upcomingHearings = upcomingHearingCandidates
      .map((h) => {
        const effectiveDate = h.status === HearingStatus.ADJOURNED ? h.nextDate : h.date;
        return effectiveDate ? { ...h, effectiveDate } : null;
      })
      .filter((h): h is NonNullable<typeof h> => h !== null)
      .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())
      .slice(0, 5);

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
        date:      h.effectiveDate,
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
