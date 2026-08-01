# Splexa — AI Agent Orientation

Splexa is a **multi-tenant legal practice management SaaS** for Indian law firms. Phase 1.
Stack: pnpm monorepo + Turborepo. Backend: Fastify + Prisma + PostgreSQL (no Redis in Phase 1). Frontend: Next.js 16 App Router + Axios + React Query + Zustand + Tailwind v4.

**Read this file first. Then read only the files relevant to your task.**

---

## Before You Write a Single Line

1. Identify the module: `auth` `cases` `hearings` `clients` `documents` `important-dates` `dashboard` `settings`
2. Read the existing files in that module — the pattern is already there, follow it exactly
3. Check `packages/shared` — does the type or constant you need already exist?
4. Run the relevant self-check checklist (bottom of each skill file) before claiming done

---

## Task → Which Files to Read

| You are working on… | Read these files |
|---|---|
| Any feature or UX decision | `product-context.md` first — understand the why before the how |
| Any backend module | `backend-rules.md` + `database-rules.md` + `security-rules.md` |
| Any frontend component | `frontend-rules.md` + `ui-component-rules.md` |
| Auth / OTP / JWT | `security-rules.md` + `backend-rules.md` |
| Database schema / queries | `database-rules.md` |
| A new shared type, schema, or constant | `shared-package-rules.md` |
| Adding / removing a dependency | `monorepo-rules.md` |
| Writing or fixing tests | `testing-rules.md` |
| Before merging / declaring done | `code-review.md` |
| Unsure where something belongs | `architecture.md` |
| Any file in the entire repo | `code-quality.md` + `typescript-linting.md` (always apply) |

---

## Architecture in 60 Seconds

### Backend request flow — never skip or merge layers
```
HTTP request
  → Route (path + method + Zod schema + preHandlers only — this file also IS the Fastify
    plugin app.ts registers; there is no separate plugin.ts)
  → Controller (calls service, sends reply — no logic)
  → Service (business rules + activity logging)
  → Repository (all Prisma — always scoped by orgId, select shapes from db/selects/)
```
Every module is registered in `app.ts` under the same single `/api/v1` prefix — a route's own
path (e.g. `/cases/:caseId/hearings`) is the complete picture of what URL it serves.

### Schema split — where Zod schemas live
| Schema type | Location |
|---|---|
| Query param, route param, body schemas | `modules/[name]/[name].schema.ts` |

No raw JSON Schema objects anywhere. Use `@fastify/type-provider-zod`. Types always from `z.infer<>` — never written separately alongside a schema.

### Constants split — where named values live
| Constant type | Location |
|---|---|
| Enums used by both apps (UserRole, etc.) | `packages/shared/src/enums/` |
| Types used by both apps | `packages/shared/src/models/` |
| OTP thresholds, token TTLs (all in ms), cookie names | `apps/server/src/constants/auth.ts` |
| Pagination limits, upload limits | `apps/server/src/constants/misc.ts` |

### Response envelope
All API responses share one shape — controllers just `return` data:
- **Success**: `{ success: true, data: ... }` — wrapped by `responsePlugin` (preSerialization hook)
- **Error**: `{ success: false, error: { code, message } }` — formatted by `errorHandlerPlugin`

### Integration pattern
Every third-party service (email, SMS, WhatsApp) is an adapter behind an interface. A factory resolves the provider from env config. Application code only imports from `@/integrations/[type]/index.ts` — never from an adapter or SDK directly.

---

## The Absolute Rules

These are never negotiable. No exceptions without an architecture decision.

1. **`orgId` comes from `req.user.orgId` (JWT) only** — never body, params, or query string
2. **Every query on a tenant-scoped table filters by `orgId`** — missing this is a critical security bug
3. **Backend layers, always** — route → controller → service → repository. No merging. (`route.ts`
   itself is the Fastify plugin — there is no separate `plugin.ts`; every module registers under
   the same single `/api/v1` prefix in `app.ts`.)
4. **Zod everywhere on the server** — no raw JSON Schema. Types from `z.infer<>` only.
5. **No magic values** — use `CASE_STATUS.ACTIVE`, `USER_ROLES.ADMIN` — never hardcode strings or numbers with business meaning
6. **No `any`, no `!`, no `@ts-ignore`** — fix the type, don't suppress it
7. **No `prisma.*` outside `*.repository.ts`** — ever. Select shapes live in `db/selects/[entity].select.ts`, not inline in the repository and not in a module folder.
8. **No business logic in routes or controllers** — service layer owns this
9. **`softDelete` uses `updateMany({ where: { id, orgId } })`** — never `update({ where: { id } })` alone
10. **Repositories return `null` — services throw** via the `Errors.xxx()` factory (`@/utils/errors`) — not the other way
11. **No raw `fetch` in frontend components** — use `lib/api/` typed client
12. **No `useEffect` for server data** — React Query only
13. **Access tokens in Zustand (memory) only** — never `localStorage` or `sessionStorage`
14. **File naming**: kebab-case for standalone/top-level files everywhere; inside a backend module,
    `[module-name].[role].ts` (e.g. `cases.controller.ts`) — see `architecture.md`.

Activity/audit logging (`logActivity()`, `ActivityAction`) is **Phase 2 scope** — not built. Do not add it; it is not a violation of these rules to omit it.

---

## What AI Agents Get Wrong in This Codebase

Read this before writing anything. These are the most frequent mistakes.

