# Documents Module — Design Spec
**Date:** 2026-06-20  
**Branch:** feat/documents  
**Phase:** 1

---

## Overview

Build a standalone `/documents` page that acts as a document manager for the organisation. The primary view is a grid of case folders — one folder per case, showing the document count. Clicking a folder opens the file list for that case with upload, open, and delete actions.

**By Client grouping is deferred to Phase 2.**

### What is changing in the existing case detail Documents tab
The Documents tab at `/cases/[caseId]` currently supports upload and delete. **Rename** is being added:
- Each file row gets an inline rename action (pencil icon → editable input → save)
- New backend endpoint: `PATCH /cases/:caseId/documents/:documentId` — updates the `name` field only
- No file content or storageKey is changed — rename is a DB-only operation

### What is NOT changing
- All existing upload, delete, and presigned-URL endpoints remain untouched
- Storage (Cloudflare R2) behaviour and the `storageProvider` abstraction are unchanged

---

## User Flow

```
/documents
  → Folder grid: one card per case, sorted alphabetically
  → Each card shows: case title + document count ("4 documents" or "No documents")

Click a folder
  → URL changes to /documents?caseId=xxx
  → File list view: case name header, Upload button, list of files
  → Each file: name, size, date + Open and Delete buttons
  → "← Documents" back button returns to the folder grid

Upload (from file list view)
  → Hidden file input triggered by Upload button
  → POST /cases/:caseId/documents (multipart/form-data)
  → File list refreshes on success

Open a file
  → GET /cases/:caseId/documents/:documentId/url
  → Backend returns presigned R2 URL (expires ~15 min)
  → window.open(url) — file opens directly from R2, not proxied through server

Delete a file
  → Confirm modal first (existing ConfirmDeleteModal component)
  → DELETE /cases/:caseId/documents/:documentId
  → Backend soft-deletes DB record first, then best-effort deletes from R2
  → File list refreshes on success

Rename a file (case detail tab + documents module file list view)
  → Click pencil icon on a file row → name becomes an editable input
  → Save → PATCH /cases/:caseId/documents/:documentId { name: "new name" }
  → DB name field updated only — storageKey and R2 object unchanged
  → File list refreshes on success
```

---

## R2 Storage Structure

All uploaded documents are stored under a deterministic key path:

```
orgs/{orgId}/cases/{caseId}/documents/{uuid}.{ext}

Example:
orgs/org-abc123/cases/case-xyz789/documents/f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf
```

- `orgId` scopes all files to the tenant — no cross-tenant access possible
- `caseId` scopes files to the case — mirrors the DB relationship
- `uuid` prevents collisions even if two files share the same original name
- `ext` preserved from the original filename for MIME-type hints in the browser

**Rename does not move the object in R2.** Only the `name` column in the DB changes. The presigned URL still resolves to the same `storageKey`.

---

## Backend

### New endpoint: `PATCH /cases/:caseId/documents/:documentId` (rename)

**Route:** `PATCH /api/v1/cases/:caseId/documents/:documentId`  
**Auth:** `authenticate` preHandler  
**Body:** `{ name: string }` (Zod: non-empty string, max 255 chars)

**Layer changes:**

| Layer | Change |
|---|---|
| `schema.ts` | Add `renameDocumentBodySchema = z.object({ name: z.string().min(1).max(255) }).strict()` |
| `repository.ts` | Add `rename(id, caseId, orgId, name)` — `prisma.document.updateMany({ where: { id, caseId, orgId, deletedAt: null }, data: { name } })` |
| `service.ts` | Add `rename(documentId, caseId, name, ctx)` — verifies document exists, calls repository, logs `ActivityAction.DOCUMENT_RENAMED` |
| `controller.ts` | Add `rename` handler |
| `routes.ts` | Add `PATCH /:caseId/documents/:documentId` to `documentsCaseScopedRoutes` |

**Note:** Uses `updateMany` (not `update`) so the `orgId` scope is enforced at the DB level — consistent with the soft-delete pattern.

---

### New endpoint: `GET /documents/folders`

Single new endpoint added to the existing `modules/documents/` module.

**Route:** `GET /api/v1/documents/folders`  
**Auth:** `authenticate` preHandler (orgId from JWT only)  
**Query params:** none for Phase 1

**Response shape:**
```json
{
  "success": true,
  "data": [
    { "caseId": "abc-123", "title": "Sharma v State", "documentCount": 4 },
    { "caseId": "def-456", "title": "Mehta Property Dispute", "documentCount": 0 }
  ]
}
```

