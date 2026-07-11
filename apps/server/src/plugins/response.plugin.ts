import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export const responsePlugin = fp(
  async (fastify: FastifyInstance) => {
    fastify.addHook("preSerialization", (_req, reply, payload, done) => {
      if (reply.statusCode >= 400 || payload == null) {
        done(null, payload);
        return;
      }
      const { message, ...data } = payload as Record<string, unknown> & {
        message?: string;
      };
      done(null, { success: true, data, message });
    });
  },
  { name: "response" },
);
