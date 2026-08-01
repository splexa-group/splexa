# Frontend Feature-Based Restructure — Design Spec
**Date:** 2026-08-01
**Branch:** bhaskar/fix/frontend
**Phase:** 1 (structural refactor, no behavior change)

---

> **SUPERSEDED (2026-08-01):** after implementing this spec through Task 10, the feature-based `features/[name]/{hooks,services,types,components}` structure was reviewed and rejected in favor of layered (type-based) folders — `hooks/`, `services/`, `types/` flat at the top level, `components/[name]/` for per-feature UI. The branch was reset to the commit right after this plan's Task 2 (`PageLayout`, `constants/options.ts`, shared modals, nav-items cleanup — all independent of feature-vs-layered and kept). See `docs/superpowers/plans/2026-08-01-frontend-layered-refactor.md` for the remaining work applied to the layered structure. Everything below this notice describes the abandoned `features/` approach — kept for history, not a guide to follow.

---

## Overview

The frontend (`apps/web/src`) is organized by **type** today: `hooks/`, `services/`, `types/` each hold one file per feature, and `components/` holds one folder per feature. As more feature modules land (dashboard, settings, calendar, documents, important-dates were all added in the last few weeks), everything about a single feature — e.g. "cases" — is scattered across 5+ top-level folders (`hooks/use-cases.ts`, `services/cases.ts`, `types/cases.ts`, `mappers/case-form.ts`, `components/cases/`), which makes a feature hard to see, review, or hand off as a unit.

This refactor moves to **feature-based modules**: each feature owns a `features/[name]/` folder containing its own `components/`, `hooks/`, `services/`, `types/`, and (only if needed) `constants/`, `mappers/`, `lib/`. This mirrors the backend's existing self-contained `modules/[name]/` pattern (`.claude/architecture.md`) — same mental model on both sides of the stack.

Two concrete messes get fixed as part of the move:
- `config/[feature]-tabs.ts` + `enums/[feature]-tabs.ts` (two top-level folders, one tightly-coupled file pair each) merge into a single `constants/[feature]-tabs.ts` inside the owning feature.
- `components/modals/` — today a flat grab-bag mixing the generic `Modal` primitive with feature-specific modals (`create-case.tsx`, `add-hearing.tsx`, `add-important-date.tsx`, `opposite-party.tsx`) — splits: feature-specific modals move into their owning feature's `components/modals/`, and only the truly generic `modal.tsx` + `confirm-delete.tsx` remain shared.

