# Frontend Feature-Based Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `apps/web/src` from type-based folders (`hooks/`, `services/`, `types/`) into feature-based modules (`features/[name]/`), fix the layout-spacing and thin-page inconsistencies found along the way, and leave the app functionally identical to today.

**Architecture:** Each feature (`auth`, `cases`, `hearings`, `important-dates`, `clients`, `documents`, `calendar`, `dashboard`, `settings`) gets its own `features/[name]/{components,hooks,services,types}` folder, moved with `git mv` to preserve history. A new `PageLayout` component replaces the unused `.page-shell` CSS and the inconsistently-used `PageContent` component as the single owner of page-level gutter/max-width/vertical rhythm. No new test framework — verification is `tsc --noEmit` (via a new `typecheck` script) plus a manual smoke test, since this branch has no existing frontend test suite.

**Tech Stack:** Next.js 16 App Router, TypeScript (strict), Tailwind v4, React Query v5, Zustand, pnpm/Turborepo monorepo.

## Global Constraints

- `orgId` handling, backend layering, and all backend rules are untouched — this plan is frontend-only.
- No `any`, no `!`, no `@ts-ignore` in any new or edited code.
- Frontend files stay kebab-case (CLAUDE.md rule #9 scopes the `[name].[role].ts` dot-convention to backend modules only).
- No raw `fetch`/`axios` in components or hooks; all API calls stay behind `services/[feature].ts` → `api/http.ts` → `api/client.ts`.
- No `useEffect` for server data — React Query only.
- Toast calls for API outcomes (`onSuccess`/`onError`) stay in the feature's hook file, never in a component.
- Comments in any new/edited code: minimal, only where something genuinely isn't obvious from the code itself — no restating what a line already says.
- Every task must leave `pnpm --filter web typecheck` passing before its commit — this is the plan's substitute for automated tests, since no frontend test framework exists yet (out of scope to add one here).
- `sed -i ''` (note the empty string argument) is required on this machine's BSD `sed` — every sed command below already includes it.
- Full spec: `docs/specs/2026-08-01-frontend-feature-restructure-design.md` — read it once before starting; every task below implements a specific section of it.

---

### Task 1: Add a `typecheck` script to `apps/web`

**Files:**
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces: `pnpm --filter web typecheck` — every later task's verification step depends on this existing.

- [ ] **Step 1: Add the script**

`apps/server/package.json` already has `"typecheck": "tsc --noEmit"`. Add the same line to `apps/web/package.json`'s `scripts` block:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
```

- [ ] **Step 2: Verify it runs clean on the current (pre-refactor) tree**

Run: `pnpm --filter web typecheck`
Expected: exits with no output and status 0 (the codebase compiles today; this just confirms the script itself is wired correctly before it becomes the gate for every later task).

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json
git commit -m "chore(web): add typecheck script"
```

---

### Task 2: `PageLayout` component, `constants/`, and shared modals (additive — nothing deleted yet)

**Files:**
- Create: `apps/web/src/components/layout/page-layout.tsx`
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/constants/options.ts` (moved from `lib/options.ts`)
- Modify: 14 files that import `@/lib/options` (listed in Step 3)
- Create: `apps/web/src/components/shared/modal.tsx`, `apps/web/src/components/shared/confirm-delete.tsx` (moved from `components/modals/`)
- Modify: files importing `@/components/modals/modal` or `@/components/modals/confirm-delete` (listed in Step 5)
- Modify: `apps/web/src/components/layout/sidebar/nav-items.ts`

**Interfaces:**
- Produces: `PageLayout` component (`maxWidth: "small"|"medium"|"large"|"full"`, `padded?: boolean`, default `medium`/`true`) — every later feature task imports this from `@/components/layout/page-layout`.
- Produces: `@/constants/options` — replaces `@/lib/options` as the import path for `DESIGNATION_OPTIONS`, `PRACTICE_TYPE_OPTIONS`, `CASE_STATUS_OPTIONS`, `CASE_TYPE_OPTIONS`, `CLIENT_TYPE_OPTIONS`, `RELATION_TYPE_OPTIONS`, `formatEnumLabel` (whatever that file currently exports — the move only changes the path, not the exports).
- Produces: `@/components/shared/modal`, `@/components/shared/confirm-delete` — replace `@/components/modals/modal`, `@/components/modals/confirm-delete`.

- [ ] **Step 1: Create `PageLayout`**

```tsx
// apps/web/src/components/layout/page-layout.tsx
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageMaxWidth = "small" | "medium" | "large" | "full";

const pageMaxWidthClass: Record<PageMaxWidth, string> = {
  small: "max-w-xl",
  medium: "max-w-2xl",
  large: "max-w-6xl",
  full: "",
};

interface PageLayoutProps {
  maxWidth?: PageMaxWidth;
  // false when the content already owns its own gutter (a FiltersBar + DataTable pair) —
  // PageLayout then only contributes the max-width cap
  padded?: boolean;
  children: ReactNode;
  className?: string;
}

export function PageLayout({
  maxWidth = "medium",
  padded = true,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        "page-layout",
        pageMaxWidthClass[maxWidth],
        padded && "page-layout--padded",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Add its CSS, right after the (still present, not yet deleted) `.page-shell` block**

In `apps/web/src/app/globals.css`, find:

```css
  /*  Page shell — applied to <main>; owns the horizontal gutter for all pages  */
  .page-shell {
    @apply px-4 md:px-6;
  }
```

Add immediately after it:

```css
  .page-layout {
    @apply mx-auto w-full;
  }
  .page-layout--padded {
    @apply px-4 md:px-6 py-6;
  }
```

- [ ] **Step 3: Move `lib/options.ts` to `constants/options.ts` and fix its consumers**

```bash
mkdir -p apps/web/src/constants
git mv apps/web/src/lib/options.ts apps/web/src/constants/options.ts
```

Update every current consumer's import path (same 14 files found during the design investigation):

```bash
cd apps/web/src
grep -rl '@/lib/options' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/lib/options#@/constants/options#g'
```

- [ ] **Step 4: Verify Step 3**

Run: `grep -rl '@/lib/options' apps/web/src` — expect no output (zero remaining references).
Run: `pnpm --filter web typecheck` — expect it to pass.

- [ ] **Step 5: Move the generic modal primitives to `components/shared/`**

```bash
mkdir -p apps/web/src/components/shared
git mv apps/web/src/components/modals/modal.tsx apps/web/src/components/shared/modal.tsx
git mv apps/web/src/components/modals/confirm-delete.tsx apps/web/src/components/shared/confirm-delete.tsx
```

Fix every current consumer (these two files are imported both by files that will move to `features/` later, and by files that stay — fixing the path now means later feature-move tasks never have to touch it again):

```bash
cd apps/web/src
grep -rl '@/components/modals/modal"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/modals/modal"#@/components/shared/modal"#g'
grep -rl '@/components/modals/confirm-delete' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/modals/confirm-delete#@/components/shared/confirm-delete#g'
```

- [ ] **Step 6: Verify Step 5**

Run: `grep -rl '@/components/modals/modal"\|@/components/modals/confirm-delete' apps/web/src` — expect no output.
Run: `pnpm --filter web typecheck` — expect it to pass.

- [ ] **Step 7: Clean up `nav-items.ts`**

In `apps/web/src/components/layout/sidebar/nav-items.ts`:
- Delete the commented-out line `// { label: 'Clients', href: '/clients', icon: User },` — dead code, not a real gap (clients have no standalone route, they're only viewed inside a case).
- Convert every single-quoted string in the file to double quotes, matching the rest of the codebase (e.g. `'Dashboard'` → `"Dashboard"`, `'/dashboard'` → `"/dashboard"`, and so on for every entry and the `import type { LucideIcon } from 'lucide-react'` line).

- [ ] **Step 8: Verify Step 7**

Run: `pnpm --filter web typecheck` — expect it to pass.
Run: `pnpm --filter web lint` — expect no new errors from the quote-style change.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/components/layout/page-layout.tsx apps/web/src/app/globals.css \
        apps/web/src/constants apps/web/src/lib/options.ts \
        apps/web/src/components/shared apps/web/src/components/modals \
        apps/web/src/components/layout/sidebar/nav-items.ts
git add -u
git commit -m "feat(web): add PageLayout, move options/shared modals to their final homes"
```

---

### Task 3: Feature — `auth`

**Files:**
- Move: `hooks/use-auth.ts`, `services/auth.ts`, `types/auth.ts`, `components/auth/**` → `features/auth/`

**Interfaces:**
- Produces: `@/features/auth/hooks/use-auth`, `@/features/auth/services/auth`, `@/features/auth/types/auth`, `@/features/auth/components/*` — used by `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, and `components/layout/sidebar` (for `authApi.logout`).

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/auth/hooks apps/web/src/features/auth/services apps/web/src/features/auth/types
git mv apps/web/src/hooks/use-auth.ts apps/web/src/features/auth/hooks/use-auth.ts
git mv apps/web/src/services/auth.ts apps/web/src/features/auth/services/auth.ts
git mv apps/web/src/types/auth.ts apps/web/src/features/auth/types/auth.ts
git mv apps/web/src/components/auth apps/web/src/features/auth/components
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-auth' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-auth#@/features/auth/hooks/use-auth#g'
grep -rl '@/services/auth"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/auth"#@/features/auth/services/auth"#g'
grep -rl '@/types/auth"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/auth"#@/features/auth/types/auth"#g'
grep -rl '@/components/auth/' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/auth/#@/features/auth/components/#g'
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes. If it doesn't, the error output names the file and line — open it and point the import at the new path from Step 2's substitutions.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/features/auth apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/components
git commit -m "refactor(web): move auth into features/auth"
```

---

### Task 4: Feature — `hearings`

**Files:**
- Move: `hooks/use-hearings.ts`, `services/hearings.ts`, `types/hearings.ts`, `components/cases/hearing-details/**`, `components/modals/add-hearing.tsx` → `features/hearings/`

**Interfaces:**
- Produces: `@/features/hearings/hooks/use-hearings` (`useHearings`, `useCreateHearing`, `useUpdateHearing`, `useDeleteHearing`), `@/features/hearings/components/hearings` (`HearingsDetails`), `@/features/hearings/components/modals/add-hearing` (`AddHearingModal`) — consumed later by the `cases` feature task (Task 11).

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/hearings/hooks apps/web/src/features/hearings/services apps/web/src/features/hearings/types apps/web/src/features/hearings/components/modals
git mv apps/web/src/hooks/use-hearings.ts apps/web/src/features/hearings/hooks/use-hearings.ts
git mv apps/web/src/services/hearings.ts apps/web/src/features/hearings/services/hearings.ts
git mv apps/web/src/types/hearings.ts apps/web/src/features/hearings/types/hearings.ts
git mv apps/web/src/components/cases/hearing-details/hearings.tsx apps/web/src/features/hearings/components/hearings.tsx
git mv apps/web/src/components/cases/hearing-details/hearing-card.tsx apps/web/src/features/hearings/components/hearing-card.tsx
git mv apps/web/src/components/cases/hearing-details/hearing-status.ts apps/web/src/features/hearings/components/hearing-status.ts
git mv apps/web/src/components/modals/add-hearing.tsx apps/web/src/features/hearings/components/modals/add-hearing.tsx
rmdir apps/web/src/components/cases/hearing-details
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-hearings' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-hearings#@/features/hearings/hooks/use-hearings#g'
grep -rl '@/services/hearings"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/hearings"#@/features/hearings/services/hearings"#g'
grep -rl '@/types/hearings"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/hearings"#@/features/hearings/types/hearings"#g'
grep -rl '@/components/modals/add-hearing' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/modals/add-hearing#@/features/hearings/components/modals/add-hearing#g'
```

The two files that stayed in place (`./hearing-card`, `./hearing-status` relative imports inside `hearings.tsx`) don't need a path fix — they moved together and their relative import stays correct.

- [ ] **Step 3: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes. Note `hearings.tsx` still imports `useCase` from `@/hooks/use-cases` and `Section`/`Button` from `@/components/ui/*` — those are untouched by this task (cases feature moves in Task 11), so they should already resolve fine.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/features/hearings apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/components
git commit -m "refactor(web): move hearings into features/hearings"
```

---

### Task 5: Feature — `important-dates`

**Files:**
- Move: `hooks/use-important-dates.ts`, `services/important-dates.ts`, `types/important-dates.ts`, `components/cases/important-dates/**`, `components/modals/add-important-date.tsx` → `features/important-dates/`

**Interfaces:**
- Produces: `@/features/important-dates/hooks/use-important-dates` (`useImportantDates`, `useCreateImportantDate`, `useUpdateImportantDate`, `useDeleteImportantDate`), `@/features/important-dates/components/important-dates` (`ImportantDatesDetails`) — consumed later by Task 11.

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/important-dates/hooks apps/web/src/features/important-dates/services apps/web/src/features/important-dates/types apps/web/src/features/important-dates/components/modals
git mv apps/web/src/hooks/use-important-dates.ts apps/web/src/features/important-dates/hooks/use-important-dates.ts
git mv apps/web/src/services/important-dates.ts apps/web/src/features/important-dates/services/important-dates.ts
git mv apps/web/src/types/important-dates.ts apps/web/src/features/important-dates/types/important-dates.ts
git mv apps/web/src/components/cases/important-dates/important-dates.tsx apps/web/src/features/important-dates/components/important-dates.tsx
git mv apps/web/src/components/modals/add-important-date.tsx apps/web/src/features/important-dates/components/modals/add-important-date.tsx
rmdir apps/web/src/components/cases/important-dates
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-important-dates' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-important-dates#@/features/important-dates/hooks/use-important-dates#g'
grep -rl '@/services/important-dates"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/important-dates"#@/features/important-dates/services/important-dates"#g'
grep -rl '@/types/important-dates"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/important-dates"#@/features/important-dates/types/important-dates"#g'
grep -rl '@/components/modals/add-important-date' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/modals/add-important-date#@/features/important-dates/components/modals/add-important-date#g'
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/features/important-dates apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/components
git commit -m "refactor(web): move important-dates into features/important-dates"
```

---

### Task 6: Feature — `clients`

**Files:**
- Move: `hooks/use-clients.ts`, `services/clients.ts`, `types/clients.ts`, `components/cases/client/**` → `features/clients/`

**Interfaces:**
- Produces: `@/features/clients/hooks/use-clients` (`useAddClientToCase`, `useUpdateClient`, and whatever else the file exports), `@/features/clients/components/client-details` (`ClientDetails`) — consumed later by Task 11.

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/clients/hooks apps/web/src/features/clients/services apps/web/src/features/clients/types apps/web/src/features/clients/components
git mv apps/web/src/hooks/use-clients.ts apps/web/src/features/clients/hooks/use-clients.ts
git mv apps/web/src/services/clients.ts apps/web/src/features/clients/services/clients.ts
git mv apps/web/src/types/clients.ts apps/web/src/features/clients/types/clients.ts
git mv apps/web/src/components/cases/client/client-details.tsx apps/web/src/features/clients/components/client-details.tsx
rmdir apps/web/src/components/cases/client
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-clients' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-clients#@/features/clients/hooks/use-clients#g'
grep -rl '@/services/clients"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/clients"#@/features/clients/services/clients"#g'
grep -rl '@/types/clients"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/clients"#@/features/clients/types/clients"#g'
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/features/clients apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/components
git commit -m "refactor(web): move clients into features/clients"
```

---

### Task 7: Feature — `documents`

**Files:**
- Move: `hooks/use-documents.ts`, `services/documents.ts`, `types/documents.ts`, `components/documents/**`, `components/cases/documents/documents.tsx` → `features/documents/`

**Interfaces:**
- Produces: `@/features/documents/hooks/use-documents` (`useFolders`, `useDocuments`, `useUploadDocument`, `useRenameDocument`, `useDeleteDocument`), `@/features/documents/components/documents` (`Documents`, the case-scoped tab), `@/features/documents/components/folder-grid` / `document-file-list` (the standalone `/documents` page) — the case-scoped `Documents` component is consumed later by Task 11.

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/documents/hooks apps/web/src/features/documents/services apps/web/src/features/documents/types apps/web/src/features/documents/components
git mv apps/web/src/hooks/use-documents.ts apps/web/src/features/documents/hooks/use-documents.ts
git mv apps/web/src/services/documents.ts apps/web/src/features/documents/services/documents.ts
git mv apps/web/src/types/documents.ts apps/web/src/features/documents/types/documents.ts
git mv apps/web/src/components/documents/folder-grid.tsx apps/web/src/features/documents/components/folder-grid.tsx
git mv apps/web/src/components/documents/folder-card.tsx apps/web/src/features/documents/components/folder-card.tsx
git mv apps/web/src/components/documents/document-file-list.tsx apps/web/src/features/documents/components/document-file-list.tsx
git mv apps/web/src/components/cases/documents/documents.tsx apps/web/src/features/documents/components/documents.tsx
rmdir apps/web/src/components/documents apps/web/src/components/cases/documents
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-documents' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-documents#@/features/documents/hooks/use-documents#g'
grep -rl '@/services/documents"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/documents"#@/features/documents/services/documents"#g'
grep -rl '@/types/documents"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/documents"#@/features/documents/types/documents"#g'
grep -rl '@/components/documents/' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/documents/#@/features/documents/components/#g'
```

`app/(protected)/documents/page.tsx` imports `FolderGrid`/`DocumentFileList` from `@/components/documents/...` — covered by the last substitution above.

- [ ] **Step 3: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/features/documents apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/components
git commit -m "refactor(web): move documents into features/documents"
```

---

### Task 8: Feature — `calendar`

**Files:**
- Move: `hooks/use-calendar.ts`, `services/calendar.ts`, `types/calendar.ts`, `lib/calendar.ts`, `components/calendar/**` → `features/calendar/`

**Interfaces:**
- Produces: `@/features/calendar/components/calendar-view` (`CalendarView`) — consumed by `app/(protected)/calendar/page.tsx`.
- Calendar is explicitly **not** wired through `PageLayout` in this plan (see spec's "Layout & Visual Consistency" section) — its existing `.calendar-page`/`.calendar-toolbar` chrome is left untouched.

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/calendar/hooks apps/web/src/features/calendar/services apps/web/src/features/calendar/types apps/web/src/features/calendar/lib
git mv apps/web/src/hooks/use-calendar.ts apps/web/src/features/calendar/hooks/use-calendar.ts
git mv apps/web/src/services/calendar.ts apps/web/src/features/calendar/services/calendar.ts
git mv apps/web/src/types/calendar.ts apps/web/src/features/calendar/types/calendar.ts
git mv apps/web/src/lib/calendar.ts apps/web/src/features/calendar/lib/calendar.ts
git mv apps/web/src/components/calendar apps/web/src/features/calendar/components
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-calendar' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-calendar#@/features/calendar/hooks/use-calendar#g'
grep -rl '@/services/calendar"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/calendar"#@/features/calendar/services/calendar"#g'
grep -rl '@/types/calendar"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/calendar"#@/features/calendar/types/calendar"#g'
grep -rl '@/lib/calendar"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/lib/calendar"#@/features/calendar/lib/calendar"#g'
grep -rl '@/components/calendar/' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/calendar/#@/features/calendar/components/#g'
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/features/calendar apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/lib apps/web/src/components
git commit -m "refactor(web): move calendar into features/calendar"
```

---

### Task 9: Feature — `dashboard` (move + thin-page extraction + `PageLayout`)

**Files:**
- Move: `hooks/use-dashboard.ts`, `services/dashboard.ts`, `types/dashboard.ts`, `lib/format-date-label.ts`, `components/dashboard/**` → `features/dashboard/`
- Create: `apps/web/src/features/dashboard/components/dashboard-view.tsx`
- Modify: `apps/web/src/app/(protected)/dashboard/page.tsx` (becomes thin)

**Interfaces:**
- Consumes: `PageLayout` from `@/components/layout/page-layout` (Task 2); `CreateCaseModal` from `@/features/cases/components/modals/create-case` — **not yet moved** (that happens in Task 11). This task's `DashboardView` import of `CreateCaseModal` will be added pointing at the future path now, and will 404 at typecheck until Task 11 lands — see Step 4.
- Produces: `DashboardView` — exported for `page.tsx` to render.

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/dashboard/hooks apps/web/src/features/dashboard/services apps/web/src/features/dashboard/types apps/web/src/features/dashboard/lib
git mv apps/web/src/hooks/use-dashboard.ts apps/web/src/features/dashboard/hooks/use-dashboard.ts
git mv apps/web/src/services/dashboard.ts apps/web/src/features/dashboard/services/dashboard.ts
git mv apps/web/src/types/dashboard.ts apps/web/src/features/dashboard/types/dashboard.ts
git mv apps/web/src/lib/format-date-label.ts apps/web/src/features/dashboard/lib/format-date-label.ts
git mv apps/web/src/components/dashboard apps/web/src/features/dashboard/components
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-dashboard' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-dashboard#@/features/dashboard/hooks/use-dashboard#g'
grep -rl '@/services/dashboard"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/dashboard"#@/features/dashboard/services/dashboard"#g'
grep -rl '@/types/dashboard"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/dashboard"#@/features/dashboard/types/dashboard"#g'
grep -rl '@/lib/format-date-label' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/lib/format-date-label#@/features/dashboard/lib/format-date-label#g'
grep -rl '@/components/dashboard/' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/dashboard/#@/features/dashboard/components/#g'
```

- [ ] **Step 3: Extract the page body into `DashboardView`, wired through `PageLayout`**

This is Exception B from the spec (an orchestrator view importing another feature's modal for its own action button) — `DashboardView` legitimately imports `CreateCaseModal` from the cases feature.

```tsx
// apps/web/src/features/dashboard/components/dashboard-view.tsx
"use client";

import { useState, useCallback } from "react";
import { AlertCircle, Briefcase, Calendar, CalendarCheck } from "lucide-react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { PageLayout } from "@/components/layout/page-layout";
import { CreateCaseModal } from "@/features/cases/components/modals/create-case";
import { StatCard } from "./stat-card";
import { UpcomingHearings } from "./upcoming-hearings";
import { AttentionNeeded } from "./attention-needed";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

export function DashboardView() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const { data, isError } = useDashboard();

  usePageTitle({
    title: "Dashboard",
    action: { label: "Add New Case", onClick: openModal },
  });

  return (
    <>
      <PageLayout maxWidth="large" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Cases" value={data?.stats.activeCases} icon={Briefcase} />
          <StatCard label="Today's Hearings" value={data?.stats.hearingsToday} icon={CalendarCheck} />
          <StatCard label="This Week" value={data?.stats.hearingsThisWeek} icon={Calendar} />
          <StatCard label="Upcoming Deadlines" value={data?.stats.upcomingDeadlines} icon={AlertCircle} />
        </div>

        {isError && (
          <p className="text-sm text-negative text-center py-8">
            Failed to load dashboard. Please refresh the page.
          </p>
        )}

        {!isError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingHearings hearings={data?.upcomingHearings} />
            <AttentionNeeded
              deadlines={data?.upcomingDeadlines}
              highPriorityCases={data?.highPriorityCases}
            />
          </div>
        )}
      </PageLayout>

      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
```

Replace `apps/web/src/app/(protected)/dashboard/page.tsx` entirely with:

```tsx
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default function Page() {
  return <DashboardView />;
}
```

- [ ] **Step 4: Verify (expected partial failure)**

Run: `pnpm --filter web typecheck`
Expected: one error, `Cannot find module '@/features/cases/components/modals/create-case'` (or similar) — this is expected until Task 11 moves that file. Confirm this is the *only* error before moving on; anything else is a real regression to fix now.

- [ ] **Step 5: Commit**

```bash
git add -A apps/web/src/features/dashboard "apps/web/src/app/(protected)/dashboard" apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/lib apps/web/src/components
git commit -m "refactor(web): move dashboard into features/dashboard, extract DashboardView"
```

---

### Task 10: Feature — `settings` (move + tabs merge + thin-page extraction + `PageLayout`)

**Files:**
- Move: `hooks/use-organization.ts`, `services/organization.ts`, `types/organization.ts`, `components/settings/**` → `features/settings/`
- Merge: `config/settings-tabs.ts` + `enums/settings-tabs.ts` → `features/settings/constants/settings-tabs.ts`
- Create: `apps/web/src/features/settings/components/settings-view.tsx`
- Modify: `apps/web/src/app/(protected)/settings/page.tsx` (becomes thin), `apps/web/src/features/settings/components/profile-tab.tsx` (swap `PageContent` → `PageLayout`)

**Interfaces:**
- Consumes: `PageLayout` from Task 2.
- Produces: `SettingsView`, `@/features/settings/constants/settings-tabs` (`SETTINGS_TAB_CONFIG`, `SettingsTabs`).

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/settings/hooks apps/web/src/features/settings/services apps/web/src/features/settings/types apps/web/src/features/settings/constants
git mv apps/web/src/hooks/use-organization.ts apps/web/src/features/settings/hooks/use-organization.ts
git mv apps/web/src/services/organization.ts apps/web/src/features/settings/services/organization.ts
git mv apps/web/src/types/organization.ts apps/web/src/features/settings/types/organization.ts
git mv apps/web/src/components/settings apps/web/src/features/settings/components
```

- [ ] **Step 2: Merge the tabs config into one file**

```bash
git rm apps/web/src/config/settings-tabs.ts apps/web/src/enums/settings-tabs.ts
```

Create `apps/web/src/features/settings/constants/settings-tabs.ts` (the enum values plus the config array that used to live in two files):

```ts
import type { TabConfig } from "@/components/layout/tabs-nav";

export enum SettingsTabs {
  PROFILE      = "profile",
  SUBSCRIPTION = "subscription",
}

export const SETTINGS_TAB_CONFIG: TabConfig[] = [
  { id: SettingsTabs.PROFILE,      label: "Profile" },
  { id: SettingsTabs.SUBSCRIPTION, label: "Subscription" },
];
```

- [ ] **Step 3: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-organization' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-organization#@/features/settings/hooks/use-organization#g'
grep -rl '@/services/organization"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/organization"#@/features/settings/services/organization"#g'
grep -rl '@/types/organization"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/organization"#@/features/settings/types/organization"#g'
grep -rl '@/components/settings/' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/settings/#@/features/settings/components/#g'
grep -rl '@/config/settings-tabs' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/config/settings-tabs#@/features/settings/constants/settings-tabs#g'
grep -rl '@/enums/settings-tabs' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/enums/settings-tabs#@/features/settings/constants/settings-tabs#g'
```

If any file ends up with two import statements both pointing at `@/features/settings/constants/settings-tabs` (because it previously imported from both the old config and enum files), merge them into one `import { ... } from "@/features/settings/constants/settings-tabs";` line by hand.

- [ ] **Step 4: Extract the page body into `SettingsView`**

Replace `apps/web/src/app/(protected)/settings/page.tsx`'s entire body with a new file:

```tsx
// apps/web/src/features/settings/components/settings-view.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { SETTINGS_TAB_CONFIG, SettingsTabs } from "@/features/settings/constants/settings-tabs";
import { useActiveTab } from "@/hooks/use-active-tab";
import {
  useOrganization,
  useProfile,
  useUpdateOrganization,
  useUpdateProfile,
} from "@/features/settings/hooks/use-organization";
import { useAuthStore } from "@/store/auth-store";
import { ProfileTab, settingsFormSchema, type SettingsFormValues } from "./profile-tab";
import { SubscriptionTab } from "./subscription-tab";

export function SettingsView() {
  const router     = useRouter();
  const activeTab  = useActiveTab(SETTINGS_TAB_CONFIG, SettingsTabs.PROFILE);

  usePageTitle({ title: "Settings" });

  const { data: profile,      isLoading: profileLoading }      = useProfile();
  const { data: organization, isLoading: orgLoading }          = useOrganization();
  const updateProfile      = useUpdateProfile();
  const updateOrganization = useUpdateOrganization();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      firstName:     "",
      lastName:      "",
      phoneNumber:   "",
      designation:   undefined,
      orgName:       "",
      city:          "",
      practiceTypes: [],
    },
  });

  useEffect(() => {
    if (profile && organization) {
      form.reset({
        firstName:     profile.firstName,
        lastName:      profile.lastName,
        phoneNumber:   profile.phoneNumber,
        designation:   profile.designation,
        orgName:       organization.name,
        city:          organization.city,
        practiceTypes: organization.practiceTypes,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, organization]);

  const isSaving   = updateProfile.isPending || updateOrganization.isPending;
  const isLoading  = profileLoading || orgLoading;
  const isDisabled = isSaving || isLoading;

  async function onSubmit(values: SettingsFormValues) {
    try {
      await updateProfile.mutateAsync({
        firstName:   values.firstName,
        lastName:    values.lastName,
        phoneNumber: values.phoneNumber,
        designation: values.designation,
      });
      const updatedOrg = await updateOrganization.mutateAsync({
        name:          values.orgName,
        city:          values.city,
        practiceTypes: values.practiceTypes,
      });
      const currentUser = useAuthStore.getState().user;
      if (currentUser && "org" in currentUser) {
        useAuthStore.getState().setAuth({
          ...currentUser,
          org: { ...currentUser.org, name: updatedOrg.name },
        });
      }
    } catch {
      // onError handlers in mutations show the toast
    }
  }

  function handleNavigate(tabId: string) {
    router.push(`/settings?tab=${tabId}`);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabsNav
        tabs={SETTINGS_TAB_CONFIG}
        activeTab={activeTab}
        activeSubTab=""
        onNavigate={handleNavigate}
      />

      <div className="flex-1 overflow-y-auto bg-page">
        {activeTab === SettingsTabs.PROFILE && (
          <ProfileTab
            form={form}
            email={profile?.email ?? ""}
            role={profile?.role ?? ""}
            isLoading={isLoading}
          />
        )}
        {activeTab === SettingsTabs.SUBSCRIPTION && <SubscriptionTab />}
      </div>

      {activeTab === SettingsTabs.PROFILE && (
        <PageFooter
          right={
            <Button
              variant="primary"
              size="sm"
              disabled={isDisabled}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          }
        />
      )}
    </div>
  );
}
```

Replace `apps/web/src/app/(protected)/settings/page.tsx` with:

```tsx
import { SettingsView } from "@/features/settings/components/settings-view";

export default function Page() {
  return <SettingsView />;
}
```

- [ ] **Step 5: Swap `PageContent` for `PageLayout` in `profile-tab.tsx`**

In `apps/web/src/features/settings/components/profile-tab.tsx`:
- Change the import from `import { PageContent } from "@/components/layout/page-content";` to `import { PageLayout } from "@/components/layout/page-layout";`
- Change both `<PageContent width="md" className="space-y-6">` occurrences (the loading-skeleton one and the real-form one) to `<PageLayout maxWidth="medium" className="space-y-6">`, and their matching closing tags to `</PageLayout>`.

- [ ] **Step 6: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes.

- [ ] **Step 7: Commit**

```bash
git add -A apps/web/src/features/settings "apps/web/src/app/(protected)/settings" apps/web/src/config apps/web/src/enums apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/components
git commit -m "refactor(web): move settings into features/settings, merge tabs config, extract SettingsView"
```

---

### Task 11: Feature — `cases` (the big one)

**Files:**
- Move: `hooks/use-cases.ts`, `services/cases.ts`, `types/cases.ts`, `mappers/case-form.ts`, `components/cases/**` (case-details/, case-utils.ts, role-badge.tsx — hearings/important-dates/client/documents subfolders are already gone by now), `app/(protected)/cases/cases-table.tsx`, `components/modals/create-case.tsx`, `components/modals/opposite-party.tsx` → `features/cases/`
- Merge: `config/case-tabs.ts` + `enums/case-tabs.ts` → `features/cases/constants/case-tabs.ts`
- Rename + move: `app/(protected)/cases/[caseId]/case-details.tsx` → `features/cases/components/case-detail-view.tsx` (`CaseDetailView`)
- Rename + move: `app/(protected)/cases/[caseId]/case-tabs.tsx` → `features/cases/components/case-detail-tabs.tsx` (`CaseDetailTabs`)
- Create: `apps/web/src/features/cases/components/cases-view.tsx`
- Modify: `apps/web/src/app/(protected)/cases/page.tsx`, `apps/web/src/app/(protected)/cases/[caseId]/page.tsx` (both become thin)
- Modify: `apps/web/src/hooks/use-active-tab.ts` (remove the `useCaseActiveTab`/`useCaseActiveSubTab` wrappers)

**Interfaces:**
- Consumes: `PageLayout` (Task 2), `HearingsDetails` from `@/features/hearings/components/hearings` (Task 4), `ImportantDatesDetails` from `@/features/important-dates/components/important-dates` (Task 5), `ClientDetails` from `@/features/clients/components/client-details` (Task 6), `Documents` from `@/features/documents/components/documents` (Task 7). This is Exception B from the spec.
- Produces: `CasesView`, `CaseDetailView`, `CaseDetailTabs`, `@/features/cases/constants/case-tabs` (`CaseTabs`, `CaseSubTabs`, `CaseTabLabel`, `CaseSubTabLabel`, `CASE_TAB_CONFIG`) — resolves the `CreateCaseModal` import Task 9's `DashboardView` was left pointing at.

- [ ] **Step 1: Move the files**

```bash
mkdir -p apps/web/src/features/cases/hooks apps/web/src/features/cases/services apps/web/src/features/cases/types apps/web/src/features/cases/mappers apps/web/src/features/cases/constants apps/web/src/features/cases/components/modals
git mv apps/web/src/hooks/use-cases.ts apps/web/src/features/cases/hooks/use-cases.ts
git mv apps/web/src/services/cases.ts apps/web/src/features/cases/services/cases.ts
git mv apps/web/src/types/cases.ts apps/web/src/features/cases/types/cases.ts
git mv apps/web/src/mappers/case-form.ts apps/web/src/features/cases/mappers/case-form.ts
git mv apps/web/src/components/cases/case-details apps/web/src/features/cases/components/case-details
git mv apps/web/src/components/cases/case-utils.ts apps/web/src/features/cases/components/case-utils.ts
git mv apps/web/src/components/cases/role-badge.tsx apps/web/src/features/cases/components/role-badge.tsx
git mv "apps/web/src/app/(protected)/cases/cases-table.tsx" apps/web/src/features/cases/components/cases-table.tsx
git mv apps/web/src/components/modals/create-case.tsx apps/web/src/features/cases/components/modals/create-case.tsx
git mv apps/web/src/components/modals/opposite-party.tsx apps/web/src/features/cases/components/modals/opposite-party.tsx
rmdir apps/web/src/components/cases apps/web/src/mappers
```

- [ ] **Step 2: Merge the tabs config into one file**

```bash
git rm apps/web/src/config/case-tabs.ts apps/web/src/enums/case-tabs.ts
```

Create `apps/web/src/features/cases/constants/case-tabs.ts`:

```ts
import type { TabConfig } from "@/components/layout/tabs-nav";

export enum CaseTabs {
  CLIENT = "client",
  CASE = "case",
  HEARINGS = "hearings",
  IMPORTANT_DATES = "important-dates",
  DOCUMENTS = "documents",
}

export enum CaseSubTabs {
  DETAILS = "details",
  DESCRIPTION = "description",
  OPPOSITE_PARTIES = "opposite-parties",
}

export enum CaseTabLabel {
  CLIENT = "Client",
  CASE = "Case",
  HEARINGS = "Hearings",
  IMPORTANT_DATES = "Important Dates",
  DOCUMENTS = "Documents",
}

export enum CaseSubTabLabel {
  DETAILS = "Case Details",
  DESCRIPTION = "Case Description",
  OPPOSITE_PARTIES = "Opposite Parties",
}

export const CASE_TAB_CONFIG: TabConfig[] = [
  {
    id: CaseTabs.CASE,
    label: CaseTabLabel.CASE,
    subTabs: [
      { id: CaseSubTabs.DETAILS, label: CaseSubTabLabel.DETAILS },
      { id: CaseSubTabs.DESCRIPTION, label: CaseSubTabLabel.DESCRIPTION },
      { id: CaseSubTabs.OPPOSITE_PARTIES, label: CaseSubTabLabel.OPPOSITE_PARTIES },
    ],
  },
  { id: CaseTabs.HEARINGS, label: CaseTabLabel.HEARINGS },
  { id: CaseTabs.CLIENT, label: CaseTabLabel.CLIENT },
  { id: CaseTabs.IMPORTANT_DATES, label: CaseTabLabel.IMPORTANT_DATES },
  { id: CaseTabs.DOCUMENTS, label: CaseTabLabel.DOCUMENTS },
];
```

- [ ] **Step 3: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/hooks/use-cases' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/hooks/use-cases#@/features/cases/hooks/use-cases#g'
grep -rl '@/services/cases"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/services/cases"#@/features/cases/services/cases"#g'
grep -rl '@/types/cases"' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/types/cases"#@/features/cases/types/cases"#g'
grep -rl '@/mappers/case-form' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/mappers/case-form#@/features/cases/mappers/case-form#g'
grep -rl '@/components/cases/' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/cases/#@/features/cases/components/#g'
grep -rl '@/components/modals/create-case' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/modals/create-case#@/features/cases/components/modals/create-case#g'
grep -rl '@/components/modals/opposite-party' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/components/modals/opposite-party#@/features/cases/components/modals/opposite-party#g'
grep -rl '@/config/case-tabs' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/config/case-tabs#@/features/cases/constants/case-tabs#g'
grep -rl '@/enums/case-tabs' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/enums/case-tabs#@/features/cases/constants/case-tabs#g'
```

Also fix the one already-known stray relative import in `cases-table.tsx` (now at `features/cases/components/cases-table.tsx`): change

```ts
import {
  priorityBorderClass,
  statusBadgeClass,
  formatHearingDate,
} from "../../../components/cases/case-utils";
```

to

```ts
import {
  priorityBorderClass,
  statusBadgeClass,
  formatHearingDate,
} from "./case-utils";
```

If any file ends up with two separate import statements both resolving to `@/features/cases/constants/case-tabs`, merge them by hand into one.

- [ ] **Step 4: Trim `hooks/use-active-tab.ts` down to the generic hooks only**

Replace the file's contents entirely:

```ts
// apps/web/src/hooks/use-active-tab.ts
"use client";

import { useSearchParams } from "next/navigation";
import type { TabConfig } from "@/components/layout/tabs-nav";

export function useActiveTab(tabs: TabConfig[], defaultTab: string): string {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const isValid = tab !== null && tabs.some((t) => t.id === tab);
  return isValid ? tab : defaultTab;
}

export function useActiveSubTab(activeTab: string, tabs: TabConfig[]): string {
  const searchParams = useSearchParams();
  const subTab = searchParams.get("subTab");
  const tabConfig = tabs.find((t) => t.id === activeTab);
  if (!tabConfig?.subTabs?.length) return "";
  const isValid = tabConfig.subTabs.some((s) => s.id === subTab);
  return isValid ? (subTab ?? tabConfig.subTabs[0].id) : tabConfig.subTabs[0].id;
}
```

This deletes `useCaseActiveTab`/`useCaseActiveSubTab` — their two call sites are rewritten in Steps 5 and 6 below to call the generic hooks directly, matching how `settings-view.tsx` already does it.

- [ ] **Step 5: Rename + rewrite `case-tabs.tsx` → `case-detail-tabs.tsx`**

```bash
git mv "apps/web/src/app/(protected)/cases/[caseId]/case-tabs.tsx" apps/web/src/features/cases/components/case-detail-tabs.tsx
```

Replace its contents:

```tsx
// apps/web/src/features/cases/components/case-detail-tabs.tsx
"use client";

import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { useActiveTab, useActiveSubTab } from "@/hooks/use-active-tab";
import { CASE_TAB_CONFIG, CaseTabs } from "@/features/cases/constants/case-tabs";

interface Props {
  caseId: string;
}

export function CaseDetailTabs({ caseId }: Props) {
  const router = useRouter();
  const activeTab = useActiveTab(CASE_TAB_CONFIG, CaseTabs.CASE) as CaseTabs;
  const activeSubTab = useActiveSubTab(activeTab, CASE_TAB_CONFIG);

  function navigateTo(tabId: string, subTabId?: string) {
    const params = new URLSearchParams({ tab: tabId });
    if (subTabId) params.set("subTab", subTabId);
    router.push(`/cases/${caseId}?${params.toString()}`);
  }

  return (
    <TabsNav
      tabs={CASE_TAB_CONFIG}
      activeTab={activeTab}
      activeSubTab={activeSubTab}
      onNavigate={navigateTo}
    />
  );
}
```

- [ ] **Step 6: Rename + rewrite `case-details.tsx` → `case-detail-view.tsx`**

```bash
git mv "apps/web/src/app/(protected)/cases/[caseId]/case-details.tsx" apps/web/src/features/cases/components/case-detail-view.tsx
```

Replace its contents:

```tsx
// apps/web/src/features/cases/components/case-detail-view.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { CaseTabs, CaseSubTabs, CASE_TAB_CONFIG } from "@/features/cases/constants/case-tabs";
import { Documents } from "@/features/documents/components/documents";
import { CaseDetailTabs } from "./case-detail-tabs";
import { useActiveTab, useActiveSubTab } from "@/hooks/use-active-tab";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useCase, useUpdateCase, useDeleteCase } from "@/features/cases/hooks/use-cases";
import { usePageLoading } from "@/components/layout/loader";
import { useAddClientToCase, useUpdateClient } from "@/features/clients/hooks/use-clients";
import { CaseDetailsSection } from "@/features/cases/components/case-details/case-details";
import { CaseDescriptionSection } from "@/features/cases/components/case-details/case-description";
import { CourtDetailsSection } from "@/features/cases/components/case-details/court-details";
import { JudgeDetailsSection } from "@/features/cases/components/case-details/judge-details";
import { OppositePartySection } from "@/features/cases/components/case-details/opposite-parties";
import { ClientDetails } from "@/features/clients/components/client-details";
import { HearingsDetails } from "@/features/hearings/components/hearings";
import { ImportantDatesDetails } from "@/features/important-dates/components/important-dates";
import { PageFooter } from "@/components/layout/page-footer";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete";
import { UpdateCaseInput } from "@/features/cases/types/cases";
import { CreateClientInput, UpdateClientInput } from "@/features/clients/types/clients";
import {
  mapCaseToFormValues,
  mapClientToFormValues,
} from "@/features/cases/mappers/case-form";

interface TabContentProps {
  tab: CaseTabs;
  subTab: string;
  caseId: string;
  caseForm: UseFormReturn<UpdateCaseInput>;
  clientForm: UseFormReturn<UpdateClientInput>;
}

function CaseSubTabContent({ subTab }: { subTab: string }) {
  switch (subTab) {
    case CaseSubTabs.DETAILS:
      return (
        <>
          <CaseDetailsSection />
          <CourtDetailsSection />
          <JudgeDetailsSection />
        </>
      );
    case CaseSubTabs.DESCRIPTION:
      return <CaseDescriptionSection />;
    case CaseSubTabs.OPPOSITE_PARTIES:
      return <OppositePartySection />;
    default:
      return null;
  }
}

function TabContent({
  tab,
  subTab,
  caseId,
  caseForm,
  clientForm,
}: TabContentProps) {
  switch (tab) {
    case CaseTabs.CLIENT:
      return (
        <FormProvider {...clientForm}>
          <ClientDetails />
        </FormProvider>
      );

    case CaseTabs.CASE:
      return (
        <FormProvider {...caseForm}>
          <CaseSubTabContent subTab={subTab} />
        </FormProvider>
      );

    case CaseTabs.HEARINGS:
      return <HearingsDetails caseId={caseId} />;

    case CaseTabs.IMPORTANT_DATES:
      return <ImportantDatesDetails caseId={caseId} />;

    case CaseTabs.DOCUMENTS:
      return <Documents caseId={caseId} />;

    default:
      return null;
  }
}

export function CaseDetailView({ caseId }: { caseId: string }) {
  const activeTab = useActiveTab(CASE_TAB_CONFIG, CaseTabs.CASE) as CaseTabs;
  const activeSubTab = useActiveSubTab(activeTab, CASE_TAB_CONFIG);
  const [showDelete, setShowDelete] = useState(false);

  const { data: caseDetails, isLoading } = useCase(caseId);
  const updateCase = useUpdateCase(caseId);
  const updateClient = useUpdateClient();
  const addClientToCase = useAddClientToCase(caseId);
  const deleteCase = useDeleteCase();

  usePageTitle({
    title: "Cases",
    resourceTitle: `${caseDetails?.title}${caseDetails?.caseNumber ? ` (${caseDetails.caseNumber})` : ""}`,
  });

  const caseForm = useForm<UpdateCaseInput>({
    values: caseDetails ? mapCaseToFormValues(caseDetails) : undefined,
  });

  const clientForm = useForm<UpdateClientInput>({
    values: caseDetails?.client
      ? mapClientToFormValues(caseDetails.client)
      : undefined,
  });

  usePageLoading(isLoading);

  const isEditableTab =
    activeTab === CaseTabs.CASE || activeTab === CaseTabs.CLIENT;
  const isSaving =
    activeTab === CaseTabs.CLIENT
      ? updateClient.isPending || addClientToCase.isPending
      : updateCase.isPending;

  const handleSave = async () => {
    if (activeTab === CaseTabs.CLIENT) {
      const valid = await clientForm.trigger();
      if (!valid) return;

      const data = clientForm.getValues();

      if (!caseDetails?.clientId) {
        if (!data.type) {
          toast.error("Client type is required");
          return;
        }
        const clientInput: CreateClientInput = {
          fullName: data.fullName ?? "",
          phone: data.phone ?? "",
          type: data.type,
          email: data.email,
          address: data.address,
          companyName: data.companyName,
          notes: data.notes,
          relationType: data.relationType,
          relationName: data.relationName,
          dateOfBirth: data.dateOfBirth,
          occupation: data.occupation,
        };
        await addClientToCase.mutateAsync(clientInput);
      } else {
        await updateClient.mutateAsync({
          id: caseDetails?.clientId ?? "",
          caseId,
          data,
        });
      }
    } else {
      const valid = await caseForm.trigger();
      if (!valid) return;

      const data = caseForm.getValues();
      await updateCase.mutateAsync(data);
    }
  };

  const handleDelete = async () => {
    await deleteCase.mutateAsync(caseId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CaseDetailTabs caseId={caseId} />

      <div className="flex-1 overflow-y-auto bg-page">
        <PageLayout maxWidth="medium" className="space-y-6">
          <TabContent
            tab={activeTab}
            subTab={activeSubTab}
            caseId={caseId}
            caseForm={caseForm}
            clientForm={clientForm}
          />
        </PageLayout>
      </div>

      <PageFooter
        right={
          <>
            <Button variant="negative" onClick={() => setShowDelete(true)}>
              Delete Case
            </Button>
            {isEditableTab && (
              <Button loading={isSaving} onClick={handleSave}>
                Save Changes
              </Button>
            )}
          </>
        }
      />

      <ConfirmDeleteModal
        open={showDelete}
        title="case"
        entityName={caseDetails?.title ?? ""}
        isPending={deleteCase.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

Note: `maxWidth="medium"` here is narrower than the page's old implicit default (`PageContent` defaulted to `width="lg"` = `max-w-4xl`, and this file never passed an explicit `width`). This is a deliberate fix, not a regression — the spec's page-width convention puts case detail and settings at the same "medium" width, and today they're inconsistently 896px vs 672px for no reason. Confirm this visually in Task 14's smoke test.

Replace `apps/web/src/app/(protected)/cases/[caseId]/page.tsx` with:

```tsx
import { use } from "react";
import { CaseDetailView } from "@/features/cases/components/case-detail-view";

export default function Page({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  return <CaseDetailView caseId={caseId} />;
}
```

- [ ] **Step 7: Extract the cases list page into `CasesView`**

```tsx
// apps/web/src/features/cases/components/cases-view.tsx
"use client";

import { useState, useCallback } from "react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { PageLayout } from "@/components/layout/page-layout";
import { CasesTable } from "./cases-table";
import { CreateCaseModal } from "./modals/create-case";

export function CasesView() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  usePageTitle({
    title: "Cases",
    action: { label: "Add Case", onClick: openModal },
  });

  return (
    <PageLayout maxWidth="large" padded={false} className="h-full">
      <CasesTable onAdd={openModal} />
      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </PageLayout>
  );
}
```

`padded={false}` means `PageLayout` only contributes the max-width cap here — `FiltersBar`/`DataTable` (rendered inside `CasesTable`) keep their own existing internal `px-4 md:px-6`, so nothing else needs editing.

Replace `apps/web/src/app/(protected)/cases/page.tsx` with:

```tsx
import { CasesView } from "@/features/cases/components/cases-view";

export default function Page() {
  return <CasesView />;
}
```

- [ ] **Step 8: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes with **zero** errors now — this also resolves the expected failure left over from Task 9.

- [ ] **Step 9: Commit**

```bash
git add -A apps/web/src/features/cases "apps/web/src/app/(protected)/cases" apps/web/src/config apps/web/src/enums apps/web/src/hooks apps/web/src/services apps/web/src/types apps/web/src/mappers apps/web/src/components
git commit -m "refactor(web): move cases into features/cases, extract CasesView/CaseDetailView, fix tab hook leak"
```

---

### Task 12: Delete now-unused `PageContent`, `.page-shell`, and confirm the global folders are down to their genuinely-shared leftovers

**Files:**
- Delete: `apps/web/src/components/layout/page-content.tsx`
- Modify: `apps/web/src/app/globals.css` (remove the `.page-shell` block)
- Verify: `apps/web/src/hooks/`, `apps/web/src/types/`, `apps/web/src/config/`, `apps/web/src/enums/`, `apps/web/src/services/`, `apps/web/src/mappers/`, `apps/web/src/components/` no longer contain feature-specific leftovers

- [ ] **Step 1: Confirm `PageContent` has no remaining consumers**

Run: `grep -rl 'PageContent\|components/layout/page-content' apps/web/src`
Expected: no output. If anything remains, it means one of Tasks 9–11 missed a `PageContent` usage — go fix that file to use `PageLayout` before continuing.

- [ ] **Step 2: Delete it**

```bash
git rm apps/web/src/components/layout/page-content.tsx
```

- [ ] **Step 3: Delete the dead `.page-shell` CSS**

In `apps/web/src/app/globals.css`, delete:

```css
  /*  Page shell — applied to <main>; owns the horizontal gutter for all pages  */
  .page-shell {
    @apply px-4 md:px-6;
  }
```

Confirm first with `grep -rn 'page-shell' apps/web/src` that this class has zero usages anywhere (it was already unused before this refactor started).

- [ ] **Step 4: Confirm the leftover top-level folders are correct**

Run:
```bash
ls apps/web/src/hooks     # expect: use-active-tab.ts only
ls apps/web/src/types     # expect: misc.ts only
ls apps/web/src/config    # expect: directory does not exist (deleted in Tasks 10/11)
ls apps/web/src/enums     # expect: directory does not exist
ls apps/web/src/services  # expect: directory does not exist (every service moved into a feature)
ls apps/web/src/mappers   # expect: directory does not exist
ls apps/web/src/components # expect: ui/, layout/, shared/ only
```

If `config/`, `enums/`, `services/`, or `mappers/` still exist, an earlier task's `rmdir`/`git rm` didn't run — remove them now (they should already be empty).

- [ ] **Step 5: Verify**

Run: `pnpm --filter web typecheck`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add -A apps/web/src
git commit -m "chore(web): delete unused PageContent and dead .page-shell CSS"
```

---

### Task 13: Update `.claude/architecture.md` and `.claude/frontend-rules.md`

**Files:**
- Modify: `.claude/architecture.md` (the "Frontend Structure" section)
- Modify: `.claude/frontend-rules.md` (the "App Router Structure" section, and a new note on `PageLayout`/tabs/nav conventions)

**Interfaces:** none — documentation only.

- [ ] **Step 1: Replace `architecture.md`'s "Frontend Structure" section**

Find the section starting `## Frontend Structure` and replace its code block with:

```
apps/web/src/
├── app/                  # Next.js App Router pages (thin page.tsx files — resolve params, render one feature view)
│   ├── (auth)/
│   ├── (protected)/
│   └── portal/
├── features/
│   └── [name]/           # cases, hearings, important-dates, clients, documents, calendar, dashboard, settings, auth
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── constants/ | mappers/ | lib/   (only if the feature actually needs one)
├── components/
│   ├── ui/               # Primitive, stateless components — no feature knowledge
│   ├── layout/            # App shell (sidebar, top bar, bottom nav, PageLayout) — no feature knowledge
│   └── shared/            # Generic, feature-agnostic components used by more than one feature (modal, confirm-delete)
├── hooks/                # use-active-tab.ts only — genuinely generic, feature-agnostic hooks
├── types/                # misc.ts only — genuinely cross-cutting types
├── constants/            # options.ts — genuinely cross-cutting constant/reference data
├── lib/                  # utils.ts only — pure, dependency-free helper functions
├── api/                  # Axios client + typed HTTP helpers
├── store/                # Zustand stores
└── middleware.ts
```

Note: the route group is `(protected)`, not `(dashboard)` — this doc previously named it wrong.

- [ ] **Step 2: Add the feature-boundary + `PageLayout` + nav/tabs rules to `frontend-rules.md`**

Under the existing "App Router Structure" section (or a new section right after it — match whatever reads best in context), add:

```markdown
### Feature Boundaries

Feature-specific code (components, hooks, services, types) lives in `features/[name]/`, never in the old top-level `hooks/`/`services/`/`types/` folders — those now hold only genuinely cross-cutting code. A feature never imports another feature's internals directly, except:
- A hook invalidating another feature's exported query-key factory when the two are genuinely coupled (e.g. a hearing update invalidates `caseKeys.detail(id)`).
- The one orchestrator view for a route that's inherently a composite of several features (e.g. `CaseDetailView` composing hearings/important-dates/client/documents tabs; `DashboardView` importing cases' `CreateCaseModal` for its own action button).

### Page-Level Layout — `PageLayout`

Every `page.tsx` renders through `components/layout/page-layout.tsx`'s `PageLayout` component instead of hand-rolling its own horizontal gutter or max-width:
- `maxWidth`: `"small"` (a single form section) | `"medium"` (detail/tab pages — case detail, settings) | `"large"` (list pages with a data table — cases, documents) | `"full"` (uncapped).
- `padded` (default `true`): set `false` when the content already owns its own gutter (a `FiltersBar` + `DataTable` pair) — `PageLayout` then only contributes the max-width cap.
- Calendar is the one exception — its own full-height, edge-to-edge chrome predates `PageLayout` and isn't wired through it.

### Nav Items & Tabs — Single Source of Truth

- Sidebar/bottom-nav entries: add or change one entry in `components/layout/sidebar/nav-items.ts`'s `NAV_ITEMS` — both surfaces update from that one array.
- Tabs: each feature owns its own `constants/[name]-tabs.ts` (a `TabConfig[]` plus whatever enum backs it) and calls the generic `useActiveTab`/`useActiveSubTab` from `hooks/use-active-tab.ts` directly — never add a feature-specific wrapper hook to that file, it must stay feature-agnostic.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/architecture.md .claude/frontend-rules.md
git commit -m "docs: update architecture.md and frontend-rules.md for the features/ restructure"
```

---

### Task 14: Final verification

**Files:** none — verification only.

- [ ] **Step 1: Full typecheck**

Run: `pnpm --filter web typecheck`
Expected: passes with zero errors.

- [ ] **Step 2: Full lint**

Run: `pnpm --filter web lint`
Expected: passes (or only pre-existing warnings unrelated to this refactor — if it flags something this refactor touched, fix it now).

- [ ] **Step 3: Full build**

Run: `pnpm --filter web build`
Expected: builds successfully — this also catches anything `tsc --noEmit` might miss (e.g. a route that no longer resolves).

- [ ] **Step 4: Manual smoke test**

Run: `pnpm --filter web dev`, then in a browser, for both a mobile viewport and a desktop viewport:
- Log in, land on `/dashboard` — stat cards, upcoming hearings, attention-needed sections render; "Add New Case" opens the modal.
- `/cases` — filters bar + table render, no doubled or missing horizontal gutter, add/edit/delete a case works, clicking a row navigates to its detail page.
- A case detail page (`/cases/[id]`) — all five tabs (Case, Hearings, Client, Important Dates, Documents) render and are editable/saveable; note the content is now capped at `medium` width (672px) instead of the old, wider, unintentional default — confirm this reads as consistent with `/settings`, not as a regression.
- `/calendar` — unchanged, still full-bleed.
- `/documents` — folder grid and file list still work.
- `/settings` — Profile and Subscription tabs both render at the same width as case detail.
- Sidebar and bottom nav both still show the same items as before (Dashboard, Cases, Calendar, Documents, Settings).

- [ ] **Step 5: Final commit (only if the smoke test required fixes)**

```bash
git add -A
git commit -m "fix(web): address issues found in post-restructure smoke test"
```

If the smoke test found nothing to fix, there's no commit for this task — Task 12's commit is the last one.
