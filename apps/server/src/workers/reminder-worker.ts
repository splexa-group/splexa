import cron from "node-cron";

import { prisma } from "@/db/client";

export function startReminderWorker(): void {
  cron.schedule("*/10 * * * *", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const dates = await prisma.importantDate.findMany({
      where: {
        date: { lte: tomorrow },
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
      } catch {
        // Log and continue — one failure should not block other notifications
      }
    }
  });
}
