import { ReqContext } from "@/models/req-context";
import { casesService } from "@/modules/cases/cases.service";
import { Errors } from "@/utils/errors";

import { hearingsRepository } from "./hearings.repository";
import { CreateHearingInput, UpdateHearingInput } from "./hearings.schema";

export const hearingsService = {
  async findById(id: string, orgId: string) {
    const hearing = await hearingsRepository.findById(id, orgId);
    if (!hearing) throw Errors.hearingNotFound();
    return hearing;
  },

  async create(caseId: string, input: CreateHearingInput, ctx: ReqContext) {
    const parentCase = await casesService.findById(caseId, ctx.orgId);

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
    await casesService.findById(caseId, orgId);
    return hearingsRepository.findByCaseId(caseId, orgId);
  },

  async update(id: string, input: UpdateHearingInput, ctx: ReqContext) {
    const hearing = await hearingsRepository.findById(id, ctx.orgId);
    if (!hearing) throw Errors.hearingNotFound();

    const updatedHearing = await hearingsRepository.update(
      id,
      hearing.caseId,
      ctx.orgId,
      input,
    );
    if (!updatedHearing) throw Errors.hearingNotFound();
    return updatedHearing;
  },

  async delete(id: string, ctx: ReqContext) {
    const hearing = await hearingsRepository.findById(id, ctx.orgId);
    if (!hearing) throw Errors.hearingNotFound();

    const { count } = await hearingsRepository.softDelete(
      id,
      hearing.caseId,
      ctx.orgId,
    );
    if (count === 0) throw Errors.hearingNotFound();
  },
};