### Layer changes

| Layer | Change |
|---|---|
| `schema.ts` | Add `DocumentFolderItem` type: `{ caseId: string, title: string, documentCount: number }` |
| `repository.ts` | Add `listFolders(orgId)` — uses Prisma `_count` to join document counts onto cases |
| `service.ts` | Add `listFolders(orgId)` — calls repository, no additional logic |
| `controller.ts` | Add `listFolders` handler — reads `req.user.orgId`, calls service, returns data |
| `routes.ts` | Add `GET /folders` route with `authenticate` preHandler |

### Repository query

```ts
async listFolders(orgId: string) {
  const cases = await prisma.case.findMany({
    where: { orgId, deletedAt: null },
    select: {
      id: true,
      title: true,
      _count: { select: { documents: { where: { deletedAt: null } } } },
    },
    orderBy: { title: 'asc' },
  });
  return cases.map((c) => ({
    caseId: c.id,
    title: c.title,
    documentCount: c._count.documents,
  }));
}
```

No raw SQL. Single DB round-trip.

---

## Frontend

### Routing

Single page, two render states — no new Next.js routes needed:

| URL | Renders |
|---|---|
| `/documents` | `FolderGrid` (caseId param absent) |
| `/documents?caseId=xxx` | `DocumentFileList` (caseId param present) |

### New files

| File | Responsibility |
|---|---|
| `app/(protected)/documents/page.tsx` | Reads `searchParams.caseId` — renders `FolderGrid` or `DocumentFileList` |
| `components/documents/folder-grid.tsx` | Grid of `FolderCard` components, empty state if no cases |
| `components/documents/folder-card.tsx` | Single case folder card — title + count badge, click navigates |
| `components/documents/document-file-list.tsx` | File list for a case — header, upload button, per-file rows |
| `hooks/use-documents.ts` | Add `useFolders()` and `useRenameDocument(caseId)` hooks |
| `services/documents.ts` | Add `listFolders()` → `GET /documents/folders` and `rename()` → `PATCH /cases/:caseId/documents/:documentId` |
| `types/documents.ts` | Add `DocumentFolder` interface |

### Data flow

```
FolderGrid
  useFolders() → GET /documents/folders → renders folder cards
  click card   → router.push('/documents?caseId=xxx')

DocumentFileList (and case detail Documents tab)
  useDocuments(caseId)       → GET /cases/:caseId/documents
  useUploadDocument(caseId)  → POST /cases/:caseId/documents
  useRenameDocument(caseId)  → PATCH /cases/:caseId/documents/:documentId
  useDeleteDocument(caseId)  → DELETE /cases/:caseId/documents/:documentId
  documentsApi.getUrl(...)   → GET /cases/:caseId/documents/:documentId/url
  "← Documents"             → router.push('/documents')
```

### React Query keys (additions to use-documents.ts)

```ts
export const documentKeys = {
  all: ['documents'] as const,
  folders: () => ['documents', 'folders'] as const,          // new
  list: (caseId: string) => ['documents', 'list', caseId] as const,
};

export function useFolders() {
  return useQuery({
    queryKey: documentKeys.folders(),
    queryFn: () => documentsApi.listFolders(),
    select: (res) => res.data,
  });
}
```

### Page title behaviour

Uses existing `usePageTitle` hook:
- Folder grid view → title: `"Documents"`
- File list view → title: the case title (read from `useFolders()` data by matching `caseId` — no extra fetch needed)

### Reused primitives (no new UI components needed)

`Button`, `Section`, `EmptyState`, `ConfirmDeleteModal` — all reused as-is from existing components.

---

## Folder card design

```
┌─────────────────────────┐
│  📁                     │
│  Sharma v State         │
│  4 documents            │
└─────────────────────────┘

┌─────────────────────────┐
│  📁                     │
│  Mehta Property Dispute │
│  No documents           │
└─────────────────────────┘
```

Grid: responsive, 2 columns on mobile, 3–4 on desktop.

---

## Phase 2 (deferred)

- **By Client grouping** — toggle between "By Case" (default) and "By Client" folder views
- Requires: `clientId` filter on documents endpoint, client folder data, handling cases with no client

---

## What is explicitly out of scope (Phase 1)

- Search within documents module
- Document preview / inline viewer
- Sorting or filtering folders
- Bulk delete
- Folder rename (case title is the folder name — edit via case detail)
