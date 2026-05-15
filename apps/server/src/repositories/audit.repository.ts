import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

export interface CreateAuditLogInput {
  orgId?: string | null;
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  ipAddress: string;
  metadata: Record<string, unknown>;
}

export const auditRepository = {
  async create(input: CreateAuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  },
};
