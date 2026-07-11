import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { hearingsController } from "./hearings.controller";
import {
  caseHearingParamsSchema,
  createHearingSchema,
  hearingParamsSchema,
  listHearingsQuerySchema,
  updateHearingSchema,
} from "./hearings.schema";

async function routes(router: FastifyInstance): Promise<void> {
  router.get("/hearings", {
    schema: { querystring: listHearingsQuerySchema },
    preHandler: [router.authenticate],
    handler: hearingsController.listCrossCase,
  });

  router.get("/hearings/:id", {
    schema: { params: hearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.getById,
  });

  router.patch("/hearings/:id", {
    schema: { params: hearingParamsSchema, body: updateHearingSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.update,
  });

  router.delete("/hearings/:id", {
    schema: { params: hearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.delete,
  });

  router.post("/cases/:caseId/hearings", {
    schema: { params: caseHearingParamsSchema, body: createHearingSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.create,
  });

  router.get("/cases/:caseId/hearings", {
    schema: { params: caseHearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.listForCase,
  });
}

export const hearingsRoutes = fp(routes, { name: "hearings-routes" });
