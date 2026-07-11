import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { dashboardController } from "./dashboard.controller";

async function routes(router: FastifyInstance): Promise<void> {
  router.get("/dashboard", {
    preHandler: [router.authenticate],
    handler: dashboardController.getData,
  });
}

export const dashboardRoutes = fp(routes, { name: "dashboard-routes" });
