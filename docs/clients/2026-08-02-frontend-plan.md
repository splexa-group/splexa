# Clients Module Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal, lookup-oriented Clients directory (`/clients` list + `/clients/[clientId]` detail) so the already-complete backend `clients` module has a working frontend surface.

**Architecture:** Frontend-only (one small, contained backend addition for a missing filter). Follows the existing layered structure exactly — flat `types/services/hooks`, nested `components/clients/`, `constants/client-tabs.ts` — and reuses existing components/patterns verbatim (`DataTable`, `FiltersBar`, `Modal`, `ConfirmDeleteModal`, `PageLayout`, `PageFooter`, `TabsNav`, the existing `ClientDetails` form fragment). No new design-system components, no new colors/spacing — every visual decision copies an existing screen (`CasesTable`/`CasesView` for the list, `CaseDetailView`/`CaseDetailTabs` for the detail page).

**Tech Stack:** Next.js App Router, TypeScript strict, React Query v5, react-hook-form, Zod (backend only), Tailwind v4 (existing tokens only), Fastify + Prisma (one small backend addition).

## Global Constraints

- `orgId` from `req.user.orgId` (JWT) only — the one backend change touches an already `orgId`-scoped query; do not weaken that scoping.
- No `prisma.*` outside `*.repository.ts`; no raw JSON Schema, Zod only, types from `z.infer<>`.
- No magic values — reuse `CLIENT_TYPE_OPTIONS` / `RELATION_TYPE_OPTIONS` from `utils/options.ts`, don't hardcode option lists.
- No `any`, no `!`, no `@ts-ignore`.
- Frontend file naming: kebab-case. No `plugin.ts` files — routes are the Fastify plugin directly (this codebase already follows this; the one backend task only touches existing files, no new module).
- This repo has **no frontend test suite** (`apps/web` has zero `.test.ts(x)` files) — frontend task verification is `pnpm --filter web typecheck`, `pnpm --filter web lint`, and `pnpm --filter web build`, not unit tests. Backend changes use Vitest as usual.
- Match existing visual patterns exactly — every className in this plan is copied from an existing file, not invented.

---

### Task 1: Backend — add `clientId` filter to the cases list endpoint

**Files:**
- Modify: `apps/server/src/modules/cases/cases.schema.ts`
- Modify: `apps/server/src/modules/cases/cases.repository.ts`
- Modify: `apps/web/src/types/cases.ts`

**Interfaces:**
- Produces: `ListCasesQuery.clientId?: string` (backend), `CaseFilters.clientId?: string` (frontend) — Task 6's `ClientCasesTab` calls `useCases({ clientId })` relying on this.

- [ ] **Step 1: Add `clientId` to the list query schema**

In `apps/server/src/modules/cases/cases.schema.ts`, find `listCasesQuerySchema`:

```ts
export const listCasesQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.enum(CaseStatus).optional(),
    caseType: z.enum(CaseType).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();
```

Change it to:

```ts
export const listCasesQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.enum(CaseStatus).optional(),
    caseType: z.enum(CaseType).optional(),
    clientId: z.uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();
```

- [ ] **Step 2: Add the `clientId` where-clause in the repository**

In `apps/server/src/modules/cases/cases.repository.ts`, find the `list()` method's `where` construction:

```ts
    const where: Prisma.CaseWhereInput = {
      orgId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(caseType ? { caseType } : {}),
      ...(search
        ? {
```

Add `clientId` to the destructured query fields and the where object:

```ts
  async list(orgId: string, query: ListCasesQuery) {
    const { search, status, caseType, clientId, page, limit } = query;
    const where: Prisma.CaseWhereInput = {
      orgId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(caseType ? { caseType } : {}),
      ...(clientId ? { clientId } : {}),
      ...(search
        ? {
```

(Only the destructuring line and the new spread line change — everything else in `list()` stays as-is.)

- [ ] **Step 3: Add `clientId` to the frontend `CaseFilters` type**

In `apps/web/src/types/cases.ts`, find:

```ts
export interface CaseFilters {
  search?: string;
  status?: CaseStatus;
  caseType?: CaseType;
  page?: number;
  limit?: number;
}
```