**Component, hook, service, and type files are not renamed** — only their parent folder path changes. This keeps the bulk of the migration mechanical (move + fix imports) and avoids touching the kebab-case naming rule (CLAUDE.md rule #9 scopes the `[name].[role].ts` dot-convention to backend modules only — frontend files stay kebab-case). Generically-named helper/util files (e.g. `case-utils.ts`) may still be renamed to describe their actual contents — see "Code Quality Standards Applied During the Move" below.

**No functional/product behavior change** — same routes, same data, same user-facing flows. What does change, as part of this same PR: a few concrete layout inconsistencies and code-quality issues get fixed on files this migration already has to touch for import fixes (see "Layout & Visual Consistency" and "Code Quality Standards" below) — this is not a separate refactor bolted on, it's cleanup that piggybacks on files already being opened. No new dependencies, no new state layer, no barrel `index.ts` files added unless a feature already needs one to break an import cycle.

---

## Current State — Pain Points

| Problem | Example |
|---|---|
| A single feature's files are scattered across 5+ top-level folders | `cases`: `hooks/use-cases.ts`, `services/cases.ts`, `types/cases.ts`, `mappers/case-form.ts`, `config/case-tabs.ts`, `enums/case-tabs.ts`, `components/cases/` |
| `config/` + `enums/` are two folders for what is really one concern per feature | `config/case-tabs.ts` imports `enums/case-tabs.ts` — same for `settings-tabs.ts` |
| `components/modals/` mixes a generic primitive with feature-specific business modals | `modal.tsx` (generic) sits next to `create-case.tsx`, `add-hearing.tsx` (feature-specific) |
| `.claude/architecture.md`'s documented frontend tree no longer matches reality | Docs say `(dashboard)/`, `stores/`, `lib/api/` — actual code has `(protected)/`, `store/`, `api/` |
| No frontend test setup exists | N/A — out of scope for this refactor, noted for awareness only |

No file currently approaches the 400–600 line limit — this is purely an organization-pattern problem, not a file-size problem.

---

## Target Structure

```
apps/web/src/
├── app/                       # routing only, route groups unchanged — thin page.tsx files
├── features/
│   ├── auth/{components,hooks,services,types}
│   ├── cases/{components,hooks,services,types,constants,mappers}
│   ├── hearings/{components,hooks,services,types}
│   ├── important-dates/{components,hooks,services,types}
│   ├── clients/{components,hooks,services,types}
│   ├── documents/{components,hooks,services,types}
│   ├── calendar/{components,hooks,services,types,lib}
│   ├── dashboard/{components,hooks,services,types,lib}
│   └── settings/{components,hooks,services,types,constants}
├── components/                # cross-feature only
│   ├── ui/                    # primitives — untouched
│   ├── layout/                # app shell — untouched
│   └── shared/
│       ├── modal.tsx
│       └── confirm-delete.tsx
├── hooks/
│   └── use-active-tab.ts      # shared hooks — genuinely generic (URL-driven tab state)
├── types/
│   └── misc.ts                # shared types — ApiErrorResponse etc.
├── constants/
│   └── options.ts             # shared constant/reference data — DESIGNATION_OPTIONS etc., used by 6+ features
├── lib/
│   └── utils.ts                # pure, dependency-free helper functions only — cn()
├── api/                       # client.ts, http.ts — unchanged, already documented in frontend-rules.md
├── store/                     # auth-store.ts — unchanged (used by layout + auth feature both)
└── middleware.ts
```

Each feature folder only gets the subfolders it actually uses — e.g. `clients` does not get an empty `constants/` just for symmetry with `cases`.

**Global-layer convention** (adapted from the bulletproof-react reference architecture — a widely-recognized pattern for scaling React apps past folder-per-type): every top-level folder outside `features/` has exactly one job, no overlap —
`hooks/` = shared hooks, `types/` = shared types, `constants/` = shared constant/reference data, `lib/` = pure helper functions, `api/` = HTTP client, `store/` = global state. The whole model collapses to one rule: **used by exactly one feature → lives in that feature; genuinely cross-cutting → has exactly one correctly-named home at the top level.** This is what keeps the structure legible as more features are added, not the specific folder names.

`api/` and `store/` keep their current names rather than folding into `lib/` or `utils/` — they're already documented by these exact paths in `frontend-rules.md` (the Axios three-layer pattern, the JWT storage rule), and renaming them would touch those docs plus every service/store import for no structural benefit. `lib/utils.ts` also keeps its name — it's the shadcn/ui-idiomatic filename for `cn()`, which this stack already follows (Radix UI, cva, tailwind-merge), and instantly recognizable to anyone who's worked in a shadcn-based project.

---

## File Moves

| Today | Moves to |
|---|---|
| `hooks/use-cases.ts`, `services/cases.ts`, `types/cases.ts`, `mappers/case-form.ts` | `features/cases/{hooks,services,types,mappers}/` |
| `config/case-tabs.ts` + `enums/case-tabs.ts` (merged into one file) | `features/cases/constants/case-tabs.ts` |
| `components/cases/**`, `app/(protected)/cases/cases-table.tsx` | `features/cases/components/` |
| `components/modals/create-case.tsx`, `opposite-party.tsx` | `features/cases/components/modals/` |
| `app/(protected)/cases/[caseId]/case-details.tsx` (`export default CaseDetails`) | `features/cases/components/case-detail-view.tsx`, renamed to named export `CaseDetailView` — matches the pattern `frontend-rules.md` already documents for this exact file; also fixes the default-export inconsistency (every other component in the codebase is a named export) |
| `app/(protected)/cases/[caseId]/case-tabs.tsx` (`export function CaseTabs`) | `features/cases/components/case-detail-tabs.tsx`, renamed to `CaseDetailTabs` — the component currently shares its name with the `CaseTabs` enum, forcing every call site to alias the import (`import { CaseTabs as CaseTabsNav }`); the new name matches its sibling `CaseDetailView` and avoids "Nav," which this codebase reserves for actual site navigation (`Sidebar`, `BottomNav`) — this is an in-page tab bar, not navigation between pages |
| `hooks/use-hearings.ts`, `services/hearings.ts`, `types/hearings.ts` | `features/hearings/{hooks,services,types}/` |
| `components/cases/hearing-details/**` | `features/hearings/components/` |
| `components/modals/add-hearing.tsx` | `features/hearings/components/modals/` |
| `hooks/use-important-dates.ts`, `services/important-dates.ts`, `types/important-dates.ts` | `features/important-dates/{hooks,services,types}/` |
| `components/cases/important-dates/**` | `features/important-dates/components/` |
| `components/modals/add-important-date.tsx` | `features/important-dates/components/modals/` |
| `hooks/use-clients.ts`, `services/clients.ts`, `types/clients.ts` | `features/clients/{hooks,services,types}/` |
| `components/cases/client/**` | `features/clients/components/` |
| `hooks/use-documents.ts`, `services/documents.ts`, `types/documents.ts` | `features/documents/{hooks,services,types}/` |
| `components/documents/**` | `features/documents/components/` |
| `components/cases/documents/documents.tsx` (the case-scoped Documents tab, `export function Documents`) | `features/documents/components/documents.tsx` — same feature as the org-wide folder view above, just the case-scoped half of it |
| `hooks/use-calendar.ts`, `services/calendar.ts`, `types/calendar.ts`, `lib/calendar.ts` | `features/calendar/{hooks,services,types,lib}/` |
| `components/calendar/**` | `features/calendar/components/` |
| `hooks/use-dashboard.ts`, `services/dashboard.ts`, `types/dashboard.ts`, `lib/format-date-label.ts` | `features/dashboard/{hooks,services,types,lib}/` |
| `components/dashboard/**` | `features/dashboard/components/` |
| `hooks/use-organization.ts`, `services/organization.ts`, `types/organization.ts` | `features/settings/{hooks,services,types}/` |
| `config/settings-tabs.ts` + `enums/settings-tabs.ts` (merged) | `features/settings/constants/settings-tabs.ts` |
| `components/settings/**` | `features/settings/components/` |
| `hooks/use-auth.ts`, `services/auth.ts`, `types/auth.ts` | `features/auth/{hooks,services,types}/` |
| `components/auth/**` | `features/auth/components/` |
| `components/modals/modal.tsx`, `confirm-delete.tsx` | `components/shared/` |
| `lib/options.ts` | `constants/options.ts` |

After the move, `config/`, `enums/`, and `services/` are deleted (empty — every service file moved into its owning feature). `hooks/`, `types/`, `components/`, `lib/` at the top level only retain the genuinely global leftovers (`use-active-tab.ts`, `misc.ts`, `ui/`, `layout/`, `shared/`, `utils.ts`).

`lib/format-date-label.ts` is demoted into `features/dashboard/lib/` since dashboard is its only consumer today. If a second feature needs it later, it gets promoted back to the global `lib/` — same rule the backend already applies to module helpers (`.claude/architecture.md`: "a helper used by only one module belongs in that module's helper file — moves to shared utils the moment a second module needs it").

---

## Rules This Introduces (codify in `frontend-rules.md`)

1. **Features never import another feature's internals directly**, except the two sanctioned cases below. Ordinary components reach other features only through `components/shared/` and `components/ui/`. This is already a documented rule ("Importing from another feature's components directly" is forbidden) — this refactor is what makes the codebase actually honor it.
2. **Exception A — query-key invalidation**, mirroring the backend's cross-module repository rule for genuinely related entities (`hearings.repository.ts` calling `casesRepository.updateNextHearingDate`): a feature's hook may invalidate another feature's exported query-key factory when the two are genuinely coupled — e.g. updating a hearing invalidates `caseKeys.detail(id)` because the case view shows "next hearing date". It must import only the `*Keys` factory, never the other feature's components or services.
3. **Exception B — the one orchestrator view per composite route.** A route that is inherently a composite of several features (a case detail page whose tabs *are* hearings/important-dates/client/documents for that case; a dashboard whose whole purpose is surfacing actions and summaries from several features at once) needs exactly one component that imports across those features to assemble the page — e.g. `features/cases/components/case-detail-view.tsx` importing `HearingsDetails`, `ImportantDatesDetails`, `ClientDetails`, `Documents` from their own features; `features/dashboard/components/dashboard-view.tsx` importing cases' `CreateCaseModal` for its "Add New Case" action. This import right is scoped to that one orchestrator component only — the components it renders still fetch their own data through their own feature's hooks, never reaching back into the orchestrator's feature.
4. Each feature is a flat `{components, hooks, services, types}` folder — no forced sub-splitting. A feature adds `constants/`, `mappers/`, or `lib/` only if it actually needs one.

---

## Layout & Visual Consistency

Investigation turned up a concrete instance of inconsistent spacing, caused by there being two competing, half-used mechanisms instead of one:

- **`.page-shell`** in `globals.css` is dead code — its comment claims it's "applied to `<main>`; owns the horizontal gutter for all pages," but it is applied nowhere in the codebase.
- **`PageContent`** (`components/layout/page-content.tsx`) already has the right idea — a size-constrained wrapper — but its prop is named `width` with values `"sm" | "md" | "lg" | "xl"`, which says nothing about what those sizes mean without checking the lookup table, and it isn't used everywhere: the horizontal gutter (`px-4 md:px-6`) ends up hand-duplicated — baked into `FiltersBar`, hardcoded directly on a `<div>` in the dashboard page, and simply absent on the cases list page.

**Fix: delete both, replace with one dedicated, clearly-named component.**

### `PageLayout` — the one page-level spacing owner

Named to match the existing `AuthLayout` convention already in this codebase (`components/auth/auth-layout.tsx`) — a `[Name]Layout` wrapper is already a recognized pattern here, so this isn't a new idea, just applied consistently. Lives in `components/layout/page-layout.tsx`, replacing `page-content.tsx` outright (not kept alongside it).

```tsx
type PageMaxWidth = "small" | "medium" | "large" | "full";
// small  → forms (e.g. a single settings section)
// medium → detail/tab pages (case detail, settings)
// large  → list pages with a data table (cases, documents)
// full   → content that must not be width-capped at all (rare)

interface PageLayoutProps {
  maxWidth?: PageMaxWidth;   // defaults to "medium"
  padded?: boolean;          // defaults to true — set false when the content already manages
                             // its own horizontal gutter (e.g. a FiltersBar + DataTable pair),
                             // so PageLayout only contributes the max-width cap, not a second gutter
  children: ReactNode;
  className?: string;
}

export function PageLayout({ maxWidth = "medium", padded = true, children, className }: PageLayoutProps) {
  return (
    <div className={cn("page-layout", pageMaxWidthClass[maxWidth], padded && "page-layout--padded", className)}>
      {children}
    </div>
  );
}
```

Named `maxWidth` instead of `width` because that's precisely what it constrains — a ceiling, not an exact size — and spelled-out t-shirt sizes (`small`/`medium`/`large`/`full`) instead of abbreviations (`sm`/`md`/`lg`/`xl`) because they read correctly at first sight, with no lookup table needed to know what it means.

`.page-layout` (bare — just `mx-auto w-full`) plus `.page-layout--padded` (`px-4 md:px-6 py-6`) in `globals.css` become the single real definition of the gutter + vertical page padding — replacing both the dead `.page-shell` and `PageContent`'s inline `mx-auto w-full py-6`.

**Why `padded` exists:** `FiltersBar` and `DataTable` already apply their own `px-4 md:px-6` internally (confirmed during investigation — `data-table.tsx` does it twice, once around the table and once around pagination). Cases and documents' list pages wrap that pair in `PageLayout` purely to gain the max-width cap; adding the padded variant on top would double the gutter. Pages without their own internal gutter (dashboard, settings, case detail tabs) use the default `padded={true}`. Calendar is excluded from `PageLayout` entirely — it already has its own full-height, edge-to-edge chrome (`.calendar-page`, `.calendar-toolbar`) that a page-level max-width/padding wrapper would conflict with, and it was already flagged as the one rare "full-bleed" exception above.

**Fix, as part of this migration:**
1. Delete the dead `.page-shell` class and the old `PageContent` component entirely — one mechanism (`PageLayout`), not a leftover second one.
2. Every top-level `page.tsx` renders its content through `<PageLayout maxWidth="...">` — no page hand-rolls its own outer horizontal padding or `max-w-*` again. `FiltersBar` and `DataTable` stop owning outer gutter — they fill 100% of `PageLayout`'s inner width; `PageLayout` is the only place that decision is made.
3. Pick `maxWidth` per page by content shape, consistently: list/table pages (cases, documents) → `large`; form/detail pages (settings, case detail) → `medium`; a lone form section → `small`. Document the mapping in `frontend-rules.md` so the next feature page picks the right one without guessing.
4. Standardize the vertical rhythm between page sections to one scale — `space-y-6` at the page level, `gap-4` inside stat/card grids — matching what dashboard already does, applied everywhere instead of ad hoc per page.

**Page composition convention** (documentation only — `FiltersBar`, `DataTable`, and `Section` already exist, only `PageLayout` is new):
- **List pages** (cases, documents folders): `PageLayout maxWidth="large" padded={false}` (the width cap only — `FiltersBar`/`DataTable` already provide their own gutter) → `FiltersBar` → (`DataTable` or a card grid) → click-through to a detail route.
- **Calendar is excluded** from `PageLayout` — its own full-height, edge-to-edge chrome (`.calendar-page`, `.calendar-toolbar`) already handles this and predates the refactor; forcing it through `PageLayout` isn't part of this pass.
- **Detail/form pages** (case detail, settings): `PageLayout maxWidth="medium"` → one or more `Section` blocks (already the pattern in `profile-tab.tsx`).

Every feature's list-style page follows the first shape and every detail-style page follows the second — new features don't invent a third shape.

---

## Navigation & Tabs — Single Source of Truth

### Nav items (sidebar + bottom nav) — already correct, keep as-is

`components/layout/sidebar/nav-items.ts` exports one `NAV_ITEMS` array; `Sidebar` renders it directly and `BottomNav` derives its own list from it (`NAV_ITEMS.filter(...).map(...)`). Add a nav entry once, in one file, and both surfaces update — this already is the pattern the rest of this refactor is trying to establish elsewhere. It stays in `components/layout/` (cross-cutting app-shell concern, not owned by any single feature) and is not touched by the File Moves table.

Two small cleanups while the file is opened:
- Remove the commented-out dead `// { label: 'Clients', ... }` line — there's no standalone `/clients` route (clients are only viewed inside a case), so this isn't a gap, it's just dead code that should go rather than sit commented out indefinitely.
- Normalize its string quotes to double quotes — the file currently uses single quotes, inconsistent with the rest of the codebase.

### Tabs — fix the real leak, then it matches the nav-items pattern

Unlike nav items, the tabs mechanism today is **not** actually generic where it claims to be. `hooks/use-active-tab.ts` is meant to be cross-cutting (`TabConfig`, `useActiveTab`, `useActiveSubTab` — feature-agnostic), but it also directly imports `CASE_TAB_CONFIG` and `CaseTabs` from the cases feature and exports `useCaseActiveTab`/`useCaseActiveSubTab` wrapper hooks. That's a feature reaching backward into a "global" file. Meanwhile `settings/page.tsx` already calls the generic hook directly — `useActiveTab(SETTINGS_TAB_CONFIG, SettingsTabs.PROFILE)` — with no wrapper. Two different patterns for the identical problem.

**Fix:** standardize on the settings way — it's simpler and keeps the global hook feature-agnostic.
- `hooks/use-active-tab.ts` keeps only `TabConfig`, `SubTabConfig`, `useActiveTab`, `useActiveSubTab` — no feature imports, ever.
- Delete `useCaseActiveTab`/`useCaseActiveSubTab`. Call sites (the new `case-detail-tabs.tsx`, `case-detail-view.tsx`) call `useActiveTab(CASE_TAB_CONFIG, CaseTabs.CASE)` / `useActiveSubTab(...)` directly, same as settings does today.
- Result: adding a tab means editing exactly one file — the feature's own `constants/[name]-tabs.ts` — same "change one file, it's reflected everywhere" property nav items already have, and the same rule applies to both: **the generic mechanism (`TabsNav`, `useActiveTab`, `NAV_ITEMS` pattern) lives at the top level and knows nothing about any feature; each feature owns its own config and calls the generic mechanism directly.**

### Future extension point — role/subscription-gated tabs and nav items (not built now)

Not a Phase 1 requirement, but worth documenting so it lands in the right place when it does become one, instead of being solved by centralizing everything into a root config file (which would undo the point of this refactor).

The tab/nav **data** stays feature-owned exactly as designed above. When gating by role or subscription plan is needed, extend the two already-shared, already-centralized **shape** definitions instead:
- `TabConfig` (`components/layout/tabs-nav.tsx`) gains optional fields, e.g. `requiredRole?: UserRole[]` / `requiredPlan?: PlanTier[]`.
- `NavItem` (`components/layout/sidebar/nav-items.ts`) gains the same optional fields, for the same reason (e.g. hiding "Settings" from non-admins, or a nav item behind a paid plan).
- One shared, generic filter (e.g. `getVisibleTabs(tabs, context)` / `getVisibleNavItems(items, context)`) lives alongside those shared types and is called by `TabsNav`/`Sidebar`/`BottomNav` before rendering.

Each feature's tab/nav entries then just optionally populate `requiredRole`/`requiredPlan` on their own data — no feature needs to know how gating is evaluated, only whether one of its own tabs needs it. Data stays per-feature; the gating rule and its evaluation logic stay in the one place that already owns the shared shape.

---

## Thin-Page Consistency

`frontend-rules.md` already documents that `page.tsx` files must be thin — resolve params, render one feature component, nothing else — and gives `CaseDetailView` as the worked example. `calendar/page.tsx` and `login/page.tsx` already follow this exactly. Several others have drifted from it, inconsistently:

| File | Problem |
|---|---|
| `app/(protected)/cases/[caseId]/case-details.tsx` | 220 lines directly in the route folder — form state, mutations, save/delete handlers. This is the exact file `frontend-rules.md`'s own example describes as `CaseDetailView` in `components/cases/` — the code just never got moved there. |
| `app/(protected)/cases/[caseId]/case-tabs.tsx` | Same issue, smaller scale, plus the `CaseTabs` naming collision with the enum (see above). |
| `app/(protected)/settings/page.tsx` | 133 lines of form/mutation logic directly in the page file. |
| `app/(protected)/dashboard/page.tsx`, `app/(protected)/cases/page.tsx` | Smaller-scale version of the same thing — modal open/close state and data hooks live in the page file instead of a feature component. |

**Fix, applied per feature as each one is moved into `features/[name]/`:** each of these pages' body moves into a `[name]-view.tsx` (or equivalent) component inside that feature's `components/`, following the already-correct `calendar`/`login` shape — `page.tsx` only resolves route params/search params and renders that one component. This isn't a new rule — it's enforcing the one already written, consistently, instead of only where it happened to be followed.

---

## Code Quality Standards Applied During the Move

Since every touched file already gets opened and re-saved for its import fixes, the following get fixed in the same pass — not as a separate line-by-line rewrite of unrelated logic, but wherever the moved file already needs a look:

- **React Query discipline** (already documented in `frontend-rules.md`, being enforced here, not re-invented): every mutation's `onSuccess`/`onError` toast, query invalidation, and derived state lives in the feature's `hooks/` file — never in a component. If a component-level `toast()` call for an API outcome is found during the move (the way `mutateAsync` + component toast was previously flagged and fixed in settings), it gets moved into the hook in the same commit.
- **Naming.** Variable, function, and prop names describe the domain, not the mechanism — `activeCase`, `onArchiveCase`, `pendingDeleteId`, not `data`, `item`, `handleClick`, `temp`. Fixed opportunistically on files already being touched; not a repo-wide rename sweep.
- **One component per file** — already a documented rule; verified for every moved file. A file colocating a form component with its Zod schema and inferred type (e.g. `profile-tab.tsx` exporting `ProfileTab` + `settingsFormSchema` + `SettingsFormValues`) is not a violation — that's one component and the schema it owns, not two components.
- **Helper files named for what they hold, not generically.** `case-utils.ts` and `hearing-status.ts` are exactly the kind of file this refactor keeps feature-scoped (see File Moves) — as an explicit exception to the "no renames" rule, a helper/util file may be renamed if its current name is generic or misleading (e.g. a follow-up could rename `case-utils.ts` → `case-status-styles.ts` to describe its actual contents — priority/status class lookups). Component, hook, service, and type files keep their names regardless, since those are already named for the domain they represent.
- **No unnecessary hooks or prop drilling.** `useRef` stays only where it's load-bearing (e.g. `DocumentFileList`'s upload-trigger ref — a real imperative-API need). Don't introduce `useEffect`, `useRef`, or context providers to solve something a plain prop or a query hook already solves. Prefer colocating state where it's used over threading callbacks through more than one intermediate layer — if a value needs to pass through 3+ components untouched, that's a signal that composition (children/slots) fits better than more props.

