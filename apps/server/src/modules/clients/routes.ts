import type { FastifyInstance } from "fastify";

import { clientsController } from "./controller";
import {
  clientParamsSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema,
} from "./schema";

export function clientsRoutes(router: FastifyInstance): void {
  router.post("/", {
    schema: { body: createClientSchema },
    preHandler: [router.authenticate],
    handler: clientsController.create,
  });

  router.get("/", {
    schema: { querystring: listClientsQuerySchema },
    preHandler: [router.authenticate],
    handler: clientsController.list,
  });

  router.get("/:id", {
    schema: { params: clientParamsSchema },
    preHandler: [router.authenticate],
    handler: clientsController.getById,
  });

  router.patch("/:id", {
    schema: { params: clientParamsSchema, body: updateClientSchema },
    preHandler: [router.authenticate],
    handler: clientsController.update,
  });

  router.delete("/:id", {
    schema: { params: clientParamsSchema },
    preHandler: [router.authenticate],
    handler: clientsController.delete,
  });
}