Change to:

```ts
export interface CaseFilters {
  search?: string;
  status?: CaseStatus;
  caseType?: CaseType;
  clientId?: string;
  page?: number;
  limit?: number;
}
```

- [ ] **Step 4: Verify — no new test needed, run existing suites**

This mirrors how `status`/`caseType` are already handled — neither has a dedicated repository-level test (only `cases.service.test.ts` and `cases.helper.test.ts` exist, both testing above the repository layer), and the `where` object still starts with `orgId` so cross-org isolation is untouched. Run:

```bash
pnpm --filter server typecheck
pnpm --filter server test
pnpm --filter web typecheck
```

Expected: all pass (114/114 backend tests, clean typechecks on both).

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/modules/cases/cases.schema.ts apps/server/src/modules/cases/cases.repository.ts apps/web/src/types/cases.ts
git commit -m "feat(server): add clientId filter to cases list endpoint"
```

---

### Task 2: Frontend — complete the clients API surface (types, service, hooks)

**Files:**
- Modify: `apps/web/src/types/clients.ts`
- Modify: `apps/web/src/services/clients.ts`
- Modify: `apps/web/src/hooks/use-clients.ts`

**Interfaces:**
- Consumes: `Client`, `PaginatedResult` from `@splexa-group/shared/models`; `GET`/`POST`/`PATCH`/`DELETE` from `@/api/http`.
- Produces: `ClientFilters`, `clientsApi.list/getById/delete`, `clientKeys`, `useClients(filters)`, `useClient(id)`, `useCreateClient()`, `useDeleteClient()` — Tasks 4 and 5 depend on these exact names.

- [ ] **Step 1: Add `ClientFilters` to types**

In `apps/web/src/types/clients.ts`, add this interface (place it after the `Client` re-export at the top, before `CreateClientInput`):

```ts
export interface ClientFilters {
  search?: string;
  type?: ClientType;
  page?: number;
  limit?: number;
}
```

- [ ] **Step 2: Add `list`, `getById`, `delete` to the clients service**

In `apps/web/src/services/clients.ts`, the current file is:

```ts
import { GET, PATCH, POST } from "@/api/http";
import type { Client } from "@splexa-group/shared/models";
import type { ClientListResponse, CreateClientInput, UpdateClientInput } from "@/types/clients";

export const clientsApi = {
  search: (query: string) =>
    GET<{ clients: ClientListResponse["data"]; total: number; page: number; limit: number }>(
      "/clients",
      { params: { search: query, limit: 10 } },
    ).then((r) => ({ data: r.clients, total: r.total, page: r.page, limit: r.limit })),

  create: (data: CreateClientInput) =>
    POST<{ client: Client }>("/clients", data).then((r) => r.client),

  update: (id: string, data: UpdateClientInput) =>
    PATCH<{ client: Client }>(`/clients/${id}`, data).then((r) => r.client),
};
```

Replace it with:

```ts
import { DELETE, GET, PATCH, POST } from "@/api/http";
import type { Client } from "@splexa-group/shared/models";
import type {
  ClientFilters,
  ClientListResponse,
  CreateClientInput,
  UpdateClientInput,
} from "@/types/clients";

