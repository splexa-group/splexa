import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { documentsCaseScopedRoutes, documentsRoutes } from "./routes";

export const documentsModule = fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
    fastify.register(documentsRoutes, { prefix: "/api/v1/documents" });
    // POST/GET/DELETE /:caseId/documents/* live under /cases to keep docs routes self-contained
    fastify.register(documentsCaseScopedRoutes, { prefix: "/api/v1/cases" });
  },
  { name: "documents-module" },
);
