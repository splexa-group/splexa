# Developer Workflow Rules

## Mindset

You are a solo developer building a production system for lawyers who trust it with confidential legal data. Every decision should be defensible from two angles:

1. **Would this hold up if a senior engineer reviewed it?**
2. **Would this hold up if a lawyer's data was at stake?**

If the answer to either is "maybe not," fix it before moving on.

---

## Documentation Standard

As of 2026-08-03, every doc lives in one feature folder under `docs/`:

```
docs/
├── auth/
├── cases/
├── clients/
├── documents/
├── hearings/
├── calendar/
├── dashboard/
├── settings/
├── frontend/       ← cross-cutting frontend architecture, not tied to one product feature
└── overview.md     ← living cross-module reference (entity map, cascade rules), not date-prefixed
```

Inside a feature folder, every doc — design spec, implementation plan, requirements doc, future
enhancement proposal, critical-bug writeup — uses `YYYY-MM-DD-<description>.md`. The date keeps
the folder chronological; the description says what kind of doc it is (`design`,
`frontend-design`, `plan`, `requirements`, `tasks`). No further nesting beyond the one feature
folder.

**Why feature folders, not flat date-prefixed specs/plans folders:** an earlier pass at this
standard (same day) tried `docs/specs/YYYY-MM-DD-....md` + `docs/plans/YYYY-MM-DD-....md` flat
folders. That made project-wide chronology visible, but gave "everything about Cases" no single
home — a future Cases enhancement or bug writeup would land in the same flat list as every other
feature's docs with no way to browse just Cases. Feature folders fix that directly, at the cost of
losing a single project-wide timeline (still recoverable via `git log --follow` on any file, or
`ls docs/*/  | sort` across folders if needed).

**No `docs/superpowers/` segment** — that path is an internal implementation detail of which
skill produced the file, not something a future contributor should need to know to find it. Both
the brainstorming and writing-plans skills explicitly document that "user preferences override the
default location" — this is that override, recorded once here so it applies every time rather than
needing to be repeated in every conversation. When invoking either skill, write to the relevant
`docs/<feature>/` folder (or `docs/frontend/` for cross-cutting frontend work) instead of the
skill's own default path.

Before this standard, docs were scattered across `docs/specs/[module]/design.md`,
`docs/superpowers/specs/`, and `docs/superpowers/plans/`, accumulated as the project's workflow
evolved. Everything was consolidated into the structure above on 2026-08-03, backdating each
file's name to its real git history date rather than the consolidation date.

---

## Git Branch Naming

```
feat/cases-archiving
feat/auth-email-otp
fix/otp-not-deleted-after-verify
refactor/notification-service-extract
chore/update-fastify-4x
test/cross-firm-isolation-cases
```

Format: `type/short-description-in-kebab-case`

- Branch off `main`. Merge back to `main` via PR.
- One branch per feature or fix — never mix unrelated changes on one branch.
- Delete the branch after merge.

---

## Starting a New Feature

1. Read the relevant section of `product-context.md` — understand what you are building and why before touching any code
2. Identify which module(s) are affected: `auth`, `cases`, `hearings`, `clients`, `documents`, `notifications`, `dashboard`
3. Start from the shared type: does `packages/shared` already have the type you need? If not, add it first
4. Write the Prisma schema change + migration if needed
5. Write the repository function
6. Write the service function
7. Write the route handler + schema validation
8. Write the tests for anything that could break in a costly way
9. Write the frontend API client function
10. Write the React Query hook
11. Build the component(s)
12. Run the self-review checklist from `code-review.md`

Do not skip steps. Do not build the UI before the API is working.

---

## The "Do I Need This?" Test

Before adding any of the following, ask the question:

| Addition                       | Required Question                                                         |
| ------------------------------ | ------------------------------------------------------------------------- |
| A new npm package              | Is there a built-in or existing dependency that does this?                |
| Redis caching for a query      | Has this query actually been measured as slow?                            |
| A new abstraction / base class | Am I solving a recurring pattern or just anticipating one?                |
| A new Zustand store            | Is this truly global UI state, or can it live in component state?         |
| A new shared utility           | Is this actually used in both apps?                                       |
| Rate limiting on an endpoint   | Has this endpoint been abused or is there a specific product requirement? |
| A third-party service          | Is there a simpler built-in solution?                                     |

If you cannot answer the question with a concrete reason, do not add it.

---

## Debugging Approach

1. Read the error message fully before doing anything else
2. Add structured logging (`req.log.info`, `req.log.error`) — do not pepper `console.log` then forget to remove it
3. Use Prisma Studio (`pnpm --filter server exec prisma studio`) to inspect the database state directly
4. Check Redis state with `redis-cli` before assuming the application logic is wrong
5. Isolate the failing layer: is the issue in the route? the service? the repository? the external API?
6. Write a test that reproduces the bug before fixing it — then fix it and watch the test pass

---

## File Creation Checklist

Before creating a new file:

- [ ] Does this file follow kebab-case naming?
- [ ] Is it in the right location (module folder, not dumped in root `src/`)?
- [ ] Will it stay under 400–600 lines?
- [ ] Does it have a single clear responsibility (can you describe it in one sentence without "and")?

---

## Dependency Addition Process

```bash
# 1. Check if the built-in or an existing dep solves it
# 2. If not, check the package on npmjs.com — last publish date, weekly downloads, open issues
# 3. Check for vulnerabilities
pnpm audit

# 4. Add to the correct workspace
pnpm --filter server add <package>

# 5. Run audit again after adding
pnpm audit

# 6. Update .env.example if the package needs configuration
```