export const clientsApi = {
  search: (query: string) =>
    GET<{ clients: ClientListResponse["data"]; total: number; page: number; limit: number }>(
      "/clients",
      { params: { search: query, limit: 10 } },
    ).then((r) => ({ data: r.clients, total: r.total, page: r.page, limit: r.limit })),

  list: (filters: ClientFilters = {}) =>
    GET<{ clients: Client[]; total: number; page: number; limit: number }>("/clients", {
      params: filters,
    }).then((r) => ({ data: r.clients, total: r.total, page: r.page, limit: r.limit })),

  getById: (id: string) => GET<{ client: Client }>(`/clients/${id}`).then((r) => r.client),

  create: (data: CreateClientInput) =>
    POST<{ client: Client }>("/clients", data).then((r) => r.client),

  update: (id: string, data: UpdateClientInput) =>
    PATCH<{ client: Client }>(`/clients/${id}`, data).then((r) => r.client),

  delete: (id: string) => DELETE<void>(`/clients/${id}`),
};
```

- [ ] **Step 3: Add `clientKeys`, `useClients`, `useClient`, `useCreateClient`, `useDeleteClient`**

The current `apps/web/src/hooks/use-clients.ts` is:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientsApi } from "@/services/clients";
import { casesApi } from "@/services/cases";
import { caseKeys } from "@/hooks/use-cases";
import type { CreateClientInput, UpdateClientInput } from "@/types/clients";

export function useClientSearch(query: string) {
  return useQuery({
    queryKey: ["clients", "search", query],
    queryFn: () => clientsApi.search(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useAddClientToCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientInput) => casesApi.addClient(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Client added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add client"),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      caseId?: string;
      data: UpdateClientInput;
    }) => clientsApi.update(id, data),
    onSuccess: (_, { caseId }) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      if (caseId) {
        qc.invalidateQueries({ queryKey: ["cases", "detail", caseId] });
      }
      toast.success("Saved");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save"),
  });
}
```

Replace it with (adds `clientKeys` at the top, three new hooks at the bottom, and updates `useUpdateClient`'s invalidation to use the new key constant — same behavior, just named consistently):

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { clientsApi } from "@/services/clients";
import { casesApi } from "@/services/cases";
import { caseKeys } from "@/hooks/use-cases";
import type { ClientFilters, CreateClientInput, UpdateClientInput } from "@/types/clients";

export const clientKeys = {
  all: ["clients"] as const,
  list: (f: ClientFilters) => ["clients", "list", f] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

export function useClientSearch(query: string) {
  return useQuery({
    queryKey: ["clients", "search", query],
    queryFn: () => clientsApi.search(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => clientsApi.list(filters),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientInput) => clientsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      toast.success("Client created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create client"),
  });
}

export function useAddClientToCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientInput) => casesApi.addClient(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(caseId) });
      toast.success("Client added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add client"),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      caseId?: string;
      data: UpdateClientInput;
    }) => clientsApi.update(id, data),
    onSuccess: (_, { caseId }) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      if (caseId) {
        qc.invalidateQueries({ queryKey: ["cases", "detail", caseId] });
      }
      toast.success("Saved");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save"),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      toast.success("Client deleted");
      router.push("/clients");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete client"),
  });
}
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter web typecheck
pnpm --filter web lint
```

Expected: both clean. (No UI consumes these yet — this task is API-surface only.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/types/clients.ts apps/web/src/services/clients.ts apps/web/src/hooks/use-clients.ts
git commit -m "feat(web): complete clients API surface — list, getById, delete, create hooks"
```

---

### Task 3: Frontend — client detail tab config

**Files:**
- Create: `apps/web/src/constants/client-tabs.ts`

**Interfaces:**
- Consumes: `TabConfig` from `@/components/layout/tabs-nav`.
- Produces: `ClientTabs` enum, `CLIENT_TAB_CONFIG` — Task 5 depends on both.

- [ ] **Step 1: Create the tab config**

```ts
import type { TabConfig } from "@/components/layout/tabs-nav";

export enum ClientTabs {
  INFO = "info",
  CASES = "cases",
}

export const CLIENT_TAB_CONFIG: TabConfig[] = [
  { id: ClientTabs.INFO, label: "Info" },
  { id: ClientTabs.CASES, label: "Cases" },
];
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter web typecheck
```

Expected: clean (this file has no consumers yet, so this just confirms it compiles standalone).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/constants/client-tabs.ts
git commit -m "feat(web): add client detail tab config"
```

---

### Task 4: Frontend — Clients list page

**Files:**
- Create: `apps/web/src/app/(protected)/clients/page.tsx`
- Create: `apps/web/src/components/clients/clients-view.tsx`
- Create: `apps/web/src/components/clients/clients-table.tsx`
- Create: `apps/web/src/components/modals/create-client.tsx`

**Interfaces:**
- Consumes: `useClients`, `useCreateClient` (Task 2); `CLIENT_TYPE_OPTIONS`, `RELATION_TYPE_OPTIONS` (existing `utils/options.ts`); `CreateClientInput`, `UpdateClientInput` (existing `types/clients.ts`); `ClientDetails` form fragment (existing, unchanged); `DataTable`, `FiltersBar`, `Search`, `Select`, `Modal`, `PageLayout`, `usePageTitle`, `useModalState` (all existing, unchanged).
- Produces: the `/clients` route. Task 7 links to it.

- [ ] **Step 1: Create the list page route**

`apps/web/src/app/(protected)/clients/page.tsx`:

```tsx
import { ClientsView } from "@/components/clients/clients-view";

