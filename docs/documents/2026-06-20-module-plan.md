# Documents Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/documents` module page (folder grid by case, file list on click, upload/delete/rename) and add rename to the existing case detail Documents tab.

**Architecture:** One new backend endpoint (`GET /documents/folders`) for the folder grid, one new endpoint (`PATCH /cases/:caseId/documents/:documentId`) for rename. The frontend `/documents` page uses a single Next.js page with two render states driven by a `?caseId` query param — no new routes. Upload, delete, and open reuse all existing endpoints unchanged.

**Tech Stack:** Fastify + Prisma + Zod (backend), Next.js App Router + React Query + Axios + Tailwind v4 (frontend), Vitest (tests).

## Global Constraints

- `orgId` always from `req.user.orgId` (JWT) — never from body, params, or query string
- Every Prisma query on tenant-scoped tables filters by `orgId`
- `prisma.*` never used outside `*-repository.ts` files
- Repositories return `null` — services throw `NotFoundError` / `AppError`
- `softDelete` and updates use `updateMany({ where: { id, orgId } })` — never `update({ where: { id } })` alone
- No `any`, no `!`, no `@ts-ignore`
- kebab-case for all new file names
- Zod everywhere on the server — types always from `z.infer<>`
- No raw `fetch` or `axios` in frontend components — use `services/documents.ts` typed client
- No `useEffect` for server data — React Query only
- `reply.code(N); return data;` in controllers — never `reply.send()`

---

## File Map

**Backend — modified files:**
- `apps/server/src/modules/documents/schema.ts` — add `renameDocumentBodySchema`, `RenameDocumentBody` type, `DocumentFolderItem` interface
- `apps/server/src/modules/documents/repository.ts` — add `rename()`, `listFolders()`
- `apps/server/src/modules/documents/service.ts` — add `rename()`, `listFolders()`
- `apps/server/src/modules/documents/controller.ts` — add `rename`, `listFolders` handlers
- `apps/server/src/modules/documents/routes.ts` — add `PATCH /:caseId/documents/:documentId`, `GET /folders`
- `apps/server/src/modules/documents/__tests__/service.test.ts` — add tests for rename and listFolders

**Frontend — modified files:**
- `apps/web/src/types/documents.ts` — add `DocumentFolder` interface
- `apps/web/src/services/documents.ts` — add `listFolders()`, `rename()`
- `apps/web/src/hooks/use-documents.ts` — add `useFolders()`, `useRenameDocument()`
- `apps/web/src/components/cases/documents/documents.tsx` — add inline rename UI

**Frontend — new files:**
- `apps/web/src/app/(protected)/documents/page.tsx`
- `apps/web/src/components/documents/folder-grid.tsx`
- `apps/web/src/components/documents/folder-card.tsx`
- `apps/web/src/components/documents/document-file-list.tsx`

---

### Task 1: Backend — Rename document endpoint

**Files:**
- Modify: `apps/server/src/modules/documents/schema.ts`
- Modify: `apps/server/src/modules/documents/repository.ts`
- Modify: `apps/server/src/modules/documents/service.ts`
- Modify: `apps/server/src/modules/documents/controller.ts`
- Modify: `apps/server/src/modules/documents/routes.ts`
- Test: `apps/server/src/modules/documents/__tests__/service.test.ts`

**Interfaces:**
- Produces: `documentsRepository.rename(id, caseId, orgId, name)`, `documentsService.rename(documentId, caseId, name, ctx)`, `PATCH /api/v1/cases/:caseId/documents/:documentId`

- [ ] **Step 1: Add the Zod schema and type**

In `apps/server/src/modules/documents/schema.ts`, add at the bottom:

```ts
export const renameDocumentBodySchema = z
  .object({ name: z.string().min(1).max(255) })
  .strict();

export type RenameDocumentBody = z.infer<typeof renameDocumentBodySchema>;
```

- [ ] **Step 2: Write failing service test for rename**

In `apps/server/src/modules/documents/__tests__/service.test.ts`:

First, update the `vi.mock("../repository", ...)` block to include `rename`:

```ts
vi.mock("../repository", () => ({
  documentsRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    listForCase: vi.fn(),
    listForOrg: vi.fn(),
    softDelete: vi.fn(),
    rename: vi.fn(),
  },
}));
```

