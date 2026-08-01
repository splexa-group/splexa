import { z } from "zod";

export const calendarEventsQuerySchema = z
  .object({
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
  })
  .strict();

export type CalendarEventsQuery = z.infer<typeof calendarEventsQuerySchema>;
