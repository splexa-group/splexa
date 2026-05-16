import { logger } from "@/config/logger";
import { type AuditAction } from "@/enums/audit.enums";
import { auditRepository } from "@/repositories/audit.repository";

export interface LogActivityInput {
  orgId?: string;
  userId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  await auditRepository
    .create({
      orgId: input.orgId ?? null,
      userId: input.userId ?? null,
      action: input.action,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      ipAddress: input.ipAddress,
      metadata: input.metadata ?? {},
    })
    .catch((err: unknown) => {
      logger.error({ err, action: input.action }, "Activity log write failed");
    });
}
