import { UserRole } from "@splexa-group/shared/enums";
import { AuthUser } from "@splexa-group/shared/models";
import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";
import { Errors } from "@/utils/errors";
import { verifyAccessToken } from "@/utils/jwt";

export const authGuardPlugin = fp(
  async (fastify: FastifyInstance) => {
    fastify.decorateRequest("user", null as unknown as AuthUser);

    fastify.decorate("authenticate", async (req: FastifyRequest) => {
      const token = req.cookies[ACCESS_TOKEN_COOKIE];
      if (!token) throw Errors.missingToken();
      try {
        req.user = await verifyAccessToken(token);
      } catch {
        throw Errors.invalidToken();
      }
      req.log = req.log.child({
        userId: req.user.userId,
        orgId: req.user.orgId,
      });
    });

    fastify.decorate(
      "requireRole",
      (role: UserRole) => async (req: FastifyRequest) => {
        if (req.user.role !== role) {
          throw Errors.forbidden(`Requires ${role} role`);
        }
      },
    );
  },
  { name: "auth-guard" },
);
