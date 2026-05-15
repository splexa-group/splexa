import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import type { AuditAction } from "@/enums/audit.enums";
import { auditRepository } from "@/repositories/audit.repository";

export interface AuditContext {
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

declare module "fastify" {
  interface FastifyReply {
    auditContext: AuditContext | null;
  }
}

export const auditPlugin = fp(
  async (fastify: FastifyInstance) => {
    fastify.decorateReply("auditContext", null);

    fastify.addHook(
      "onResponse",
      async (req: FastifyRequest, reply: FastifyReply) => {
        const ctx = reply.auditContext;
        if (!ctx || reply.statusCode >= 500) return;

        const user = req.user as { orgId?: string; userId?: string } | null;

        await auditRepository
          .create({
            action: ctx.action,
            orgId: user?.orgId ?? null,
            userId: user?.userId ?? null,
            resourceType: ctx.resourceType ?? null,
            resourceId: ctx.resourceId ?? null,
            ipAddress: req.ip,
            metadata: ctx.metadata ?? {},
          })
          .catch((err: unknown) => {
            req.log.error({ err }, "Audit log write failed");
          });
      },
    );
  },
  { name: "audit" },
);
