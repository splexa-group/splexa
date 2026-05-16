import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { authRoutes } from "./routes";

export const authModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(authRoutes, { prefix: "/api/v1/auth" });
  },
  { name: "auth-module" },
);
