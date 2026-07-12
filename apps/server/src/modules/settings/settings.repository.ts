import { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { orgSelect } from "@/db/selects/org.select";

import { UpdateOrganizationBody, UpdateProfileBody } from "./settings.schema";

const profileSelect = {
  id:          true,
  firstName:   true,
  lastName:    true,
  email:       true,
  phoneNumber: true,
  designation: true,
  role:        true,
} satisfies Prisma.UserSelect;

export const settingsRepository = {
  async getProfile(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id: userId, orgId, deletedAt: null },
      select: profileSelect,
    });
  },

  async updateProfile(userId: string, orgId: string, data: UpdateProfileBody) {
    const { count } = await prisma.user.updateMany({
      where: { id: userId, orgId, deletedAt: null },
      data: { ...data },
    });
    if (count === 0) return null;
    return prisma.user.findFirst({
      where: { id: userId, orgId, deletedAt: null },
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
    const { count } = await prisma.organization.updateMany({
      where: { id: orgId, deletedAt: null },
      data: {
        name:          data.name,
        city:          data.city,
        practiceTypes: data.practiceTypes,
      },
    });
    if (count === 0) return null;
    return prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null },
      select: orgSelect,
    });
  },

  async findUserById(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id: userId, orgId, deletedAt: null },
      select: { id: true },
    });
  },
};
