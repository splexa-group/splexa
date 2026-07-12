import { FastifyRequest } from "fastify";

import { ListCalendarEventsQuery } from "./calendar.schema";
import { calendarService } from "./calendar.service";

export const calendarController = {
  async list(req: FastifyRequest<{ Querystring: ListCalendarEventsQuery }>) {
    const events = await calendarService.listEvents(req.user.orgId, req.query);
    return { events };
  },
};
