# Frontend Rules — Next.js, Tailwind, React Query, Zustand

## Stack
- **Framework**: Next.js 16.2.4 (App Router)
- **Styling**: Tailwind CSS v4 (`@theme inline` — two-layer CSS variable token system; no `tailwind.config.ts`)
- **HTTP client**: Axios — instance in `api/client.ts`, typed helpers in `api/http.ts`, feature services in `services/[feature].ts`
- **Server state**: TanStack React Query v5
- **Client state**: Zustand (user object only — no tokens in JS)
- **Forms**: React Hook Form; use `Controller` for Radix UI inputs (Select, MultiSelect, OTP)
- **Toasts**: Sonner — see Toast Placement Rules below
- **Language**: TypeScript (strict)

---

## Next.js Conventions

### App Router Structure

```
apps/web/src/
├── api/
│   ├── client.ts               # Axios instance + 401 → refresh → retry interceptor
│   └── http.ts                 # Typed GET/POST/PUT/PATCH/DELETE helpers
├── services/
│   └── auth.ts                 # authApi object — one file per feature domain
├── hooks/
│   └── use-auth.ts             # useMutation/useQuery hooks — toasts live here
├── store/
│   └── auth-store.ts           # Zustand: user object only
├── types/
│   ├── auth.ts                 # VerifyOtpResponse, SignupPayload
│   ├── user.ts                 # AuthUser
│   └── misc.ts                 # ApiErrorResponse, shared types
├── lib/
│   ├── utils.ts                # cn(), maskEmail()
│   └── options.ts              # DESIGNATION_OPTIONS, PRACTICE_TYPE_OPTIONS (from shared enums)
├── components/
│   ├── ui/                     # Primitive, stateless, zero business logic
│   └── [feature]/              # Feature components, composed from ui/
└── app/
    ├── (auth)/                 # Auth route group — no layout chrome
    │   ├── login/page.tsx
    │   └── signup/page.tsx
    ├── (protected)/            # Authenticated route group — guarded by middleware.ts
    │   ├── layout.tsx          # Dashboard shell with nav + sidebar
    │   ├── dashboard/page.tsx
    │   ├── cases/
    │   │   ├── page.tsx
    │   │   ├── new/page.tsx
    │   │   └── [caseId]/page.tsx
    │   └── settings/page.tsx
    ├── portal/
    │   └── [token]/page.tsx    # Public client portal — no auth
    ├── layout.tsx              # Root layout
    ├── globals.css
    └── providers.tsx           # QueryClientProvider + Toaster
```

### Page Components
Page files (`page.tsx`) are thin — resolve params, render a feature component, wrap with Suspense/Error boundaries. All logic lives in `components/`.

```tsx
// app/(dashboard)/cases/[caseId]/page.tsx
import { CaseDetailView } from '@/components/cases/case-detail-view';

interface Props { params: { caseId: string } }

export default function CaseDetailPage({ params }: Props) {
  return <CaseDetailView caseId={params.caseId} />;
}
```

### Server vs Client Components
Default to Server Components. Add `'use client'` only when needed: `useState`, `useEffect`, event handlers, browser APIs, context. Never put a `'use client'` component in the import chain of a data-fetching server component.

### Route Protection
Protected routes are guarded in `middleware.ts`. No auth checks inside page components.

---

## Component Architecture

```
apps/web/src/components/
├── ui/                         # Primitive, stateless, zero business logic
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── modal.tsx
│   ├── toast.tsx
│   ├── spinner.tsx
│   ├── empty-state.tsx
│   ├── avatar.tsx
│   ├── countdown-badge.tsx
│   └── skeleton.tsx
├── cases/                      # Feature components
├── hearings/
├── dashboard/
├── auth/
├── layout/                     # App shell
│   ├── sidebar.tsx
│   ├── top-nav.tsx
│   └── bottom-nav.tsx
└── shared/                     # Cross-feature, non-primitive
    ├── empty-state.tsx
    └── error-boundary.tsx
```

### Component Rules
1. `ui/` components: no business logic, no data fetching, no Zustand
2. Feature components: domain-aware, composed from `ui/`
3. All props explicitly typed — no `any`, no implicit `{}`
4. Components do not fetch data directly — they use query hooks
5. One component per file; file name matches component in kebab-case

---

## Axios API Client — Three-Layer Pattern

All backend communication follows the same three-layer structure:

```
api/client.ts        ← Axios instance: baseURL, withCredentials, 401 interceptor
api/http.ts          ← Typed helpers: GET<T>, POST<T>, PUT<T>, PATCH<T>, DELETE<T>
services/[name].ts   ← Feature API object: casesApi, authApi, hearingsApi, etc.
```

