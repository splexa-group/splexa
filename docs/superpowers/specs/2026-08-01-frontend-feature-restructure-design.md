# Frontend Feature-Based Restructure — Design Spec
**Date:** 2026-08-01
**Branch:** bhaskar/fix/frontend
**Phase:** 1 (structural refactor, no behavior change)

---

## Overview

The frontend (`apps/web/src`) is organized by **type** today: `hooks/`, `services/`, `types/` each hold one file per feature, and `components/` holds one folder per feature. As more feature modules land (dashboard, settings, calendar, documents, important-dates were all added in the last few weeks), everything about a single feature — e.g. "cases" — is scattered across 5+ top-level folders (`hooks/use-cases.ts`, `services/cases.ts`, `types/cases.ts`, `mappers/case-form.ts`, `components/cases/`), which makes a feature hard to see, review, or hand off as a unit.

This refactor moves to **feature-based modules**: each feature owns a `features/[name]/` folder containing its own `components/`, `hooks/`, `services/`, `types/`, and (only if needed) `constants/`, `mappers/`, `lib/`. This mirrors the backend's existing self-contained `modules/[name]/` pattern (`.claude/architecture.md`) — same mental model on both sides of the stack.

Two concrete messes get fixed as part of the move:
- `config/[feature]-tabs.ts` + `enums/[feature]-tabs.ts` (two top-level folders, one tightly-coupled file pair each) merge into a single `constants/[feature]-tabs.ts` inside the owning feature.
- `components/modals/` — today a flat grab-bag mixing the generic `Modal` primitive with feature-specific modals (`create-case.tsx`, `add-hearing.tsx`, `add-important-date.tsx`, `opposite-party.tsx`) — splits: feature-specific modals move into their owning feature's `components/modals/`, and only the truly generic `modal.tsx` + `confirm-delete.tsx` remain shared.

**No file is renamed.** Every file keeps its exact current name — only its parent folder path changes. This keeps the migration mechanical (move + fix imports) and avoids touching the kebab-case naming rule (CLAUDE.md rule #9 scopes the `[name].[role].ts` dot-convention to backend modules only — frontend files stay kebab-case).

**No behavior change.** No renamed exports, no new dependencies, no new abstractions (no barrel `index.ts` files added unless a feature already needs one to break an import cycle).

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
│   └── use-active-tab.ts      # genuinely generic (URL-driven tab state) — stays global
├── api/                       # client.ts, http.ts — unchanged
├── store/                     # auth-store.ts — unchanged (used by layout + auth feature both)
├── types/
│   └── misc.ts                # ApiErrorResponse etc. — genuinely cross-cutting, stays global
├── lib/
│   ├── utils.ts                # cn() — unchanged
│   └── options.ts               # DESIGNATION_OPTIONS etc., used by 6+ features — unchanged
└── middleware.ts
```

Each feature folder only gets the subfolders it actually uses — e.g. `clients` does not get an empty `constants/` just for symmetry with `cases`.

---

## File Moves

| Today | Moves to |
|---|---|
| `hooks/use-cases.ts`, `services/cases.ts`, `types/cases.ts`, `mappers/case-form.ts` | `features/cases/{hooks,services,types,mappers}/` |
| `config/case-tabs.ts` + `enums/case-tabs.ts` (merged into one file) | `features/cases/constants/case-tabs.ts` |
| `components/cases/**`, `app/(protected)/cases/cases-table.tsx` | `features/cases/components/` |
| `components/modals/create-case.tsx`, `opposite-party.tsx` | `features/cases/components/modals/` |
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

After the move, `config/` and `enums/` are deleted (empty). `hooks/`, `services/`, `types/`, `components/` at the top level only retain the genuinely global leftovers (`use-active-tab.ts`, `misc.ts`, `ui/`, `layout/`, `shared/`).

`lib/format-date-label.ts` is demoted into `features/dashboard/lib/` since dashboard is its only consumer today. If a second feature needs it later, it gets promoted back to the global `lib/` — same rule the backend already applies to module helpers (`.claude/architecture.md`: "a helper used by only one module belongs in that module's helper file — moves to shared utils the moment a second module needs it").

---

## Rules This Introduces (codify in `frontend-rules.md`)

1. **Features never import another feature's internals directly.** Cross-feature composition happens only at the `app/` page level, or through `components/shared/` and `components/ui/`. This is already a documented rule ("Importing from another feature's components directly" is forbidden) — this refactor is what makes the codebase actually honor it.
2. **One sanctioned exception**, mirroring the backend's cross-module repository rule for genuinely related entities (`hearings.repository.ts` calling `casesRepository.updateNextHearingDate`): a feature's hook may invalidate another feature's exported query-key factory when the two are genuinely coupled — e.g. updating a hearing invalidates `caseKeys.detail(id)` because the case view shows "next hearing date". It must import only the `*Keys` factory, never the other feature's components or services.
3. Each feature is a flat `{components, hooks, services, types}` folder — no forced sub-splitting. A feature adds `constants/`, `mappers/`, or `lib/` only if it actually needs one.

---

## Migration Steps

1. Create `features/[name]/` folders; `git mv` each file per the File Moves table (preserves git history/blame).
2. Merge each `config/[x]-tabs.ts` + `enums/[x]-tabs.ts` pair into one `features/[x]/constants/[x]-tabs.ts`.
3. Fix imports repo-wide for every moved path (mechanical find-replace per path, then verify with `tsc --noEmit` and `eslint`).
4. Delete now-empty `config/` and `enums/` folders.
5. Update `.claude/architecture.md`'s "Frontend Structure" section and `.claude/frontend-rules.md`'s "App Router Structure" section to reflect the new `features/` tree and the actual `(protected)` route group name (currently documented as `(dashboard)`).
6. Run full build (`pnpm build` for `apps/web`) and manually smoke-test the app (nav between cases, hearings, dashboard, settings, calendar, documents) to confirm no broken imports or runtime regressions.

Single PR — all moves land together, per the chosen migration approach.

---

## What Is Explicitly Out of Scope

- No frontend test framework setup (noted as a gap, not addressed here)
- No component renames or prop signature changes
- No new shared abstractions (no barrel `index.ts` files, no new state layer)
- No change to backend structure, API contracts, or database schema
- No change to the `(auth)` / `(protected)` / `portal` route group boundaries in `app/`

---

## Risks

- **Import churn is large but mechanical** — every moved file needs its importers updated. Mitigated by doing it as one pass with `tsc --noEmit` as the completeness check (a broken import is a compile error, not a silent runtime failure).
- **Merge conflicts with any concurrent frontend branch** — since this touches nearly every frontend file's path, any other in-flight frontend PR will conflict heavily. Recommend landing this first, before other frontend work continues.
- **Git blame continuity** — using `git mv` (not delete + recreate) preserves history so `git log --follow` still works per file.
