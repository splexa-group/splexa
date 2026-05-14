# Frontend Rules — Next.js, Tailwind, React Query, Zustand

## Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + CSS custom properties
- **Server state**: TanStack React Query v5
- **Client state**: Zustand
- **Language**: TypeScript (strict)

---

## Next.js Conventions

### App Router Structure

```
apps/web/src/app/
├── (auth)/                     # Auth route group (no layout chrome)
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (dashboard)/                # Authenticated layout group
│   ├── layout.tsx              # Dashboard shell with nav + sidebar
│   ├── page.tsx                # /dashboard
│   ├── cases/
│   │   ├── page.tsx            # /cases list
│   │   ├── new/page.tsx        # /cases/new
│   │   └── [caseId]/page.tsx   # /cases/:id
│   └── settings/page.tsx
├── portal/
│   └── [token]/page.tsx        # Public client portal — no auth
├── layout.tsx                  # Root layout
└── globals.css
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

## Design Tokens — Colors from `index.css` / `globals.css`

> ⚠️ **The colors below are examples only.** Do not use them as-is.
>
> When starting a project or adding color tokens: **ask the user what colors to use**, or read them from the project's existing `index.css` / `globals.css`. The `.md` skill files are not the source of truth for colors — the CSS file is.

Example structure (actual values are decided by the product designer / user):

```css
/* app/globals.css */
/* ⚠️ Example values — replace with actual brand colors */
:root {
  --color-primary: #1E3A5F;      /* example — main brand color */
  --color-accent: #2E86AB;       /* example — secondary/links */
  --color-cta: #E07B39;          /* example — primary CTA buttons */
  --color-success: #27AE60;      /* example — success states */
  --color-warning: #E67E22;      /* example — warnings */
  --color-danger: #E74C3C;       /* example — errors, urgent */
  --color-surface: #F5F5F5;      /* example — page background */
  --color-card: #FFFFFF;         /* example — card backgrounds */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-border: #E5E7EB;

  --radius-card: 8px;
  --radius-input: 4px;
  --radius-badge: 24px;
  --spacing-unit: 8px;
  --font-primary: 'Inter', system-ui, sans-serif;
}
```

Map these CSS variables to Tailwind tokens in `tailwind.config.ts`:

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Map to CSS variables so dark mode and theming work
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        cta: 'var(--color-cta)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
      },
    },
  },
};
```

Usage:
```tsx
// ✅ Use tokens
<button className="bg-cta text-white">Add Case</button>

// ❌ Never hardcode hex values
<button style={{ backgroundColor: '#E07B39' }}>Add Case</button>
<button className="bg-[#E07B39]">Add Case</button>
```

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

```ts
// hooks/use-cases.ts
export const caseKeys = {
  all: ['cases'] as const,
  list: (filters: CaseFilters) => ['cases', 'list', filters] as const,
  detail: (id: string) => ['cases', 'detail', id] as const,
};

export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: caseKeys.list(filters),
    queryFn: () => casesApi.list(filters),
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
    },
  });
}
```

All API calls go through a typed client in `lib/api/` — no raw `fetch` in components.

---

## Global State — Zustand

For global UI state and auth session only. Not for server data (that is React Query's job).

```ts
// stores/auth-store.ts
export const useAuthStore = create<AuthStore>((set) => ({
  user: null, // { userId, orgId, role, name }
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

Good candidates: auth user, sidebar state, active modal, toast queue. Everything else: component state or React Query.

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

## Mobile-First Rules

All layouts start from mobile and scale up. Base styles are mobile, `md:` and `lg:` add desktop enhancements.

```tsx
// ✅ Mobile-first
<div className="flex flex-col lg:flex-row gap-4">

// ❌ Desktop-first
<div className="flex flex-row sm:flex-col">
```

Minimum tap target: `min-h-[44px] min-w-[44px]` on all interactive elements. Touch feedback: `active:scale-95` on buttons. No horizontal scroll on mobile.

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

## API Client — `lib/api/`

All backend communication goes through typed API functions. No raw `fetch` in components or hooks.

```
lib/api/
├── client.ts        # Base fetch wrapper: auth header, error handling
├── cases.ts
├── hearings.ts
├── auth.ts
└── index.ts         # Re-exports all modules
```

```ts
// lib/api/client.ts
import { useAuthStore } from '@/stores/auth-store';
import { env } from '@/lib/env';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${env.API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, body.message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}
```

```ts
// lib/api/cases.ts
import type { Case, CreateCaseInput, CaseFilters, PaginatedResult } from '@splexa/shared';
import { apiRequest } from './client';

export const casesApi = {
  list: (filters: CaseFilters) =>
    apiRequest<PaginatedResult<Case>>(`/cases?${new URLSearchParams(filters as Record<string, string>)}`),

  getById: (id: string) =>
    apiRequest<Case>(`/cases/${id}`),

  create: (data: CreateCaseInput) =>
    apiRequest<Case>('/cases', { method: 'POST', body: JSON.stringify(data) }),

  archive: (id: string) =>
    apiRequest<void>(`/cases/${id}`, { method: 'DELETE' }),
};
```

---

## JWT Storage — Security Rule

Access tokens live in **Zustand (in-memory) only**. Never in `localStorage`, `sessionStorage`, or a JavaScript-readable cookie.

```ts
// stores/auth-store.ts
interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;  // In-memory — lost on reload (intentional)
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}
```

The refresh token is an `httpOnly` + `Secure` + `SameSite=Strict` cookie — JavaScript never reads it. On page reload, silently call `/auth/refresh` to restore the session.

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
| `localStorage` / `sessionStorage` for access tokens | XSS can steal the token |
| Raw `fetch` in components or hooks | Bypasses typed API client and error handling |
| `useEffect` for data fetching | React Query handles this — no exceptions |
| Hardcoded hex colors or `style={{ color/background }}` | Breaks theming; use design tokens |
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
- [ ] Query key uses the feature's `*Keys` factory
- [ ] Mutation `onSuccess` invalidates the relevant query keys
- [ ] API call goes through `lib/api/` — not raw `fetch`

**Styling**
- [ ] Elements with > 4 Tailwind classes extracted to a `globals.css` component class
- [ ] No hardcoded hex values or dynamic `style={{ color/bg }}` props
- [ ] Mobile-first: base styles are mobile, `md:`/`lg:` scale up
- [ ] All interactive elements have `min-h-[44px]` tap target

**Security**
- [ ] No token stored in `localStorage` or `sessionStorage`
- [ ] No server-only env var accessed in client code (missing `NEXT_PUBLIC_` prefix)
- [ ] Auth guard lives in `middleware.ts`, not in the page component

**Quality**
- [ ] No unused imports
- [ ] Import groups in order, separated by blank lines
- [ ] No `console.log` left in committed code