| Mistake | Correct approach |
|---|---|
| `orgId` from `req.body` or `req.params` | Always `req.user.orgId` from verified JWT |
| `prisma.cases.findMany(...)` in a service | `casesRepository.findAllByOrg(orgId, filters)` |
| `prisma.cases.findUnique({ where: { id } })` | `prisma.cases.findFirst({ where: { id, orgId } })` |
| Missing `deletedAt: null` on case/document queries | Archived records appear as active |
| `softDelete(id)` without orgId | `softDelete(id, orgId)` using `updateMany` |
| `redis.get(\`otp:${email}\`)` inline | `redis.get(redisKeys.otp(email))` |
| `where: { status: 'ACTIVE' }` | `where: { status: CASE_STATUS.ACTIVE }` |
| Writing a TypeScript type alongside a Zod schema | `type X = z.infer<typeof xSchema>` — one source |
| Raw JSON Schema object in a route | Pass the Zod schema directly — `@fastify/type-provider-zod` handles it |
| Throwing `NotFoundError` in a repository | Return `null` — the service decides to throw |
| `useEffect(() => { fetch('/api/cases')... }, [])` | `const { data } = useCases(filters)` |
| Raw `fetch(...)` or `axios.get(...)` in a hook | `casesApi.list(filters)` from `services/cases.ts` |
| `localStorage.setItem('token', ...)` | Tokens are httpOnly cookies — store holds user object only |
| `useAuthStore.getState().accessToken` | Field does not exist — store has user object only |
| `'use client'` on a page file | Default to Server Component; push boundary down |
| Missing `additionalProperties: false` on schema | Unknown fields pass Fastify validation silently |
| `any` to silence a TypeScript error | Fix the type — narrow with `unknown`, use a guard |
| Magic number `3` for OTP attempts | `MAX_OTP_ATTEMPTS` from `@/constants` |
| `new NotFoundError('...')` in a service | `throw Errors.userNotFound()` from `@/utils/errors` |
| `reply.code(201).send(data)` in a controller | `reply.code(201); return data;` — never call `send()` |
| `import from '@splexa/shared'` | `import from '@splexa-group/shared/enums'` or `/models` |

---

## Key Patterns — Quick Reference

### Repository function signatures (use these names exactly)
```ts
findById(id: string, orgId: string): Promise<T | null>
findAllByOrg(orgId: string, filters: Filters): Promise<PaginatedResult<T>>
create(data: CreateInput): Promise<T>
update(id: string, orgId: string, data: UpdateInput): Promise<T>
softDelete(id: string, orgId: string): Promise<void>
```

### Error factories (use Errors.xxx() — never construct AppError directly)
```ts
import { Errors } from '@/utils/errors';
if (!user) throw Errors.userNotFound();
if (!session) throw Errors.sessionExpired();
```

### Pagination (all list queries)
```ts
const [data, total] = await prisma.$transaction([
  prisma.cases.findMany({ where: { orgId, deletedAt: null }, skip, take: limit }),
  prisma.cases.count({ where: { orgId, deletedAt: null } }),
]);
return { data, total, page, limit };
```

### React Query hook (all server data)
```ts
// Keys factory exported from the hooks file — components never hardcode key strings
export const caseKeys = {
  all: ['cases'] as const,
  list: (f: CaseFilters) => ['cases', 'list', f] as const,
  detail: (id: string) => ['cases', 'detail', id] as const,
};
export function useCases(filters: CaseFilters) {
  return useQuery({ queryKey: caseKeys.list(filters), queryFn: () => casesApi.list(filters) });
}
// Mutations: toasts in onSuccess/onError, invalidate in onSuccess
export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: caseKeys.all }); toast.success("Created."); },
    onError: (err) => toast.error(err.message || "Failed."),
  });
}
```

---

## All Skill Files

| File | Covers | Priority |
|---|---|---|
| `product-context.md` | Product brain — who we build for, why features work this way, the UX standard | Read for any feature or UX decision |
| `architecture.md` | Monorepo layout, module boundaries, file naming | High — read for any new file |
| `backend-rules.md` | Five-layer pattern with full examples, auth, activity logging, Zod setup | High — read for all backend work |
| `database-rules.md` | Prisma queries, orgId scoping, soft deletes, transactions, Redis, repository naming | High — read for all DB work |
| `security-rules.md` | Multi-tenancy, roles, OTP, JWT, document access, portal security | High — read for auth or any data access |
| `frontend-rules.md` | App Router, React Query, Zustand, API client, JWT storage, env vars, forbidden patterns | High — read for all frontend work |
| `code-quality.md` | DRY/SOLID, no magic values, constants/enums, type safety, async discipline | Always — applies everywhere |
| `typescript-linting.md` | Strict TS config, ESLint rules, import order, naming conventions | Always — applies everywhere |
| `ui-component-rules.md` | Component hierarchy, primitives, loading/error states, accessibility, mobile UX | Read before building components |
| `shared-package-rules.md` | What belongs in shared, type/schema/constant split, how to add new items | Read before touching packages/shared |
| `testing-rules.md` | Vitest conventions, what to test, factories, mocking rules, naming | Read before writing tests |
| `monorepo-rules.md` | pnpm commands, Turborepo pipeline, dependency vetting, forbidden package managers | Read before adding dependencies |
| `code-review.md` | Self-review checklist, AI-generated code review lens, cleanup obligations | Read before declaring work done |
| `developer-workflow.md` | Feature order, git branching, AI agent instructions, Phase 1 scope, logging | Read for workflow and scope questions |
