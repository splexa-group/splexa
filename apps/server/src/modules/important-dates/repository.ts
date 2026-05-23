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

  async findById(id: string, caseId: string, orgId: string) {
    return prisma.importantDate.findFirst({
      where: { id, caseId, orgId, deletedAt: null },
    });
  },

  async update(id: string, data: UpdateImportantDateInput) {
    return prisma.importantDate.update({
      where: { id },
      data: {
        ...(data.dateType ? { dateType: data.dateType } : {}),
        ...(data.date ? { date: parseDate(data.date) } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
      },
    });
  },

  async softDelete(id: string, orgId: string) {
    return prisma.importantDate.updateMany({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};
