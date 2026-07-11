import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { authController } from "./auth.controller";
import {
  otpRequestSchema,
  otpVerifySchema,
  sessionParamsSchema,
  signupSchema,
} from "./auth.schema";

async function routes(router: FastifyInstance): Promise<void> {
  router.post("/auth/signup", {
    schema: { body: signupSchema },
    handler: authController.signup,
  });

  router.post("/auth/otp/request", {
    schema: { body: otpRequestSchema },
    handler: authController.requestOtp,
  });

  router.post("/auth/otp/verify", {
    schema: { body: otpVerifySchema },
    handler: authController.verifyOtp,
  });

  router.post("/auth/refresh", {
    handler: authController.refresh,
  });

  router.post("/auth/logout", {
    handler: authController.logout,
  });

  router.get("/auth/me", {
    preHandler: [router.authenticate],
    handler: authController.getMe,
  });

  router.get("/auth/sessions", {
    preHandler: [router.authenticate],
    handler: authController.listSessions,
  });

  router.get("/auth/sessions/:id", {
    schema: { params: sessionParamsSchema },
    preHandler: [router.authenticate],
    handler: authController.getSession,
  });

  router.delete("/auth/sessions/:id", {
    schema: { params: sessionParamsSchema },
    preHandler: [router.authenticate],
    handler: authController.revokeSession,
  });

  router.delete("/auth/sessions", {
    preHandler: [router.authenticate],
    handler: authController.revokeAllSessions,
  });
}

export const authRoutes = fp(routes, { name: "auth-routes" });
