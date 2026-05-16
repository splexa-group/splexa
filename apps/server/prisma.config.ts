import path from "path";

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const envFile = process.env["ENV_FILE"] ?? ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
