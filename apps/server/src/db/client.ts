import { PrismaClient } from "@prisma/client";

import { env } from "@/config/env";
import { ENVIRONMENT } from "@/enums/env.enums";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === ENVIRONMENT.DEVELOPMENT
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (env.NODE_ENV !== ENVIRONMENT.PRODUCTION) {
  globalForPrisma.prisma = prisma;
}
