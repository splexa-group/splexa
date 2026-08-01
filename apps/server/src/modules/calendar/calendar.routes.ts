import { FastifyInstance } from "fastify";

import { calendarController } from "./calendar.controller";
import { calendarEventsQuerySchema } from "./calendar.schema";

async function routes(router: FastifyInstance): Promise<void> {
  router.get("/calendar", {
    schema: { querystring: calendarEventsQuerySchema },
    preHandler: [router.authenticate],
    handler: calendarController.list,
  });
}

export const calendarRoutes = routes;
