import { Errors } from "@/utils/errors";

import { organizationRepository } from "./organization.repository";
import { UpdateOrganizationInput, UpdateProfileInput } from "./organization.schema";

export const organizationService = {
  async get(orgId: string) {
    const org = await organizationRepository.get(orgId);
    if (!org) throw Errors.organizationNotFound();
    return org;
  },

  async update(orgId: string, data: UpdateOrganizationInput) {
    const existing = await organizationRepository.get(orgId);
    if (!existing) throw Errors.organizationNotFound();
    const updated = await organizationRepository.update(orgId, data);
    if (!updated) throw Errors.organizationNotFound();
    return updated;
  },

  async getProfile(userId: string, orgId: string) {
    const profile = await organizationRepository.getProfile(userId, orgId);
    if (!profile) throw Errors.userNotFound();
    return profile;
  },

  async updateProfile(userId: string, orgId: string, data: UpdateProfileInput) {
    const existing = await organizationRepository.getProfile(userId, orgId);
    if (!existing) throw Errors.userNotFound();
    const updated = await organizationRepository.updateProfile(userId, orgId, data);
    if (!updated) throw Errors.userNotFound();
    return updated;
  },

  findUserById(userId: string, orgId: string) {
    return organizationRepository.findUserById(userId, orgId);
  },
};
