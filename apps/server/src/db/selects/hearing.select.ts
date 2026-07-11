import type { Prisma } from "@prisma/client";

export const hearingSelect = {
  id: true,
  caseId: true,
  date: true,
  time: true,
  purpose: true,
  status: true,
  notes: true,
  nextDate: true,
  adjournmentReason: true,
  judgePresent: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HearingSelect;

export const hearingSummarySelect = {
  ...hearingSelect,
  orgId: true,
  addedBy: true,
} satisfies Prisma.HearingSelect;

export const hearingCalendarSelect = {
  id: true,
  caseId: true,
  date: true,
  time: true,
  purpose: true,
  status: true,
  case: {
    select: {
      id: true,
      title: true,
      courtName: true,
    },
  },
} satisfies Prisma.HearingSelect;

export const hearingDetailSelect = {
  id: true,
  caseId: true,
  orgId: true,
  date: true,
  time: true,
  purpose: true,
  status: true,
  notes: true,
  nextDate: true,
  adjournmentReason: true,
  judgePresent: true,
  addedBy: true,
  createdAt: true,
  updatedAt: true,
  case: {
    select: {
      id: true,
      title: true,
      courtName: true,
      client: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.HearingSelect;