Then add at the bottom of the file:

```ts
describe("documentsService.rename", () => {
  it("throws documentNotFound when doc does not exist", async () => {
    vi.mocked(documentsRepository.findById).mockResolvedValue(null);
    await expect(
      documentsService.rename("bad-doc", "case-1", "new name.pdf", ctx),
    ).rejects.toThrow(Errors.documentNotFound());
  });

  it("renames the document and returns updated record", async () => {
    const renamed = { ...mockDoc, name: "new name.pdf" };
    vi.mocked(documentsRepository.findById).mockResolvedValue(mockDoc);
    vi.mocked(documentsRepository.rename).mockResolvedValue(renamed);

    const result = await documentsService.rename("doc-1", "case-1", "new name.pdf", ctx);

    expect(documentsRepository.rename).toHaveBeenCalledWith("doc-1", "case-1", "org-1", "new name.pdf");
    expect(result).toEqual(renamed);
  });
});
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
cd apps/server && pnpm test --reporter=verbose 2>&1 | grep -A5 "documentsService.rename"
```

Expected: FAIL — `documentsService.rename is not a function`

- [ ] **Step 4: Add `rename` to the repository**

In `apps/server/src/modules/documents/repository.ts`, add after `softDelete`:

```ts
async rename(id: string, caseId: string, orgId: string, name: string) {
  await prisma.document.updateMany({
    where: { id, caseId, orgId, deletedAt: null },
    data: { name },
  });
  return prisma.document.findFirst({
    where: { id, orgId, deletedAt: null },
    select: documentSelect,
  });
},
```

- [ ] **Step 5: Add `rename` to the service**

In `apps/server/src/modules/documents/service.ts`, add after `delete`:

```ts
async rename(documentId: string, caseId: string, name: string, ctx: ServiceContext) {
  const doc = await documentsRepository.findById(documentId, caseId, ctx.orgId);
  if (!doc) throw Errors.documentNotFound();
  return documentsRepository.rename(documentId, caseId, ctx.orgId, name);
},
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd apps/server && pnpm test --reporter=verbose 2>&1 | grep -A3 "documentsService.rename"
```

Expected: PASS (2 passing tests)

- [ ] **Step 7: Add `rename` handler to the controller**

In `apps/server/src/modules/documents/controller.ts`:

Add the `RenameDocumentBody` import alongside the existing schema imports:

```ts
import type {
  DocumentCaseParams,
  DocumentParams,
  ListDocumentsOrgQuery,
  ListDocumentsQuery,
  RenameDocumentBody,
} from "./schema";
```

Add the handler at the bottom of `documentsController`:

```ts
async rename(
  req: FastifyRequest<{ Params: DocumentParams; Body: RenameDocumentBody }>,
) {
  return documentsService.rename(
    req.params.documentId,
    req.params.caseId,
    req.body.name,
    { orgId: req.user.orgId, userId: req.user.userId, ipAddress: req.ip },
  );
},
```

- [ ] **Step 8: Register the route**

In `apps/server/src/modules/documents/routes.ts`:

Add the schema import:

```ts
import {
  documentCaseParamsSchema,
  documentParamsSchema,
  listDocumentsOrgQuerySchema,
  listDocumentsQuerySchema,
  renameDocumentBodySchema,
} from "./schema";
```

Add inside `documentsCaseScopedRoutes`, after the DELETE route:

```ts
router.patch("/:caseId/documents/:documentId", {
  schema: { params: documentParamsSchema, body: renameDocumentBodySchema },
  preHandler: [router.authenticate],
  handler: documentsController.rename,
});
```

- [ ] **Step 9: Commit**

```bash
git add apps/server/src/modules/documents/
git commit -m "feat(documents): add rename endpoint PATCH /cases/:caseId/documents/:documentId"
```

---

### Task 2: Backend — List folders endpoint

**Files:**
- Modify: `apps/server/src/modules/documents/schema.ts`
- Modify: `apps/server/src/modules/documents/repository.ts`
- Modify: `apps/server/src/modules/documents/service.ts`
- Modify: `apps/server/src/modules/documents/controller.ts`
- Modify: `apps/server/src/modules/documents/routes.ts`
- Test: `apps/server/src/modules/documents/__tests__/service.test.ts`