**The 401 interceptor (in `api/client.ts`):** when any request returns 401, it calls `POST /auth/refresh` once (using the refresh cookie), then retries the original request. If refresh also fails, it redirects to `/login`. This happens transparently — hooks and components never see the refresh logic.

**The response interceptor** unwraps the `{ success: true, data: ... }` envelope automatically. Everything downstream receives the inner payload only.

```ts
// services/cases.ts — follows this pattern exactly
import { GET, POST, PATCH, DELETE } from "@/api/http";
import type { Case, CreateCaseInput } from "@/types/cases";

export const casesApi = {
  list: (filters: CaseFilters) => GET<PaginatedResult<Case>>("/cases", { params: filters }),
  getById: (id: string) => GET<Case>(`/cases/${id}`),
  create: (data: CreateCaseInput) => POST<Case>("/cases", data),
  update: (id: string, data: UpdateCaseInput) => PATCH<Case>(`/cases/${id}`, data),
  archive: (id: string) => DELETE<void>(`/cases/${id}`),
};
```

No raw `fetch` in components or hooks. No raw `axios.get(...)` in services — use the `http.ts` helpers.

---

## Tailwind — The 4-Class Rule

If any HTML element needs **more than 4 Tailwind utility classes**, extract it to a named class in `globals.css`.

```tsx
// ❌ Too many inline classes — hard to read, inconsistent across the app
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">

// ✅ Extract to a semantic class
<div className="case-card">
```

```css
/* app/globals.css */
@layer components {
  .case-card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
    @apply hover:shadow-md transition-shadow duration-200 cursor-pointer;
  }
}
```

### CSS Class Naming
Classes in `globals.css` use kebab-case. Modifiers use `--`:
- `.case-card` — component
- `.case-card--overdue` — modifier
- `.hearing-badge` — component
- `.hearing-badge--today` — modifier

---

## Design Tokens — Tailwind v4 Token System

This project uses Tailwind v4 with `@theme inline`. There is **no `tailwind.config.ts`**. Token mapping is done entirely in `globals.css`.

```css
/* globals.css — two-layer structure */

/* Layer 1: @theme inline — maps Tailwind utility names to CSS variables */
@theme inline {
  --color-primary: var(--primary);
  --color-panel: var(--panel);
  --color-dark: var(--text);
  --color-secondary: var(--text-secondary);
  --color-disabled: var(--text-muted);
  --color-brand: var(--primary);
  --color-border: var(--border);
  /* ... etc */
}

/* Layer 2: :root — actual color values */
:root {
  --primary: #1e40af;
  --panel: #0c1445;
  --text: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  /* ... etc */
}
```

Usage: `bg-primary`, `text-dark`, `text-secondary`, `border-border`, `text-brand`, `text-disabled`.

Read the actual values from `apps/web/src/app/globals.css` — it is the source of truth. Never hardcode hex values in component files.

---

## No Inline Styles

Inline `style` props are banned unless the value is genuinely dynamic and cannot be a Tailwind class:

```tsx
// ❌ Banned
<div style={{ color: '#E74C3C', fontWeight: 'bold' }}>Overdue</div>

// ✅ Use a class
<div className="text-danger font-semibold">Overdue</div>

// ✅ Dynamic value — acceptable exception
<div style={{ width: `${progressPercent}%` }} className="progress-bar-fill" />
```

---

## Data Fetching — React Query

All server data fetching uses React Query. No `useEffect` + `fetch` patterns.

### Query Keys — Always Use a Factory

Every hook file that has `useQuery` calls must export a `*Keys` factory. Never hardcode query key strings in components.

```ts
// hooks/use-cases.ts
export const caseKeys = {
  all: ['cases'] as const,
  list: (filters: CaseFilters) => ['cases', 'list', filters] as const,
  detail: (id: string) => ['cases', 'detail', id] as const,
};
```

### Query Hooks

```ts
export function useCases(filters: CaseFilters) {
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
```

### Mutations — Invalidate in `onSuccess`

```ts
export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Case created.");
    },
    onError: (err) => toast.error(err.message || "Failed to create case."),
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => casesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success("Case updated.");
    },
    onError: (err) => toast.error(err.message || "Failed to update case."),
  });
}
```

Standard invalidation rules:
| Mutation | Invalidate |
|---|---|
| Create resource | `keys.all` |
| Update resource | `keys.detail(id)` + `keys.all` |
| Delete / archive resource | `keys.all` |
| Logout | `queryClient.clear()` — wipe everything |

