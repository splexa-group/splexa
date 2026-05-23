import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { importantDatesRoutes } from "./routes";

export const importantDatesModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(importantDatesRoutes, { prefix: "/api/v1/cases" });
  },
  { name: "important-dates-module" },
);
