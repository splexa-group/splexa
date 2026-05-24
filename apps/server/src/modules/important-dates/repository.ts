import { ImportantDateType } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";
import { parseDate } from "@/utils/date";

import type {
  CreateImportantDateInput,
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

  async findById(id: string, caseId: string, orgId: string) {
    return prisma.importantDate.findFirst({
      where: { id, caseId, orgId, deletedAt: null },
    });
  },

  async update(id: string, orgId: string, data: UpdateImportantDateInput) {
    await prisma.importantDate.updateMany({
      where: { id, orgId, deletedAt: null },
      data: {
        ...(data.dateType ? { dateType: data.dateType } : {}),
        ...(data.date ? { date: parseDate(data.date) } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
    return prisma.importantDate.findFirstOrThrow({ where: { id, orgId } });
  },

  async softDelete(id: string, orgId: string) {
    return prisma.importantDate.updateMany({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};
