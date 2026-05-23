import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CaseParams,
  CreateImportantDateInput,
  ImportantDateParams,
  UpdateImportantDateInput,
} from "./schema";
import { importantDatesService } from "./service";

export const importantDatesController = {
  async create(
    req: FastifyRequest<{ Params: CaseParams; Body: CreateImportantDateInput }>,
    reply: FastifyReply,
  ) {
    const result = await importantDatesService.create(req.params.caseId, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
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
      ipAddress: req.ip,
    });
  },

  async delete(
    req: FastifyRequest<{ Params: ImportantDateParams }>,
    reply: FastifyReply,
  ) {
    await importantDatesService.delete(req.params.caseId, req.params.dateId, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(204);
  },
};
