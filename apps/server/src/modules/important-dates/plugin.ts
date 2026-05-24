import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { importantDatesRoutes, importantDatesCaseScopeRoutes } from "./routes";

export const importantDatesModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(importantDatesRoutes, {
      prefix: "/api/v1/important-dates",
    });
    fastify.register(importantDatesCaseScopeRoutes, {
      prefix: "/api/v1/cases",
    });
  },
  { name: "important-dates-module" },
);
