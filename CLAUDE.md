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
3. **Every successful mutation calls `logActivity()`** — use `ActivityAction.*` constants
4. **Five backend layers always**: plugin → route → controller → service → repository
5. **Zod everywhere** — no raw JSON Schema; types always from `z.infer<>`
6. **No magic values** — use `CASE_STATUS.*`, `USER_ROLES.*`, `ActivityAction.*`, `redisKeys.*`
7. **No `any`, no `!`, no `@ts-ignore`**
8. **No `prisma.*` outside `*-repository.ts`**
9. **Repositories return `null` — services throw `NotFoundError`**
10. **kebab-case for all file names**, everywhere

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
