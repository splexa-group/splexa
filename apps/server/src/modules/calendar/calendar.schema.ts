import { z } from "zod";

export const listCalendarEventsQuerySchema = z
  .object({
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
  })
  .strict();

export type ListCalendarEventsQuery = z.infer<typeof listCalendarEventsQuerySchema>;
