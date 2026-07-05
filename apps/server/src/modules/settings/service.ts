import { Errors } from "@/utils/errors";

import { settingsRepository } from "./repository";
import type { UpdateOrganizationBody, UpdateProfileBody } from "./schema";

export const settingsService = {
  async getProfile(userId: string, orgId: string) {
    const profile = await settingsRepository.getProfile(userId, orgId);
    if (!profile) throw Errors.userNotFound();
    return profile;
  },

  async updateProfile(userId: string, orgId: string, data: UpdateProfileBody) {
    return settingsRepository.updateProfile(userId, orgId, data);
  },

  async getOrganization(orgId: string) {
    const org = await settingsRepository.getOrganization(orgId);
    if (!org) throw Errors.organizationNotFound();
    return org;
  },

  async updateOrganization(orgId: string, data: UpdateOrganizationBody) {
    return settingsRepository.updateOrganization(orgId, data);
  },
};
