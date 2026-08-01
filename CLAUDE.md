# Splexa — Claude Entry Point

## Read First

Start every session by reading `.claude/README.md`. It contains your full orientation: what the project is, which skill files to read for your task, the absolute rules, and the most common mistakes to avoid.

**For any product or UX decision, also read `.claude/product-context.md`.**  
It explains who we are building for, why features work the way they do, and the standard every UI decision is measured against.

---

## What This Project Is

Multi-tenant legal practice management SaaS for Indian law firms. Phase 1.  
The primary user is an Indian advocate managing 15–25 active cases across multiple courts.  
The single most important feature is hearing date reminders. Everything else is secondary to that.

---

## The Non-Negotiables (Memorise These)

1. **`orgId` from `req.user.orgId` (JWT) only** — never body, params, or query string
2. **Every tenant-scoped DB query filters by `orgId`** — missing this is a critical security bug
3. **Backend layers always**: route → controller → service → repository. `route.ts` is itself the
   Fastify plugin (no separate `plugin.ts`); every module registers under the same `/api/v1`
   prefix in `app.ts`, not a per-module one.
4. **Zod everywhere** — no raw JSON Schema; types always from `z.infer<>`
5. **No magic values** — use `CASE_STATUS.*`, `USER_ROLES.*`
6. **No `any`, no `!`, no `@ts-ignore`**
7. **No `prisma.*` outside `*.repository.ts`** — select shapes live in `db/selects/[entity].select.ts`, never inline and never in a module folder
8. **Repositories return `null` — services throw** via `Errors.xxx()` (`@/utils/errors`)
9. **File naming**: kebab-case everywhere except inside a backend module, where it's
   `[module-name].[role].ts` (e.g. `cases.service.ts`) — see `.claude/architecture.md`

Activity/audit logging (`logActivity()`, `ActivityAction`) is Phase 2 scope — not built, do not add it. See `developer-workflow.md`.

---

## Skill Files

All rules, patterns, and decisions live in `.claude/`. The README routes you to the right file for your task.

```
.claude/
├── README.md              ← Start here every session
├── product-context.md     ← Product brain — read for any feature or UX decision
├── architecture.md
├── backend-rules.md
├── frontend-rules.md
├── database-rules.md
├── security-rules.md
├── code-quality.md
├── typescript-linting.md
├── ui-component-rules.md
├── shared-package-rules.md
├── testing-rules.md
├── monorepo-rules.md
├── code-review.md
└── developer-workflow.md
```
