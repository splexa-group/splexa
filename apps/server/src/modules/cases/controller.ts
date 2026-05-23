import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CaseParams,
  CreateCaseInput,
  CreateImportantDateInput,
  ImportantDateParams,
  ListCasesQuery,
  UpdateCaseInput,
  UpdateImportantDateInput,
} from "./schema";
import { casesService } from "./service";

export const casesController = {
  async create(
    req: FastifyRequest<{ Body: CreateCaseInput }>,
    reply: FastifyReply,
  ) {
    const result = await casesService.create(req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(201);
    return result;
  },

  async list(req: FastifyRequest<{ Querystring: ListCasesQuery }>) {
    const { data, total } = await casesService.list(req.user.orgId, req.query);
    return { data, total, page: req.query.page, limit: req.query.limit };
  },

  async getById(req: FastifyRequest<{ Params: CaseParams }>) {
    return casesService.findById(req.params.id, req.user.orgId);
  },

  async update(
    req: FastifyRequest<{ Params: CaseParams; Body: UpdateCaseInput }>,
  ) {
    return casesService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async delete(
    req: FastifyRequest<{ Params: CaseParams }>,
    reply: FastifyReply,
  ) {
    await casesService.delete(req.params.id, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(204);
  },

  async createImportantDate(
    req: FastifyRequest<{ Params: CaseParams; Body: CreateImportantDateInput }>,
    reply: FastifyReply,
  ) {
    const result = await casesService.createImportantDate(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(201);
    return result;
  },

  async updateImportantDate(
    req: FastifyRequest<{
      Params: ImportantDateParams;
      Body: UpdateImportantDateInput;
    }>,
  ) {
    return casesService.updateImportantDate(
      req.params.id,
      req.params.dateId,
      req.body,
      {
        orgId: req.user.orgId,
        userId: req.user.userId,
        ipAddress: req.ip,
      },
    );
  },

  async deleteImportantDate(
    req: FastifyRequest<{ Params: ImportantDateParams }>,
    reply: FastifyReply,
  ) {
    await casesService.deleteImportantDate(req.params.id, req.params.dateId, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(204);
  },
};
