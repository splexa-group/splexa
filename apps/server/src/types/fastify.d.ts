import type { UserRole } from "@splexa-group/shared/enums";
import type { AuthUser } from "@splexa-group/shared/types";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser;
  }

  interface FastifyInstance {
    authenticate: (
      req: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;

    requireRole: (
      role: UserRole,
    ) => (
      req: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;
  }
}
