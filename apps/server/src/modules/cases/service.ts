import type { Prisma } from "@prisma/client";

import { clientsRepository } from "@/modules/clients/repository";
import type { ServiceContext } from "@/types/service-context";
import { parseDate } from "@/utils/date";
import { AppError } from "@/utils/errors";
import { Errors } from "@/utils/errors";

import { casesRepository } from "./repository";
import type { CreateCaseInput, ListCasesQuery, UpdateCaseInput } from "./schema";

export const casesService = {
  async create(input: CreateCaseInput, ctx: ServiceContext) {
    const { newClient, clientId, filingDate, oppositeParties, ...rest } = input;

    const caseFields = {
      ...rest,
      orgId: ctx.orgId,
      createdBy: ctx.userId,
      oppositeParties: oppositeParties as Prisma.InputJsonValue,
      filingDate: filingDate ? parseDate(filingDate) : undefined,
    };

    if (clientId) {
      const client = await clientsRepository.findById(clientId, ctx.orgId);
      if (!client) throw Errors.clientNotFound();
      return { data: await casesRepository.create({ ...caseFields, clientId }) };
    }

    // unreachable at runtime: superRefine above guarantees newClient when clientId is absent
    if (!newClient) throw new AppError(422, "VALIDATION_ERROR", "newClient is required");

    const existingWithPhone = await clientsRepository.findByPhone(newClient.phone, ctx.orgId);
    const data = await casesRepository.createWithNewClient({ ...caseFields, newClient });

    if (existingWithPhone) {
      return {
        data,
        warnings: [`${existingWithPhone.fullName} already has this phone number`],
      };
    }

    return { data };
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
      (input.judgeName !== undefined && input.judgeName !== existing.judgeName) ||
      (input.judgeDesignation !== undefined &&
        input.judgeDesignation !== existing.judgeDesignation);

    const updateData: Prisma.CaseUpdateInput = {
      ...input,
      ...(input.filingDate ? { filingDate: parseDate(input.filingDate) } : {}),
      ...(judgeChanged ? { judgeUpdatedAt: new Date() } : {}),
    };

    const updated = await casesRepository.update(id, ctx.orgId, updateData);
    if (!updated) throw Errors.caseNotFound();
    return updated;
  },

  async delete(id: string, ctx: ServiceContext) {
    const existing = await casesRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();
    await casesRepository.softDeleteCascade(id, ctx.orgId);
  },
};