export default function Page() {
  return <ClientsView />;
}
```

- [ ] **Step 2: Create the create-client modal**

`apps/web/src/components/modals/create-client.tsx` — wraps the existing `ClientDetails` form fragment instead of hand-rolled fields, since `ClientDetails` already renders every field this form needs. `ClientDetails` is typed against `UpdateClientInput` (all fields optional, including `type?: ClientType`) — mirroring the exact pattern `case-detail-view.tsx`'s `handleSave` already uses for creating a client via this same form fragment: form the optional-everywhere shape, then construct the strict `CreateClientInput` (where `type` is required) at submit time with a validation toast, rather than fighting the type mismatch between `CreateClientInput` and `UpdateClientInput`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Modal } from "@/components/shared/modal";
import { ClientDetails } from "@/components/cases/client/client-details";
import { useCreateClient } from "@/hooks/use-clients";
import type { CreateClientInput, UpdateClientInput } from "@/types/clients";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateClientModal({ open, onClose }: Props) {
  const router = useRouter();
  const createClient = useCreateClient();

  const form = useForm<UpdateClientInput>({
    defaultValues: { fullName: "", phone: "", type: undefined },
  });
  const { handleSubmit, reset, control } = form;

  const fullName = useWatch({ control, name: "fullName" });
  const phone = useWatch({ control, name: "phone" });
  const type = useWatch({ control, name: "type" });

  async function onSubmit(data: UpdateClientInput) {
    if (!data.type) {
      toast.error("Client type is required");
      return;
    }

    const input: CreateClientInput = {
      fullName: data.fullName ?? "",
      phone: data.phone ?? "",
      type: data.type,
      email: data.email,
      address: data.address,
      companyName: data.companyName,
      notes: data.notes,
      preferredLanguage: data.preferredLanguage,
      relationType: data.relationType,
      relationName: data.relationName,
      dateOfBirth: data.dateOfBirth,
      occupation: data.occupation,
    };

    const result = await createClient.mutateAsync(input);
    reset();
    onClose();
    router.push(`/clients/${result.id}`);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Client"
      size="lg"
      onSave={handleSubmit(onSubmit)}
      saveLabel="Add Client"
      saveLoading={createClient.isPending}
      saveDisabled={!fullName?.trim() || !phone?.trim() || !type}
    >
      <div className="p-5">
        <FormProvider {...form}>
          <ClientDetails />
        </FormProvider>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: Create the clients table**

`apps/web/src/components/clients/clients-table.tsx` — structurally a near-verbatim copy of `cases-table.tsx`, with client fields/columns instead of case fields, no priority border, no status badge, and the "Clients" link removed here (it belongs on `cases-table.tsx`, added in Task 7):

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientType } from "@splexa-group/shared/enums";

import { DataTable } from "@/components/ui/data-table";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Search } from "@/components/ui/form/search";
import { Select } from "@/components/ui/form/select";
import { useClients } from "@/hooks/use-clients";
import { ClientFilters } from "@/types/clients";
import { CLIENT_TYPE_OPTIONS } from "@/utils/options";

const PAGE_SIZE = 30;

function isClientType(v: string): v is ClientType {
  return (Object.values(ClientType) as string[]).includes(v);
}

const COLUMNS = ["Name", "Type", "Phone", "Email"];

const COLUMN_WIDTHS = "1fr 140px 180px 1fr";

export function ClientsTable({ onAdd }: { onAdd?: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const filters: ClientFilters = {
    search: search || undefined,
    type: isClientType(type) ? type : undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data } = useClients(filters);
  const clients = data?.data ?? [];

  const rows = clients.map((c) => ({
    key: c.id,
    onClick: () => router.push(`/clients/${c.id}`),
    cells: [
      <p key="name" className="text-sm text-body truncate pr-4">
        {c.fullName}
      </p>,

      <p key="type" className="text-sm text-body pr-4 truncate">
        {c.type}
      </p>,

      <p key="phone" className="text-sm text-body pr-4 truncate">
        {c.phone}
      </p>,

      <p key="email" className="text-sm text-body pr-4 truncate">
        {c.email ?? "—"}
      </p>,
    ],
  }));

  return (
    <div className="flex flex-col h-full">
      <FiltersBar columns="1fr 240px">
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          placeholder="Search clients, phone, email, company..."
        />
        <Select
          options={CLIENT_TYPE_OPTIONS}
          value={type}
          onChange={setType}
          onClear={() => {
            setType("");
            setPage(1);
          }}
          placeholder="Filter by type..."
        />
      </FiltersBar>

      <DataTable
        columns={COLUMNS}
        columnWidths={COLUMN_WIDTHS}
        rows={rows}
        emptyStateText="No clients found."
        emptyStateAction={onAdd ? { label: "Add new client", onClick: onAdd } : undefined}
        page={page}
        pageSize={PAGE_SIZE}
        totalRows={data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
```

