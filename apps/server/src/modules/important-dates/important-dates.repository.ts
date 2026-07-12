import { ImportantDateType } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";

import {
  CreateImportantDateInput,
  UpdateImportantDateInput,
} from "./important-dates.schema";

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
        date: data.date,
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
        dateType: { not: ImportantDateType.HEARING_DATE },
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
    const { count } = await prisma.importantDate.updateMany({
      where: { id, orgId, deletedAt: null },
      data: {
        dateType: data.dateType,
        date: data.date,
        description: data.description,
      },
    });
    if (count === 0) return null;
    return prisma.importantDate.findFirst({
      where: { id, orgId, deletedAt: null },
    });
  },

  async softDelete(id: string, orgId: string) {
    return prisma.importantDate.updateMany({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};
