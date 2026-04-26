import { ENV } from "./config/env";
import { buildApp } from "./app";

const app = buildApp();

async function startServer() {
  try {
    await app.listen({
      port: ENV.port,
      host: ENV.isDevelopment ? "127.0.0.1" : "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

startServer();
