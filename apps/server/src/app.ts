import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "@/config/env";
import { fastifyLogger } from "@/config/logger";
import { authModule } from "@/modules/auth/auth-plugin";
import { authGuardPlugin } from "@/plugins/auth-guard.plugin";
import { errorHandlerPlugin } from "@/plugins/error-handler.plugin";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: fastifyLogger });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorHandlerPlugin);
  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(authGuardPlugin);
  await app.register(authModule);

  return app;
}
