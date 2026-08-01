import { FastifyRequest } from "fastify";

import {
  UpdateOrganizationInput,
  UpdateProfileInput,
} from "./organization.schema";
import { organizationService } from "./organization.service";

export const organizationController = {
  async get(req: FastifyRequest) {
    const organization = await organizationService.get(req.user.orgId);
    return { organization };
  },

  async update(req: FastifyRequest<{ Body: UpdateOrganizationInput }>) {
    const organization = await organizationService.update(
      req.user.orgId,
      req.body,
    );
    return { organization };
  },

  async getProfile(req: FastifyRequest) {
    const profile = await organizationService.getProfile(
      req.user.userId,
      req.user.orgId,
    );
    return { profile };
  },

  async updateProfile(req: FastifyRequest<{ Body: UpdateProfileInput }>) {
    const profile = await organizationService.updateProfile(
      req.user.userId,
      req.user.orgId,
      req.body,
    );
    return { profile };
  },
};
