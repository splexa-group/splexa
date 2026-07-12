import { FastifyRequest } from "fastify";

import { CalendarEventsQuery } from "./calendar.schema";
import { calendarService } from "./calendar.service";

export const calendarController = {
  async list(req: FastifyRequest<{ Querystring: CalendarEventsQuery }>) {
    const events = await calendarService.listEvents(req.user.orgId, req.query);
    return { events };
  },
};
