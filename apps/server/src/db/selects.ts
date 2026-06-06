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

export const hearingSelect = {
  id: true,
  caseId: true,
  date: true,
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

export const importantDateSelect = {
  id: true,
  caseId: true,
  dateType: true,
  date: true,
  description: true,
  createdAt: true,
} satisfies Prisma.ImportantDateSelect;

export const caseDetailSelect = {
  id: true,
  orgId: true,
  title: true,
  clientId: true,
  clientRole: true,
  caseNumber: true,
  caseType: true,
  filingDate: true,
  courtName: true,
  courtType: true,
  courtState: true,
  courtCity: true,
  benchNumber: true,
  judgeName: true,
  judgeDesignation: true,
  judgeUpdatedAt: true,
  status: true,
  stage: true,
  priority: true,
  description: true,
  oppositeParties: true,
  tags: true,
  nextHearingDate: true,
  assignedTo: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  client: { select: clientSelect },
  hearings: {
    where: { deletedAt: null },
    orderBy: { date: "desc" as const },
    select: hearingSelect,
  },
  importantDates: {
    where: { deletedAt: null },
    orderBy: { date: "asc" as const },
    select: importantDateSelect,
  },
} satisfies Prisma.CaseSelect;

export const documentSelect = {
  id: true,
  caseId: true,
  orgId: true,
  name: true,
  mimeType: true,
  size: true,
  storageKey: true,
  uploadedBy: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

export const hearingDetailSelect = {
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
  case: {
    select: {
      id: true,
      title: true,
      client: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.HearingSelect;
