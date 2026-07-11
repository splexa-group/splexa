import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "@/config/env";
import { fastifyLogger } from "@/config/logger";
import { authRoutes } from "@/modules/auth/auth.routes";
import { casesRoutes } from "@/modules/cases/cases.routes";
import { clientsRoutes } from "@/modules/clients/clients.routes";
import { dashboardRoutes } from "@/modules/dashboard/dashboard.routes";
import { documentsRoutes } from "@/modules/documents/documents.routes";
import { hearingsRoutes } from "@/modules/hearings/hearings.routes";
import { importantDatesRoutes } from "@/modules/important-dates/important-dates.routes";
import { settingsRoutes } from "@/modules/settings/settings.routes";
import { authGuardPlugin } from "@/plugins/auth-guard.plugin";
import { errorHandlerPlugin } from "@/plugins/error-handler.plugin";
import { responsePlugin } from "@/plugins/response.plugin";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: fastifyLogger });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorHandlerPlugin);
  await app.register(responsePlugin);
  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(authGuardPlugin);

  await app.register(authRoutes, { prefix: "/api/v1" });
  await app.register(clientsRoutes, { prefix: "/api/v1" });
  await app.register(casesRoutes, { prefix: "/api/v1" });
  await app.register(hearingsRoutes, { prefix: "/api/v1" });
  await app.register(importantDatesRoutes, { prefix: "/api/v1" });
  await app.register(documentsRoutes, { prefix: "/api/v1" });
  await app.register(settingsRoutes, { prefix: "/api/v1" });
  await app.register(dashboardRoutes, { prefix: "/api/v1" });

  return app;
}
