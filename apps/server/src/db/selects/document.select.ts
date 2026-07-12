import { Prisma } from "@prisma/client";

// API-facing shape — used anywhere a document is returned directly in a response body.
export const documentSelect = {
  id: true,
  caseId: true,
  orgId: true,
  name: true,
  mimeType: true,
  size: true,
  uploadedBy: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

// Internal-only — adds storageKey, the raw storage backend path. Only for lookups that stay
// server-side to generate a signed URL or delete the object; never returned to the client.
export const documentWithStorageKeySelect = {
  ...documentSelect,
  storageKey: true,
} satisfies Prisma.DocumentSelect;
