import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { settingsRoutes } from "./routes";

export const settingsModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(settingsRoutes, { prefix: "/api/v1/settings" });
  },
  { name: "settings-module" },
);
