import type { FastifyInstance } from "fastify";

import { settingsController } from "./controller";
import { updateOrganizationBodySchema, updateProfileBodySchema } from "./schema";

export function settingsRoutes(router: FastifyInstance): void {
  router.get("/profile", {
    preHandler: [router.authenticate],
    handler: settingsController.getProfile,
  });

  router.patch("/profile", {
    schema: { body: updateProfileBodySchema },
    preHandler: [router.authenticate],
    handler: settingsController.updateProfile,
  });

  router.get("/organization", {
    preHandler: [router.authenticate],
    handler: settingsController.getOrganization,
  });

  router.patch("/organization", {
    schema: { body: updateOrganizationBodySchema },
    preHandler: [router.authenticate],
    handler: settingsController.updateOrganization,
  });
}
