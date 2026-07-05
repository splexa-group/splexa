import type { Prisma } from "@prisma/client";
import {
  HearingPurpose,
  HearingStatus,
  ImportantDateType,
} from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";
import { hearingCalendarSelect, hearingDetailSelect, hearingSummarySelect } from "@/db/selects";
import { casesRepository } from "@/modules/cases/repository";
import { parseDate } from "@/utils/date";

import type { CreateHearingInput, ListHearingsQuery } from "./schema";

export const hearingsRepository = {
  async create(
    data: CreateHearingInput & {
      caseId: string;
      orgId: string;
      addedBy: string;
      notifyUserId: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const status = data.status ?? HearingStatus.SCHEDULED;

      const hearing = await tx.hearing.create({
        data: {
          caseId: data.caseId,
          orgId: data.orgId,
          date: parseDate(data.date),
          time: data.time,
          purpose: data.purpose,
          notes: data.notes,
          judgePresent: data.judgePresent,
          addedBy: data.addedBy,
          status,
        },
        select: hearingSummarySelect,
      });

      await casesRepository.updateNextHearingDate(data.caseId, data.orgId, tx);

      if (status === HearingStatus.SCHEDULED) {
        await tx.importantDate.create({
          data: {
            caseId: data.caseId,
            orgId: data.orgId,
            dateType: ImportantDateType.HEARING_DATE,
            date: parseDate(data.date),
            sourceId: hearing.id,
            notifyUserId: data.notifyUserId,
          },
        });
      }

      return hearing;
    });
  },

  async findById(id: string, orgId: string) {
    return prisma.hearing.findFirst({
      where: { id, orgId, deletedAt: null },
      select: hearingDetailSelect,
    });
  },

  async findByCaseId(caseId: string, orgId: string) {
    return prisma.hearing.findMany({
      where: { caseId, orgId, deletedAt: null },
      select: hearingSummarySelect,
      orderBy: { date: "desc" },
    });
  },

  async listCrossCase(orgId: string, query: ListHearingsQuery) {
    const { from, to, status, caseId, page, limit } = query;
    const where: Prisma.HearingWhereInput = {
      orgId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(caseId ? { caseId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: parseDate(from) } : {}),
              ...(to ? { lte: parseDate(to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.hearing.findMany({
        where,
        select: hearingCalendarSelect,
        orderBy: { date: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hearing.count({ where }),
    ]);

    return { data, total };
  },

  async update(
    id: string,
    caseId: string,
    orgId: string,
    data: {
      status?: HearingStatus;
      notes?: string;
      date?: string;
      time?: string;
      nextDate?: string;
      adjournmentReason?: string;
      judgePresent?: string;
      purpose?: HearingPurpose;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.hearing.updateMany({
        where: { id, orgId, deletedAt: null },
        data: {
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.date ? { date: parseDate(data.date) } : {}),
          ...(data.time !== undefined ? { time: data.time || null } : {}),
          ...(data.nextDate ? { nextDate: parseDate(data.nextDate) } : {}),
          ...(data.adjournmentReason !== undefined
            ? { adjournmentReason: data.adjournmentReason }
            : {}),
          ...(data.judgePresent !== undefined
            ? { judgePresent: data.judgePresent }
            : {}),
          ...(data.purpose !== undefined ? { purpose: data.purpose } : {}),
        },
      });

      if (count === 0) return null;

      const updated = await tx.hearing.findFirstOrThrow({
        where: { id, orgId, deletedAt: null },
        select: hearingSummarySelect,
      });

      await casesRepository.updateNextHearingDate(caseId, orgId, tx);

      if (
        data.status === HearingStatus.CANCELLED ||
        data.status === HearingStatus.COMPLETED
      ) {
        // Terminal status — no more reminders needed for this hearing
        await tx.importantDate.updateMany({
          where: { sourceId: id, orgId, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      } else {
        if (data.date) {
          await tx.importantDate.updateMany({
            where: {
              sourceId: id,
              orgId,
              dateType: ImportantDateType.HEARING_DATE,
              deletedAt: null,
            },
            data: { date: parseDate(data.date) },
          });
        }
        if (data.nextDate) {
          await tx.importantDate.updateMany({
            where: {
              sourceId: id,
              orgId,
              dateType: ImportantDateType.HEARING_DATE,
              deletedAt: null,
            },
            data: { date: parseDate(data.nextDate) },
          });
        }
      }

      return updated;
    });
  },

  async softDelete(id: string, caseId: string, orgId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.hearing.updateMany({
        where: { id, orgId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      await casesRepository.updateNextHearingDate(caseId, orgId, tx);

      await tx.importantDate.updateMany({
        where: { sourceId: id, orgId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
  },
};
