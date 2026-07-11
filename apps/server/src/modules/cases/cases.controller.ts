import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  AddClientToCaseInput,
  CaseParams,
  CreateCaseInput,
  ListCasesQuery,
  UpdateCaseInput,
} from "./cases.schema";
import { casesService } from "./cases.service";

export const casesController = {
  async create(
    req: FastifyRequest<{ Body: CreateCaseInput }>,
    reply: FastifyReply,
  ) {
    const { data, warnings } = await casesService.create(req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(201);
    return warnings ? { ...data, warnings } : data;
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

  async addClient(
    req: FastifyRequest<{ Params: CaseParams; Body: AddClientToCaseInput }>,
    reply: FastifyReply,
  ) {
    const { data, warnings } = await casesService.addClient(
      req.params.id,
      req.body,
      {
        orgId: req.user.orgId,
        userId: req.user.userId,
        ipAddress: req.ip,
      },
    );
    reply.code(201);
    return warnings ? { ...data, warnings } : data;
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
};
