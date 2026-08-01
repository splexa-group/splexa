import { FastifyInstance } from "fastify";

import { clientsController } from "./clients.controller";
import {
  clientParamsSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema,
} from "./clients.schema";

async function routes(router: FastifyInstance): Promise<void> {
  router.post("/clients", {
    schema: { body: createClientSchema },
    preHandler: [router.authenticate],
    handler: clientsController.create,
  });

  router.get("/clients", {
    schema: { querystring: listClientsQuerySchema },
    preHandler: [router.authenticate],
    handler: clientsController.list,
  });

  router.get("/clients/:id", {
    schema: { params: clientParamsSchema },
    preHandler: [router.authenticate],
    handler: clientsController.getById,
  });

  router.patch("/clients/:id", {
    schema: { params: clientParamsSchema, body: updateClientSchema },
    preHandler: [router.authenticate],
    handler: clientsController.update,
  });

  router.delete("/clients/:id", {
    schema: { params: clientParamsSchema },
    preHandler: [router.authenticate],
    handler: clientsController.delete,
  });
}

export const clientsRoutes = routes;