Unlike `CasesTable`, there is no `usePageLoading` call here — a standalone list page doesn't need the case-detail-style loading skeleton, so `isLoading` isn't destructured at all (avoids an unused-variable lint error).

- [ ] **Step 4: Create the clients view (page shell)**

`apps/web/src/components/clients/clients-view.tsx` — mirrors `cases-view.tsx`:

```tsx
"use client";

import { ClientsTable } from "@/components/clients/clients-table";
import { PageLayout } from "@/components/layout/page-layout";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { CreateClientModal } from "@/components/modals/create-client";
import { useModalState } from "@/hooks/use-modal-state";

export function ClientsView() {
  const modal = useModalState();

  usePageTitle({
    title: "Clients",
    action: { label: "Add Client", onClick: modal.open },
  });

  return (
    <PageLayout maxWidth="large" padded={false} className="h-full">
      <ClientsTable onAdd={modal.open} />
      <CreateClientModal open={modal.isOpen} onClose={modal.close} />
    </PageLayout>
  );
}
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
```

Expected: all clean; build output lists a new `/clients` static route.

- [ ] **Step 6: Manual smoke check**

Start the dev server (`pnpm --filter web dev`), log in, navigate to `http://localhost:3000/clients` directly. Confirm: the page loads, search box and type filter render, "Add Client" opens the modal with the full `ClientDetails` form, and creating a client with a name/phone/type redirects to its (not-yet-built) detail page URL — a 404 here is expected until Task 5 lands; that confirms the create flow and routing are wired correctly.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(protected\)/clients/page.tsx apps/web/src/components/clients/clients-view.tsx apps/web/src/components/clients/clients-table.tsx apps/web/src/components/modals/create-client.tsx
git commit -m "feat(web): add clients list page"
```

---

### Task 5: Frontend — Client detail page (Info tab, Save, Delete)

**Files:**
- Create: `apps/web/src/app/(protected)/clients/[clientId]/page.tsx`
- Create: `apps/web/src/components/clients/client-detail-tabs.tsx`
- Create: `apps/web/src/components/clients/client-detail-view.tsx`

**Interfaces:**
- Consumes: `useClient`, `useUpdateClient`, `useDeleteClient` (Task 2); `ClientTabs`, `CLIENT_TAB_CONFIG` (Task 3); `useActiveTab` (existing `hooks/use-active-tab.ts`); `mapClientToFormValues` (existing `mappers/case-form.ts` — already typed to accept a full `Client`, confirmed against `CaseDetail.client: Client | null`); `ClientDetails` form fragment; `TabsNav`, `PageLayout`, `PageFooter`, `ConfirmDeleteModal`, `Button`, `usePageLoading`, `usePageTitle` (all existing).
- Produces: the `/clients/[clientId]` route with a working Info tab. Task 6 adds the Cases tab into `TabContent` here.

- [ ] **Step 1: Create the detail page route**

`apps/web/src/app/(protected)/clients/[clientId]/page.tsx`:

```tsx
import { use } from "react";
import { ClientDetailView } from "@/components/clients/client-detail-view";

