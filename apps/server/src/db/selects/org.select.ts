import { Prisma } from "@prisma/client";

export const orgSelect = {
  id: true,
  name: true,
  practiceTypes: true,
  firmType: true,
  city: true,
  state: true,
} satisfies Prisma.OrganizationSelect;