**Interfaces:**
- Produces: `documentsRepository.listFolders(orgId)`, `documentsService.listFolders(orgId)`, `GET /api/v1/documents/folders` → `{ caseId: string, title: string, documentCount: number }[]`

- [ ] **Step 1: Add the DocumentFolderItem type to schema**

In `apps/server/src/modules/documents/schema.ts`, add:

```ts
export interface DocumentFolderItem {
  caseId: string;
  title: string;
  documentCount: number;
}
```

- [ ] **Step 2: Update the repository mock and write failing test**

In `apps/server/src/modules/documents/__tests__/service.test.ts`, add `listFolders` to the repository mock:

```ts
vi.mock("../repository", () => ({
  documentsRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    listForCase: vi.fn(),
    listForOrg: vi.fn(),
    softDelete: vi.fn(),
    rename: vi.fn(),
    listFolders: vi.fn(),
  },
}));
```

Add at the bottom of the file:

```ts
describe("documentsService.listFolders", () => {
  it("returns folder list from repository", async () => {
    const folders = [
      { caseId: "case-1", title: "Sharma v State", documentCount: 4 },
      { caseId: "case-2", title: "Mehta Property", documentCount: 0 },
    ];
    vi.mocked(documentsRepository.listFolders).mockResolvedValue(folders);

    const result = await documentsService.listFolders("org-1");

    expect(documentsRepository.listFolders).toHaveBeenCalledWith("org-1");
    expect(result).toEqual(folders);
  });
});
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
cd apps/server && pnpm test --reporter=verbose 2>&1 | grep -A5 "documentsService.listFolders"
```

Expected: FAIL — `documentsService.listFolders is not a function`

- [ ] **Step 4: Add `listFolders` to the repository**

In `apps/server/src/modules/documents/repository.ts`, add after `rename`. This requires importing `prisma` from the case model — add the import at the top if not already present (it is already imported):

```ts
async listFolders(orgId: string): Promise<DocumentFolderItem[]> {
  const cases = await prisma.case.findMany({
    where: { orgId, deletedAt: null },
    select: {
      id: true,
      title: true,
      _count: { select: { documents: { where: { deletedAt: null } } } },
    },
    orderBy: { title: "asc" },
  });
  return cases.map((c) => ({
    caseId: c.id,
    title: c.title,
    documentCount: c._count.documents,
  }));
},
```

Add the `DocumentFolderItem` import at the top of the repository file:

```ts
import type { DocumentFolderItem } from "./schema";
```

- [ ] **Step 5: Add `listFolders` to the service**

In `apps/server/src/modules/documents/service.ts`, add after `rename`:

```ts
async listFolders(orgId: string) {
  return documentsRepository.listFolders(orgId);
},
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd apps/server && pnpm test --reporter=verbose 2>&1 | grep -A3 "documentsService.listFolders"
```

Expected: PASS

- [ ] **Step 7: Add `listFolders` handler to the controller**

In `apps/server/src/modules/documents/controller.ts`, add at the bottom of `documentsController`:

```ts
async listFolders(req: FastifyRequest) {
  return documentsService.listFolders(req.user.orgId);
},
```

- [ ] **Step 8: Register the GET /folders route**

In `apps/server/src/modules/documents/routes.ts`, inside `documentsRoutes` (the one registered at `/api/v1/documents`), add after the existing `GET /` route:

```ts
router.get("/folders", {
  preHandler: [router.authenticate],
  handler: documentsController.listFolders,
});
```

- [ ] **Step 9: Commit**

```bash
git add apps/server/src/modules/documents/
git commit -m "feat(documents): add GET /documents/folders endpoint with case document counts"
```

---

### Task 3: Frontend — Types and API service layer

**Files:**
- Modify: `apps/web/src/types/documents.ts`
- Modify: `apps/web/src/services/documents.ts`

**Interfaces:**
- Produces: `DocumentFolder` type, `documentsApi.listFolders()`, `documentsApi.rename(caseId, documentId, name)`

- [ ] **Step 1: Add DocumentFolder type**

In `apps/web/src/types/documents.ts`, add:

