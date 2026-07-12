import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { importantDatesController } from "./important-dates.controller";
import {
  caseParamsSchema,
  createImportantDateSchema,
  importantDateParamsSchema,
  updateImportantDateSchema,
} from "./important-dates.schema";

async function routes(router: FastifyInstance): Promise<void> {
  router.get("/cases/:caseId/important-dates", {
    schema: { params: caseParamsSchema },
    preHandler: [router.authenticate],
    handler: importantDatesController.listForCase,
  });

  router.post("/cases/:caseId/important-dates", {
    schema: { params: caseParamsSchema, body: createImportantDateSchema },
    preHandler: [router.authenticate],
    handler: importantDatesController.create,
  });

  router.patch("/cases/:caseId/important-dates/:dateId", {
    schema: { params: importantDateParamsSchema, body: updateImportantDateSchema },
    preHandler: [router.authenticate],
    handler: importantDatesController.update,
  });

  router.delete("/cases/:caseId/important-dates/:dateId", {
    schema: { params: importantDateParamsSchema },
    preHandler: [router.authenticate],
    handler: importantDatesController.delete,
  });
}

export const importantDatesRoutes = fp(routes, { name: "important-dates-routes" });
