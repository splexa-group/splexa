import type { Prisma } from "@prisma/client";
import { HearingStatus } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";
import { caseDetailSelect, caseSummarySelect } from "@/db/selects";
import type { CreateCaseData, CreateCaseWithNewClientData } from "@/types/cases";

import type { ListCasesQuery } from "./schema";

export const casesRepository = {
  async create(data: CreateCaseData) {
    return prisma.case.create({ data, select: caseDetailSelect });
  },

  async createInTx(tx: Prisma.TransactionClient, data: CreateCaseData) {
    return tx.case.create({ data, select: caseDetailSelect });
  },

  async createWithNewClient(data: CreateCaseWithNewClientData) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          orgId: data.orgId,
          fullName: data.newClient.fullName,
          phone: data.newClient.phone,
          type: data.newClient.type,
          createdBy: data.createdBy,
        },
        select: { id: true },
      });

      const { newClient: _, ...caseData } = data;
      return tx.case.create({
        data: { ...caseData, clientId: client.id },
        select: caseDetailSelect,
      });
    });
  },

  async findById(id: string, orgId: string) {
    return prisma.case.findFirst({
      where: { id, orgId, deletedAt: null },
      select: caseDetailSelect,
    });
  },

  async list(orgId: string, query: ListCasesQuery) {
    const { search, status, caseType, priority, courtType, clientId, page, limit } = query;
    const where: Prisma.CaseWhereInput = {
      orgId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(caseType ? { caseType } : {}),
      ...(priority ? { priority } : {}),
      ...(courtType ? { courtType } : {}),
      ...(clientId ? { clientId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { caseNumber: { contains: search, mode: "insensitive" } },
              { courtName: { contains: search, mode: "insensitive" } },
              { client: { fullName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.case.findMany({
        where,
        select: caseSummarySelect,
        orderBy: [{ nextHearingDate: "asc" }, { updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, orgId: string, data: Prisma.CaseUpdateInput) {
    await prisma.case.updateMany({ where: { id, orgId, deletedAt: null }, data });
    return prisma.case.findFirstOrThrow({ where: { id, orgId }, select: caseDetailSelect });
  },

  async softDeleteCascade(id: string, orgId: string) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.case.updateMany({ where: { id, orgId, deletedAt: null }, data: { deletedAt: now } });
      await tx.hearing.updateMany({ where: { caseId: id, orgId, deletedAt: null }, data: { deletedAt: now } });
      await tx.importantDate.updateMany({ where: { caseId: id, orgId, deletedAt: null }, data: { deletedAt: now } });
      await tx.document.updateMany({ where: { caseId: id, orgId, deletedAt: null }, data: { deletedAt: now } });
    });
  },

  async updateNextHearingDate(caseId: string, orgId: string, tx: Prisma.TransactionClient) {
    const nextHearing = await tx.hearing.findFirst({
      where: { caseId, orgId, status: HearingStatus.Scheduled, date: { gte: new Date() }, deletedAt: null },
      orderBy: { date: "asc" },
      select: { date: true },
    });
    await tx.case.updateMany({
      where: { id: caseId, orgId },
      data: { nextHearingDate: nextHearing?.date ?? null },
    });
  },
};
