import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { hearingsRoutes } from "./routes";

export const hearingsModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(hearingsRoutes, { prefix: "/api/v1/hearings" });
  },
  { name: "hearings-module" },
);
