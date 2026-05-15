import type { FastifyInstance } from "fastify";

import { authController } from "./auth-controller";
import {
  otpRequestSchema,
  otpVerifySchema,
  sessionParamsSchema,
  signupSchema,
} from "./auth-schema";

export function authRoutes(router: FastifyInstance): void {
  router.post("/signup", {
    schema: { body: signupSchema },
    handler: authController.signup,
  });

  router.post("/otp/request", {
    schema: { body: otpRequestSchema },
    handler: authController.requestOtp,
  });

  router.post("/otp/verify", {
    schema: { body: otpVerifySchema },
    handler: authController.verifyOtp,
  });

  router.post("/refresh", {
    handler: authController.refresh,
  });

  router.post("/logout", {
    handler: authController.logout,
  });

  router.get("/me", {
    preHandler: [router.authenticate],
    handler: authController.getMe,
  });

  router.get("/sessions", {
    preHandler: [router.authenticate],
    handler: authController.listSessions,
  });

  router.get("/sessions/:id", {
    schema: { params: sessionParamsSchema },
    preHandler: [router.authenticate],
    handler: authController.getSession,
  });

  router.delete("/sessions/:id", {
    schema: { params: sessionParamsSchema },
    preHandler: [router.authenticate],
    handler: authController.revokeSession,
  });

  router.delete("/sessions", {
    preHandler: [router.authenticate],
    handler: authController.revokeAllSessions,
  });
}
