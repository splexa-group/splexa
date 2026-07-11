import { Prisma } from "@prisma/client";

import { ServiceContext } from "@/models/service-context";
import { clientsRepository } from "@/modules/clients/clients.repository";
import { parseDate } from "@/utils/date";
import { Errors } from "@/utils/errors";

import { casesRepository } from "./cases.repository";
import {
  AddClientToCaseInput,
  CreateCaseInput,
  ListCasesQuery,
  UpdateCaseInput,
} from "./cases.schema";

export const casesService = {
  async create(input: CreateCaseInput, ctx: ServiceContext) {
    return casesRepository.create({
      ...input,
      orgId: ctx.orgId,
      createdBy: ctx.userId,
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

    if (input.clientId) {
      const client = await clientsRepository.findById(
        input.clientId,
        ctx.orgId,
      );
      if (!client) throw Errors.clientNotFound();
    }

    if (input.assignedTo) {
      const assignedUserExists = await casesRepository.userExistsInOrg(
        input.assignedTo,
        ctx.orgId,
      );
      if (!assignedUserExists) throw Errors.assignedUserNotFound();
    }

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

    const updated = await casesRepository.update(id, ctx.orgId, updateData);
    if (!updated) throw Errors.caseNotFound();
    return updated;
  },

  async addClient(
    caseId: string,
    input: AddClientToCaseInput,
    ctx: ServiceContext,
  ) {
    const existing = await casesRepository.findById(caseId, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();
    if (existing.clientId) throw Errors.caseClientExists();

    const existingWithPhone = await clientsRepository.findByPhone(
      input.phone,
      ctx.orgId,
    );

    const updated = await casesRepository.createClientAndLink(
      caseId,
      ctx.orgId,
      {
        ...input,
        orgId: ctx.orgId,
        createdBy: ctx.userId,
      },
    );
    if (!updated) {
      const stillExists = await casesRepository.findById(caseId, ctx.orgId);
      throw stillExists ? Errors.caseClientExists() : Errors.caseNotFound();
    }

    if (existingWithPhone) {
      return {
        data: updated,
        warnings: [
          `${existingWithPhone.fullName} already has this phone number`,
        ],
      };
    }
    return { data: updated };
  },

  async delete(id: string, ctx: ServiceContext) {
    const existing = await casesRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();
    const { count } = await casesRepository.softDeleteCascade(id, ctx.orgId);
    if (count === 0) throw Errors.caseNotFound();
  },
};
