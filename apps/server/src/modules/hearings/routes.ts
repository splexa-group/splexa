import type { FastifyInstance } from "fastify";

import { hearingsController } from "./controller";
import {
  caseHearingParamsSchema,
  createHearingSchema,
  hearingParamsSchema,
  listHearingsQuerySchema,
  updateHearingSchema,
} from "./schema";

export function hearingsStandaloneRoutes(router: FastifyInstance): void {
  router.get("/", {
    schema: { querystring: listHearingsQuerySchema },
    preHandler: [router.authenticate],
    handler: hearingsController.listCrossCase,
  });

  router.patch("/:id", {
    schema: { params: hearingParamsSchema, body: updateHearingSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.update,
  });

  router.delete("/:id", {
    schema: { params: hearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.delete,
  });
}

export function hearingsCaseScopedRoutes(router: FastifyInstance): void {
  router.post("/:caseId/hearings", {
    schema: { params: caseHearingParamsSchema, body: createHearingSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.create,
  });

  router.get("/:caseId/hearings", {
    schema: { params: caseHearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.listForCase,
  });
}
