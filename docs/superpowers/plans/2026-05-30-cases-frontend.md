# Cases Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Cases frontend — list page (table/card), case detail/edit page (5 tabs), case creation page, and shared modal components.

**Architecture:** Next.js App Router pages are thin shells; all logic lives in `components/cases/`. Data flows through typed service functions → React Query hooks → components. Forms use React Hook Form with `Controller` for Radix Select inputs.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind v4, React Query v5, React Hook Form v7, Radix UI, Sonner toasts, Lucide icons, Axios.

---

## File Map

**Create:**
```
apps/web/src/types/cases.ts
apps/web/src/types/hearings.ts
apps/web/src/types/clients.ts
apps/web/src/types/important-dates.ts
apps/web/src/services/cases.ts
apps/web/src/services/hearings.ts
apps/web/src/services/clients.ts
apps/web/src/services/important-dates.ts
apps/web/src/hooks/use-cases.ts
apps/web/src/hooks/use-hearings.ts
apps/web/src/hooks/use-clients.ts
apps/web/src/hooks/use-important-dates.ts
apps/web/src/lib/case-options.ts
apps/web/src/components/ui/textarea.tsx
apps/web/src/components/ui/modal.tsx
apps/web/src/components/ui/confirm-delete-modal.tsx
apps/web/src/components/ui/page-footer.tsx
apps/web/src/components/cases/case-table-row.tsx
apps/web/src/components/cases/case-card.tsx
apps/web/src/components/cases/case-list.tsx
apps/web/src/components/cases/case-row-menu.tsx
apps/web/src/components/cases/sections/case-details-section.tsx
apps/web/src/components/cases/sections/court-details-section.tsx
apps/web/src/components/cases/sections/judge-details-section.tsx
apps/web/src/components/cases/sections/opposite-party-section.tsx
apps/web/src/components/cases/client-tab.tsx
apps/web/src/components/cases/hearings-tab.tsx
apps/web/src/components/cases/hearing-card.tsx
apps/web/src/components/cases/hearing-edit-modal.tsx
apps/web/src/components/cases/documents-tab.tsx
apps/web/src/components/cases/important-dates-tab.tsx
apps/web/src/components/cases/important-date-modal.tsx
apps/web/src/components/cases/case-tabs.tsx
apps/web/src/app/(protected)/cases/new/page.tsx
apps/web/src/app/(protected)/cases/[id]/page.tsx
```

**Modify:**
```
apps/web/src/app/globals.css                    — add priority tokens
apps/web/src/lib/options.ts                     — add case enum options
apps/web/src/app/(protected)/cases/page.tsx    — replace stub
```

---

## Task 1: Install @radix-ui/react-dialog + add priority design tokens

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Install dialog dependency**

```bash
cd apps/web && pnpm add @radix-ui/react-dialog
```

- [ ] **Step 2: Add priority tokens to globals.css**

In `apps/web/src/app/globals.css`, inside `@theme inline { }` block, after the existing `--radius-*` lines, add:

```css
  --color-priority-high:         var(--priority-high);
  --color-priority-high-muted:   var(--priority-high-muted);
  --color-priority-medium:       var(--priority-medium);
  --color-priority-medium-muted: var(--priority-medium-muted);
```

Inside `:root { }`, after the `--positive-muted` line, add:

```css
  --priority-high:         #ef4444;
  --priority-high-muted:   #fee2e2;
  --priority-medium:       #f97316;
  --priority-medium-muted: #ffedd5;
```

- [ ] **Step 3: Verify types compile**

```bash
pnpm --filter web typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/src/app/globals.css pnpm-lock.yaml
git commit -m "feat(cases): install radix-dialog, add priority design tokens"
```

---

## Task 2: Case enum options

**Files:**
- Modify: `apps/web/src/lib/options.ts`

- [ ] **Step 1: Add case-related options**

Replace the full content of `apps/web/src/lib/options.ts`:

```ts
import {
  CaseStage,
  CaseStatus,
  CaseType,
  ClientType,
  CourtType,
  Designation,
  HearingPurpose,
  HearingStatus,
  ImportantDateType,
  PartyRole,
  PracticeType,
  Priority,
} from "@splexa-group/shared/enums";

function toOptions<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj).map((value) => ({
    value,
    label: value
      .replace(/([A-Z])/g, " $1")
      .replace(/^_/, "")
      .trim(),
  }));
}

export const DESIGNATION_OPTIONS = toOptions(Designation);
export const PRACTICE_TYPE_OPTIONS = toOptions(PracticeType);
export const CASE_TYPE_OPTIONS = toOptions(CaseType);
export const CASE_STATUS_OPTIONS = toOptions(CaseStatus);
export const CASE_STAGE_OPTIONS = toOptions(CaseStage);
export const COURT_TYPE_OPTIONS = toOptions(CourtType);
export const PRIORITY_OPTIONS = toOptions(Priority);
export const PARTY_ROLE_OPTIONS = toOptions(PartyRole);
export const CLIENT_TYPE_OPTIONS = toOptions(ClientType);
export const HEARING_PURPOSE_OPTIONS = toOptions(HearingPurpose);
export const HEARING_STATUS_OPTIONS = toOptions(HearingStatus);
export const IMPORTANT_DATE_TYPE_OPTIONS = toOptions(ImportantDateType);
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/options.ts
git commit -m "feat(cases): add case/court/hearing enum options"
```

---

## Task 3: TypeScript types

**Files:**
- Create: `apps/web/src/types/cases.ts`
- Create: `apps/web/src/types/hearings.ts`
- Create: `apps/web/src/types/clients.ts`
- Create: `apps/web/src/types/important-dates.ts`

- [ ] **Step 1: Create `types/cases.ts`**

```ts
import type {
  CaseStage,
  CaseStatus,
  CaseType,
  CourtType,
  PartyRole,
  Priority,
} from "@splexa-group/shared/enums";

export interface OppositeParty {
  name: string;
  role: PartyRole;
  advocateName?: string;
  advocatePhone?: string;
  address?: string;
}

export interface ClientSummary {
  id: string;
  fullName: string;
  phone: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  caseNumber: string | null;
  status: CaseStatus;
  priority: Priority | null;
  courtName: string | null;
  nextHearingDate: string | null;
  clientRole: PartyRole;
  client: ClientSummary;
}

export interface CaseDetail {
  id: string;
  orgId: string;
  title: string;
  clientId: string;
  clientRole: PartyRole;
  caseNumber: string | null;
  caseType: CaseType | null;
  filingDate: string | null;
  courtName: string | null;
  courtType: CourtType | null;
  courtState: string | null;
  courtCity: string | null;
  benchNumber: string | null;
  judgeName: string | null;
  judgeDesignation: string | null;
  status: CaseStatus;
  stage: CaseStage | null;
  priority: Priority | null;
  description: string | null;
  oppositeParties: OppositeParty[] | null;
  tags: string[] | null;
  nextHearingDate: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    fullName: string;
    phone: string;
    type: string;
    email: string | null;
  };
}

export interface CaseListResponse {
  data: CaseSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CaseFilters {
  search?: string;
  status?: CaseStatus;
  priority?: Priority;
  courtType?: CourtType;
  page?: number;
  limit?: number;
}

export interface CreateCaseInput {
  title: string;
  clientRole: PartyRole;
  clientId?: string;
  newClient?: { fullName: string; phone: string; type: string };
  caseNumber?: string;
  caseType?: CaseType;
  filingDate?: string;
  courtName?: string;
  courtType?: CourtType;
  courtState?: string;
  courtCity?: string;
  benchNumber?: string;
  judgeName?: string;
  judgeDesignation?: string;
  description?: string;
  status?: CaseStatus;
  stage?: CaseStage;
  priority?: Priority;
  oppositeParties?: OppositeParty[];
}

export interface UpdateCaseInput {
  title?: string;
  clientRole?: PartyRole;
  caseNumber?: string;
  caseType?: CaseType;
  filingDate?: string;
  courtName?: string;
  courtType?: CourtType;
  courtState?: string;
  courtCity?: string;
  benchNumber?: string;
  judgeName?: string;
  judgeDesignation?: string;
  status?: CaseStatus;
  stage?: CaseStage;
  description?: string;
  priority?: Priority;
  oppositeParties?: OppositeParty[];
  tags?: string[];
}
```

