import { type Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

import type { UpdateOrganizationBody, UpdateProfileBody } from "./schema";

const profileSelect = {
  id:          true,
  firstName:   true,
  lastName:    true,
  email:       true,
  phoneNumber: true,
  designation: true,
  role:        true,
} satisfies Prisma.UserSelect;

const orgSelect = {
  id:            true,
  name:          true,
  city:          true,
  practiceTypes: true,
} satisfies Prisma.OrganizationSelect;

export const settingsRepository = {
  async getProfile(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id: userId, orgId, deletedAt: null },
      select: profileSelect,
    });
  },

  async updateProfile(userId: string, orgId: string, data: UpdateProfileBody) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: profileSelect,
    });
  },

  async getOrganization(orgId: string) {
    return prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null },
      select: orgSelect,
    });
  },

  async updateOrganization(orgId: string, data: UpdateOrganizationBody) {
    return prisma.organization.update({
      where: { id: orgId },
      data: {
        name:          data.name,
        city:          data.city,
        practiceTypes: data.practiceTypes,
        updatedAt:     new Date(),
      },
      select: orgSelect,
    });
  },
};