If `pnpm audit` reports a high/critical vulnerability in a package you just added, find an alternative. Do not add vulnerable packages.

---

## When Removing a Feature

Removing something is as important as adding it. A removed feature leaves behind:

**In code:**

- Route handler and schema
- Service function
- Repository function
- Related types in `packages/shared`
- Frontend API client function
- React Query hook
- Component(s)

**In config:**

- npm packages no longer needed (remove with `pnpm remove`)
- Environment variables no longer needed (remove from `.env.example`)
- Prisma schema fields (if removing a DB column, create a migration)

**In tests:**

- Test cases for the removed feature

Go through this list when removing anything. Leave the codebase in a state where the code matches the current product, not the product as it once was.

---

## Logging Guidelines

Use Fastify's built-in Pino logger. Do not use `console.log` in production code.

```ts
// In route handlers — req.log is scoped to the request (has request ID)
req.log.info({ caseId, orgId }, "Case created");
req.log.error({ error, caseId }, "Failed to archive case");

// In services / workers — use the fastify logger instance
fastify.log.info({ hearingId }, "Reminder scheduled");
fastify.log.warn({ reminderId }, "Reminder send failed, retrying");
```

Log levels:

- `error`: something failed that needs investigation
- `warn`: something unexpected but handled (retry, fallback)
- `info`: significant business events (case created, reminder sent, user logged in)
- `debug`: detailed diagnostic info (only in development)

What to log:

- User actions: login, logout, case created, case archived
- Auth events: OTP sent, OTP verified, login failed, account locked
- Notification events: reminder enqueued, reminder sent, reminder failed
- Errors: all caught exceptions in services and workers

What NOT to log:

- Passwords, OTPs, JWT tokens, refresh tokens
- Full mobile numbers (mask: `+91 XXXXXX7890`)
- Full request bodies (may contain sensitive case data)

---

## Error Recovery

Production errors happen. When they do:

1. The error is logged with enough context to reproduce: `{ error, userId, orgId, caseId }`
2. The error does not leak implementation details to the client
3. The system continues running — one bad request does not crash the server
4. The user sees a plain English message: "Something went wrong. Please try again."

Fastify's `setErrorHandler` handles this centrally. Individual route handlers do not need try/catch unless they are handling a specific recoverable error (like "case already exists").

---

## AI Agent Workflow — How to Work in This Codebase

When an AI agent is implementing a task in this project, follow this sequence precisely. Do not skip steps or reorder them.

### Before Writing Any Code

1. Identify the module: which of `auth`, `cases`, `hearings`, `clients`, `documents`, `notifications`, `dashboard`, `team` is affected?
2. Read the existing files in that module before creating anything — the pattern is already there.
3. Check `packages/shared` — does the type you need already exist? If yes, use it. If no, add it first.
4. Check `database-rules.md` if any schema or query changes are needed.

### Implementing (Always in This Order)

```
shared types → schema migration → repository → service → routes/schema → tests → frontend hook → component
```

Do not build the frontend before the backend function exists and is tested.

### Before Claiming Done

Run the self-check checklist from the relevant file:
- `backend-rules.md` → Backend AI self-check
- `database-rules.md` → Database AI self-check
- `frontend-rules.md` → Frontend AI self-check
- `code-quality.md` → Code quality AI self-check
- `testing-rules.md` → Tests AI self-check

All checklists must pass. Do not mark a task complete if any item is unresolved.

### Common AI Mistakes in This Codebase (Avoid These)

| Mistake | Correct Approach |
|---|---|
| Putting orgId in request body/params | Always `req.user.orgId` from JWT |
| Calling `prisma.*` directly in a service | Use the repository — `casesRepository.findById(...)` |
| `findUnique({ where: { id } })` on tenant tables | `findFirst({ where: { id, orgId } })` |
| Forgetting `deletedAt: null` on case queries | Archived cases would appear as active |
| `softDelete` without orgId scope | Use `updateMany({ where: { id, orgId } })` |
| `useEffect` + `fetch` for server data on frontend | Use React Query `useQuery` |
| Raw `fetch` in a React component | Use the typed client in `lib/api/` |
| Missing `additionalProperties: false` on schema | Unknown fields pass validation silently |
| `any` type to resolve a TypeScript error | Fix the type — narrow with `unknown`, use a guard |

---

## Phase 1 Scope Discipline

Do not build Phase 2 features in Phase 1. Specifically, do NOT add:

- Elasticsearch / full-text search beyond PostgreSQL's built-in
- React Native / mobile app code
- Payment gateway (add in Phase 1 only if MVP is ready and you're doing soft launch)
- Advanced analytics / PostHog beyond basic event tracking
- S3 (use Supabase Storage for Phase 1)
- Redis caching for API responses (only if specifically proven necessary)
- Email notifications (WhatsApp + SMS only for Phase 1)
- Advanced role permissions beyond ADMIN / MEMBER
- Multi-language UI (English only until Hindi translation is reviewed)
- Activity/audit logging (`logActivity`, `ActivityAction`, an `AuditLog` table) — not built. It's not part of the core hearing-reminder value prop; revisit in Phase 2.

When you find yourself wanting to add something beyond Phase 1 scope: write it in a `BACKLOG.md` note and continue.