export default function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  return <ClientDetailView clientId={clientId} />;
}
```

- [ ] **Step 2: Create the tabs bar**

`apps/web/src/components/clients/client-detail-tabs.tsx` — mirrors `case-detail-tabs.tsx`, no sub-tabs:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { useActiveTab, useActiveSubTab } from "@/hooks/use-active-tab";
import { CLIENT_TAB_CONFIG, ClientTabs } from "@/constants/client-tabs";

interface Props {
  clientId: string;
}

export function ClientDetailTabs({ clientId }: Props) {
  const router = useRouter();
  const activeTab = useActiveTab<ClientTabs>(CLIENT_TAB_CONFIG, ClientTabs.INFO);
  const activeSubTab = useActiveSubTab(activeTab, CLIENT_TAB_CONFIG);

  function navigateTo(tabId: string) {
    router.push(`/clients/${clientId}?tab=${tabId}`);
  }

  return (
    <TabsNav
      tabs={CLIENT_TAB_CONFIG}
      activeTab={activeTab}
      activeSubTab={activeSubTab}
      onNavigate={navigateTo}
    />
  );
}
```

- [ ] **Step 3: Create the detail view**

`apps/web/src/components/clients/client-detail-view.tsx` — mirrors `case-detail-view.tsx`, simplified (no sub-tabs, no create-vs-update branching since the client already exists). The Cases tab branch is added in Task 6 — for this task, render `null` for `ClientTabs.CASES` as a placeholder that Task 6 replaces:

```tsx
"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { ClientDetails } from "@/components/cases/client/client-details";
import { usePageLoading } from "@/components/layout/loader";
import { PageFooter } from "@/components/layout/page-footer";
import { PageLayout } from "@/components/layout/page-layout";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { CLIENT_TAB_CONFIG, ClientTabs } from "@/constants/client-tabs";
import { useActiveTab } from "@/hooks/use-active-tab";
import { useClient, useDeleteClient, useUpdateClient } from "@/hooks/use-clients";
import { mapClientToFormValues } from "@/mappers/case-form";
import type { UpdateClientInput } from "@/types/clients";

import { ClientDetailTabs } from "./client-detail-tabs";

export function ClientDetailView({ clientId }: { clientId: string }) {
  const activeTab = useActiveTab<ClientTabs>(CLIENT_TAB_CONFIG, ClientTabs.INFO);
  const [showDelete, setShowDelete] = useState(false);

  const { data: client, isLoading } = useClient(clientId);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  usePageTitle({
    title: "Clients",
    resourceTitle: client?.fullName,
  });

  const form = useForm<UpdateClientInput>({
    values: client ? mapClientToFormValues(client) : undefined,
  });

  usePageLoading(isLoading);

  const handleSave = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    await updateClient.mutateAsync({ id: clientId, data: form.getValues() });
  };

  const handleDelete = async () => {
    await deleteClient.mutateAsync(clientId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ClientDetailTabs clientId={clientId} />

      <div className="flex-1 overflow-y-auto bg-page">
        <PageLayout maxWidth="medium" className="space-y-6">
          {activeTab === ClientTabs.INFO && (
            <FormProvider {...form}>
              <ClientDetails />
            </FormProvider>
          )}
          {activeTab === ClientTabs.CASES && null}
        </PageLayout>
      </div>

      <PageFooter
        right={
          <>
            <Button variant="negative" onClick={() => setShowDelete(true)}>
              Delete Client
            </Button>
            {activeTab === ClientTabs.INFO && (
              <Button loading={updateClient.isPending} onClick={handleSave}>
                Save Changes
              </Button>
            )}
          </>
        }
      />

      <ConfirmDeleteModal
        open={showDelete}
        title="client"
        entityName={client?.fullName ?? ""}
        isPending={deleteClient.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
```

Expected: all clean; build output lists the new dynamic `/clients/[clientId]` route.

- [ ] **Step 5: Manual smoke check**

