import { Prisma } from "@prisma/client";

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
