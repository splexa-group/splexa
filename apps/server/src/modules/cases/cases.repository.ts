import { Prisma } from "@prisma/client";
import { HearingStatus } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";
import { caseDetailSelect, caseSummarySelect } from "@/db/selects/case.select";

import { CaseClientData, CreateCaseData } from "./cases.models";
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
    const { search, status, caseType, page, limit } = query;
    const where: Prisma.CaseWhereInput = {
      orgId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(caseType ? { caseType } : {}),
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
        orderBy: [{ nextHearingDate: "asc" }, { updatedAt: "desc" }],
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
    return prisma.case.findFirst({
      where: { id, orgId, deletedAt: null },
      select: caseDetailSelect,
    });
  },

  async createClientAndLink(
    caseId: string,
    orgId: string,
    clientData: CaseClientData,
  ) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          orgId: clientData.orgId,
          fullName: clientData.fullName,
          phone: clientData.phone,
          type: clientData.type,
          email: clientData.email,
          address: clientData.address,
          companyName: clientData.companyName,
          notes: clientData.notes,
          relationType: clientData.relationType,
          relationName: clientData.relationName,
          dateOfBirth: clientData.dateOfBirth,
          occupation: clientData.occupation,
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
    const now = new Date();

    // An adjourned hearing's upcoming date lives in `nextDate`, not `date` (`date` still
    // holds the past date it was adjourned from) — both cases need to be considered, or a
    // case's "next hearing" silently disappears every time its only hearing is adjourned.
    const [nextScheduled, nextAdjourned] = await Promise.all([
      tx.hearing.findFirst({
        where: {
          caseId,
          orgId,
          status: HearingStatus.SCHEDULED,
          date: { gte: now },
          deletedAt: null,
        },
        orderBy: { date: "asc" },
        select: { date: true },
      }),
      tx.hearing.findFirst({
        where: {
          caseId,
          orgId,
          status: HearingStatus.ADJOURNED,
          nextDate: { gte: now },
          deletedAt: null,
        },
        orderBy: { nextDate: "asc" },
        select: { nextDate: true },
      }),
    ]);

    const candidates = [nextScheduled?.date, nextAdjourned?.nextDate].filter(
      (date): date is Date => date != null,
    );
    const nextHearingDate =
      candidates.length > 0
        ? candidates.reduce((earliest, date) =>
            date < earliest ? date : earliest,
          )
        : null;

    await tx.case.updateMany({
      where: { id: caseId, orgId },
      data: { nextHearingDate },
    });
  },
};
