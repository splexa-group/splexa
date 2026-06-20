# Documents Module — Design Spec
**Date:** 2026-06-20  
**Branch:** feat/documents  
**Phase:** 1

---

## Overview

Build a standalone `/documents` page that acts as a document manager for the organisation. The primary view is a grid of case folders — one folder per case, showing the document count. Clicking a folder opens the file list for that case with upload, open, and delete actions.

**By Client grouping is deferred to Phase 2.**

### What is NOT changing
- The existing Documents tab inside the case detail page (`/cases/[caseId]`) stays exactly as-is
- All existing backend endpoints remain untouched
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
```

---

## Backend

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
| `hooks/use-documents.ts` | Add `useFolders()` hook (new). Existing hooks unchanged. |
| `services/documents.ts` | Add `listFolders()` → `GET /documents/folders` |
| `types/documents.ts` | Add `DocumentFolder` interface |

### Data flow

```
FolderGrid
  useFolders() → GET /documents/folders → renders folder cards
  click card   → router.push('/documents?caseId=xxx')

DocumentFileList
  useDocuments(caseId)       → GET /cases/:caseId/documents
  useUploadDocument(caseId)  → POST /cases/:caseId/documents
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