- [ ] **Step 2: Create `types/hearings.ts`**

```ts
import type { HearingPurpose, HearingStatus } from "@splexa-group/shared/enums";

export interface Hearing {
  id: string;
  caseId: string;
  date: string;
  purpose: HearingPurpose | null;
  status: HearingStatus;
  notes: string | null;
  nextDate: string | null;
  adjournmentReason: string | null;
  judgePresent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHearingInput {
  date: string;
  purpose?: HearingPurpose;
  notes?: string;
  judgePresent?: string;
}

export interface UpdateHearingInput {
  date?: string;
  purpose?: HearingPurpose;
  status?: HearingStatus;
  notes?: string;
  nextDate?: string;
  adjournmentReason?: string;
  judgePresent?: string;
}
```

- [ ] **Step 3: Create `types/clients.ts`**

```ts
import type { ClientType } from "@splexa-group/shared/enums";

export interface ClientSearchResult {
  id: string;
  fullName: string;
  phone: string;
  type: ClientType;
}

export interface ClientListResponse {
  data: ClientSearchResult[];
  total: number;
  page: number;
  limit: number;
}
```

- [ ] **Step 4: Create `types/important-dates.ts`**

```ts
import type { ImportantDateType } from "@splexa-group/shared/enums";

export interface ImportantDate {
  id: string;
  caseId: string;
  dateType: ImportantDateType;
  date: string;
  description: string | null;
  createdAt: string;
}

export interface CreateImportantDateInput {
  dateType: ImportantDateType;
  date: string;
  description?: string;
}

export interface UpdateImportantDateInput {
  dateType?: ImportantDateType;
  date?: string;
  description?: string;
}
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/types/
git commit -m "feat(cases): add TypeScript types for cases, hearings, clients, important-dates"
```

---

## Task 4: API services

**Files:**
- Create: `apps/web/src/services/cases.ts`
- Create: `apps/web/src/services/hearings.ts`
- Create: `apps/web/src/services/clients.ts`
- Create: `apps/web/src/services/important-dates.ts`

- [ ] **Step 1: Create `services/cases.ts`**

```ts
import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CaseDetail,
  CaseFilters,
  CaseListResponse,
  CreateCaseInput,
  UpdateCaseInput,
} from "@/types/cases";

export const casesApi = {
  list: (filters: CaseFilters = {}) =>
    GET<CaseListResponse>("/cases", { params: filters }),

  getById: (id: string) => GET<CaseDetail>(`/cases/${id}`),

  create: (data: CreateCaseInput) => POST<CaseDetail>("/cases", data),

  update: (id: string, data: UpdateCaseInput) =>
    PATCH<CaseDetail>(`/cases/${id}`, data),

  delete: (id: string) => DELETE<void>(`/cases/${id}`),
};
```

- [ ] **Step 2: Create `services/hearings.ts`**

```ts
import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CreateHearingInput,
  Hearing,
  UpdateHearingInput,
} from "@/types/hearings";

export const hearingsApi = {
  listByCaseId: (caseId: string) =>
    GET<Hearing[]>(`/cases/${caseId}/hearings`),

  create: (caseId: string, data: CreateHearingInput) =>
    POST<Hearing>(`/cases/${caseId}/hearings`, data),

  update: (id: string, data: UpdateHearingInput) =>
    PATCH<Hearing>(`/hearings/${id}`, data),

  delete: (id: string) => DELETE<void>(`/hearings/${id}`),
};
```

- [ ] **Step 3: Create `services/clients.ts`**

```ts
import { GET } from "@/api/http";
import type { ClientListResponse } from "@/types/clients";

export const clientsApi = {
  search: (query: string) =>
    GET<ClientListResponse>("/clients", { params: { search: query, limit: 10 } }),
};
```

- [ ] **Step 4: Create `services/important-dates.ts`**

```ts
import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CreateImportantDateInput,
  ImportantDate,
  UpdateImportantDateInput,
} from "@/types/important-dates";

export const importantDatesApi = {
  listByCaseId: (caseId: string) =>
    GET<ImportantDate[]>(`/cases/${caseId}/important-dates`),

  create: (caseId: string, data: CreateImportantDateInput) =>
    POST<ImportantDate>(`/cases/${caseId}/important-dates`, data),

  update: (caseId: string, dateId: string, data: UpdateImportantDateInput) =>
    PATCH<ImportantDate>(`/cases/${caseId}/important-dates/${dateId}`, data),

  delete: (caseId: string, dateId: string) =>
    DELETE<void>(`/cases/${caseId}/important-dates/${dateId}`),
};
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/services/
git commit -m "feat(cases): add API service layer for cases, hearings, clients, important-dates"
```

---

## Task 5: React Query hooks

**Files:**
- Create: `apps/web/src/hooks/use-cases.ts`
- Create: `apps/web/src/hooks/use-hearings.ts`
- Create: `apps/web/src/hooks/use-clients.ts`
- Create: `apps/web/src/hooks/use-important-dates.ts`

- [ ] **Step 1: Create `hooks/use-cases.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { casesApi } from "@/services/cases";
import type { CaseFilters, CreateCaseInput, UpdateCaseInput } from "@/types/cases";

export const caseKeys = {
  all: ["cases"] as const,
  list: (f: CaseFilters) => ["cases", "list", f] as const,
  detail: (id: string) => ["cases", "detail", id] as const,
};

export function useCases(filters: CaseFilters = {}) {
  return useQuery({
    queryKey: caseKeys.list(filters),
    queryFn: () => casesApi.list(filters),
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => casesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCaseInput) => casesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Case created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create case"),
  });
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCaseInput) => casesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.detail(id) });
      qc.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Saved");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save"),
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => casesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Case deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete case"),
  });
}
```

- [ ] **Step 2: Create `hooks/use-hearings.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hearingsApi } from "@/services/hearings";
import type { CreateHearingInput, UpdateHearingInput } from "@/types/hearings";

export const hearingKeys = {
  byCase: (caseId: string) => ["hearings", "case", caseId] as const,
};

export function useHearings(caseId: string) {
  return useQuery({
    queryKey: hearingKeys.byCase(caseId),
    queryFn: () => hearingsApi.listByCaseId(caseId),
    enabled: !!caseId,
  });
}

export function useCreateHearing(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHearingInput) => hearingsApi.create(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hearingKeys.byCase(caseId) });
      toast.success("Hearing added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add hearing"),
  });
}

export function useUpdateHearing(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHearingInput }) =>
      hearingsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hearingKeys.byCase(caseId) });
      toast.success("Hearing updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update hearing"),
  });
}

export function useDeleteHearing(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hearingsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hearingKeys.byCase(caseId) });
      toast.success("Hearing deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete hearing"),
  });
}
```

- [ ] **Step 3: Create `hooks/use-clients.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/services/clients";

export function useClientSearch(query: string) {
  return useQuery({
    queryKey: ["clients", "search", query],
    queryFn: () => clientsApi.search(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
```

- [ ] **Step 4: Create `hooks/use-important-dates.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { importantDatesApi } from "@/services/important-dates";
import type {
  CreateImportantDateInput,
  UpdateImportantDateInput,
} from "@/types/important-dates";

export const importantDateKeys = {
  byCase: (caseId: string) => ["important-dates", "case", caseId] as const,
};

export function useImportantDates(caseId: string) {
  return useQuery({
    queryKey: importantDateKeys.byCase(caseId),
    queryFn: () => importantDatesApi.listByCaseId(caseId),
    enabled: !!caseId,
  });
}

export function useCreateImportantDate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateImportantDateInput) =>
      importantDatesApi.create(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: importantDateKeys.byCase(caseId) });
      toast.success("Date added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add date"),
  });
}

export function useUpdateImportantDate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dateId, data }: { dateId: string; data: UpdateImportantDateInput }) =>
      importantDatesApi.update(caseId, dateId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: importantDateKeys.byCase(caseId) });
      toast.success("Date updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update date"),
  });
}

export function useDeleteImportantDate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dateId: string) => importantDatesApi.delete(caseId, dateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: importantDateKeys.byCase(caseId) });
      toast.success("Date deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete date"),
  });
}
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hooks/
git commit -m "feat(cases): add React Query hooks for all case modules"
```