All API calls go through `services/[feature].ts` → `api/http.ts` → `api/client.ts`. No raw `fetch` or `axios` calls in components.

---

## Toast Placement Rules

**All API result toasts belong in the hook's `onSuccess`/`onError` — not in the component.**

```ts
// ✅ Correct — hook owns the outcome toast
export function useCreateCase() {
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => toast.success("Case created."),
    onError: (err) => toast.error(err.message || "Failed to create case."),
  });
}

// ❌ Wrong — component duplicates toast after mutateAsync
const createCase = useCreateCase();
async function handleSubmit(data) {
  await createCase.mutateAsync(data);
  toast.success("Case created."); // already fired by the hook
}
```

**Local UX toasts (no API call involved) belong in the component.**

```ts
// ✅ A validation or UX event with no API call — component is right
if (selectedItems.length === 0) {
  toast.warning("Select at least one item.");
  return;
}
```

Rule summary:
| Toast trigger | Where |
|---|---|
| API call succeeded | hook `onSuccess` |
| API call failed | hook `onError` |
| Client-side validation failed | component |
| UX event (step transition, etc.) | component |

Components that call `mutateAsync` handle **step transitions** in `try/catch` — not toast calls:

```ts
// The hook fires the toast. The component handles what to do next.
async function handleSubmit({ email }) {
  await requestOtp.mutateAsync({ email }); // hook fires onSuccess toast
  onSuccess(email);                         // component advances the step
}
```

---

## Global State — Zustand

For global UI state and auth session only. Not for server data (that is React Query's job).

```ts
// store/auth-store.ts — holds user object only, NO access token
interface AuthState {
  user: AuthUser | null;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setAuth: (user) => set({ user }),
  clearAuth: () => set({ user: null }),
}));
```

The access token is an httpOnly cookie — JavaScript cannot read it. The store holds only the user object. On page reload the store is empty until a `/auth/me` call rehydrates it.

Good candidates for Zustand: auth user, sidebar collapse state, active modal. Everything else: component state or React Query.

---

## Loading and Error States — Always Handle

Every data-fetching component handles all three states:

```tsx
export function CaseList({ filters }: CaseListProps) {
  const { data: cases, isLoading, isError, refetch } = useCases(filters);

  if (isLoading) return <CaseListSkeleton />;
  if (isError) return (
    <EmptyState message="Could not load cases." action={{ label: 'Retry', onClick: refetch }} />
  );
  if (!cases?.length) return (
    <EmptyState message="No cases yet." action={{ label: 'Add Case', href: '/cases/new' }} />
  );

  return (
    <div className="case-list">
      {cases.map(case_ => <CaseCard key={case_.id} case_={case_} />)}
    </div>
  );
}
```

Never render `undefined` silently — always show the user something meaningful.

---

## Responsive Design — Every Component, Every Screen

Advocates use Splexa on their phones standing outside courtrooms. The mobile experience is not a nice-to-have — it is the primary use case. Every component must work correctly on both mobile and desktop before it is considered done.

### Mobile-First CSS — Non-Negotiable

Base styles are mobile. Desktop styles layer on top with `md:` and `lg:` prefixes. Never invert this.

```tsx
// ✅ Mobile-first: stacked on small, row on large
<div className="flex flex-col lg:flex-row gap-4">

// ❌ Desktop-first: will not adapt correctly
<div className="flex flex-row sm:flex-col">
```

### Layout Patterns by Breakpoint

| Element | Mobile (`< md`) | Desktop (`md+`) |
|---|---|---|
| Page layout | Full-width single column | Sidebar + content area |
| Navigation | Bottom tab bar (fixed) | Left sidebar |
| Modals / drawers | Slide-up bottom drawer | Centered modal |
| Data tables | Stacked cards | Row-based table |
| Action buttons | Fixed bottom bar | Inline or top-right |
| Filters | Collapsed behind a button | Visible sidebar or top bar |
| Case card | Full-width card | Card in grid |

### Touch and Tap Rules

- **Minimum tap target**: `min-h-[44px] min-w-[44px]` on every interactive element — buttons, links, list items
- **Touch feedback**: `active:scale-95` or `active:bg-*` on every tappable element — users must feel the tap
- **Readable text**: `text-base` (16px) minimum for all body text on mobile — no `text-xs` for important information
- **No horizontal scroll**: no fixed-width element wider than the viewport — use `max-w-full`, `overflow-x-hidden`, or `w-full`
- **Smooth scroll**: `-webkit-overflow-scrolling: touch` on scrollable lists for iOS momentum

### Before Claiming a Component Done

Test the component at both viewports before declaring it complete. A component that only works on desktop is not done.

| Check | Mobile | Desktop |
|---|---|---|
| Layout renders without horizontal overflow | ✅ | ✅ |
| All text is readable (≥ 16px body) | ✅ | ✅ |
| All tap targets are ≥ 44px | ✅ | ✅ |
| Navigation is visible and reachable | Bottom tab bar | Sidebar |
| Modals/drawers open correctly | Slide-up drawer | Centered modal |
| Lists and cards display correctly | Full-width stacked | Grid or table |

---

## Form Patterns

1. Validate on `blur`, not only `submit`
2. Inline error messages below each field
3. Submit button is disabled + shows spinner during mutation
4. On success: success toast, redirect or form reset
5. On error: error shown inline or in toast, form data preserved

```tsx
const createCase = useCreateCase();

<Button onClick={handleSubmit} isLoading={createCase.isPending} disabled={!isValid}>
  Create Case
</Button>
```

---

## UX Rules (From Product Spec)

1. Every button shows a spinner during async operations — never leave the user guessing
2. Every successful mutation shows a toast
3. Error messages in plain language — "OTP expired. Please request a new one." not error codes
4. Every list has an empty state with a CTA — never a blank screen
5. Back navigation always works — use `router.back()` for in-app navigation

---

## Import Grouping

```ts
// 1. React / Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. External packages
import { useQuery } from '@tanstack/react-query';

// 3. Workspace packages
import type { Case } from '@splexa/shared';

// 4. Internal aliases
import { useCases } from '@/hooks/use-cases';
import { CaseCard } from '@/components/cases/case-card';
```

One blank line between each group. No unused imports.

---

## API Client — Three Layers

See the **Axios API Client — Three-Layer Pattern** section above. The structure is:

```
api/client.ts       ← Axios instance + interceptors (no feature knowledge)
api/http.ts         ← Typed GET/POST/PUT/PATCH/DELETE helpers
services/[name].ts  ← Feature API object (cases, hearings, auth, etc.)
```

The feature service is the only import hooks use. No hook or component imports from `api/` directly.

```ts
// ✅ hooks import from services/
import { casesApi } from "@/services/cases";

// ❌ hooks do not import raw http helpers
import { GET } from "@/api/http";
```

---

## JWT Storage — Security Rule

Access tokens and refresh tokens are **httpOnly cookies** — JavaScript never reads them. The Zustand store holds **only the user object**, never a token.

```ts
// ✅ Correct
useAuthStore.getState().user          // safe — user object from verifyOtp response

// ❌ Wrong — tokens are not in the store
useAuthStore.getState().accessToken   // does not exist
```

The 401 → refresh → retry cycle is handled entirely by the axios interceptor in `api/client.ts`. No hook or component needs to know about token refresh.

---

## `'use client'` Boundary Rules

Default to Server Component. Add `'use client'` only when the component uses:
- `useState`, `useReducer`, `useEffect`, `useRef`
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `document`, `navigator`)
- Context that holds client state

