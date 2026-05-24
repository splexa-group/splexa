import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "@/config/env";
import { fastifyLogger } from "@/config/logger";
import { authModule } from "@/modules/auth/plugin";
import { casesModule } from "@/modules/cases/plugin";
import { clientsModule } from "@/modules/clients/plugin";
import { documentsModule } from "@/modules/documents/plugin";
import { hearingsModule } from "@/modules/hearings/plugin";
import { importantDatesModule } from "@/modules/important-dates/plugin";
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
  await app.register(authModule);
  await app.register(clientsModule);
  await app.register(casesModule);
  await app.register(hearingsModule);
  await app.register(importantDatesModule);
  await app.register(documentsModule);

  return app;
}
