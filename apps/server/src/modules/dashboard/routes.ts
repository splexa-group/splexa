import type { FastifyInstance } from "fastify";

import { dashboardController } from "./controller";

export function dashboardRoutes(router: FastifyInstance): void {
  router.get("/", {
    preHandler: [router.authenticate],
    handler: dashboardController.getData,
  });
}
