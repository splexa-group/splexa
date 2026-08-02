# Clients Module (Frontend) — Design Spec
**Date:** 2026-08-02
**Branch:** bhaskar/fix/frontend
**Phase:** 1

---

## Overview

A minimal, lookup-oriented Clients directory: a `/clients` list page and a `/clients/[clientId]` detail page. This is deliberately **not** a CRM surface — per `product-context.md`, the client record exists purely so an advocate has instant context when a client calls, not to manage relationships or pipelines.

The backend `clients` module is already complete (create/list/getById/update/soft-delete, search, pagination) — no changes needed there. The frontend's `clientsApi` only wires up `search`/`create`/`update` today; `list`, `getById`, and `delete` need to be added to call the existing endpoints.

One genuine backend gap: the Cases tab on the client detail page needs to list a client's cases, but `GET /cases`'s `listCasesQuerySchema` only supports `search`/`status`/`caseType` — there is no `clientId` filter (a `clientId` field does exist on `updateCaseSchema`, but that's the "assign a client to a case" body, unrelated to list filtering). This needs a small addition: `clientId: z.uuid().optional()` on `listCasesQuerySchema` and a matching `where` clause in `cases.repository.ts`'s `list()`, mirroring how `status`/`caseType` are already handled there.

No new nav item and no mobile bottom-tab slot — the directory is reached via a small "Clients" link on the Cases page. Mobile bottom-nav is already at 4 tabs (its practical ceiling), and product-context is explicit that clients are secondary to cases.

---

## Routing & Navigation

| URL | Renders |
|---|---|
| `/clients` | Clients list (search + type filter + table) |
| `/clients/[clientId]` | Client detail — `Info` tab (default) or `Cases` tab via `?tab=` |

Entry point: a small link/button next to the "Add Case" action on the Cases page header (`CasesView`), not a `NAV_ITEMS` entry — `nav-items.ts` and `bottom-nav.tsx` are untouched.

Tab state on the detail page follows the exact `?tab=` mechanism used by Settings and Case Detail (`useActiveTab<ClientTabs>(CLIENT_TAB_CONFIG, ClientTabs.INFO)`). No sub-tabs.

---

## File Structure (Frontend only)

| File | Purpose |
|---|---|
| `src/constants/client-tabs.ts` | `ClientTabs { INFO="info", CASES="cases" }` + `CLIENT_TAB_CONFIG: TabConfig[]` |
| `src/types/clients.ts` | *(existing, extend)* add `ClientFilters`, full `Client` list/detail response shapes |
| `src/services/clients.ts` | *(existing, extend)* add `list(filters)`, `getById(id)`, `delete(id)` |
| `src/hooks/use-clients.ts` | *(existing, extend)* add `useClients(filters)`, `useClient(id)`, `useDeleteClient()`; keep existing `useClientSearch`, `useAddClientToCase`, `useUpdateClient` untouched |
| `src/app/(protected)/clients/page.tsx` | Thin wrapper → `<ClientsView />` |
| `src/app/(protected)/clients/[clientId]/page.tsx` | Thin wrapper → `<ClientDetailView clientId={clientId} />` |
| `src/components/clients/clients-view.tsx` | Page shell — `PageLayout` + `usePageTitle` + `ClientsTable` + create modal |
| `src/components/clients/clients-table.tsx` | `FiltersBar` (Search + type `Select`) + `DataTable`, mirrors `cases-table.tsx` structure/columns |
| `src/components/clients/client-detail-view.tsx` | Tab switcher, form state, Save/Delete footer — mirrors `CaseDetailView` |
| `src/components/clients/client-detail-tabs.tsx` | `TabsNav` wrapper — mirrors `CaseDetailTabs` |
| `src/components/clients/client-cases-tab.tsx` | Renders `useCases({ clientId })` through the existing cases table/row rendering |
| `src/components/modals/create-client.tsx` | `Modal` wrapping the existing `ClientDetails` form fragment, for standalone creation from the list page |

`src/components/cases/client/client-details.tsx` (the existing form fragment) and its `CLIENT_TYPE_OPTIONS`/`RELATION_TYPE_OPTIONS` in `utils/options.ts` are reused as-is on the Info tab — no duplication.

---

## Frontend Detail

### Types (`types/clients.ts` additions)

```ts
export interface ClientFilters {
  search?: string;
  type?: ClientType;
  page?: number;
  limit?: number;
}
```

`Client` (full detail shape) and `ClientListResponse` already exist and are reused unchanged.

### Services (`services/clients.ts` additions)

```ts
list: (filters: ClientFilters) =>
  GET<{ clients: Client[]; total: number; page: number; limit: number }>("/clients", { params: filters })
    .then((r) => ({ data: r.clients, total: r.total, page: r.page, limit: r.limit })),

getById: (id: string) =>
  GET<{ client: Client }>(`/clients/${id}`).then((r) => r.client),

delete: (id: string) =>
  DELETE<void>(`/clients/${id}`),
```

### Hooks (`hooks/use-clients.ts` additions)

```ts
export const clientKeys = {
  all: ["clients"] as const,
  list: (f: ClientFilters) => ["clients", "list", f] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

useClients(filters)   → useQuery  → clientsApi.list(filters)
useClient(id)         → useQuery  → clientsApi.getById(id), enabled: !!id
useCreateClient()     → useMutation → clientsApi.create(data), invalidates clientKeys.all, toast "Client created"
useDeleteClient()     → useMutation → clientsApi.delete(id), invalidates clientKeys.all, toast "Client deleted", router.push("/clients")
```

`useUpdateClient`'s existing `onSuccess` already invalidates `["clients"]` broadly — extend the invalidated key to `clientKeys.all` for consistency, no behavior change.

### Clients List (`components/clients/clients-view.tsx` + `clients-table.tsx`)

Structurally a near-verbatim copy of `CasesView`/`CasesTable`:

- `usePageTitle({ title: "Clients" })` — no header action; "Add Client" lives as the table's empty-state action and a button inside `FiltersBar`, matching how `CasesTable` takes `onAdd`.
- `FiltersBar` — `Search` (search box hits `search` — backend already matches name/phone/email/company) + `Select` for `type` (`CLIENT_TYPE_OPTIONS`).
- `DataTable` columns: **Name, Type, Phone, Email** — no date-ish column (clients don't carry their own dates; that's what the Cases tab on detail is for).
- Row click → `/clients/${id}`.
- "Add Client" opens `CreateClientModal` (wraps the existing `ClientDetails` form + a local `useForm<CreateClientInput>`, submits via `useCreateClient` — new mutation, same shape as `useCreateCase`).

### Client Detail (`components/clients/client-detail-view.tsx`)

Mirrors `CaseDetailView` but simpler — no sub-tabs, no client-creation branching (the client already exists by the time you're on its detail page):

```
<ClientDetailTabs clientId={clientId} />
<PageLayout maxWidth="medium">
  {tab === INFO  && <FormProvider {...form}><ClientDetails /></FormProvider>}
  {tab === CASES && <ClientCasesTab clientId={clientId} />}
</PageLayout>
<PageFooter right={
  <Button variant="negative" onClick={openDeleteConfirm}>Delete Client</Button>
  {tab === INFO && <Button loading={isSaving} onClick={handleSave}>Save Changes</Button>}
} />
<ConfirmDeleteModal ... />
```

`usePageTitle({ title: "Clients", resourceTitle: client?.fullName })`.

### Cases Tab (`components/clients/client-cases-tab.tsx`)

```tsx
const { data, isLoading } = useCases({ clientId }); // requires the CaseFilters.clientId addition below
// renders the same row/column treatment as CasesTable's `rows` (title, number, court, status, next hearing)
// but without the FiltersBar/pagination chrome — just the list, since a client won't have enough
// cases to need search/pagination inside their own detail page
```

If a client has zero cases, show the existing empty-state pattern with no action button (creating a case from here is out of scope — cases are still created from the Cases page).

### Backend Addition: `clientId` filter on cases list

- `apps/server/src/modules/cases/cases.schema.ts` — add `clientId: z.uuid().optional()` to `listCasesQuerySchema`.
- `apps/server/src/modules/cases/cases.repository.ts` — in `list()`, add `...(query.clientId ? { clientId: query.clientId } : {})` to the `where` object, alongside the existing `status`/`caseType` spreads.
- `apps/web/src/types/cases.ts` — add `clientId?: string` to `CaseFilters`.

No new test is needed for the repository `where`-clause itself — the existing `status`/`caseType` filters aren't unit-tested at that layer either (only `cases.service.test.ts` and `cases.helper.test.ts` exist, both testing above the repository).

---

## What Is Explicitly Out of Scope (Phase 1)

- Dedicated sidebar/bottom-nav item — reached via the Cases page link only
- Client-facing login/portal (per product-context, clients never log in in Phase 1)
- Activity/interaction timeline beyond the existing free-text `notes` field
- Bulk import/export
- Billing/invoicing tie-in
- Creating a new case directly from the client detail page
- Global/omnisearch (doesn't exist yet for anything else either — out of scope here too)
