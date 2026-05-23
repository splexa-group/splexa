import { env } from "@/config/env";

import { buildApp } from "./app";
import { startReminderWorker } from "./workers/reminder-worker";

async function startServer() {
  const app = await buildApp();
  try {
    await app.listen({
      port: env.PORT,
      host: env.IS_DEVELOPMENT ? "127.0.0.1" : "0.0.0.0",
    });
    startReminderWorker();
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

startServer();
