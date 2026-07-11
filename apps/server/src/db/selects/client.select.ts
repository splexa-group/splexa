import { Prisma } from "@prisma/client";

export const clientSelect = {
  id: true,
  orgId: true,
  fullName: true,
  phone: true,
  type: true,
  email: true,
  address: true,
  companyName: true,
  notes: true,
  preferredLanguage: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;