**Cost:** the component and all its subtree opt out of server rendering. Push the boundary as far down the tree as possible.

```tsx
// ❌ Entire view becomes client because one leaf needs state
'use client';
export function CaseDetailView({ caseId }: Props) {
  // All of this could be server-rendered
  return <div>...</div>;
}

// ✅ Only the interactive island is client — in its own file
// case-archive-button.tsx
'use client';
export function CaseArchiveButton({ caseId }: { caseId: string }) {
  const archive = useArchiveCase();
  return <Button onClick={() => archive.mutate(caseId)}>Archive</Button>;
}

// case-detail-view.tsx — Server Component
import { CaseArchiveButton } from './case-archive-button';
export function CaseDetailView({ caseId }: Props) {
  return (
    <div>
      <CaseHeader caseId={caseId} />
      <CaseArchiveButton caseId={caseId} />
    </div>
  );
}
```

---

## Environment Variables (Frontend)

Only `NEXT_PUBLIC_*` variables are available in the browser bundle. Everything else is silently `undefined` at runtime — not a build error.

```ts
// ✅ Available in browser
process.env.NEXT_PUBLIC_API_URL

// ❌ Silently undefined in browser — never use in client code
process.env.DATABASE_URL
process.env.JWT_SECRET
```

Validate required public env vars at import time in `lib/env.ts`:

```ts
// apps/web/src/lib/env.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not set');

export const env = { API_URL } as const;
```

Import from `@/lib/env` in client code — never access `process.env` directly in components.

---

## Navigation Rules

