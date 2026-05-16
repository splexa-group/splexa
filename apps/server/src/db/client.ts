import { PrismaClient, Prisma } from "@prisma/client";

import { env } from "@/config/env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const logLevels: Prisma.LogLevel[] = env.IS_DEVELOPMENT
  ? ["query", "warn", "error"]
  : ["warn", "error"];

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: logLevels });

if (env.IS_PRODUCTION) {
  globalForPrisma.prisma = prisma;
}
