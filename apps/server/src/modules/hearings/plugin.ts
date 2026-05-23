import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { hearingsCaseScopedRoutes, hearingsStandaloneRoutes } from "./routes";

export const hearingsModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(hearingsStandaloneRoutes, { prefix: "/api/v1/hearings" });
    fastify.register(hearingsCaseScopedRoutes, { prefix: "/api/v1/cases" });
  },
  { name: "hearings-module" },
);
