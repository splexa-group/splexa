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

export const orgSelect = {
  id: true,
  name: true,
  practiceTypes: true,
  city: true,
} satisfies Prisma.OrganizationSelect;

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

export const caseSummarySelect = {
  id: true,
  title: true,
  caseNumber: true,
  status: true,
  priority: true,
  courtName: true,
  nextHearingDate: true,
  clientRole: true,
  client: {
    select: {
      id: true,
      fullName: true,
      phone: true,
    },
  },
} satisfies Prisma.CaseSelect;

export const hearingSummarySelect = {
  id: true,
  caseId: true,
  orgId: true,
  date: true,
  purpose: true,
  status: true,
  notes: true,
  nextDate: true,
  adjournmentReason: true,
  judgePresent: true,
  addedBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HearingSelect;
