import { Errors } from "@/utils/errors";

import { settingsRepository } from "./settings.repository";
import type { UpdateOrganizationBody, UpdateProfileBody } from "./settings.schema";

export const settingsService = {
  async getProfile(userId: string, orgId: string) {
    const profile = await settingsRepository.getProfile(userId, orgId);
    if (!profile) throw Errors.userNotFound();
    return profile;
  },

  async updateProfile(userId: string, orgId: string, data: UpdateProfileBody) {
    const existing = await settingsRepository.getProfile(userId, orgId);
    if (!existing) throw Errors.userNotFound();
    const updated = await settingsRepository.updateProfile(userId, orgId, data);
    if (!updated) throw Errors.userNotFound();
    return updated;
  },

  async getOrganization(orgId: string) {
    const org = await settingsRepository.getOrganization(orgId);
    if (!org) throw Errors.organizationNotFound();
    return org;
  },

  async updateOrganization(orgId: string, data: UpdateOrganizationBody) {
    const existing = await settingsRepository.getOrganization(orgId);
    if (!existing) throw Errors.organizationNotFound();
    const updated = await settingsRepository.updateOrganization(orgId, data);
    if (!updated) throw Errors.organizationNotFound();
    return updated;
  },
};