```ts
export interface DocumentFolder {
  caseId: string;
  title: string;
  documentCount: number;
}

export interface DocumentFolderListResponse {
  data: DocumentFolder[];
}
```

- [ ] **Step 2: Add listFolders and rename to the API service**

In `apps/web/src/services/documents.ts`, add the `PATCH` import and new methods:

```ts
import { DELETE, GET, PATCH, POST } from "@/api/http";
import type { Document, DocumentFolder, DocumentFolderListResponse, DocumentListResponse } from "@/types/documents";

export const documentsApi = {
  listByCaseId: (caseId: string) =>
    GET<DocumentListResponse>(`/cases/${caseId}/documents`),

  listFolders: () =>
    GET<DocumentFolderListResponse>("/documents/folders"),

  upload: (caseId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return POST<Document>(`/cases/${caseId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getUrl: (caseId: string, documentId: string) =>
    GET<{ url: string }>(`/cases/${caseId}/documents/${documentId}/url`),

  rename: (caseId: string, documentId: string, name: string) =>
    PATCH<Document>(`/cases/${caseId}/documents/${documentId}`, { name }),

  delete: (caseId: string, documentId: string) =>
    DELETE<void>(`/cases/${caseId}/documents/${documentId}`),
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/types/documents.ts apps/web/src/services/documents.ts
git commit -m "feat(documents): add DocumentFolder type and listFolders/rename API calls"
```

---

### Task 4: Frontend — React Query hooks

**Files:**
- Modify: `apps/web/src/hooks/use-documents.ts`

**Interfaces:**
- Consumes: `documentsApi.listFolders()`, `documentsApi.rename()` from Task 3
- Produces: `useFolders()`, `useRenameDocument(caseId)`, updated `documentKeys`

- [ ] **Step 1: Add useFolders and useRenameDocument hooks**

Replace the full content of `apps/web/src/hooks/use-documents.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { documentsApi } from "@/services/documents";

export const documentKeys = {
  all: ["documents"] as const,
  folders: () => ["documents", "folders"] as const,
  list: (caseId: string) => ["documents", "list", caseId] as const,
};

export function useFolders() {
  return useQuery({
    queryKey: documentKeys.folders(),
    queryFn: () => documentsApi.listFolders(),
    select: (res) => res.data,
  });
}

export function useDocuments(caseId: string) {
  return useQuery({
    queryKey: documentKeys.list(caseId),
    queryFn: () => documentsApi.listByCaseId(caseId),
    enabled: !!caseId,
    select: (res) => res.data,
  });
}

export function useUploadDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documentsApi.upload(caseId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.list(caseId) });
      qc.invalidateQueries({ queryKey: documentKeys.folders() });
      toast.success("Document uploaded");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to upload document"),
  });
}

export function useRenameDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, name }: { documentId: string; name: string }) =>
      documentsApi.rename(caseId, documentId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.list(caseId) });
      toast.success("Document renamed");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to rename document"),
  });
}

export function useDeleteDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.delete(caseId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.list(caseId) });
      qc.invalidateQueries({ queryKey: documentKeys.folders() });
      toast.success("Document deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete document"),
  });
}
```

Note: `useUploadDocument` and `useDeleteDocument` now also invalidate `documentKeys.folders()` so the folder grid counts stay accurate after uploads/deletes from any location.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/use-documents.ts
git commit -m "feat(documents): add useFolders and useRenameDocument hooks"
```

---

### Task 5: Frontend — Rename UI in case detail Documents tab

**Files:**
- Modify: `apps/web/src/components/cases/documents/documents.tsx`

**Interfaces:**
- Consumes: `useRenameDocument(caseId)` from Task 4
- Produces: Updated `Documents` component with inline rename per file row

- [ ] **Step 1: Add rename state and handler to Documents component**

