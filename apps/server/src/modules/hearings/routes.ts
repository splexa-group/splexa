import type { FastifyInstance } from "fastify";

import { hearingsController } from "./controller";
import {
  hearingParamsSchema,
  listHearingsQuerySchema,
  updateHearingSchema,
} from "./schema";

export function hearingsRoutes(router: FastifyInstance): void {
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
