import type { FastifyReply, FastifyRequest } from "fastify";

import { settingsService } from "./service";
import type { UpdateOrganizationBody, UpdateProfileBody } from "./schema";

export const settingsController = {
  async getProfile(req: FastifyRequest) {
    const data = await settingsService.getProfile(req.user.userId, req.user.orgId);
    return { data };
  },

  async updateProfile(req: FastifyRequest<{ Body: UpdateProfileBody }>) {
    const data = await settingsService.updateProfile(req.user.userId, req.user.orgId, req.body);
    return { data };
  },

  async getOrganization(req: FastifyRequest) {
    const data = await settingsService.getOrganization(req.user.orgId);
    return { data };
  },

  async updateOrganization(req: FastifyRequest<{ Body: UpdateOrganizationBody }>) {
    const data = await settingsService.updateOrganization(req.user.orgId, req.body);
    return { data };
  },
};
