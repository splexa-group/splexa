import { FastifyReply, FastifyRequest } from "fastify";

import {
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
    reply.code(201);
    return casesService.create(req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
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
    });
    reply.code(204);
  },
};
