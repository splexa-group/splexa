import type { FastifyInstance } from "fastify";

import { authController } from "./auth-controller";
import {
  otpRequestSchema,
  otpVerifySchema,
  sessionParamsSchema,
  signupSchema,
} from "./auth-schema";

export function registerAuthRoutes(fastify: FastifyInstance): void {
  fastify.post("/auth/signup", { schema: { body: signupSchema } }, authController.signup);

  fastify.post("/auth/otp/request", { schema: { body: otpRequestSchema } }, authController.requestOtp);

  fastify.post("/auth/otp/verify", { schema: { body: otpVerifySchema } }, authController.verifyOtp);

  fastify.post("/auth/refresh", {}, authController.refresh);

  fastify.post("/auth/logout", {}, authController.logout);

  fastify.get("/auth/me", { preHandler: [fastify.authenticate] }, authController.getMe);

  fastify.get("/auth/sessions", { preHandler: [fastify.authenticate] }, authController.listSessions);

  fastify.get(
    "/auth/sessions/:id",
    { schema: { params: sessionParamsSchema }, preHandler: [fastify.authenticate] },
    authController.getSession,
  );

  fastify.delete(
    "/auth/sessions/:id",
    { schema: { params: sessionParamsSchema }, preHandler: [fastify.authenticate] },
    authController.revokeSession,
  );

  fastify.delete(
    "/auth/sessions",
    { preHandler: [fastify.authenticate] },
    authController.revokeAllSessions,
  );
}
