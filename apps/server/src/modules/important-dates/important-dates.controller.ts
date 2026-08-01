import { FastifyReply, FastifyRequest } from "fastify";

import {
  CaseParams,
  CreateImportantDateInput,
  ImportantDateParams,
  UpdateImportantDateInput,
} from "./important-dates.schema";
import { importantDatesService } from "./important-dates.service";

export const importantDatesController = {
  async listForCase(req: FastifyRequest<{ Params: CaseParams }>) {
    const importantDates = await importantDatesService.listForCase(req.params.caseId, req.user.orgId);
    return { importantDates };
  },

  async create(
    req: FastifyRequest<{ Params: CaseParams; Body: CreateImportantDateInput }>,
    reply: FastifyReply,
  ) {
    const importantDate = await importantDatesService.create(req.params.caseId, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(201);
    return { importantDate };
  },

  async update(
    req: FastifyRequest<{ Params: ImportantDateParams; Body: UpdateImportantDateInput }>,
  ) {
    const importantDate = await importantDatesService.update(req.params.caseId, req.params.dateId, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    return { importantDate };
  },

  async delete(
    req: FastifyRequest<{ Params: ImportantDateParams }>,
    reply: FastifyReply,
  ) {
    await importantDatesService.delete(req.params.caseId, req.params.dateId, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(204);
  },
};
