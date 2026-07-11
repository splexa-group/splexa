import { Prisma } from "@prisma/client";

import { clientsRepository } from "@/modules/clients/clients.repository";
import { ServiceContext } from "@/types/service-context";
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
      return {
        data: await casesRepository.create({ ...caseFields, clientId }),
      };
    }

    if (!newClient) {
      return { data: await casesRepository.create(caseFields) };
    }

    const existingWithPhone = await clientsRepository.findByPhone(
      newClient.phone,
      ctx.orgId,
    );
    const data = await casesRepository.createWithNewClient({
      ...caseFields,
      newClient,
    });

    if (existingWithPhone) {
      return {
        data,
        warnings: [
          `${existingWithPhone.fullName} already has this phone number`,
        ],
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

    if (input.clientId) {
      const client = await clientsRepository.findById(
        input.clientId,
        ctx.orgId,
      );
      if (!client) throw Errors.clientNotFound();
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
    if (!updated) throw Errors.caseNotFound();

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
