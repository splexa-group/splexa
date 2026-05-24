import { prisma } from "@/db/client";
import { clientSelect } from "@/db/selects";

import type { CreateClientInput, ListClientsQuery, UpdateClientInput } from "./schema";

export const clientsRepository = {
  async create(
    data: CreateClientInput & { orgId: string; createdBy: string },
  ) {
    return prisma.client.create({
      data: {
        orgId: data.orgId,
        fullName: data.fullName,
        phone: data.phone,
        type: data.type,
        email: data.email,
        address: data.address,
        companyName: data.companyName,
        notes: data.notes,
        preferredLanguage: data.preferredLanguage,
        createdBy: data.createdBy,
      },
      select: clientSelect,
    });
  },

  async findById(id: string, orgId: string) {
    return prisma.client.findFirst({
      where: { id, orgId, deletedAt: null },
      select: clientSelect,
    });
  },

  async findByPhone(phone: string, orgId: string) {
    return prisma.client.findFirst({
      where: { phone, orgId, deletedAt: null },
      select: { id: true, fullName: true },
    });
  },

  async list(orgId: string, query: ListClientsQuery) {
    const { search, type, page, limit } = query;
    const where = {
      orgId,
      deletedAt: null,
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { companyName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: clientSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, orgId: string, data: UpdateClientInput) {
    await prisma.client.updateMany({ where: { id, orgId, deletedAt: null }, data });
    return prisma.client.findFirstOrThrow({ where: { id, orgId }, select: clientSelect });
  },

  async softDelete(id: string, orgId: string) {
    return prisma.client.updateMany({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};
