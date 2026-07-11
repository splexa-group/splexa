import { Prisma } from "@prisma/client";

export const orgSelect = {
  id: true,
  name: true,
  practiceTypes: true,
  city: true,
} satisfies Prisma.OrganizationSelect;
