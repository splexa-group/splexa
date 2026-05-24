import cron from "node-cron";

import { logger } from "@/config/logger";
import { prisma } from "@/db/client";

export function startReminderWorker(): void {
  cron.schedule("*/10 * * * *", async () => {
    const now = new Date();
    // Use explicit UTC arithmetic to avoid server timezone affecting IST date comparisons
    const startOfTodayUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const endOfTomorrowUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2) - 1,
    );

    const dates = await prisma.importantDate.findMany({
      where: {
        date: { gte: startOfTodayUTC, lte: endOfTomorrowUTC },
        notifiedAt: null,
        deletedAt: null,
      },
      select: {
        id: true,
        dateType: true,
        date: true,
        caseId: true,
        notifyUserId: true,
      },
    });

    for (const date of dates) {
      try {
        // TODO: look up user phone by date.notifyUserId, call whatsAppProvider.sendTemplateMessage()

        await prisma.importantDate.update({
          where: { id: date.id },
          data: { notifiedAt: new Date() },
        });
      } catch (error) {
        logger.error({ importantDateId: date.id, error }, "reminder-worker: failed to process importantDate");
      }
    }
  });
}
