import { FastifyReply, FastifyRequest } from "fastify";

import {
  CaseHearingParams,
  CreateHearingInput,
  HearingParams,
  ListHearingsQuery,
  UpdateHearingInput,
} from "./hearings.schema";
import { hearingsService } from "./hearings.service";

export const hearingsController = {
  async create(
    req: FastifyRequest<{ Params: CaseHearingParams; Body: CreateHearingInput }>,
    reply: FastifyReply,
  ) {
    const result = await hearingsService.create(req.params.caseId, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(201);
    return result;
  },

  async listForCase(req: FastifyRequest<{ Params: CaseHearingParams }>) {
    return hearingsService.listForCase(req.params.caseId, req.user.orgId);
  },

  async getById(req: FastifyRequest<{ Params: HearingParams }>) {
    return hearingsService.findById(req.params.id, req.user.orgId);
  },

  async listCrossCase(req: FastifyRequest<{ Querystring: ListHearingsQuery }>) {
    const { data, total } = await hearingsService.listCrossCase(
      req.user.orgId,
      req.query,
    );
    return { data, total, page: req.query.page, limit: req.query.limit };
  },

  async update(
    req: FastifyRequest<{ Params: HearingParams; Body: UpdateHearingInput }>,
  ) {
    return hearingsService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
  },

  async delete(
    req: FastifyRequest<{ Params: HearingParams }>,
    reply: FastifyReply,
  ) {
    await hearingsService.delete(req.params.id, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(204);
  },
};
