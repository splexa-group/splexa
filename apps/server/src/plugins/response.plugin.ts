import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export const responsePlugin = fp(
  async (fastify: FastifyInstance) => {
    fastify.addHook("preSerialization", (_req, reply, payload, done) => {
      if (reply.statusCode >= 400) {
        done(null, payload);
        return;
      }
      done(null, { success: true, data: payload });
    });
  },
  { name: "response" },
);
