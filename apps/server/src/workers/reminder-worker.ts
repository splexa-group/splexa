import cron from "node-cron";

import { prisma } from "@/db/client";

export function startReminderWorker(): void {
  // Runs every morning at 7:00 AM IST (01:30 UTC)
  cron.schedule("30 1 * * *", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const events = await prisma.scheduledEvent.findMany({
      where: {
        date: { gte: today, lte: tomorrow },
        notifiedAt: null,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        date: true,
        caseId: true,
        notifyUserId: true,
        sourceType: true,
      },
    });

    for (const event of events) {
      try {
        // TODO: look up user phone by event.notifyUserId, then call whatsAppProvider.sendTemplateMessage()

        await prisma.scheduledEvent.update({
          where: { id: event.id },
          data: { notifiedAt: new Date() },
        });
      } catch {
        // Log and continue — one failure should not block other notifications
      }
    }
  });
}
