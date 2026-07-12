import { FastifyReply, FastifyRequest } from "fastify";

import {
  CreateClientInput,
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
    const caseDetails = await casesService.create(req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(201);
    return { caseDetails };
  },

  async list(req: FastifyRequest<{ Querystring: ListCasesQuery }>) {
    const { data, total } = await casesService.list(req.user.orgId, req.query);
    return {
      cases: data,
      total,
      page: req.query.page,
      limit: req.query.limit,
    };
  },

  async getById(req: FastifyRequest<{ Params: CaseParams }>) {
    const caseDetails = await casesService.findById(
      req.params.id,
      req.user.orgId,
    );
    return { caseDetails };
  },

  async update(
    req: FastifyRequest<{ Params: CaseParams; Body: UpdateCaseInput }>,
  ) {
    const caseDetails = await casesService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    return { caseDetails };
  },

  async addClientToCase(
    req: FastifyRequest<{ Params: CaseParams; Body: CreateClientInput }>,
    reply: FastifyReply,
  ) {
    const caseDetails = await casesService.addClient(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(201);
    return { caseDetails };
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
