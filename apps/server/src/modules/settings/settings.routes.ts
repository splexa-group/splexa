import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { settingsController } from "./settings.controller";
import { updateOrganizationBodySchema, updateProfileBodySchema } from "./settings.schema";

async function routes(router: FastifyInstance): Promise<void> {
  router.get("/settings/profile", {
    preHandler: [router.authenticate],
    handler: settingsController.getProfile,
  });

  router.patch("/settings/profile", {
    schema: { body: updateProfileBodySchema },
    preHandler: [router.authenticate],
    handler: settingsController.updateProfile,
  });

  router.get("/settings/organization", {
    preHandler: [router.authenticate],
    handler: settingsController.getOrganization,
  });

  router.patch("/settings/organization", {
    schema: { body: updateOrganizationBodySchema },
    preHandler: [router.authenticate],
    handler: settingsController.updateOrganization,
  });
}

export const settingsRoutes = fp(routes, { name: "settings-routes" });
