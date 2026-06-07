import type { Prisma } from "@prisma/client";
import { ImportantDateType } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";
import { importantDateCalendarSelect } from "@/db/selects";
import { parseDate } from "@/utils/date";

import type {
  CreateImportantDateInput,
  ListImportantDatesQuery,
  UpdateImportantDateInput,
} from "./schema";

export const importantDatesRepository = {
  async create(
    data: CreateImportantDateInput & {
      caseId: string;
      orgId: string;
      notifyUserId: string;
    },
  ) {
    return prisma.importantDate.create({
      data: {
        caseId: data.caseId,
        orgId: data.orgId,
        dateType: data.dateType,
        date: parseDate(data.date),
        description: data.description,
        notifyUserId: data.notifyUserId,
      },
    });
  },

  async listForCase(caseId: string, orgId: string) {
    return prisma.importantDate.findMany({
      where: {
        caseId,
        orgId,
        deletedAt: null,
        dateType: { not: ImportantDateType.HearingDate },
      },
      orderBy: { date: "asc" },
    });
  },

  async listCrossCase(orgId: string, query: ListImportantDatesQuery) {
    const { from, to, page, limit } = query;
    const where: Prisma.ImportantDateWhereInput = {
      orgId,
      deletedAt: null,
      dateType: { not: ImportantDateType.HearingDate },
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
      prisma.importantDate.findMany({
        where,
        select: importantDateCalendarSelect,
        orderBy: { date: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.importantDate.count({ where }),
    ]);

    return { data, total };
  },

  async findById(id: string, caseId: string, orgId: string) {
    return prisma.importantDate.findFirst({
      where: { id, caseId, orgId, deletedAt: null },
    });
  },

  async update(id: string, orgId: string, data: UpdateImportantDateInput) {
    const { count } = await prisma.importantDate.updateMany({
      where: { id, orgId, deletedAt: null },
      data: {
        ...(data.dateType ? { dateType: data.dateType } : {}),
        ...(data.date ? { date: parseDate(data.date) } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
    if (count === 0) return null;
    return prisma.importantDate.findFirstOrThrow({ where: { id, orgId, deletedAt: null } });
  },

  async softDelete(id: string, orgId: string) {
    return prisma.importantDate.updateMany({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};
