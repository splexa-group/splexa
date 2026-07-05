import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { dashboardRoutes } from "./routes";

export const dashboardModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(dashboardRoutes, { prefix: "/api/v1/dashboard" });
  },
  { name: "dashboard-module" },
);
