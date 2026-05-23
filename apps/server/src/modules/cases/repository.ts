import { $Enums } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { HearingStatus } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";
import { caseSummarySelect, clientSelect, hearingSummarySelect } from "@/db/selects";

import type {
  CreateImportantDateInput,
  ListCasesQuery,
  UpdateImportantDateInput,
} from "./schema";

const caseDetailSelect = {
  id: true,
  orgId: true,
  title: true,
  clientId: true,
  clientRole: true,
  caseNumber: true,
  caseType: true,
  filingDate: true,
  courtName: true,
  courtType: true,
  courtState: true,
  courtCity: true,
  benchNumber: true,
  judgeName: true,
  judgeDesignation: true,
  judgeUpdatedAt: true,
  status: true,
  stage: true,
  priority: true,
  oppositeParties: true,
  notes: true,
  tags: true,
  nextHearingDate: true,
  assignedTo: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  client: { select: clientSelect },
  hearings: {
    where: { deletedAt: null },
    orderBy: { date: "desc" as const },
    take: 5,
    select: hearingSummarySelect,
  },
  importantDates: {
    where: { deletedAt: null },
    orderBy: { date: "asc" as const },
    select: {
      id: true,
      dateType: true,
      date: true,
      description: true,
      createdAt: true,
    },
  },
} satisfies Prisma.CaseSelect;

type CreateCaseData = {
  orgId: string;
  createdBy: string;
  title: string;
  clientId: string;
  clientRole: $Enums.PartyRole;
  caseNumber?: string;
  caseType?: $Enums.CaseType;
  filingDate?: Date;
  courtName?: string;
  courtType?: $Enums.CourtType;
  courtState?: string;
  courtCity?: string;
  benchNumber?: string;
  judgeName?: string;
  judgeDesignation?: string;
  status?: $Enums.CaseStatus;
  stage?: $Enums.CaseStage;
  priority?: $Enums.Priority;
  oppositeParties?: Prisma.InputJsonValue;
  notes?: string;
  tags?: string[];
  assignedTo?: string;
};

export const casesRepository = {
  async create(data: CreateCaseData) {
    return prisma.case.create({ data, select: caseDetailSelect });
  },

  async createInTx(tx: Prisma.TransactionClient, data: CreateCaseData) {
    return tx.case.create({ data, select: caseDetailSelect });
  },

  async findById(id: string, orgId: string) {
    return prisma.case.findFirst({
      where: { id, orgId, deletedAt: null },
      select: caseDetailSelect,
    });
  },

  async list(orgId: string, query: ListCasesQuery) {
    const { search, status, caseType, priority, courtType, clientId, page, limit } =
      query;
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

  async update(id: string, data: Prisma.CaseUpdateInput) {
    return prisma.case.update({ where: { id }, data, select: caseDetailSelect });
  },

  async softDeleteCascade(id: string, orgId: string) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.case.updateMany({
        where: { id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.hearing.updateMany({
        where: { caseId: id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.caseImportantDate.updateMany({
        where: { caseId: id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.scheduledEvent.updateMany({
        where: { caseId: id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
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
        status: HearingStatus.Scheduled,
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

  async createImportantDate(
    data: CreateImportantDateInput & { caseId: string; orgId: string },
    notifyUserId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const importantDate = await tx.caseImportantDate.create({
        data: {
          caseId: data.caseId,
          orgId: data.orgId,
          dateType: data.dateType,
          date: new Date(data.date),
          description: data.description,
        },
      });

      await tx.scheduledEvent.create({
        data: {
          orgId: data.orgId,
          type: $Enums.ScheduledEventType.ImportantDate,
          date: new Date(data.date),
          sourceId: importantDate.id,
          sourceType: "important-date",
          caseId: data.caseId,
          notifyUserId,
        },
      });

      return importantDate;
    });
  },

  async findImportantDateById(id: string, caseId: string, orgId: string) {
    return prisma.caseImportantDate.findFirst({
      where: { id, caseId, orgId, deletedAt: null },
    });
  },

  async updateImportantDate(
    id: string,
    caseId: string,
    orgId: string,
    data: UpdateImportantDateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.caseImportantDate.update({
        where: { id },
        data: {
          ...(data.dateType ? { dateType: data.dateType } : {}),
          ...(data.date ? { date: new Date(data.date) } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
        },
      });

      if (data.date) {
        await tx.scheduledEvent.updateMany({
          where: { sourceId: id, deletedAt: null },
          data: { date: new Date(data.date) },
        });
      }

      return updated;
    });
  },

  async softDeleteImportantDate(id: string, orgId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.caseImportantDate.updateMany({
        where: { id, orgId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await tx.scheduledEvent.updateMany({
        where: { sourceId: id, orgId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
  },
};
