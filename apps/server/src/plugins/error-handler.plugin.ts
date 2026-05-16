import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { ErrorCode } from "@/enums/error-code";
import { AppError } from "@/utils/errors";

export const errorHandlerPlugin = fp(
  async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((error, _req, reply) => {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
        return;
      }

      const maybeValidation = error as { validation?: unknown[] };
      if (maybeValidation.validation) {
        reply.code(400).send({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: "Validation error",
            details: maybeValidation.validation,
          },
        });
        return;
      }

      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: "Internal server error" },
      });
    });
  },
  { name: "error-handler" },
);
