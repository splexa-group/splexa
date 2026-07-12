import { ReqContext } from "@/models/req-context";
import { casesService } from "@/modules/cases/cases.service";
import { Errors } from "@/utils/errors";

import { importantDatesRepository } from "./important-dates.repository";
import {
  CreateImportantDateInput,
  UpdateImportantDateInput,
} from "./important-dates.schema";

export const importantDatesService = {
  async listForCase(caseId: string, orgId: string) {
    await casesService.findById(caseId, orgId);
    return importantDatesRepository.listForCase(caseId, orgId);
  },

  async create(
    caseId: string,
    input: CreateImportantDateInput,
    ctx: ReqContext,
  ) {
    const parentCase = await casesService.findById(caseId, ctx.orgId);

    const notifyUserId = parentCase.assignedTo ?? parentCase.createdBy;

    return importantDatesRepository.create({
      ...input,
      caseId,
      orgId: ctx.orgId,
      notifyUserId,
    });
  },

  async update(
    caseId: string,
    dateId: string,
    input: UpdateImportantDateInput,
    ctx: ReqContext,
  ) {
    const date = await importantDatesRepository.findById(
      dateId,
      caseId,
      ctx.orgId,
    );
    if (!date) throw Errors.importantDateNotFound();
    const updated = await importantDatesRepository.update(
      dateId,
      ctx.orgId,
      input,
    );
    if (!updated) throw Errors.importantDateNotFound();
    return updated;
  },

  async delete(caseId: string, dateId: string, ctx: ReqContext) {
    const date = await importantDatesRepository.findById(
      dateId,
      caseId,
      ctx.orgId,
    );
    if (!date) throw Errors.importantDateNotFound();
    const { count } = await importantDatesRepository.softDelete(
      dateId,
      ctx.orgId,
    );
    if (count === 0) throw Errors.importantDateNotFound();
  },
};
