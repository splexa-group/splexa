import { FastifyReply, FastifyRequest } from "fastify";

import {
  CaseHearingParams,
  CreateHearingInput,
  HearingParams,
  UpdateHearingInput,
} from "./hearings.schema";
import { hearingsService } from "./hearings.service";

export const hearingsController = {
  async getById(req: FastifyRequest<{ Params: HearingParams }>) {
    const hearing = await hearingsService.findById(
      req.params.id,
      req.user.orgId,
    );
    return { hearing };
  },

  async create(
    req: FastifyRequest<{
      Params: CaseHearingParams;
      Body: CreateHearingInput;
    }>,
    reply: FastifyReply,
  ) {
    const hearing = await hearingsService.create(req.params.caseId, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(201);
    return { hearing };
  },

  async listForCase(req: FastifyRequest<{ Params: CaseHearingParams }>) {
    const hearings = await hearingsService.listForCase(
      req.params.caseId,
      req.user.orgId,
    );
    return { hearings };
  },

  async update(
    req: FastifyRequest<{ Params: HearingParams; Body: UpdateHearingInput }>,
  ) {
    const hearing = await hearingsService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    return { hearing };
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
