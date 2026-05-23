import type { FastifyInstance } from "fastify";

import { importantDatesController } from "./controller";
import {
  caseParamsSchema,
  createImportantDateSchema,
  importantDateParamsSchema,
  updateImportantDateSchema,
} from "./schema";

export function importantDatesRoutes(router: FastifyInstance): void {
  router.post("/:caseId/important-dates", {
    schema: { params: caseParamsSchema, body: createImportantDateSchema },
    preHandler: [router.authenticate],
    handler: importantDatesController.create,
  });

  router.patch("/:caseId/important-dates/:dateId", {
    schema: { params: importantDateParamsSchema, body: updateImportantDateSchema },
    preHandler: [router.authenticate],
    handler: importantDatesController.update,
  });

  router.delete("/:caseId/important-dates/:dateId", {
    schema: { params: importantDateParamsSchema },
    preHandler: [router.authenticate],
    handler: importantDatesController.delete,
  });
}
