import { Errors } from "@/utils/errors";
import { casesRepository } from "@/modules/cases/repository";

import type {
  CreateHearingInput,
  ListHearingsQuery,
  UpdateHearingInput,
} from "./schema";
import { hearingsRepository } from "./repository";

type Ctx = { orgId: string; userId: string; ipAddress: string };

export const hearingsService = {
  async create(caseId: string, input: CreateHearingInput, ctx: Ctx) {
    const parentCase = await casesRepository.findById(caseId, ctx.orgId);
    if (!parentCase) throw Errors.caseNotFound();

    const notifyUserId = parentCase.assignedTo ?? parentCase.createdBy;

    return hearingsRepository.create({
      ...input,
      caseId,
      orgId: ctx.orgId,
      addedBy: ctx.userId,
      notifyUserId,
    });
  },

  async listForCase(caseId: string, orgId: string) {
    const parentCase = await casesRepository.findById(caseId, orgId);
    if (!parentCase) throw Errors.caseNotFound();
    return hearingsRepository.findByCaseId(caseId, orgId);
  },

  async listCrossCase(orgId: string, query: ListHearingsQuery) {
    return hearingsRepository.listCrossCase(orgId, query);
  },

  async update(id: string, input: UpdateHearingInput, ctx: Ctx) {
    const hearing = await hearingsRepository.findById(id, ctx.orgId);
    if (!hearing) throw Errors.hearingNotFound();

    return hearingsRepository.update(id, hearing.caseId, ctx.orgId, input);
  },

  async delete(id: string, ctx: Ctx) {
    const hearing = await hearingsRepository.findById(id, ctx.orgId);
    if (!hearing) throw Errors.hearingNotFound();

    await hearingsRepository.softDelete(id, hearing.caseId, ctx.orgId);
  },
};
