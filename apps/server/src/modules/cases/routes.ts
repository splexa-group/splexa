import type { FastifyInstance } from "fastify";

import { casesController } from "./controller";
import { caseParamsSchema, createCaseSchema, listCasesQuerySchema, updateCaseSchema } from "./schema";

export function casesRoutes(router: FastifyInstance): void {
  router.post("/", {
    schema: { body: createCaseSchema },
    preHandler: [router.authenticate],
    handler: casesController.create,
  });

  router.get("/", {
    schema: { querystring: listCasesQuerySchema },
    preHandler: [router.authenticate],
    handler: casesController.list,
  });

  router.get("/:id", {
    schema: { params: caseParamsSchema },
    preHandler: [router.authenticate],
    handler: casesController.getById,
  });

  router.patch("/:id", {
    schema: { params: caseParamsSchema, body: updateCaseSchema },
    preHandler: [router.authenticate],
    handler: casesController.update,
  });

  router.delete("/:id", {
    schema: { params: caseParamsSchema },
    preHandler: [router.authenticate],
    handler: casesController.delete,
  });
}