---

## Task 6: Shared UI components

**Files:**
- Create: `apps/web/src/components/ui/textarea.tsx`
- Create: `apps/web/src/components/ui/modal.tsx`
- Create: `apps/web/src/components/ui/confirm-delete-modal.tsx`
- Create: `apps/web/src/components/ui/page-footer.tsx`

- [ ] **Step 1: Create `ui/textarea.tsx`**

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, className, id: explicitId, required, ...props }, ref) => {
    const autoId = React.useId();
    const id = explicitId ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-label">
            {label}
            {required && <span className="text-negative ml-0.5">*</span>}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            "w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm text-dark placeholder:text-placeholder transition-colors resize-none",
            "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
            error && "border-negative focus-visible:border-negative focus-visible:ring-negative/20",
            "disabled:bg-subtle disabled:text-disabled disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-secondary">{hint}</p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-xs text-negative">{error}</p>
        )}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";
export { TextareaField };
```

- [ ] **Step 2: Create `ui/modal.tsx`**

```tsx
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md bg-card rounded-xl shadow-xl border border-line",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className,
          )}
        >
          <div className="flex items-center justify-between p-5 border-b border-line">
            <Dialog.Title className="text-base font-semibold text-dark">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 text-placeholder hover:text-secondary hover:bg-subtle transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 3: Create `ui/confirm-delete-modal.tsx`**

```tsx
"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  entityName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfirmDeleteModal({
  open,
  title,
  entityName,
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={`Delete this ${title}?`}>
      <div className="p-5 space-y-3">
        <div className="w-10 h-10 rounded-lg bg-negative-muted flex items-center justify-center">
          <Trash2 className="size-5 text-negative" />
        </div>
        <p className="text-sm text-secondary leading-relaxed">
          You are about to permanently delete{" "}
          <span className="font-semibold text-dark">{entityName}</span> and all its
          associated data.
        </p>
        <p className="text-xs font-semibold text-negative">
          ⚠ This cannot be undone.
        </p>
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="negative"
          size="sm"
          onClick={onConfirm}
          loading={isPending}
        >
          Yes, delete {title}
        </Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Create `ui/page-footer.tsx`**

```tsx
import { cn } from "@/lib/utils";

interface PageFooterProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function PageFooter({ left, right, className }: PageFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 h-[60px] bg-card border-t border-line",
        "flex items-center justify-between px-6",
        className,
      )}
    >
      <div>{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/
git commit -m "feat(cases): add shared UI — TextareaField, Modal, ConfirmDeleteModal, PageFooter"
```

---

## Task 7: Cases list — CaseRowMenu + CaseTableRow + CaseCard

**Files:**
- Create: `apps/web/src/components/cases/case-row-menu.tsx`
- Create: `apps/web/src/components/cases/case-table-row.tsx`
- Create: `apps/web/src/components/cases/case-card.tsx`

- [ ] **Step 1: Create `cases/case-row-menu.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseRowMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onViewClient: () => void;
}

export function CaseRowMenu({ onEdit, onDelete, onViewClient }: CaseRowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="p-1.5 rounded-md text-placeholder hover:text-secondary hover:bg-subtle transition-colors"
        aria-label="Case actions"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 bg-card border border-line rounded-lg shadow-md py-1">
          {[
            { icon: Pencil, label: "Edit", action: onEdit },
            { icon: User, label: "View client", action: onViewClient },
            { icon: Trash2, label: "Delete", action: onDelete, danger: true },
          ].map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); action(); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
                danger
                  ? "text-negative hover:bg-negative-muted"
                  : "text-label hover:bg-subtle",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `cases/case-table-row.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CaseRowMenu } from "./case-row-menu";
import type { CaseSummary } from "@/types/cases";
import { formatHearingDate, hearingDateColor, priorityStripeClass, statusDotClass } from "./case-utils";

interface CaseTableRowProps {
  case_: CaseSummary;
  onDelete: (c: CaseSummary) => void;
}

export function CaseTableRow({ case_, onDelete }: CaseTableRowProps) {
  const router = useRouter();
  const isInactive = case_.status === "Stayed" || case_.status === "Disposed";

  return (
    <div
      role="row"
      onClick={() => router.push(`/cases/${case_.id}`)}
      className={cn(
        "grid items-center gap-0 px-4 min-h-[54px] border-b border-line cursor-pointer transition-colors hover:bg-subtle",
        "grid-cols-[12px_1fr_140px_130px_70px_110px_36px]",
        isInactive && "opacity-40",
      )}
    >
      {/* Priority stripe */}
      <span className={cn("w-[3px] h-7 rounded-full", priorityStripeClass(case_.priority))} />

      {/* Case + number */}
      <div className="pr-4 min-w-0">
        <p className="text-sm font-semibold text-dark truncate">{case_.title}</p>
        {case_.caseNumber && (
          <p className="text-xs text-placeholder">{case_.caseNumber}</p>
        )}
      </div>

      {/* Client */}
      <p className="text-sm text-label pr-4 truncate">{case_.client.fullName}</p>

      {/* Court */}
      <p className="text-xs text-secondary pr-4 truncate">{case_.courtName ?? "—"}</p>

      {/* Status */}
      <div className="flex items-center gap-1.5 pr-4">
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusDotClass(case_.status))} />
        <span className="text-xs text-secondary">{case_.status}</span>
      </div>

      {/* Next hearing */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-placeholder">
          Next Hearing
        </span>
        <span className={cn("text-xs font-semibold", hearingDateColor(case_.nextHearingDate))}>
          {formatHearingDate(case_.nextHearingDate)}
        </span>
      </div>

      {/* Menu */}
      <div onClick={(e) => e.stopPropagation()}>
        <CaseRowMenu
          onEdit={() => router.push(`/cases/${case_.id}`)}
          onViewClient={() => router.push(`/clients/${case_.client.id}`)}
          onDelete={() => onDelete(case_)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `cases/case-card.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CaseSummary } from "@/types/cases";
import {
  formatHearingDate,
  hearingDateColor,
  priorityStripeClass,
  statusDotClass,
} from "./case-utils";

interface CaseCardProps {
  case_: CaseSummary;
  onDelete: (c: CaseSummary) => void;
}

