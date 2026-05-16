import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { ErrorCode } from "@/enums/error-code";
import { AppError } from "@/utils/errors";

export const errorHandlerPlugin = fp(
  async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((error, _req, reply) => {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          error: error.message,
          code: error.code,
        });
        return;
      }

      const maybeValidation = error as { validation?: unknown[] };
      if (maybeValidation.validation) {
        reply.code(400).send({
          error: "Validation error",
          code: ErrorCode.VALIDATION_ERROR,
          details: maybeValidation.validation,
        });
        return;
      }

      fastify.log.error(error);
      reply.code(500).send({
        error: "Internal server error",
        code: ErrorCode.INTERNAL_ERROR,
      });
    });
  },
  { name: "error-handler" },
);
