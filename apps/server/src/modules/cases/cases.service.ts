import { Prisma } from "@prisma/client";

import { logger } from "@/config/logger";
import { ReqContext } from "@/models/req-context";
import { clientsService } from "@/modules/clients/clients.service";
import { settingsService } from "@/modules/settings/settings.service";
import { Errors } from "@/utils/errors";

import { didJudgeChange } from "./cases.helper";
import { casesRepository } from "./cases.repository";
import {
  CreateClientInput,
  CreateCaseInput,
  ListCasesQuery,
  UpdateCaseInput,
} from "./cases.schema";

export const casesService = {
  create(input: CreateCaseInput, ctx: ReqContext) {
    return casesRepository.create({
      ...input,
      orgId: ctx.orgId,
      createdBy: ctx.userId,
    });
  },

  list(orgId: string, query: ListCasesQuery) {
    return casesRepository.list(orgId, query);
  },

  async findById(caseId: string, orgId: string) {
    const caseDetails = await casesRepository.findById(caseId, orgId);
    if (!caseDetails) throw Errors.caseNotFound();
    return caseDetails;
  },

  async update(caseId: string, input: UpdateCaseInput, ctx: ReqContext) {
    const oldCaseDetails = await casesRepository.findById(caseId, ctx.orgId);
    if (!oldCaseDetails) throw Errors.caseNotFound();

    if (input.clientId) {
      await clientsService.findById(input.clientId, ctx.orgId);
    }

    if (input.assignedTo) {
      const assignedUser = await settingsService.findUserById(
        input.assignedTo,
        ctx.orgId,
      );
      if (!assignedUser) throw Errors.assignedUserNotFound();
    }

    const judgeChanged = didJudgeChange(input, oldCaseDetails);

    const updateData: Prisma.CaseUpdateInput = {
      ...input,
      ...(judgeChanged ? { judgeUpdatedAt: new Date() } : {}),
    };

    const updated = await casesRepository.update(caseId, ctx.orgId, updateData);
    if (!updated) throw Errors.caseNotFound();
    logger.info(
      {
        caseId,
        userId: ctx.userId,
        orgId: ctx.orgId,
        oldCaseDetails,
        updateData,
      },
      "cases: case updated",
    );
    return updated;
  },

  async addClient(caseId: string, input: CreateClientInput, ctx: ReqContext) {
    const existingCase = await casesRepository.findById(caseId, ctx.orgId);
    if (!existingCase) throw Errors.caseNotFound();
    if (existingCase.clientId) throw Errors.caseClientExists();

    const updatedDetails = await casesRepository.createClientAndLink(
      caseId,
      ctx.orgId,
      {
        ...input,
        orgId: ctx.orgId,
        createdBy: ctx.userId,
      },
    );
    if (!updatedDetails) {
      const stillExists = await casesRepository.findById(caseId, ctx.orgId);
      throw stillExists ? Errors.caseClientExists() : Errors.caseNotFound();
    }

    return updatedDetails;
  },

  async delete(caseId: string, ctx: ReqContext) {
    const caseDetails = await casesRepository.findById(caseId, ctx.orgId);
    if (!caseDetails) throw Errors.caseNotFound();

    const { count } = await casesRepository.softDeleteCascade(
      caseId,
      ctx.orgId,
    );
    if (count === 0) throw Errors.caseNotFound();
  },
};
