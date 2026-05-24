import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { hearingsCaseScopedRoutes, hearingsRoutes } from "./routes";

export const hearingsModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(hearingsRoutes, { prefix: "/api/v1/hearings" });
    fastify.register(hearingsCaseScopedRoutes, { prefix: "/api/v1/cases" });
  },
  { name: "hearings-module" },
);
