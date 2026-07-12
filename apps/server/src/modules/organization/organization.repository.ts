import { prisma } from "@/db/client";
import { orgSelect } from "@/db/selects/org.select";
import { profileSelect } from "@/db/selects/user.select";

import {
  UpdateOrganizationInput,
  UpdateProfileInput,
} from "./organization.schema";

export const organizationRepository = {
  async get(orgId: string) {
    return prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null },
      select: orgSelect,
    });
  },

  async update(orgId: string, data: UpdateOrganizationInput) {
    const { count } = await prisma.organization.updateMany({
      where: { id: orgId, deletedAt: null },
      data,
    });
    if (count === 0) return null;
    return prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null },
      select: orgSelect,
    });
  },

  async getProfile(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id: userId, orgId, deletedAt: null },
      select: profileSelect,
    });
  },

  async updateProfile(userId: string, orgId: string, data: UpdateProfileInput) {
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

  async findUserById(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id: userId, orgId, deletedAt: null },
      select: { id: true },
    });
  },
};
