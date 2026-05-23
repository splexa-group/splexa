import { prisma } from "@/db/client";
import { Errors } from "@/utils/errors";
import { clientsRepository } from "@/modules/clients/repository";

import type {
  CreateCaseInput,
  CreateImportantDateInput,
  ListCasesQuery,
  UpdateCaseInput,
  UpdateImportantDateInput,
} from "./schema";
import { casesRepository } from "./repository";

type Ctx = { orgId: string; userId: string; ipAddress: string };

export const casesService = {
  async create(input: CreateCaseInput, ctx: Ctx) {
    const { newClient, clientId, ...caseFields } = input;

    if (clientId) {
      const client = await clientsRepository.findById(clientId, ctx.orgId);
      if (!client) throw Errors.clientNotFound();

      return casesRepository.create({
        orgId: ctx.orgId,
        createdBy: ctx.userId,
        clientId,
        title: caseFields.title,
        clientRole: caseFields.clientRole,
        caseNumber: caseFields.caseNumber,
        caseType: caseFields.caseType,
        filingDate: caseFields.filingDate ? new Date(caseFields.filingDate) : undefined,
        courtName: caseFields.courtName,
        courtType: caseFields.courtType,
        courtState: caseFields.courtState,
        courtCity: caseFields.courtCity,
        benchNumber: caseFields.benchNumber,
        judgeName: caseFields.judgeName,
        judgeDesignation: caseFields.judgeDesignation,
        status: caseFields.status,
        stage: caseFields.stage,
        priority: caseFields.priority,
        oppositeParties: caseFields.oppositeParties as never,
        notes: caseFields.notes,
        tags: caseFields.tags,
        assignedTo: caseFields.assignedTo,
      });
    }

    // newClient path — create client and case atomically
    return prisma.$transaction(async (tx) => {
      const createdClient = await tx.client.create({
        data: {
          orgId: ctx.orgId,
          fullName: newClient!.fullName,
          phone: newClient!.phone,
          type: newClient!.type,
          createdBy: ctx.userId,
        },
        select: { id: true },
      });

      return casesRepository.createInTx(tx, {
        orgId: ctx.orgId,
        createdBy: ctx.userId,
        clientId: createdClient.id,
        title: caseFields.title,
        clientRole: caseFields.clientRole,
        caseNumber: caseFields.caseNumber,
        caseType: caseFields.caseType,
        filingDate: caseFields.filingDate ? new Date(caseFields.filingDate) : undefined,
        courtName: caseFields.courtName,
        courtType: caseFields.courtType,
        courtState: caseFields.courtState,
        courtCity: caseFields.courtCity,
        benchNumber: caseFields.benchNumber,
        judgeName: caseFields.judgeName,
        judgeDesignation: caseFields.judgeDesignation,
        status: caseFields.status,
        stage: caseFields.stage,
        priority: caseFields.priority,
        oppositeParties: caseFields.oppositeParties as never,
        notes: caseFields.notes,
        tags: caseFields.tags,
        assignedTo: caseFields.assignedTo,
      });
    });
  },

  async list(orgId: string, query: ListCasesQuery) {
    return casesRepository.list(orgId, query);
  },

  async findById(id: string, orgId: string) {
    const c = await casesRepository.findById(id, orgId);
    if (!c) throw Errors.caseNotFound();
    return c;
  },

  async update(id: string, input: UpdateCaseInput, ctx: Ctx) {
    const existing = await casesRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();

    const judgeChanged =
      (input.judgeName !== undefined && input.judgeName !== existing.judgeName) ||
      (input.judgeDesignation !== undefined &&
        input.judgeDesignation !== existing.judgeDesignation);

    const updateData: Record<string, unknown> = { ...input };
    if (input.filingDate) updateData.filingDate = new Date(input.filingDate);
    if (judgeChanged) updateData.judgeUpdatedAt = new Date();

    return casesRepository.update(id, updateData as never);
  },

  async delete(id: string, ctx: Ctx) {
    const existing = await casesRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();
    await casesRepository.softDeleteCascade(id, ctx.orgId);
  },

  async createImportantDate(
    caseId: string,
    input: CreateImportantDateInput,
    ctx: Ctx,
  ) {
    const existing = await casesRepository.findById(caseId, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();

    const notifyUserId = existing.assignedTo ?? existing.createdBy;

    return casesRepository.createImportantDate(
      { ...input, caseId, orgId: ctx.orgId },
      notifyUserId,
    );
  },

  async updateImportantDate(
    caseId: string,
    dateId: string,
    input: UpdateImportantDateInput,
    ctx: Ctx,
  ) {
    const date = await casesRepository.findImportantDateById(
      dateId,
      caseId,
      ctx.orgId,
    );
    if (!date) throw Errors.importantDateNotFound();
    return casesRepository.updateImportantDate(dateId, caseId, ctx.orgId, input);
  },

  async deleteImportantDate(caseId: string, dateId: string, ctx: Ctx) {
    const date = await casesRepository.findImportantDateById(
      dateId,
      caseId,
      ctx.orgId,
    );
    if (!date) throw Errors.importantDateNotFound();
    await casesRepository.softDeleteImportantDate(dateId, ctx.orgId);
  },
};
