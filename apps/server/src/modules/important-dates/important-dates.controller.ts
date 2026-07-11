import { FastifyReply, FastifyRequest } from "fastify";

import {
  CaseParams,
  CreateImportantDateInput,
  ImportantDateParams,
  ListImportantDatesQuery,
  UpdateImportantDateInput,
} from "./important-dates.schema";
import { importantDatesService } from "./important-dates.service";

export const importantDatesController = {
  async listCrossCase(
    req: FastifyRequest<{ Querystring: ListImportantDatesQuery }>,
  ) {
    return importantDatesService.listCrossCase(req.user.orgId, req.query);
  },

  async listForCase(req: FastifyRequest<{ Params: CaseParams }>) {
    return importantDatesService.listForCase(req.params.caseId, req.user.orgId);
  },

  async create(
    req: FastifyRequest<{ Params: CaseParams; Body: CreateImportantDateInput }>,
    reply: FastifyReply,
  ) {
    const result = await importantDatesService.create(req.params.caseId, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(201);
    return result;
  },

  async update(
    req: FastifyRequest<{ Params: ImportantDateParams; Body: UpdateImportantDateInput }>,
  ) {
    return importantDatesService.update(req.params.caseId, req.params.dateId, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
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
