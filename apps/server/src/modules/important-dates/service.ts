import { casesRepository } from "@/modules/cases/repository";
import type { ServiceContext } from "@/types/service-context";
import { Errors } from "@/utils/errors";

import { importantDatesRepository } from "./repository";
import type { CreateImportantDateInput, ListImportantDatesQuery, UpdateImportantDateInput } from "./schema";

export const importantDatesService = {
  async listForCase(caseId: string, orgId: string) {
    return importantDatesRepository.listForCase(caseId, orgId);
  },

  async listCrossCase(orgId: string, query: ListImportantDatesQuery) {
    return importantDatesRepository.listCrossCase(orgId, query);
  },

  async create(caseId: string, input: CreateImportantDateInput, ctx: ServiceContext) {
    const parentCase = await casesRepository.findById(caseId, ctx.orgId);
    if (!parentCase) throw Errors.caseNotFound();

    const notifyUserId = parentCase.assignedTo ?? parentCase.createdBy;

    return importantDatesRepository.create({ ...input, caseId, orgId: ctx.orgId, notifyUserId });
  },

  async update(caseId: string, dateId: string, input: UpdateImportantDateInput, ctx: ServiceContext) {
    const date = await importantDatesRepository.findById(dateId, caseId, ctx.orgId);
    if (!date) throw Errors.importantDateNotFound();
    const updated = await importantDatesRepository.update(dateId, ctx.orgId, input);
    if (!updated) throw Errors.importantDateNotFound();
    return updated;
  },

  async delete(caseId: string, dateId: string, ctx: ServiceContext) {
    const date = await importantDatesRepository.findById(dateId, caseId, ctx.orgId);
    if (!date) throw Errors.importantDateNotFound();
    const { count } = await importantDatesRepository.softDelete(dateId, ctx.orgId);
    if (count === 0) throw Errors.importantDateNotFound();
  },
};