From the `/clients` list (Task 4), click a client row (or the one created during Task 4's smoke check). Confirm: Info tab loads with the client's data pre-filled, editing a field and clicking "Save Changes" persists (toast "Saved"), "Delete Client" opens the confirm modal and deleting redirects back to `/clients`. Clicking the "Cases" tab shows nothing yet — expected until Task 6.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(protected\)/clients/\[clientId\]/page.tsx apps/web/src/components/clients/client-detail-tabs.tsx apps/web/src/components/clients/client-detail-view.tsx
git commit -m "feat(web): add client detail page — Info tab, save, delete"
```

---

### Task 6: Frontend — Cases tab on client detail

**Files:**
- Create: `apps/web/src/components/clients/client-cases-tab.tsx`
- Modify: `apps/web/src/components/clients/client-detail-view.tsx`

**Interfaces:**
- Consumes: `useCases` (existing `hooks/use-cases.ts`, now accepting `clientId` per Task 1); `CaseSummary` (existing `types/cases.ts`); `EmptyState` (existing `components/ui/empty-state.tsx`).

- [ ] **Step 1: Create the Cases tab component**

`apps/web/src/components/clients/client-cases-tab.tsx` — reuses the same row treatment as `cases-table.tsx`'s cells (title, number, court, status, next hearing), without the `FiltersBar`/pagination chrome, since a single client's case list is short:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { statusBadgeClass } from "@/components/cases/case-styles";
import { EmptyState } from "@/components/ui/empty-state";
import { useCases } from "@/hooks/use-cases";
import { formatHearingDate } from "@/utils/format-hearing-date";
import { cn } from "@/utils/tailwind";

export function ClientCasesTab({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { data, isLoading } = useCases({ clientId });
  const cases = data?.data ?? [];

  if (!isLoading && cases.length === 0) {
    return <EmptyState text="No cases for this client yet." />;
  }

  return (
    <div className="bg-card border border-line rounded-lg overflow-hidden divide-y divide-line">
      {cases.map((c) => (
        <div
          key={c.id}
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/cases/${c.id}`)}
          onKeyDown={(e) => e.key === "Enter" && router.push(`/cases/${c.id}`)}
          className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="min-w-0">
            <p className="text-sm text-body truncate">{c.title}</p>
            <p className="text-xs text-secondary truncate">{c.courtName ?? "No court"}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-sm",
                statusBadgeClass(c.status),
              )}
            >
              {c.status}
            </span>
            <span className="text-sm text-body">{formatHearingDate(c.nextHearingDate)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the detail view**

In `apps/web/src/components/clients/client-detail-view.tsx`, add the import:

```ts
import { ClientCasesTab } from "@/components/clients/client-cases-tab";
```

Replace:

```tsx
          {activeTab === ClientTabs.CASES && null}
```

with:

```tsx
          {activeTab === ClientTabs.CASES && <ClientCasesTab clientId={clientId} />}
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
```

Expected: all clean.

- [ ] **Step 4: Manual smoke check**

On a client detail page for a client linked to at least one case (find one via the Cases page, open its client, or add a client to an existing case first), click the "Cases" tab. Confirm the linked case(s) render with title/court/status/next-hearing, and clicking one navigates to that case's detail page. On a client with zero cases, confirm the empty state renders.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/clients/client-cases-tab.tsx apps/web/src/components/clients/client-detail-view.tsx
git commit -m "feat(web): add Cases tab to client detail page"
```

---

### Task 7: Frontend — entry point link from the Cases page

**Files:**
- Modify: `apps/web/src/components/cases/cases-table.tsx`

**Interfaces:**
- Consumes: `Link` from `next/link` (new import in this file).

- [ ] **Step 1: Add the "Clients" link to the Cases page's filter row**

In `apps/web/src/components/cases/cases-table.tsx`, add the import:

```ts
import Link from "next/link";
```

Change the `FiltersBar` block from:

```tsx
      <FiltersBar columns="1fr 300px 300px">
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          placeholder="Search cases, clients, case numbers..."
        />
        <Select
          options={CASE_STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          onClear={() => {
            setStatus("");
            setPage(1);
          }}
          placeholder="Filter by status..."
        />
        <Select
          options={CASE_TYPE_OPTIONS}
          value={caseType}
          onChange={setCaseType}
          onClear={() => {
            setCaseType("");
            setPage(1);
          }}
          placeholder="Filter by case type..."
        />
      </FiltersBar>
```

to:

```tsx
      <FiltersBar columns="1fr 300px 300px auto">
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          placeholder="Search cases, clients, case numbers..."
        />
        <Select
          options={CASE_STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          onClear={() => {
            setStatus("");
            setPage(1);
          }}
          placeholder="Filter by status..."
        />
        <Select
          options={CASE_TYPE_OPTIONS}
          value={caseType}
          onChange={setCaseType}
          onClear={() => {
            setCaseType("");
            setPage(1);
          }}
          placeholder="Filter by case type..."
        />
        <Link
          href="/clients"
          className="text-sm font-medium text-secondary hover:text-brand transition-colors whitespace-nowrap px-2"
        >
          Clients
        </Link>
      </FiltersBar>
```

(The `text-secondary hover:text-brand` treatment matches the existing auth footer link pattern in `email-step.tsx`, just without the underline since this sits in a filter bar, not body copy.)

- [ ] **Step 2: Verify**

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
```

Expected: all clean.

- [ ] **Step 3: Manual smoke check**

Visit `/cases`, confirm a "Clients" link renders at the end of the filter row and clicking it navigates to `/clients`. Check on a narrow (mobile) viewport too — `FiltersBar`'s grid wraps via its existing responsive behavior; confirm the link doesn't get cut off or overlap the filters.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/cases/cases-table.tsx
git commit -m "feat(web): add Clients entry-point link to the Cases page"
```

---

### Task 8: Full verification sweep and Prettier

**Files:** none new — this task only runs checks and formatters across everything touched in Tasks 1–7.

- [ ] **Step 1: Run the full backend suite**

```bash
pnpm --filter server typecheck
pnpm --filter server test
```

Expected: typecheck clean, all tests passing (114+ — no new backend tests were added per Task 1's reasoning, so the count stays at 114 unless Task 1's reviewer disagrees and adds one).

- [ ] **Step 2: Run the full frontend suite**

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
```

Expected: all clean; build output lists both new `/clients` routes.

- [ ] **Step 3: Prettier every file touched across this plan**

```bash
npx prettier --write \
  apps/server/src/modules/cases/cases.schema.ts \
  apps/server/src/modules/cases/cases.repository.ts \
  apps/web/src/types/cases.ts \
  apps/web/src/types/clients.ts \
  apps/web/src/services/clients.ts \
  apps/web/src/hooks/use-clients.ts \
  apps/web/src/constants/client-tabs.ts \
  "apps/web/src/app/(protected)/clients/page.tsx" \
  "apps/web/src/app/(protected)/clients/[clientId]/page.tsx" \
  apps/web/src/components/clients/clients-view.tsx \
  apps/web/src/components/clients/clients-table.tsx \
  apps/web/src/components/clients/client-detail-view.tsx \
  apps/web/src/components/clients/client-detail-tabs.tsx \
  apps/web/src/components/clients/client-cases-tab.tsx \
  apps/web/src/components/modals/create-client.tsx \
  apps/web/src/components/cases/cases-table.tsx
```

- [ ] **Step 4: Re-run typecheck/lint/build if Prettier changed anything**

If Step 3 reformatted any file, re-run Steps 1–2's commands to confirm formatting didn't break anything (it shouldn't — Prettier is whitespace-only).

- [ ] **Step 5: Discard any stray auto-generated diffs**

```bash
git status --porcelain
```

If `apps/web/next-env.d.ts` shows as modified (a known side effect of running `build`/`typecheck` locally), discard it:

```bash
git checkout -- apps/web/next-env.d.ts
```

- [ ] **Step 6: Commit any Prettier reformatting**

```bash
git add -A
git status --porcelain  # confirm only expected files are staged before committing
git commit -m "chore(web): prettier pass on clients module files"
```

If Step 3 made no changes, skip this commit (nothing to commit).
