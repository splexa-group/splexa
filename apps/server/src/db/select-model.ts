import type { Prisma } from "@prisma/client";

// User and Organization have no owning module — User is created by auth and
// viewed/edited by settings; Organization the same. Their select projections
// live here rather than being forced into either module.

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

export const orgSelect = {
  id: true,
  name: true,
  practiceTypes: true,
  city: true,
} satisfies Prisma.OrganizationSelect;