Replace the full content of `apps/web/src/components/cases/documents/documents.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import {
  Download,
  File,
  FileImage,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  useRenameDocument,
} from "@/hooks/use-documents";
import { documentsApi } from "@/services/documents";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types/documents";

interface DocumentsTabProps {
  caseId: string;
}

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf")
    return <FileText className="size-5 text-negative shrink-0" />;
  if (mimeType.startsWith("image/"))
    return <FileImage className="size-5 text-brand shrink-0" />;
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return <FileText className="size-5 text-positive shrink-0" />;
  return <File className="size-5 text-secondary shrink-0" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Documents({ caseId }: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<Document | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: documents = [], isLoading } = useDocuments(caseId);
  const upload = useUploadDocument(caseId);
  const deleteDoc = useDeleteDocument(caseId);
  const renameDoc = useRenameDocument(caseId);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await upload.mutateAsync(file);
  }

  async function handleOpen(doc: Document) {
    setOpeningId(doc.id);
    try {
      const { url } = await documentsApi.getUrl(caseId, doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open document");
    } finally {
      setOpeningId(null);
    }
  }

  function startRename(doc: Document) {
    setRenamingId(doc.id);
    setRenameValue(doc.name);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  async function commitRename(doc: Document) {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === doc.name) {
      cancelRename();
      return;
    }
    await renameDoc.mutateAsync({ documentId: doc.id, name: trimmed });
    setRenamingId(null);
    setRenameValue("");
  }

  async function handleDelete() {
    if (!toDelete) return;
    await deleteDoc.mutateAsync(toDelete.id);
    setToDelete(null);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="*/*"
      />

      <Section
        title={isLoading ? "Documents" : `Documents (${documents.length})`}
        action={
          <Button
            size="sm"
            onClick={handleUploadClick}
            disabled={upload.isPending}
          >
            <Plus className="size-3.5" />
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        }
        isEmpty={!isLoading && documents.length === 0}
        emptyLabel="No documents yet. Upload petitions, orders, affidavits, or any case file."
        onAdd={handleUploadClick}
        addLabel="Upload Document"
      >
        <div className="rounded border border-line bg-card overflow-hidden">
          {documents.map((doc, i) => (
            <div
              key={doc.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                i < documents.length - 1 && "border-b border-line",
              )}
            >
              {fileIcon(doc.mimeType)}

              <div className="flex-1 min-w-0 space-y-0.5">
                {renamingId === doc.id ? (
                  <input
                    autoFocus
                    className="text-sm font-medium text-dark w-full border border-brand rounded px-2 py-0.5 outline-none"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename(doc);
                      if (e.key === "Escape") cancelRename();
                    }}
                  />
                ) : (
                  <p className="text-sm font-medium text-dark truncate">{doc.name}</p>
                )}
                <p className="text-xs text-secondary">
                  {formatBytes(doc.size)} ·{" "}
                  {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {renamingId === doc.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void commitRename(doc)}
                      disabled={renameDoc.isPending}
                      className="p-1.5 rounded bg-positive-muted text-positive hover:opacity-80 transition-opacity disabled:opacity-50"
                      aria-label="Save rename"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                      aria-label="Cancel rename"
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startRename(doc)}
                      className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                      aria-label="Rename"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleOpen(doc)}
                      disabled={openingId === doc.id}
                      className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors disabled:opacity-50"
                      aria-label="Download"
                    >
                      <Download className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(doc)}
                      className="p-1.5 rounded bg-negative-muted text-negative hover:opacity-80 transition-opacity"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <ConfirmDeleteModal
        open={!!toDelete}
        title="document"
        entityName={toDelete?.name ?? ""}
        isPending={deleteDoc.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/cases/documents/documents.tsx
git commit -m "feat(documents): add inline rename to case detail Documents tab"
```

---

### Task 6: Frontend — Documents module page and folder components

**Files:**
- Create: `apps/web/src/app/(protected)/documents/page.tsx`
- Create: `apps/web/src/components/documents/folder-grid.tsx`
- Create: `apps/web/src/components/documents/folder-card.tsx`

**Interfaces:**
- Consumes: `useFolders()` from Task 4, `DocumentFolder` from Task 3
- Produces: `/documents` page rendering `FolderGrid` or `DocumentFileList` based on `?caseId` param

- [ ] **Step 1: Create the folder card component**

Create `apps/web/src/components/documents/folder-card.tsx`:

