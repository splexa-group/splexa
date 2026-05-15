# Splexa — AI Agent Orientation

Splexa is a **multi-tenant legal practice management SaaS** for Indian law firms. Phase 1.
Stack: pnpm monorepo + Turborepo. Backend: Fastify + Prisma + PostgreSQL + Redis. Frontend: Next.js 14 App Router + React Query + Zustand + Tailwind.

**Read this file first. Then read only the files relevant to your task.**

---

## Before You Write a Single Line

1. Identify the module: `auth` `cases` `hearings` `clients` `documents` `notifications` `dashboard` `team`
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
  → Plugin (registers routes in server)
  → Route (path + method + Zod schema + preHandlers only)
  → Controller (calls service, sends reply — no logic)
  → Service (business rules + activity logging)
  → Repository (all Prisma — always scoped by orgId)
```

### Schema split — where Zod schemas live
| Schema type | Location |
|---|---|
| Input/create schemas used by frontend forms | `packages/shared/src/schemas/` |
| Query param, route param, server-only schemas | `modules/[name]/[name]-schema.ts` |

No raw JSON Schema objects anywhere. Use `@fastify/type-provider-zod`. Types always from `z.infer<>` — never written separately alongside a schema.

### Constants split — where named values live
| Constant type | Location |
|---|---|
| Status values, roles, plan limits (both apps use) | `packages/shared/src/constants.ts` |
| TTLs, Redis keys, activity action names, pagination limits | `apps/server/src/lib/constants.ts` |

### Integration pattern
Every third-party service (email, SMS, WhatsApp) is an adapter behind an interface. A factory resolves the provider from env/DB config. Application code only imports from `lib/integrations/[type]/index.ts` — never from an adapter or SDK directly.

---

## The Absolute Rules

These are never negotiable. No exceptions without an architecture decision.

1. **`orgId` comes from `req.user.orgId` (JWT) only** — never body, params, or query string
2. **Every query on a tenant-scoped table filters by `orgId`** — missing this is a critical security bug
3. **Every successful mutation calls `logActivity()`** — use `ActivityAction.*` constants, never raw strings
4. **Five backend layers, always** — plugin → route → controller → service → repository. No merging.
5. **Zod everywhere on the server** — no raw JSON Schema. Types from `z.infer<>` only.
6. **No magic values** — use `CASE_STATUS.ACTIVE`, `USER_ROLES.ADMIN`, `ActivityAction.CASE_CREATED`, `redisKeys.otp(email)` — never hardcode strings or numbers with business meaning
7. **No `any`, no `!`, no `@ts-ignore`** — fix the type, don't suppress it
8. **No `prisma.*` outside `*-repository.ts`** — ever
9. **No business logic in routes or controllers** — service layer owns this
10. **`softDelete` uses `updateMany({ where: { id, orgId } })`** — never `update({ where: { id } })` alone
11. **Repositories return `null` — services throw `NotFoundError`** — not the other way
12. **No raw `fetch` in frontend components** — use `lib/api/` typed client
13. **No `useEffect` for server data** — React Query only
14. **Access tokens in Zustand (memory) only** — never `localStorage` or `sessionStorage`
15. **kebab-case for all file names** — everywhere, always

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
| No `logActivity()` after a mutation | Every state change must be logged |
| `action: 'case.created'` raw string | `action: ActivityAction.CASE_CREATED` |
| `redis.get(\`otp:${email}\`)` inline | `redis.get(redisKeys.otp(email))` |
| `where: { status: 'ACTIVE' }` | `where: { status: CASE_STATUS.ACTIVE }` |
| Writing a TypeScript type alongside a Zod schema | `type X = z.infer<typeof xSchema>` — one source |
| Raw JSON Schema object in a route | Pass the Zod schema directly — `@fastify/type-provider-zod` handles it |
| Throwing `NotFoundError` in a repository | Return `null` — the service decides to throw |
| `useEffect(() => { fetch('/api/cases')... }, [])` | `const { data } = useCases(filters)` |
| Raw `fetch(...)` in a hook | `casesApi.list(filters)` from `lib/api/cases.ts` |
| `localStorage.setItem('token', ...)` | Zustand store only — memory, cleared on reload |
| `'use client'` on a page file | Default to Server Component; push boundary down |
| Missing `additionalProperties: false` on schema | Unknown fields pass Fastify validation silently |
| `any` to silence a TypeScript error | Fix the type — narrow with `unknown`, use a guard |
| Magic number `3` for OTP attempts | `MAX_OTP_ATTEMPTS` from `lib/constants.ts` |

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

### Activity logging (every mutation in service layer)
```ts
import { ActivityAction } from '@/lib/constants';
await logActivity({ orgId: user.orgId, userId: user.userId, action: ActivityAction.CASE_CREATED, resourceType: 'case', resourceId: case_.id, ipAddress: req.ip });
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
export const caseKeys = {
  all: ['cases'] as const,
  list: (f: CaseFilters) => ['cases', 'list', f] as const,
  detail: (id: string) => ['cases', 'detail', id] as const,
};
export function useCases(filters: CaseFilters) {
  return useQuery({ queryKey: caseKeys.list(filters), queryFn: () => casesApi.list(filters) });
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
