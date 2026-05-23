import type { Prisma } from "@prisma/client";

import { clientsRepository } from "@/modules/clients/repository";
import type { ServiceContext } from "@/types/service-context";
import { parseDate } from "@/utils/date";
import { Errors } from "@/utils/errors";

import { casesRepository } from "./repository";
import type {
  CreateCaseInput,
  ListCasesQuery,
  UpdateCaseInput,
} from "./schema";

export const casesService = {
  async create(input: CreateCaseInput, ctx: ServiceContext) {
    const { newClient, clientId, filingDate, oppositeParties, ...rest } = input;

    const caseFields = {
      orgId: ctx.orgId,
      createdBy: ctx.userId,
      title: rest.title,
      clientRole: rest.clientRole,
      caseNumber: rest.caseNumber,
      caseType: rest.caseType,
      filingDate: filingDate ? parseDate(filingDate) : undefined,
      courtName: rest.courtName,
      courtType: rest.courtType,
      courtState: rest.courtState,
      courtCity: rest.courtCity,
      benchNumber: rest.benchNumber,
      judgeName: rest.judgeName,
      judgeDesignation: rest.judgeDesignation,
      status: rest.status,
      stage: rest.stage,
      priority: rest.priority,
      oppositeParties: oppositeParties as Prisma.InputJsonValue,
      notes: rest.notes,
      tags: rest.tags,
      assignedTo: rest.assignedTo,
    };

    if (clientId) {
      const client = await clientsRepository.findById(clientId, ctx.orgId);
      if (!client) throw Errors.clientNotFound();
      return casesRepository.create({ ...caseFields, clientId });
    }

    return casesRepository.createWithNewClient({
      ...caseFields,
      newClient: newClient!,
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

  async update(id: string, input: UpdateCaseInput, ctx: ServiceContext) {
    const existing = await casesRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();

    const judgeChanged =
      (input.judgeName !== undefined &&
        input.judgeName !== existing.judgeName) ||
      (input.judgeDesignation !== undefined &&
        input.judgeDesignation !== existing.judgeDesignation);

    const updateData: Prisma.CaseUpdateInput = {
      ...input,
      ...(input.filingDate ? { filingDate: parseDate(input.filingDate) } : {}),
      ...(judgeChanged ? { judgeUpdatedAt: new Date() } : {}),
    };

    return casesRepository.update(id, updateData);
  },

  async delete(id: string, ctx: ServiceContext) {
    const existing = await casesRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();
    await casesRepository.softDeleteCascade(id, ctx.orgId);
  },
};
