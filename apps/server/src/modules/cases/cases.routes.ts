import { FastifyInstance } from "fastify";

import { casesController } from "./cases.controller";
import {
  createClientSchema,
  caseParamsSchema,
  createCaseSchema,
  listCasesQuerySchema,
  updateCaseSchema,
} from "./cases.schema";

async function routes(router: FastifyInstance): Promise<void> {
  router.post("/cases", {
    schema: { body: createCaseSchema },
    preHandler: [router.authenticate],
    handler: casesController.create,
  });

  router.get("/cases", {
    schema: { querystring: listCasesQuerySchema },
    preHandler: [router.authenticate],
    handler: casesController.list,
  });

  router.get("/cases/:id", {
    schema: { params: caseParamsSchema },
    preHandler: [router.authenticate],
    handler: casesController.getById,
  });

  router.patch("/cases/:id", {
    schema: { params: caseParamsSchema, body: updateCaseSchema },
    preHandler: [router.authenticate],
    handler: casesController.update,
  });

  router.post("/cases/:id/client", {
    schema: { params: caseParamsSchema, body: createClientSchema },
    preHandler: [router.authenticate],
    handler: casesController.addClientToCase,
  });

  router.delete("/cases/:id", {
    schema: { params: caseParamsSchema },
    preHandler: [router.authenticate],
    handler: casesController.delete,
  });
}

export const casesRoutes = routes;