**Known bug fixed as a side effect:** `cases-table.tsx` currently imports `case-utils` via `"../../../components/cases/case-utils"` instead of the `@/` path alias — corrected automatically since the move rewrites this import to `@/features/cases/components/case-utils`.

---

## Migration Steps

1. Create `features/[name]/` folders; `git mv` each file per the File Moves table (preserves git history/blame), including the `case-details.tsx` → `case-detail-view.tsx` (`CaseDetailView`) and `case-tabs.tsx` → `case-detail-tabs.tsx` (`CaseDetailTabs`) renames.
2. Merge each `config/[x]-tabs.ts` + `enums/[x]-tabs.ts` pair into one `features/[x]/constants/[x]-tabs.ts`.
3. Fix imports repo-wide for every moved path (mechanical find-replace per path, then verify with `tsc --noEmit` and `eslint`) — this is also where the stray relative import in `cases-table.tsx` gets corrected to the `@/` alias, and where the `CaseTabs as CaseTabsNav` import alias disappears (the export is now already named `CaseDetailTabs`, no alias needed).
4. Delete now-empty `config/` and `enums/` folders.
5. Layout pass: add the new `PageLayout` component (`components/layout/page-layout.tsx`) alongside the existing `PageContent`/`.page-shell` (additive, nothing deleted yet); wire dashboard, settings, and case-detail through `<PageLayout maxWidth="...">` (default `padded`, no changes needed to their inner content); wire cases' and documents' list pages through `<PageLayout maxWidth="large" padded={false}>` — `padded={false}` means `PageLayout` contributes only the max-width cap here, so `FiltersBar`/`DataTable` keep their own internal `px-4 md:px-6` completely untouched, no doubling; remove the dashboard page's ad-hoc `"px-4 md:px-6 py-6 space-y-6"` div. Calendar is left untouched. Only after every consumer is migrated: delete the now-unused `PageContent` component and the dead `.page-shell` CSS class.
6. Nav & tabs pass: remove the dead commented-out nav item and normalize quotes in `nav-items.ts`; delete `useCaseActiveTab`/`useCaseActiveSubTab` from `hooks/use-active-tab.ts` and switch their call sites to the generic `useActiveTab`/`useActiveSubTab` directly.
7. Thin-page pass: extract the body of `cases/[caseId]` (already done via the rename above), `settings/page.tsx`, `dashboard/page.tsx`, and `cases/page.tsx` into a `[name]-view.tsx` (or `-table.tsx`, matching what already exists) component in each feature's `components/`, leaving `page.tsx` as params-in/component-out — matching the shape `calendar/page.tsx` and `login/page.tsx` already use correctly.
8. Code-quality pass on each moved file: verify toasts/invalidations live in the feature's hook file (not the component), fix any obviously generic/AI-ish names encountered, confirm one component per file, rename a helper file if its current name doesn't describe its contents (e.g. `case-utils.ts`).
9. Update `.claude/architecture.md`'s "Frontend Structure" section and `.claude/frontend-rules.md`'s "App Router Structure" section to reflect the new `features/` tree, the actual `(protected)` route group name (currently documented as `(dashboard)`), the `PageLayout` maxWidth-per-page-type convention, the list-page vs. detail-page composition pattern, and the nav-items/tabs single-source-of-truth rule.
10. Run full build (`pnpm build` for `apps/web`) and manually smoke-test the app (nav between cases, hearings, dashboard, settings, calendar, documents) to confirm no broken imports, no visual regressions, and consistent spacing across pages.

