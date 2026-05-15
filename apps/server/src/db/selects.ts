import type { Prisma } from "@prisma/client";

export const userPublicSelect = {
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

export const orgPublicSelect = {
  id: true,
  name: true,
  practiceType: true,
  city: true,
} satisfies Prisma.OrganizationSelect;
