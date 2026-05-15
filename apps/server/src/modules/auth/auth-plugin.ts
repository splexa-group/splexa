import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { registerAuthRoutes } from "./auth-routes";

export const authModule = fp(
  async (fastify: FastifyInstance) => {
    registerAuthRoutes(fastify);
  },
  { name: "auth-module" },
);