```tsx
"use client";

import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentFolder } from "@/types/documents";

interface Props {
  folder: DocumentFolder;
  onClick: (folder: DocumentFolder) => void;
}

export function FolderCard({ folder, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(folder)}
      className={cn(
        "w-full text-left p-4 rounded-lg border border-line bg-card",
        "hover:border-brand/40 hover:bg-brand/5 transition-colors",
        "flex flex-col gap-2",
      )}
    >
      <Folder className="size-8 text-brand/70" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-dark truncate">{folder.title}</p>
        <p className="text-xs text-secondary mt-0.5">
          {folder.documentCount === 0
            ? "No documents"
            : folder.documentCount === 1
              ? "1 document"
              : `${folder.documentCount} documents`}
        </p>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Create the folder grid component**

Create `apps/web/src/components/documents/folder-grid.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { FolderCard } from "@/components/documents/folder-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useFolders } from "@/hooks/use-documents";
import type { DocumentFolder } from "@/types/documents";

export function FolderGrid() {
  const router = useRouter();
  const { data: folders = [], isLoading } = useFolders();

  function handleFolderClick(folder: DocumentFolder) {
    router.push(`/documents?caseId=${folder.caseId}`);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-line bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <EmptyState
        text="No cases yet. Create a case to start uploading documents."
        className="py-16"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {folders.map((folder) => (
        <FolderCard key={folder.caseId} folder={folder} onClick={handleFolderClick} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create the page**

Create `apps/web/src/app/(protected)/documents/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { FolderGrid } from "@/components/documents/folder-grid";
import { DocumentFileList } from "@/components/documents/document-file-list";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useFolders } from "@/hooks/use-documents";

interface Props {
  searchParams: Promise<{ caseId?: string }>;
}

function DocumentsPageInner({ caseId }: { caseId: string | undefined }) {
  const { data: folders = [] } = useFolders();
  const activeFolder = caseId ? folders.find((f) => f.caseId === caseId) : undefined;

  usePageTitle({
    title: activeFolder ? activeFolder.title : "Documents",
  });

  if (caseId) {
    return <DocumentFileList caseId={caseId} caseTitle={activeFolder?.title ?? "Documents"} />;
  }

  return <FolderGrid />;
}

export default function Page({ searchParams }: Props) {
  const { caseId } = use(searchParams);
  return <DocumentsPageInner caseId={caseId} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(protected)/documents/ apps/web/src/components/documents/folder-grid.tsx apps/web/src/components/documents/folder-card.tsx
git commit -m "feat(documents): add documents module folder grid page"
```

---

### Task 7: Frontend — Documents module file list view

**Files:**
- Create: `apps/web/src/components/documents/document-file-list.tsx`

**Interfaces:**
- Consumes: `useDocuments(caseId)`, `useUploadDocument(caseId)`, `useRenameDocument(caseId)`, `useDeleteDocument(caseId)`, `documentsApi.getUrl()` from Tasks 3 & 4
- Produces: `DocumentFileList` component — file list with upload, open, rename, delete

- [ ] **Step 1: Create the document file list component**

Create `apps/web/src/components/documents/document-file-list.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  File,
  FileImage,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  useRenameDocument,
} from "@/hooks/use-documents";
import { documentsApi } from "@/services/documents";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Document } from "@/types/documents";

interface Props {
  caseId: string;
  caseTitle: string;
}

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf")
    return <FileText className="size-5 text-negative shrink-0" />;
  if (mimeType.startsWith("image/"))
    return <FileImage className="size-5 text-brand shrink-0" />;
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return <FileText className="size-5 text-positive shrink-0" />;
  return <File className="size-5 text-secondary shrink-0" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentFileList({ caseId, caseTitle }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<Document | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: documents = [], isLoading } = useDocuments(caseId);
  const upload = useUploadDocument(caseId);
  const deleteDoc = useDeleteDocument(caseId);
  const renameDoc = useRenameDocument(caseId);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await upload.mutateAsync(file);
  }

  async function handleOpen(doc: Document) {
    setOpeningId(doc.id);
    try {
      const { url } = await documentsApi.getUrl(caseId, doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open document");
    } finally {
      setOpeningId(null);
    }
  }

  function startRename(doc: Document) {
    setRenamingId(doc.id);
    setRenameValue(doc.name);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  async function commitRename(doc: Document) {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === doc.name) {
      cancelRename();
      return;
    }
    await renameDoc.mutateAsync({ documentId: doc.id, name: trimmed });
    setRenamingId(null);
    setRenameValue("");
  }

  async function handleDelete() {
    if (!toDelete) return;
    await deleteDoc.mutateAsync(toDelete.id);
    setToDelete(null);
  }

  const subtitle = isLoading
    ? ""
    : documents.length === 0
      ? "No documents"
      : documents.length === 1
        ? "1 document"
        : `${documents.length} documents`;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="*/*"
      />

      <div className="space-y-4">
        {/* Back nav */}
        <button
          type="button"
          onClick={() => router.push("/documents")}
          className="flex items-center gap-1.5 text-sm text-brand font-medium hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="size-4" />
          Documents
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-dark">{caseTitle}</h2>
            {!isLoading && (
              <p className="text-xs text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
          <Button size="sm" onClick={handleUploadClick} disabled={upload.isPending}>
            <Plus className="size-3.5" />
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>

        {/* File list */}
        {!isLoading && documents.length === 0 ? (
          <EmptyState
            text="No documents yet. Upload petitions, orders, affidavits, or any case file."
            action={{ label: "Upload Document", onClick: handleUploadClick }}
            className="py-12"
          />
        ) : (
          <div className="rounded border border-line bg-card overflow-hidden">
            {documents.map((doc, i) => (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i < documents.length - 1 && "border-b border-line",
                )}
              >
                {fileIcon(doc.mimeType)}

                <div className="flex-1 min-w-0 space-y-0.5">
                  {renamingId === doc.id ? (
                    <input
                      autoFocus
                      className="text-sm font-medium text-dark w-full border border-brand rounded px-2 py-0.5 outline-none"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void commitRename(doc);
                        if (e.key === "Escape") cancelRename();
                      }}
                    />
                  ) : (
                    <p className="text-sm font-medium text-dark truncate">{doc.name}</p>
                  )}
                  <p className="text-xs text-secondary">
                    {formatBytes(doc.size)} ·{" "}
                    {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {renamingId === doc.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void commitRename(doc)}
                        disabled={renameDoc.isPending}
                        className="p-1.5 rounded bg-positive-muted text-positive hover:opacity-80 transition-opacity disabled:opacity-50"
                        aria-label="Save rename"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                        aria-label="Cancel rename"
                      >
                        <X className="size-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startRename(doc)}
                        className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                        aria-label="Rename"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleOpen(doc)}
                        disabled={openingId === doc.id}
                        className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors disabled:opacity-50"
                        aria-label="Open"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(doc)}
                        className="p-1.5 rounded bg-negative-muted text-negative hover:opacity-80 transition-opacity"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!toDelete}
        title="document"
        entityName={toDelete?.name ?? ""}
        isPending={deleteDoc.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/documents/document-file-list.tsx
git commit -m "feat(documents): add document file list view for documents module"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `/documents` folder grid (Task 6)
- ✅ All cases shown including empty ones (FolderGrid shows all folders from `/documents/folders` which returns all org cases)
- ✅ "No documents" on empty folder cards (Task 6, FolderCard)
- ✅ Click folder → navigate to `/documents?caseId=xxx` (Task 6, FolderGrid)
- ✅ File list: case name header, Upload, Open, Delete, Rename (Task 7)
- ✅ `← Documents` back button (Task 7)
- ✅ Rename in case detail Documents tab (Task 5)
- ✅ `PATCH /cases/:caseId/documents/:documentId` (Task 1)
- ✅ `GET /documents/folders` (Task 2)
- ✅ R2 storage structure unchanged — rename is DB-only (Task 1, repository uses updateMany)
- ✅ orgId always from JWT — every repository method scopes by orgId
- ✅ updateMany used for rename (not update) — orgId enforced at DB level
- ✅ By Client deferred — not implemented

**Type consistency check:**
- `useRenameDocument` mutationFn takes `{ documentId: string; name: string }` — matches usage in both Documents tab (Task 5) and DocumentFileList (Task 7) ✅
- `DocumentFolder` interface: `{ caseId, title, documentCount }` — matches repository output shape ✅
- `documentKeys.folders()` used consistently in useFolders, useUploadDocument, useDeleteDocument ✅
- `FolderCard` `onClick` receives `DocumentFolder` — matches FolderGrid call site ✅
- `DocumentFileList` props: `{ caseId: string, caseTitle: string }` — matches page.tsx usage ✅
