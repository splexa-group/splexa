import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";

import { env } from "@/config/env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const logLevels: Prisma.LogLevel[] = env.IS_DEVELOPMENT
  ? ["query", "warn", "error"]
  : ["warn", "error"];

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter, log: logLevels });

if (!env.IS_PRODUCTION) {
  globalForPrisma.prisma = prisma;
}
