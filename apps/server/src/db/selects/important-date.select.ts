import { Prisma } from "@prisma/client";

export const importantDateSelect = {
  id: true,
  caseId: true,
  dateType: true,
  date: true,
  description: true,
  createdAt: true,
} satisfies Prisma.ImportantDateSelect;

export const importantDateCalendarSelect = {
  id: true,
  caseId: true,
  dateType: true,
  date: true,
  description: true,
  createdAt: true,
  case: {
    select: {
      id: true,
      title: true,
    },
  },
} satisfies Prisma.ImportantDateSelect;
