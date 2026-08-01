import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { organizationController } from "./organization.controller";
import {
  updateOrganizationSchema,
  updateProfileSchema,
} from "./organization.schema";

async function routes(router: FastifyInstance): Promise<void> {
  router.get("/organization", {
    preHandler: [router.authenticate],
    handler: organizationController.get,
  });

  router.patch("/organization", {
    schema: { body: updateOrganizationSchema },
    preHandler: [router.authenticate],
    handler: organizationController.update,
  });

  router.get("/organization/profile", {
    preHandler: [router.authenticate],
    handler: organizationController.getProfile,
  });

  router.patch("/organization/profile", {
    schema: { body: updateProfileSchema },
    preHandler: [router.authenticate],
    handler: organizationController.updateProfile,
  });
}

export const organizationRoutes = fp(routes, { name: "organization-routes" });
