import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { authRoutes } from "./auth-routes";

export const authModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(authRoutes, { prefix: "/auth" });
  },
  { name: "auth-module" },
);
