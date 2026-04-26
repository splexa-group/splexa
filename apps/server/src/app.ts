import Fastify from "fastify";

import { logger } from "@/config/logger";

export function buildApp() {
  const app = Fastify({
    logger: logger,
  });

  return app;
}
