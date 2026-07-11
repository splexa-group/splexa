import { Prisma } from "@prisma/client";

import { clientSelect } from "./client.select";
import { hearingSelect } from "./hearing.select";
import { importantDateSelect } from "./important-date.select";

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
