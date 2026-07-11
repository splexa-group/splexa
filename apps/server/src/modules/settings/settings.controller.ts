import { FastifyRequest } from "fastify";

import { settingsService } from "./settings.service";
import { UpdateOrganizationBody, UpdateProfileBody } from "./settings.schema";

export const settingsController = {
  async getProfile(req: FastifyRequest) {
    const profile = await settingsService.getProfile(req.user.userId, req.user.orgId);
    return { profile };
  },

  async updateProfile(req: FastifyRequest<{ Body: UpdateProfileBody }>) {
    const profile = await settingsService.updateProfile(req.user.userId, req.user.orgId, req.body);
    return { profile };
  },

  async getOrganization(req: FastifyRequest) {
    const organization = await settingsService.getOrganization(req.user.orgId);
    return { organization };
  },

  async updateOrganization(req: FastifyRequest<{ Body: UpdateOrganizationBody }>) {
    const organization = await settingsService.updateOrganization(req.user.orgId, req.body);
    return { organization };
  },
};
