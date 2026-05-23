import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { clientsRoutes } from "./routes";

export const clientsModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(clientsRoutes, { prefix: "/api/v1/clients" });
  },
  { name: "clients-module" },
);
