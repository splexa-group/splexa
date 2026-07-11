import type { Prisma } from "@prisma/client";

export const userSelect = {
  id: true,
  orgId: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  designation: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
