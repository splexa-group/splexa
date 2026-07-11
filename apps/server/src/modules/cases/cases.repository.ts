import { Prisma, ClientType } from "@prisma/client";
import { HearingStatus } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";
import { caseDetailSelect, caseSummarySelect } from "@/db/selects/case.select";

import { CreateCaseData } from "./cases.models";
import { ListCasesQuery } from "./cases.schema";

export const casesRepository = {
  async create(data: CreateCaseData) {
    return prisma.case.create({ data, select: caseDetailSelect });
  },

  async findById(id: string, orgId: string) {
    return prisma.case.findFirst({
      where: { id, orgId, deletedAt: null },
      select: caseDetailSelect,
    });
  },

  async list(orgId: string, query: ListCasesQuery) {
    const {
      search,
      status,
      caseType,
      priority,
      courtType,
      clientId,
      sortBy,
      page,
      limit,
    } = query;
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
              {
                client: { fullName: { contains: search, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.case.findMany({
        where,
        select: caseSummarySelect,
        orderBy:
          sortBy === "createdAt"
            ? [{ createdAt: "desc" }]
            : [{ nextHearingDate: "asc" }, { updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, orgId: string, data: Prisma.CaseUpdateInput) {
    const { count } = await prisma.case.updateMany({
      where: { id, orgId, deletedAt: null },
      data,
    });
    if (count === 0) return null;
    return prisma.case.findFirstOrThrow({
      where: { id, orgId, deletedAt: null },
      select: caseDetailSelect,
    });
  },

  async createClientAndLink(
    caseId: string,
    orgId: string,
    clientData: {
      fullName: string;
      phone: string;
      type: string;
      email?: string;
      address?: string;
      companyName?: string;
      notes?: string;
      orgId: string;
      createdBy: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          orgId: clientData.orgId,
          fullName: clientData.fullName,
          phone: clientData.phone,
          type: clientData.type as ClientType,
          email: clientData.email,
          address: clientData.address,
          companyName: clientData.companyName,
          notes: clientData.notes,
          createdBy: clientData.createdBy,
        },
        select: { id: true },
      });
      const { count } = await tx.case.updateMany({
        where: { id: caseId, orgId, deletedAt: null, clientId: null },
        data: { clientId: client.id },
      });
      if (count === 0) return null;
      return tx.case.findFirstOrThrow({
        where: { id: caseId, orgId, deletedAt: null },
        select: caseDetailSelect,
      });
    });
  },

  async userExistsInOrg(userId: string, orgId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { id: userId, orgId, deletedAt: null },
      select: { id: true },
    });
    return user !== null;
  },

  async softDeleteCascade(
    id: string,
    orgId: string,
  ): Promise<{ count: number }> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const { count } = await tx.case.updateMany({
        where: { id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      if (count === 0) return { count };

      await tx.hearing.updateMany({
        where: { caseId: id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.importantDate.updateMany({
        where: { caseId: id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.document.updateMany({
        where: { caseId: id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      return { count };
    });
  },

  async updateNextHearingDate(
    caseId: string,
    orgId: string,
    tx: Prisma.TransactionClient,
  ) {
    const nextHearing = await tx.hearing.findFirst({
      where: {
        caseId,
        orgId,
        status: HearingStatus.SCHEDULED,
        date: { gte: new Date() },
        deletedAt: null,
      },
      orderBy: { date: "asc" },
      select: { date: true },
    });
    await tx.case.updateMany({
      where: { id: caseId, orgId },
      data: { nextHearingDate: nextHearing?.date ?? null },
    });
  },
};
