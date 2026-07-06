import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

import type { DocumentFolderItem, ListDocumentsOrgQuery, ListDocumentsQuery } from "./schema";
import { documentSelect } from "./selects";

export const documentsRepository = {
  async create(data: {
    orgId: string;
    caseId: string;
    name: string;
    mimeType: string;
    size: number;
    storageKey: string;
    uploadedBy: string;
  }) {
    return prisma.document.create({ data, select: documentSelect });
  },

  async findById(id: string, caseId: string, orgId: string) {
    return prisma.document.findFirst({
      where: { id, caseId, orgId, deletedAt: null },
      select: documentSelect,
    });
  },

  async listForCase(caseId: string, orgId: string, query: ListDocumentsQuery) {
    const where: Prisma.DocumentWhereInput = { caseId, orgId, deletedAt: null };
    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        select: documentSelect,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.document.count({ where }),
    ]);
    return { data, total };
  },

  async listForOrg(orgId: string, query: ListDocumentsOrgQuery) {
    const where: Prisma.DocumentWhereInput = {
      orgId,
      deletedAt: null,
      ...(query.caseId ? { caseId: query.caseId } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        select: documentSelect,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.document.count({ where }),
    ]);
    return { data, total };
  },

  async softDelete(id: string, orgId: string) {
    return prisma.document.updateMany({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  async rename(id: string, caseId: string, orgId: string, name: string) {
    await prisma.document.updateMany({
      where: { id, caseId, orgId, deletedAt: null },
      data: { name },
    });
    return prisma.document.findFirst({
      where: { id, orgId, deletedAt: null },
      select: documentSelect,
    });
  },

  async listFolders(orgId: string): Promise<DocumentFolderItem[]> {
    const cases = await prisma.case.findMany({
      where: { orgId, deletedAt: null },
      select: {
        id: true,
        title: true,
        _count: { select: { documents: { where: { deletedAt: null } } } },
      },
      orderBy: { title: "asc" },
    });
    return cases.map((c) => ({
      caseId: c.id,
      title: c.title,
      documentCount: c._count.documents,
    }));
  },
};