| Situation | Use |
|---|---|
| Link in JSX | `<Link href="...">` from `next/link` |
| Programmatic navigation after a mutation | `router.push(...)` from `useRouter` |
| Back navigation | `router.back()` |
| External link | `<a href="..." target="_blank" rel="noopener noreferrer">` |
| Redirect inside a Server Component | `redirect(...)` from `next/navigation` |

Never use `window.location.href` for in-app navigation — it triggers a full page reload.

---

## React Query — Default Configuration

Set defaults in the root `QueryClientProvider`. Override per-query only when there's a specific reason.

```tsx
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min — reduces unnecessary background refetches
      retry: 1,                     // One retry on failure; fail fast after that
      refetchOnWindowFocus: false,  // Avoid jarring refetches when switching tabs
    },
  },
});
```

Override examples:
- `staleTime: 0` — real-time data that must always be fresh
- `staleTime: Infinity` — reference data (roles, org config) that rarely changes
- `retry: 0` — mutations should never retry automatically

---

## Forbidden — Frontend

| Forbidden | Why |
|---|---|
| `localStorage` / `sessionStorage` for tokens | XSS can steal the token |
| Storing `accessToken` in Zustand | Tokens are httpOnly cookies; store holds user object only |
| Raw `fetch` or `axios.get(...)` in components or hooks | Use `services/[feature].ts` → `api/http.ts` |
| `toast()` in component for an API outcome | Hook `onSuccess`/`onError` owns API result toasts |
| `useEffect` for data fetching | React Query handles this — no exceptions |
| Hardcoded hex colors or `style={{ color/background }}` | Breaks theming; use design tokens |
| Fixed-width elements without `max-w-full` or `w-full` | Causes horizontal scroll on mobile |
| Desktop-first CSS (`flex-row sm:flex-col`) | Layout breaks on phones — always start mobile |
| Touch targets smaller than `min-h-[44px]` | Unusable on mobile — fingers miss small targets |
| `text-xs` for important information on mobile | Below readable threshold — use `text-sm` minimum |
| `<div onClick>` for interactive elements | Not keyboard accessible; use `<button>` |
| `any` in props or hook return types | Defeats TypeScript |
| `process.env.SECRET` in client code | Silently `undefined` in browser — secrets stay server-side |
| Auth checks inside page components | `middleware.ts` owns this — no duplication |
| Importing from another feature's components directly | Feature isolation; go through `shared/` or `ui/` |
| `window.location.href` for in-app navigation | Full page reload; use `router.push` |
| `'use client'` at the top of a page file | Pages should be Server Components by default |

---

## AI Agent Self-Check — Frontend Code

Before declaring frontend work done:

**Component structure**
- [ ] `'use client'` only where state/events/browser APIs are actually used
- [ ] Page file is thin — renders one feature component, no logic
- [ ] All props explicitly typed — no `any`, no implicit `{}`
- [ ] Loading, error, and empty states all handled

**Data fetching**
- [ ] All server data via React Query — no `useEffect` + `fetch`
- [ ] Query key uses the feature's `*Keys` factory (exported from the hooks file)
- [ ] Mutation `onSuccess` invalidates the relevant query keys + shows a toast
- [ ] Mutation `onError` shows an error toast with the server message or a fallback
- [ ] API call goes through `services/[feature].ts` → `api/http.ts` — not raw `fetch` or `axios`

**Toasts**
- [ ] API result toasts (`onSuccess`, `onError`) are in the hook — not in the component
- [ ] Component only has toasts for local UX events (no API involved)

**Styling**
- [ ] Elements with > 4 Tailwind classes extracted to a `globals.css` component class
- [ ] No hardcoded hex values or dynamic `style={{ color/bg }}` props

**Responsive (both viewports required — not optional)**
- [ ] Base CSS styles are mobile — desktop enhancements use `md:`/`lg:` prefixes, never inverted
- [ ] No horizontal scroll on mobile — no fixed-width elements wider than viewport
- [ ] All interactive elements have `min-h-[44px]` tap target
- [ ] Body text is `text-base` (16px) minimum — no `text-xs` for important content on mobile
- [ ] Layout follows the responsive pattern: bottom nav on mobile, sidebar on desktop
- [ ] Modals become slide-up drawers on mobile where the pattern applies

**Security**
- [ ] No token stored in `localStorage` or `sessionStorage`
- [ ] No server-only env var accessed in client code (missing `NEXT_PUBLIC_` prefix)
- [ ] Auth guard lives in `middleware.ts`, not in the page component

**Quality**
- [ ] No unused imports
- [ ] Import groups in order, separated by blank lines
- [ ] No `console.log` left in committed code