Single PR — all moves land together, per the chosen migration approach.

---

## What Is Explicitly Out of Scope

- No frontend test framework setup (noted as a gap, not addressed here)
- No component/hook/service/type renames and no prop signature changes, **except** the two documented above (`CaseDetails` → `CaseDetailView`, `CaseTabs` → `CaseDetailTabs`) — both are forced by a real naming collision or a default-export inconsistency, not a style preference. Generically-named helper/util files are also candidates for a clarity rename (e.g. `case-utils.ts`).
- No repo-wide naming rewrite — naming fixes only happen on files this migration already touches, not a separate sweep
- No new shared abstractions beyond `PageLayout` itself (no barrel `index.ts` files, no new state layer, no separate List-page or Detail-page wrapper component — `PageLayout` + the existing `FiltersBar`/`DataTable`/`Section` primitives already cover both page shapes)
- No change to backend structure, API contracts, or database schema
- No change to the `(auth)` / `(protected)` / `portal` route group boundaries in `app/`

---

## Risks

- **Import churn is large but mechanical** — every moved file needs its importers updated. Mitigated by doing it as one pass with `tsc --noEmit` as the completeness check (a broken import is a compile error, not a silent runtime failure).
- **Merge conflicts with any concurrent frontend branch** — since this touches nearly every frontend file's path, any other in-flight frontend PR will conflict heavily. Recommend landing this first, before other frontend work continues.
- **Git blame continuity** — using `git mv` (not delete + recreate) preserves history so `git log --follow` still works per file.
