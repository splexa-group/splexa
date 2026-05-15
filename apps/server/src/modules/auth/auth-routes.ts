import type { FastifyInstance } from "fastify";

import {
  getMeController,
  getSessionController,
  listSessionsController,
  logoutController,
  refreshController,
  requestOtpController,
  revokeAllSessionsController,
  revokeSessionController,
  signupController,
  verifyOtpController,
} from "./auth-controller";
import {
  signupSchema,
  otpRequestSchema,
  otpVerifySchema,
  sessionParamsSchema,
} from "./auth-schema";

export function registerAuthRoutes(fastify: FastifyInstance): void {
  fastify.post(
    "/auth/signup",
    { schema: { body: signupSchema } },
    signupController,
  );

  fastify.post(
    "/auth/otp/request",
    { schema: { body: otpRequestSchema } },
    requestOtpController,
  );

  fastify.post(
    "/auth/otp/verify",
    { schema: { body: otpVerifySchema } },
    verifyOtpController,
  );

  fastify.post("/auth/refresh", {}, refreshController);

  fastify.post("/auth/logout", {}, logoutController);

  fastify.get(
    "/auth/me",
    { preHandler: [fastify.authenticate] },
    getMeController,
  );

  fastify.get(
    "/auth/sessions",
    { preHandler: [fastify.authenticate] },
    listSessionsController,
  );

  fastify.get(
    "/auth/sessions/:id",
    {
      schema: { params: sessionParamsSchema },
      preHandler: [fastify.authenticate],
    },
    getSessionController,
  );

  fastify.delete(
    "/auth/sessions/:id",
    {
      schema: { params: sessionParamsSchema },
      preHandler: [fastify.authenticate],
    },
    revokeSessionController,
  );

  fastify.delete(
    "/auth/sessions",
    { preHandler: [fastify.authenticate] },
    revokeAllSessionsController,
  );
}
