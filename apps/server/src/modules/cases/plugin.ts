import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { casesRoutes } from "./routes";

export const casesModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(casesRoutes, { prefix: "/api/v1/cases" });
  },
  { name: "cases-module" },
);
