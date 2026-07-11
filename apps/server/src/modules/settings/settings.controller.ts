import type { FastifyRequest } from "fastify";

import { settingsService } from "./settings.service";
import type { UpdateOrganizationBody, UpdateProfileBody } from "./settings.schema";

export const settingsController = {
  async getProfile(req: FastifyRequest) {
    return settingsService.getProfile(req.user.userId, req.user.orgId);
  },

  async updateProfile(req: FastifyRequest<{ Body: UpdateProfileBody }>) {
    return settingsService.updateProfile(req.user.userId, req.user.orgId, req.body);
  },

  async getOrganization(req: FastifyRequest) {
    return settingsService.getOrganization(req.user.orgId);
  },

  async updateOrganization(req: FastifyRequest<{ Body: UpdateOrganizationBody }>) {
    return settingsService.updateOrganization(req.user.orgId, req.body);
  },
};