export function CaseCard({ case_, onDelete }: CaseCardProps) {
  const router = useRouter();
  const isUrgent =
    case_.nextHearingDate &&
    (isOverdue(case_.nextHearingDate) || isToday(case_.nextHearingDate));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/cases/${case_.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/cases/${case_.id}`)}
      className={cn(
        "bg-card rounded-xl border flex overflow-hidden cursor-pointer active:scale-[0.99] transition-transform min-h-[44px]",
        isUrgent ? "border-priority-high-muted" : "border-line",
      )}
    >
      {/* Priority stripe */}
      <div className={cn("w-[3px] flex-shrink-0", priorityStripeClass(case_.priority))} />

      <div className="flex-1 p-3 min-w-0">
        {/* Row 1: title + hearing */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-dark leading-snug flex-1 min-w-0">
            {case_.title}
          </p>
          <div className="flex-shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-placeholder mb-0.5">
              Next hearing
            </p>
            <p className={cn("text-xs font-bold", hearingDateColor(case_.nextHearingDate))}>
              {formatHearingDate(case_.nextHearingDate)}
            </p>
          </div>
        </div>

        {/* Case number */}
        {case_.caseNumber && (
          <p className="text-[11px] text-placeholder mb-1">{case_.caseNumber}</p>
        )}

        {/* Client + court */}
        <p className="text-xs text-secondary mb-2 truncate">
          {case_.client.fullName}
          {case_.courtName && ` · ${case_.courtName}`}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusDotClass(case_.status))} />
          <span className="text-[11px] text-secondary">{case_.status}</span>
        </div>
      </div>
    </div>
  );
}

function isOverdue(date: string) {
  return new Date(date) < new Date(new Date().toDateString());
}

function isToday(date: string) {
  return new Date(date).toDateString() === new Date().toDateString();
}
```

- [ ] **Step 4: Create `cases/case-utils.ts`** (shared helpers used by both row and card)

```ts
import { cn } from "@/lib/utils";
import type { CaseStatus, Priority } from "@splexa-group/shared/enums";

export function priorityStripeClass(priority: Priority | null | undefined): string {
  if (priority === "High") return "bg-priority-high";
  if (priority === "Medium") return "bg-priority-medium";
  return "bg-transparent";
}

export function statusDotClass(status: CaseStatus): string {
  if (status === "Active") return "bg-positive";
  if (status === "Stayed") return "bg-brand-light";
  return "bg-placeholder";
}

export function hearingDateColor(date: string | null): string {
  if (!date) return "text-placeholder";
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d < today) return "text-negative";
  if (d.toDateString() === today.toDateString()) return "text-amber";
  if (d.toDateString() === tomorrow.toDateString()) return "text-brand";
  return "text-label";
}

export function formatHearingDate(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d < today) return "Overdue";
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export { cn };
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/cases/
git commit -m "feat(cases): add CaseRowMenu, CaseTableRow, CaseCard, case-utils"
```

---

## Task 8: Cases list page (`/cases`)

**Files:**
- Create: `apps/web/src/components/cases/case-list.tsx`
- Modify: `apps/web/src/app/(protected)/cases/page.tsx`

- [ ] **Step 1: Create `cases/case-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCases, useDeleteCase } from "@/hooks/use-cases";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { CaseTableRow } from "./case-table-row";
import { CaseCard } from "./case-card";
import type { CaseSummary } from "@/types/cases";
import type { CaseStatus } from "@splexa-group/shared/enums";

const STATUS_TABS: { label: string; value: CaseStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Stayed", value: "Stayed" },
  { label: "Disposed", value: "Disposed" },
];

export function CaseList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<CaseStatus | "All">("All");
  const [toDelete, setToDelete] = useState<CaseSummary | null>(null);

  const filters = {
    search: search || undefined,
    status: statusTab !== "All" ? statusTab : undefined,
  };

  const { data, isLoading } = useCases(filters);
  const deleteCase = useDeleteCase();

  const cases = data?.data ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="px-4 md:px-6 pt-4 pb-0 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-placeholder" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases, clients, case numbers…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-line bg-card text-sm text-dark placeholder:text-placeholder focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-line overflow-x-auto -mb-px">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={cn(
                "px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                statusTab === tab.value
                  ? "border-dark text-dark font-bold"
                  : "border-transparent text-placeholder hover:text-secondary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 py-2 text-xs text-placeholder">
        {isLoading ? "Loading…" : `${data?.total ?? 0} cases · sorted by next hearing`}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block flex-1 overflow-y-auto px-6">
        {!isLoading && cases.length === 0 ? (
          <EmptyState onAdd={() => router.push("/cases/new")} />
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            {/* Column headers */}
            <div className="grid px-4 py-2 bg-subtle border-b border-line grid-cols-[12px_1fr_140px_130px_70px_110px_36px]">
              {["", "Case / Number", "Client", "Court", "Status", "Next Hearing", ""].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-placeholder">
                  {h}
                </span>
              ))}
            </div>
            {cases.map((c) => (
              <CaseTableRow key={c.id} case_={c} onDelete={setToDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        {!isLoading && cases.length === 0 ? (
          <EmptyState onAdd={() => router.push("/cases/new")} />
        ) : (
          cases.map((c) => (
            <CaseCard key={c.id} case_={c} onDelete={setToDelete} />
          ))
        )}
      </div>

      <ConfirmDeleteModal
        open={!!toDelete}
        title="case"
        entityName={toDelete?.title ?? ""}
        isPending={deleteCase.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteCase.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-secondary mb-4">No cases yet.</p>
      <button
        type="button"
        onClick={onAdd}
        className="text-sm font-semibold text-brand hover:underline"
      >
        Add your first case
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/(protected)/cases/page.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/components/layout/top-bar-context';
import { CaseList } from '@/components/cases/case-list';

export default function CasesPage() {
  const router = useRouter();
  usePageTitle({
    title: 'Cases',
    action: { label: 'Add Case', href: '/cases/new' },
  });

  return <CaseList />;
}
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/cases/case-list.tsx apps/web/src/app/(protected)/cases/page.tsx
git commit -m "feat(cases): implement cases list page with table/card responsive layout"
```

---

## Task 9: Case edit page shell + form sections

**Files:**
- Create: `apps/web/src/app/(protected)/cases/[id]/page.tsx`
- Create: `apps/web/src/components/cases/case-tabs.tsx`
- Create: `apps/web/src/components/cases/sections/case-details-section.tsx`
- Create: `apps/web/src/components/cases/sections/court-details-section.tsx`
- Create: `apps/web/src/components/cases/sections/judge-details-section.tsx`
- Create: `apps/web/src/components/cases/sections/opposite-party-section.tsx`

- [ ] **Step 1: Create `cases/case-tabs.tsx`**

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type CaseTab = "case" | "client" | "hearings" | "documents" | "important-dates";

const TABS: { id: CaseTab; label: string }[] = [
  { id: "case", label: "Case" },
  { id: "client", label: "Client" },
  { id: "hearings", label: "Hearings" },
  { id: "documents", label: "Documents" },
  { id: "important-dates", label: "Important Dates" },
];

interface CaseTabsProps {
  caseId: string;
}

export function CaseTabs({ caseId }: CaseTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") ?? "case") as CaseTab;

  return (
    <div className="flex overflow-x-auto border-b border-line -mb-px">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => router.push(`/cases/${caseId}?tab=${tab.id}`)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
            active === tab.id
              ? "border-dark text-dark font-bold"
              : "border-transparent text-placeholder hover:text-secondary",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function useActiveTab(): CaseTab {
  const searchParams = useSearchParams();
  return (searchParams.get("tab") ?? "case") as CaseTab;
}
```

- [ ] **Step 2: Create `sections/case-details-section.tsx`**

```tsx
"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { TextareaField } from "@/components/ui/textarea";
import {
  CASE_STAGE_OPTIONS,
  CASE_STATUS_OPTIONS,
  CASE_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function CaseDetailsSection() {
  const { register, control, formState: { errors } } = useFormContext<UpdateCaseInput>();

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Case Details
        </h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <Field
            label="Case Title"
            error={errors.title?.message}
            {...register("title")}
          />
        </div>
        <Field label="Case Number" {...register("caseNumber")} />
        <Controller
          name="caseType"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Case Type"
              options={CASE_TYPE_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Select type"
            />
          )}
        />
        <Field label="Filing Date" type="date" {...register("filingDate")} />
        <Controller
          name="stage"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Stage"
              options={CASE_STAGE_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Select stage"
            />
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Status"
              options={CASE_STATUS_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Select priority"
            />
          )}
        />
        <div className="md:col-span-3">
          <TextareaField
            label="Description"
            rows={4}
            error={errors.description?.message}
            {...register("description")}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `sections/court-details-section.tsx`**

```tsx
"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { COURT_TYPE_OPTIONS } from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function CourtDetailsSection() {
  const { register, control } = useFormContext<UpdateCaseInput>();

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Court Details
        </h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Court Name" {...register("courtName")} />
        </div>
        <Controller
          name="courtType"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Court Type"
              options={COURT_TYPE_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Select type"
            />
          )}
        />
        <Field label="Bench No." {...register("benchNumber")} />
        <Field label="State" {...register("courtState")} />
        <Field label="City" {...register("courtCity")} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `sections/judge-details-section.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/input";
import type { UpdateCaseInput } from "@/types/cases";

export function JudgeDetailsSection() {
  const { register } = useFormContext<UpdateCaseInput>();

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Judge Details
        </h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Judge Name" {...register("judgeName")} />
        <Field label="Designation" {...register("judgeDesignation")} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `sections/opposite-party-section.tsx`**

```tsx
"use client";

import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Field } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function OppositePartySection() {
  const { register, control } = useFormContext<UpdateCaseInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "oppositeParties",
  });

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Opposite Party
        </h3>
        <button
          type="button"
          onClick={() => append({ name: "", role: "Respondent" as const, advocateName: "", advocatePhone: "" })}
          className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <Plus className="size-3" /> Add party
        </button>
      </div>
      <div className="p-4 space-y-4">
        {fields.length === 0 && (
          <p className="text-xs text-placeholder text-center py-2">No opposite parties added.</p>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="border border-line rounded-lg p-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-secondary">Party {index + 1}</span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-negative hover:text-negative/80 transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" required {...register(`oppositeParties.${index}.name`)} />
              <Controller
                name={`oppositeParties.${index}.role`}
                control={control}
                render={({ field: f }) => (
                  <SelectGroup
                    label="Role"
                    options={PARTY_ROLE_OPTIONS}
                    value={f.value}
                    onChange={f.onChange}
                    required
                  />
                )}
              />
              <Field label="Advocate name" {...register(`oppositeParties.${index}.advocateName`)} />
              <Field label="Advocate phone" {...register(`oppositeParties.${index}.advocatePhone`)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `app/(protected)/cases/[id]/page.tsx`**

```tsx
'use client';

import { use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { usePageTitle } from '@/components/layout/top-bar-context';
import { useCase, useUpdateCase, useDeleteCase } from '@/hooks/use-cases';
import { useActiveTab, CaseTabs } from '@/components/cases/case-tabs';
import { CaseDetailsSection } from '@/components/cases/sections/case-details-section';
import { CourtDetailsSection } from '@/components/cases/sections/court-details-section';
import { JudgeDetailsSection } from '@/components/cases/sections/judge-details-section';
import { OppositePartySection } from '@/components/cases/sections/opposite-party-section';
import { ClientTab } from '@/components/cases/client-tab';
import { HearingsTab } from '@/components/cases/hearings-tab';
import { DocumentsTab } from '@/components/cases/documents-tab';
import { ImportantDatesTab } from '@/components/cases/important-dates-tab';
import { PageFooter } from '@/components/ui/page-footer';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import type { UpdateCaseInput } from '@/types/cases';
import { useState } from 'react';

export default function CaseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense>
      <CaseEditContent caseId={id} />
    </Suspense>
  );
}

function CaseEditContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const activeTab = useActiveTab();
  const [showDelete, setShowDelete] = useState(false);

  const { data: case_, isLoading } = useCase(caseId);
  const updateCase = useUpdateCase(caseId);
  const deleteCase = useDeleteCase();

  usePageTitle({
    title: 'Cases',
    resourceTitle: case_?.title ?? '…',
  });

  const methods = useForm<UpdateCaseInput>({
    values: case_
      ? {
          title: case_.title,
          clientRole: case_.clientRole,
          caseNumber: case_.caseNumber ?? '',
          caseType: case_.caseType ?? undefined,
          filingDate: case_.filingDate ? case_.filingDate.substring(0, 10) : '',
          courtName: case_.courtName ?? '',
          courtType: case_.courtType ?? undefined,
          courtState: case_.courtState ?? '',
          courtCity: case_.courtCity ?? '',
          benchNumber: case_.benchNumber ?? '',
          judgeName: case_.judgeName ?? '',
          judgeDesignation: case_.judgeDesignation ?? '',
          status: case_.status,
          stage: case_.stage ?? undefined,
          priority: case_.priority ?? undefined,
          description: case_.description ?? '',
          oppositeParties: (case_.oppositeParties as UpdateCaseInput['oppositeParties']) ?? [],
        }
      : undefined,
  });

  if (isLoading || !case_) {
    return <div className="p-6 text-sm text-secondary">Loading…</div>;
  }

  async function handleSave(data: UpdateCaseInput) {
    await updateCase.mutateAsync(data);
  }

  const showSaveFooter = activeTab === 'case' || activeTab === 'client';

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-4 pb-0 bg-card border-b border-line flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl font-extrabold text-dark tracking-tight leading-tight">
              {case_.title}
            </h1>
          </div>
          <p className="text-xs text-secondary mb-3">
            {[case_.caseNumber, case_.client.fullName, case_.courtName]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <CaseTabs caseId={caseId} />
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto bg-page">
          <div className="p-6 space-y-4 max-w-4xl">
            {activeTab === 'case' && (
              <>
                <CaseDetailsSection />
                <div className="grid md:grid-cols-2 gap-4">
                  <CourtDetailsSection />
                  <JudgeDetailsSection />
                </div>
                <OppositePartySection />
              </>
            )}
            {activeTab === 'client' && <ClientTab case_={case_} />}
            {activeTab === 'hearings' && <HearingsTab caseId={caseId} />}
            {activeTab === 'documents' && <DocumentsTab caseId={caseId} />}
            {activeTab === 'important-dates' && <ImportantDatesTab caseId={caseId} />}
          </div>
        </div>

        {/* Footer */}
        {showSaveFooter && (
          <PageFooter
            left={
              activeTab === 'case' && (
                <Button
                  variant="negativeOutline"
                  size="sm"
                  onClick={() => setShowDelete(true)}
                >
                  Delete Case
                </Button>
              )
            }
            right={
              <>
                <Button variant="secondary" size="sm" onClick={() => router.push('/cases')}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={updateCase.isPending}
                  onClick={methods.handleSubmit(handleSave)}
                >
                  Save Changes
                </Button>
              </>
            }
          />
        )}
      </div>

      <ConfirmDeleteModal
        open={showDelete}
        title="case"
        entityName={case_.title}
        isPending={deleteCase.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={async () => {
          await deleteCase.mutateAsync(caseId);
          router.push('/cases');
        }}
      />
    </FormProvider>
  );
}
```

- [ ] **Step 7: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/cases/sections/ apps/web/src/components/cases/case-tabs.tsx apps/web/src/app/(protected)/cases/
git commit -m "feat(cases): add case edit page shell, tabs, and Case tab form sections"
```

---

## Task 10: Client tab + Hearings tab

**Files:**
- Create: `apps/web/src/components/cases/client-tab.tsx`
- Create: `apps/web/src/components/cases/hearing-card.tsx`
- Create: `apps/web/src/components/cases/hearing-edit-modal.tsx`
- Create: `apps/web/src/components/cases/hearings-tab.tsx`

- [ ] **Step 1: Create `cases/client-tab.tsx`**

```tsx
"use client";

import { Controller, useFormContext } from "react-hook-form";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Field } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";
import type { CaseDetail } from "@/types/cases";
import type { UpdateCaseInput } from "@/types/cases";

interface ClientTabProps {
  case_: CaseDetail;
}

export function ClientTab({ case_ }: ClientTabProps) {
  const { control } = useFormContext<UpdateCaseInput>();

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Client Info
        </h3>
        <Link
          href={`/clients/${case_.clientId}`}
          className="text-xs font-semibold text-brand hover:underline"
        >
          View full profile →
        </Link>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-label mb-1.5">
            <Lock className="size-3 text-placeholder" />
            Full Name
          </label>
          <input
            readOnly
            disabled
            value={case_.client.fullName}
            className="w-full rounded-md border border-line bg-subtle px-3 py-[9px] text-sm text-secondary cursor-not-allowed"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-label mb-1.5">
            <Lock className="size-3 text-placeholder" />
            Client Type
          </label>
          <input
            readOnly
            disabled
            value={case_.client.type}
            className="w-full rounded-md border border-line bg-subtle px-3 py-[9px] text-sm text-secondary cursor-not-allowed"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-label mb-1.5">
            <Lock className="size-3 text-placeholder" />
            Phone
          </label>
          <input
            readOnly
            disabled
            value={case_.client.phone}
            className="w-full rounded-md border border-line bg-subtle px-3 py-[9px] text-sm text-secondary cursor-not-allowed"
          />
        </div>

        <Controller
          name="clientRole"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Role in Case"
              options={PARTY_ROLE_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              required
            />
          )}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `cases/hearing-card.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Hearing } from "@/types/hearings";
import type { HearingStatus } from "@splexa-group/shared/enums";

const STATUS_STYLES: Record<HearingStatus, { dot: string; badge: string }> = {
  Scheduled: { dot: "bg-brand-soft border-brand", badge: "bg-brand-soft text-brand" },
  Completed: { dot: "bg-positive-muted border-positive", badge: "bg-positive-muted text-positive" },
  Adjourned:  { dot: "bg-amber-muted border-amber", badge: "bg-amber-muted text-amber-dark" },
  Cancelled:  { dot: "bg-negative-muted border-negative", badge: "bg-negative-muted text-negative" },
};

interface HearingCardProps {
  hearing: Hearing;
  onEdit: () => void;
  onDelete: () => void;
  faded?: boolean;
}

export function HearingCard({ hearing, onEdit, onDelete, faded }: HearingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const styles = STATUS_STYLES[hearing.status];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const dateStr = new Date(hearing.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className={cn("relative pl-6", faded && "opacity-50")}>
      {/* Timeline dot */}
      <span
        className={cn(
          "absolute left-0 top-3 w-3.5 h-3.5 rounded-full border-2 border-card ring-1 z-10",
          styles.dot,
        )}
      />

      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-dark mb-0.5">{dateStr}</p>
            <p className="text-xs text-secondary">
              {hearing.purpose?.replace(/([A-Z])/g, " $1").trim() ?? "—"}
              {hearing.judgePresent && ` · ${hearing.judgePresent}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", styles.badge)}>
              {hearing.status}
            </span>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((p) => !p)}
                className="p-1 rounded-md text-placeholder hover:text-secondary hover:bg-subtle transition-colors"
              >
                <MoreVertical className="size-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-30 w-36 bg-card border border-line rounded-lg shadow-md py-1">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-label hover:bg-subtle"
                  >
                    <Pencil className="size-3.5" /> Edit hearing
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-negative hover:bg-negative-muted"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {hearing.notes && (
          <div className="px-4 pb-3 pt-0 border-t border-line">
            <p className="text-xs text-secondary leading-relaxed">{hearing.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `cases/hearing-edit-modal.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { TextareaField } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HEARING_PURPOSE_OPTIONS, HEARING_STATUS_OPTIONS } from "@/lib/options";
import type { Hearing, UpdateHearingInput } from "@/types/hearings";
import type { CreateHearingInput } from "@/types/hearings";

interface HearingEditModalProps {
  open: boolean;
  hearing?: Hearing | null;
  onClose: () => void;
  onSave: (data: UpdateHearingInput | CreateHearingInput) => void;
  isPending?: boolean;
}

export function HearingEditModal({
  open,
  hearing,
  onClose,
  onSave,
  isPending,
}: HearingEditModalProps) {
  const { register, control, watch, handleSubmit, reset } = useForm<UpdateHearingInput>({
    defaultValues: {
      date: "",
      purpose: undefined,
      status: "Scheduled",
      judgePresent: "",
      notes: "",
      nextDate: "",
      adjournmentReason: "",
    },
  });

  const status = watch("status");

  useEffect(() => {
    if (hearing) {
      reset({
        date: hearing.date ? hearing.date.substring(0, 10) : "",
        purpose: hearing.purpose ?? undefined,
        status: hearing.status,
        judgePresent: hearing.judgePresent ?? "",
        notes: hearing.notes ?? "",
        nextDate: hearing.nextDate ? hearing.nextDate.substring(0, 10) : "",
        adjournmentReason: hearing.adjournmentReason ?? "",
      });
    } else {
      reset({ date: "", status: "Scheduled" });
    }
  }, [hearing, open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hearing ? "Edit Hearing" : "Add Hearing"}
    >
      <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hearing Date" type="date" required {...register("date")} />
          <Controller
            name="purpose"
            control={control}
            render={({ field }) => (
              <SelectGroup
                label="Purpose"
                options={HEARING_PURPOSE_OPTIONS}
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Select purpose"
              />
            )}
          />
        </div>

        {hearing && (
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <SelectGroup
                label="Status"
                options={HEARING_STATUS_OPTIONS}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        )}

        <Field label="Judge Present" {...register("judgePresent")} />

        <TextareaField label="Notes" rows={3} {...register("notes")} />

        {status === "Adjourned" && (
          <>
            <Field label="Next Date" type="date" {...register("nextDate")} />
            <Field label="Adjournment Reason" {...register("adjournmentReason")} />
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isPending}>
            {hearing ? "Save Hearing" : "Add Hearing"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 4: Create `cases/hearings-tab.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useHearings, useCreateHearing, useUpdateHearing, useDeleteHearing } from "@/hooks/use-hearings";
import { HearingCard } from "./hearing-card";
import { HearingEditModal } from "./hearing-edit-modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { PageFooter } from "@/components/ui/page-footer";
import { Button } from "@/components/ui/button";
import type { Hearing } from "@/types/hearings";

interface HearingsTabProps {
  caseId: string;
}

export function HearingsTab({ caseId }: HearingsTabProps) {
  const [editHearing, setEditHearing] = useState<Hearing | null | "new">(null);
  const [toDelete, setToDelete] = useState<Hearing | null>(null);

  const { data: hearings = [], isLoading } = useHearings(caseId);
  const createHearing = useCreateHearing(caseId);
  const updateHearing = useUpdateHearing(caseId);
  const deleteHearing = useDeleteHearing(caseId);

  const sorted = [...hearings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-placeholder">
            {isLoading ? "Loading…" : `${hearings.length} hearings`}
          </span>
          <Button size="sm" onClick={() => setEditHearing("new")}>
            <Plus className="size-3.5" /> Add Hearing
          </Button>
        </div>

        {!isLoading && hearings.length === 0 && (
          <p className="text-sm text-secondary text-center py-8">No hearings yet.</p>
        )}

        {/* Timeline */}
        <div className="relative space-y-3">
          {sorted.length > 1 && (
            <div className="absolute left-[5px] top-4 bottom-4 w-px bg-line" />
          )}
          {sorted.map((h, i) => (
            <HearingCard
              key={h.id}
              hearing={h}
              faded={i >= 3 && h.status === "Completed"}
              onEdit={() => setEditHearing(h)}
              onDelete={() => setToDelete(h)}
            />
          ))}
        </div>
      </div>

      <PageFooter
        right={
          <Button size="sm" onClick={() => setEditHearing("new")}>
            <Plus className="size-3.5" /> Add Hearing
          </Button>
        }
      />

      <HearingEditModal
        open={editHearing !== null}
        hearing={editHearing === "new" ? null : editHearing}
        isPending={createHearing.isPending || updateHearing.isPending}
        onClose={() => setEditHearing(null)}
        onSave={async (data) => {
          if (editHearing === "new") {
            await createHearing.mutateAsync(data as Parameters<typeof createHearing.mutateAsync>[0]);
          } else if (editHearing) {
            await updateHearing.mutateAsync({ id: editHearing.id, data });
          }
          setEditHearing(null);
        }}
      />

      <ConfirmDeleteModal
        open={!!toDelete}
        title="hearing"
        entityName={toDelete ? new Date(toDelete.date).toLocaleDateString("en-IN") : ""}
        isPending={deleteHearing.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteHearing.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/cases/
git commit -m "feat(cases): add Client tab, Hearing timeline, HearingEditModal"
```

---

## Task 11: Documents tab + Important Dates tab

**Files:**
- Create: `apps/web/src/components/cases/documents-tab.tsx`
- Create: `apps/web/src/components/cases/important-date-modal.tsx`
- Create: `apps/web/src/components/cases/important-dates-tab.tsx`

- [ ] **Step 1: Create `cases/documents-tab.tsx`**

```tsx
"use client";

import { FileText, Image, File } from "lucide-react";
import { PageFooter } from "@/components/ui/page-footer";
import { Button } from "@/components/ui/button";

interface DocumentsTabProps {
  caseId: string;
}

export function DocumentsTab({ caseId: _ }: DocumentsTabProps) {
  return (
    <>
      <div className="text-sm text-secondary text-center py-12">
        Document upload coming soon.
      </div>
      <PageFooter
        right={
          <Button size="sm" disabled>
            Upload Document
          </Button>
        }
      />
    </>
  );
}
```

- [ ] **Step 2: Create `cases/important-date-modal.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { TextareaField } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IMPORTANT_DATE_TYPE_OPTIONS } from "@/lib/options";
import type { ImportantDate, CreateImportantDateInput, UpdateImportantDateInput } from "@/types/important-dates";

interface ImportantDateModalProps {
  open: boolean;
  date?: ImportantDate | null;
  onClose: () => void;
  onSave: (data: CreateImportantDateInput | UpdateImportantDateInput) => void;
  isPending?: boolean;
}

export function ImportantDateModal({ open, date, onClose, onSave, isPending }: ImportantDateModalProps) {
  const { register, control, handleSubmit, reset } = useForm<CreateImportantDateInput>({
    defaultValues: { dateType: undefined, date: "", description: "" },
  });

  useEffect(() => {
    if (date) {
      reset({
        dateType: date.dateType,
        date: date.date.substring(0, 10),
        description: date.description ?? "",
      });
    } else {
      reset({ dateType: undefined, date: "", description: "" });
    }
  }, [date, open, reset]);

  return (
    <Modal open={open} onClose={onClose} title={date ? "Edit Date" : "Add Important Date"}>
      <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">
        <Controller
          name="dateType"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SelectGroup
              label="Date Type"
              options={IMPORTANT_DATE_TYPE_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Select type"
              required
            />
          )}
        />
        <Field label="Date" type="date" required {...register("date", { required: true })} />
        <TextareaField label="Description" rows={2} {...register("description")} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={isPending}>Save Date</Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 3: Create `cases/important-dates-tab.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useImportantDates,
  useCreateImportantDate,
  useUpdateImportantDate,
  useDeleteImportantDate,
} from "@/hooks/use-important-dates";
import { ImportantDateModal } from "./important-date-modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { PageFooter } from "@/components/ui/page-footer";
import { Button } from "@/components/ui/button";
import type { ImportantDate } from "@/types/important-dates";

const CRITICAL_TYPES = ["Limitation", "BailExpiry", "StayExpiry", "AppealDeadline"];

interface ImportantDatesTabProps {
  caseId: string;
}

export function ImportantDatesTab({ caseId }: ImportantDatesTabProps) {
  const [modal, setModal] = useState<ImportantDate | null | "new">(null);
  const [toDelete, setToDelete] = useState<ImportantDate | null>(null);

  const { data: dates = [], isLoading } = useImportantDates(caseId);
  const createDate = useCreateImportantDate(caseId);
  const updateDate = useUpdateImportantDate(caseId);
  const deleteDate = useDeleteImportantDate(caseId);

  const sorted = [...dates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  function dateColor(isoDate: string) {
    const d = new Date(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return "text-negative";
    if (d.toDateString() === today.toDateString()) return "text-amber";
    return "text-dark";
  }

  function badgeClass(type: string) {
    return CRITICAL_TYPES.includes(type)
      ? "bg-negative-muted text-negative"
      : "bg-brand-soft text-brand";
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-placeholder">
            {isLoading ? "Loading…" : `${dates.length} dates`}
          </span>
          <Button size="sm" onClick={() => setModal("new")}>
            <Plus className="size-3.5" /> Add Date
          </Button>
        </div>

        {!isLoading && dates.length === 0 && (
          <p className="text-sm text-secondary text-center py-8">No important dates added yet.</p>
        )}

        <div className="bg-card border border-line rounded-xl overflow-hidden">
          {sorted.map((d, i) => (
            <div
              key={d.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                i < sorted.length - 1 && "border-b border-line",
              )}
            >
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", badgeClass(d.dateType))}>
                {d.dateType.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", dateColor(d.date))}>
                  {new Date(d.date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                {d.description && (
                  <p className="text-xs text-secondary truncate">{d.description}</p>
                )}
              </div>
              <div className="relative">
                <DateRowMenu
                  onEdit={() => setModal(d)}
                  onDelete={() => setToDelete(d)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <PageFooter
        right={
          <Button size="sm" onClick={() => setModal("new")}>
            <Plus className="size-3.5" /> Add Important Date
          </Button>
        }
      />

      <ImportantDateModal
        open={modal !== null}
        date={modal === "new" ? null : modal}
        isPending={createDate.isPending || updateDate.isPending}
        onClose={() => setModal(null)}
        onSave={async (data) => {
          if (modal === "new") {
            await createDate.mutateAsync(data as Parameters<typeof createDate.mutateAsync>[0]);
          } else if (modal) {
            await updateDate.mutateAsync({ dateId: modal.id, data });
          }
          setModal(null);
        }}
      />

      <ConfirmDeleteModal
        open={!!toDelete}
        title="date"
        entityName={toDelete ? toDelete.dateType : ""}
        isPending={deleteDate.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteDate.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}

function DateRowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="p-1 rounded text-placeholder hover:text-secondary hover:bg-subtle"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-36 bg-card border border-line rounded-lg shadow-md py-1">
          <button type="button" onClick={() => { setOpen(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-label hover:bg-subtle">
            <Pencil className="size-3.5" /> Edit
          </button>
          <button type="button" onClick={() => { setOpen(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-negative hover:bg-negative-muted">
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function useState<T>(init: T): [T, (v: T | ((prev: T) => T)) => void] {
  // re-exported from react via the import at top
  return require("react").useState(init);
}
```

> **Note:** Remove the bottom `useState` shim — it was mistakenly included. The `useState` import at the top of the file covers it. The `import { useState } from "react"` should already be at the top.

- [ ] **Step 4: Fix the important-dates-tab.tsx** — add the proper imports at the top and remove the shim function at the bottom:

```tsx
"use client";

import { useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
// ... rest of imports unchanged
```

Remove the `function useState` shim at the bottom of the file entirely.

- [ ] **Step 5: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/cases/
git commit -m "feat(cases): add Documents tab, Important Dates tab with modal"
```

---

## Task 12: Case creation page (`/cases/new`)

**Files:**
- Create: `apps/web/src/app/(protected)/cases/new/page.tsx`

- [ ] **Step 1: Create `app/(protected)/cases/new/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { usePageTitle } from '@/components/layout/top-bar-context';
import { useCreateCase } from '@/hooks/use-cases';
import { useClientSearch } from '@/hooks/use-clients';
import { Field } from '@/components/ui/input';
import { SelectGroup } from '@/components/ui/select';
import { TextareaField } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PageFooter } from '@/components/ui/page-footer';
import {
  CASE_STAGE_OPTIONS,
  CASE_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COURT_TYPE_OPTIONS,
  PARTY_ROLE_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/lib/options';
import type { CreateCaseInput } from '@/types/cases';
import { cn } from '@/lib/utils';

type NewClientMode = 'search' | 'new';

export default function NewCasePage() {
  usePageTitle({ title: 'Cases', resourceTitle: 'New Case' });
  const router = useRouter();
  const createCase = useCreateCase();

  const [clientMode, setClientMode] = useState<NewClientMode>('search');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { data: searchResults } = useClientSearch(clientSearch);
  const clients = searchResults?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<CreateCaseInput>({
    defaultValues: { status: 'Active' },
    mode: 'onChange',
  });

  const title = watch('title');
  const newClientName = watch('newClient.fullName');
  const newClientPhone = watch('newClient.phone');

  const canSubmit =
    !!title?.trim() &&
    (
      (clientMode === 'search' && !!selectedClientId) ||
      (clientMode === 'new' && !!newClientName?.trim() && !!newClientPhone?.trim())
    );

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function onSubmit(data: CreateCaseInput) {
    const payload: CreateCaseInput = {
      ...data,
      ...(clientMode === 'search'
        ? { clientId: selectedClientId! }
        : { newClient: data.newClient }),
    };
    const result = await createCase.mutateAsync(payload);
    router.push(`/cases/${result.id}?tab=case`);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-page">
        <div className="max-w-2xl mx-auto p-6 space-y-4">

          {/* Required section */}
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
                Required
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <Field
                label="Case Title"
                placeholder="e.g. Sharma v State of AP"
                required
                {...register('title', { required: true })}
              />

              {/* Client selection */}
              <div>
                <label className="text-sm font-medium text-label block mb-2">
                  Client <span className="text-negative">*</span>
                </label>

                {clientMode === 'search' && (
                  <div className="space-y-2">
                    {selectedClientId ? (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-md border border-brand bg-brand-soft">
                        <span className="text-sm font-medium text-brand">{selectedClientName}</span>
                        <button
                          type="button"
                          onClick={() => { setSelectedClientId(null); setSelectedClientName(''); }}
                          className="text-xs text-brand hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search by name or phone…"
                          className="w-full h-9 px-3 rounded-md border border-line bg-card text-sm text-dark placeholder:text-placeholder focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                        {clients.length > 0 && clientSearch.length >= 2 && (
                          <div className="absolute top-10 left-0 right-0 z-20 bg-card border border-line rounded-lg shadow-md max-h-48 overflow-y-auto">
                            {clients.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedClientId(c.id);
                                  setSelectedClientName(c.fullName);
                                  setClientSearch('');
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-subtle border-b border-line last:border-b-0"
                              >
                                <span className="font-medium text-dark">{c.fullName}</span>
                                <span className="text-secondary ml-2 text-xs">{c.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!selectedClientId && (
                      <button
                        type="button"
                        onClick={() => setClientMode('new')}
                        className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                      >
                        <Plus className="size-3" /> Create new client instead
                      </button>
                    )}
                  </div>
                )}

                {clientMode === 'new' && (
                  <div className="space-y-3 p-3 border border-line rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-secondary">New client</span>
                      <button
                        type="button"
                        onClick={() => setClientMode('search')}
                        className="text-xs text-brand hover:underline"
                      >
                        Search existing instead
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Field
                          label="Full Name"
                          required
                          {...register('newClient.fullName', { required: clientMode === 'new' })}
                        />
                      </div>
                      <Field
                        label="Phone"
                        required
                        {...register('newClient.phone', { required: clientMode === 'new' })}
                      />
                      <Controller
                        name="newClient.type"
                        control={control}
                        defaultValue="Individual"
                        render={({ field }) => (
                          <SelectGroup
                            label="Client Type"
                            options={CLIENT_TYPE_OPTIONS}
                            value={field.value ?? 'Individual'}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Client role */}
              <Controller
                name="clientRole"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <SelectGroup
                    label="Client Role"
                    options={PARTY_ROLE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select role"
                    required
                  />
                )}
              />
            </div>
          </div>

          {/* Optional: Case Details */}
          <CollapsibleSection
            title="Case Details"
            expanded={expandedSections['case']}
            onToggle={() => toggleSection('case')}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <Field label="Case Number" {...register('caseNumber')} />
              <Controller
                name="caseType"
                control={control}
                render={({ field }) => (
                  <SelectGroup
                    label="Case Type"
                    options={CASE_TYPE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select type"
                  />
                )}
              />
              <Field label="Filing Date" type="date" {...register('filingDate')} />
              <Controller
                name="stage"
                control={control}
                render={({ field }) => (
                  <SelectGroup
                    label="Stage"
                    options={CASE_STAGE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select stage"
                  />
                )}
              />
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <SelectGroup
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select priority"
                  />
                )}
              />
              <div className="md:col-span-3">
                <TextareaField label="Description" rows={3} {...register('description')} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Optional: Court Details */}
          <CollapsibleSection
            title="Court Details"
            expanded={expandedSections['court']}
            onToggle={() => toggleSection('court')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div className="md:col-span-2">
                <Field label="Court Name" {...register('courtName')} />
              </div>
              <Controller
                name="courtType"
                control={control}
                render={({ field }) => (
                  <SelectGroup
                    label="Court Type"
                    options={COURT_TYPE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select type"
                  />
                )}
              />
              <Field label="Bench No." {...register('benchNumber')} />
              <Field label="State" {...register('courtState')} />
              <Field label="City" {...register('courtCity')} />
            </div>
          </CollapsibleSection>

          {/* Optional: Judge Details */}
          <CollapsibleSection
            title="Judge Details"
            expanded={expandedSections['judge']}
            onToggle={() => toggleSection('judge')}
          >
            <div className="grid grid-cols-2 gap-4 p-4">
              <Field label="Judge Name" {...register('judgeName')} />
              <Field label="Designation" {...register('judgeDesignation')} />
            </div>
          </CollapsibleSection>

        </div>
      </div>

      <PageFooter
        right={
          <>
            <Button variant="secondary" size="sm" onClick={() => router.push('/cases')}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!canSubmit}
              loading={createCase.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              Create Case
            </Button>
          </>
        }
      />
    </div>
  );
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-line hover:bg-subtle transition-colors"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          {title}
          <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-placeholder/70">
            (optional)
          </span>
        </span>
        {expanded ? (
          <ChevronUp className="size-4 text-placeholder" />
        ) : (
          <ChevronDown className="size-4 text-placeholder" />
        )}
      </button>
      {expanded && children}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(protected)/cases/new/
git commit -m "feat(cases): add case creation page /cases/new with required + collapsible optional sections"
```

---

## Task 13: Final typecheck and manual smoke test

- [ ] **Step 1: Full typecheck**

```bash
pnpm --filter web typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Start dev server**

```bash
pnpm --filter web dev
```

- [ ] **Step 3: Manual smoke test checklist**

Open `http://localhost:3000` (or whatever port) and verify:

- [ ] `/cases` loads — shows "Cases — coming soon" replaced by list UI (empty state if no data)
- [ ] `/cases/new` loads — shows required section (Title, Client, Role) and collapsed optional sections
- [ ] `/cases/new` — Create Case button disabled until title + client filled
- [ ] `/cases/[id]` loads — shows case header + tabs
- [ ] `/cases/[id]?tab=hearings` — shows hearings timeline
- [ ] `/cases/[id]?tab=important-dates` — shows important dates list
- [ ] Clicking Edit on a case row in the list navigates to `/cases/[id]`
- [ ] Delete on a row opens ConfirmDeleteModal
- [ ] ConfirmDeleteModal shows "This cannot be undone"
- [ ] PageFooter is visible and sticky at the bottom of the edit page

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(cases): complete cases frontend — list, edit, create pages"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Desktop table (§1.2) — CaseTableRow with all 7 columns
- ✅ Mobile cards (§1.3) — CaseCard
- ✅ Three-dot menu: Edit, View Client, Delete (§1.2)
- ✅ Status tabs + search + filters (§1.4)
- ✅ ConfirmDeleteModal reusable (§3.1)
- ✅ Case tab form sections (§2.3)
- ✅ Client tab with disabled fields (§2.4)
- ✅ Hearings timeline + HearingEditModal (§2.5, §3.2)
- ✅ Documents tab stub (§2.6)
- ✅ Important Dates tab + modal (§2.7, §3.3)
- ✅ Fixed PageFooter per-tab (§2.8)
- ✅ Case creation /cases/new (§4)
- ✅ Design tokens (§0) — Task 1+2
- ✅ Routing with ?tab= query param (§5)

**Gaps flagged:**
- Documents upload (S3) is stubbed — marked out of scope in spec ✓
- `hearingsApi.listByCaseId` returns `Hearing[]` but the backend may return a paginated response — verify the actual API response shape and adjust the type if needed before wiring up
