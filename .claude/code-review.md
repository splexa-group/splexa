# Code Review & PR Rules

## Purpose

As a solo developer, "code review" means you are reviewing your own code before it is merged. These rules are the checklist you run through before every merge. They exist because the bugs that cost you — data leaks, auth bypasses, corrupt data — rarely get caught in the moment you write them.

---

## PR Size

Keep PRs focused. A PR should do one thing:

- Add a feature (e.g., "Add case archiving with ADMIN-only guard")
- Fix a bug (e.g., "Fix OTP not being deleted from Redis after verification")
- Refactor one thing (e.g., "Extract hearing reminder scheduling into notification service")

If you find yourself writing "and also..." in the PR description, split it.

No PR exceeds **400 lines changed** unless it is a schema migration or a new module being added from scratch.

---

## Before Every Merge — Self-Review Checklist

### Security

- [ ] Every new route uses `fastify.authenticate` preHandler
- [ ] Every DB query on a tenant-scoped table filters by `orgId` from JWT (never from request body)
- [ ] No raw passwords, OTPs, or tokens appear in logs or API responses
- [ ] Sensitive fields are excluded from API responses via explicit Prisma `select`
- [ ] New endpoints that modify data have role checks where the spec requires it

### Code Quality

- [ ] No `any` type introduced
- [ ] No `!` non-null assertions introduced
- [ ] No unused imports remain
- [ ] No `console.log` left in — use the Fastify logger (`req.log.info`)
- [ ] No commented-out code
- [ ] File does not exceed 600 lines

### Architecture

- [ ] Business logic is in the service, not the route handler
- [ ] DB queries are in the repository, not the service directly
- [ ] New types are added to `packages/shared` if needed by both apps, otherwise app-local
- [ ] No cross-module imports (module A importing from module B's internal files)
- [ ] Import groups are separated by blank lines

### Tests

- [ ] If auth logic changed → auth tests updated
- [ ] If multi-tenancy guard changed anywhere → cross-firm isolation test exists
- [ ] If a permission rule changed → service test covers allowed and denied cases
- [ ] No trivial tests added for getters or framework behavior

### Cleanup

- [ ] If a feature was removed → its dependencies removed from `package.json`
- [ ] If a package was added → `pnpm audit` was run and passed
- [ ] If a Prisma schema changed → migration file exists and is committed
- [ ] If an env variable was added → `.env.example` updated

### Frontend (if applicable)

- [ ] No inline `style` props except for dynamic values
- [ ] Elements with more than 4 Tailwind classes use a CSS component class
- [ ] Color values use design tokens, not raw hex
- [ ] All interactive elements have `min-h-[44px]` touch targets
- [ ] Loading state implemented for every mutation button
- [ ] Error state handled for every query

---

## What to Look for in Logic

### The "Different Firm" Test

For any new feature that reads or writes a resource: trace the code path from HTTP request to DB query. Ask: "If I send a valid JWT from firm A and ask for a resource owned by firm B, what happens?"

The correct answer is always: 404 (or the record is simply never returned because the `orgId` WHERE clause excludes it).

### The "MEMBER vs ADMIN" Test

For any mutation endpoint: ask "Can a MEMBER (non-admin user) call this and succeed?" If the spec says only ADMINs can do it, there must be an explicit role check in the service — not assumed from the frontend blocking the button.

### The "What Happens When It Fails" Test

For every external call (WhatsApp API, SMS, Supabase, Redis): ask "What happens if this throws?" The answer must be a graceful degradation — log the error, fall back if there is a fallback, return a meaningful error to the caller. Never crash the request silently.

---

## Commit Messages

Use conventional commits format:

```
feat(cases): add case archiving with ADMIN-only guard
fix(auth): delete OTP from Redis after successful verification
refactor(notifications): extract reminder scheduling into notification service
chore(deps): update fastify to 4.x
test(auth): add cross-firm isolation test for case access
docs(readme): add local setup instructions
```

Format: `type(scope): short description`

Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`
Scope: module or app name (`auth`, `cases`, `web`, `shared`)

---

## Cleanup — Non-Negotiable

When you finish any task:

1. **Remove dead code**: if you replaced an approach, delete the old one. Git history exists for a reason.
2. **Remove unused packages**: if you stopped using a library, `pnpm remove` it.
3. **Update `.env.example`**: if you added or removed an env var, update the example file.
4. **Update types**: if you changed an API response shape, update the corresponding type in `packages/shared`.
5. **Remove TODO comments**: if you added a TODO during development and it is still there at merge time, either fix it or create a tracked issue — then remove the comment.

The codebase should always be in a state where the current code represents the current reality. Never leave "we'll clean this up later" debt — later never comes.

---

## No Blind Infrastructure

Before adding any of the following, there must be a specific, demonstrated need:

| Infrastructure        | Justification Required                                   |
| --------------------- | -------------------------------------------------------- |
| Redis caching         | A specific query proved slow in production               |
| General rate limiting | A specific endpoint was abused in production             |
| Job queue (Bull)      | A specific async operation proved blocking or unreliable |
| CDN                   | Asset delivery proved slow for actual users              |
| Elasticsearch         | Full-text search proved slow on actual data volume       |
| Feature flags         | A specific feature needs controlled rollout              |

The only "blind" additions allowed are items explicitly in the product spec or security checklist (JWT auth, OTP rate limiting, HTTPS, Helmet).

---

## Naming Review

Before merging, read every new identifier (variable, function, file, constant) and ask:

- Does this name tell me **what** it is without reading the implementation?
- Is there a more specific name available?
- Does it follow the naming conventions in `typescript-linting.md`?

Rename anything that required you to read the implementation to understand it.

---

## Reviewing AI-Generated Code — Extra Checks

AI agents produce plausible-looking code that passes TypeScript but may violate the invariants this codebase depends on. When reviewing AI output, check specifically for:

### The Invariants AI Most Often Misses

| Check | What to Look For |
|---|---|
| `orgId` source | Is it from `req.user.orgId`? Reject if it came from body, params, or query |
| Tenant isolation | Every `findFirst`/`findMany` on tenant tables — is `orgId` in the `where`? |
| `softDelete` scope | Is `orgId` in the `updateMany` where? A bare `where: { id }` is a bug |
| `deletedAt` filter | Do case/document queries have `deletedAt: null`? |
| Layer violations | Is there a `prisma.*` call outside a repository file? Is there business logic in a route or controller? |
| Schema `additionalProperties` | Is `additionalProperties: false` on every request schema? |
| Floating promises | Is every `async` call awaited or explicitly returned? |
| `any` hiding a type problem | Is `any` used to silence a TS error instead of fixing the underlying type? |
| Frontend token storage | Is anything written to `localStorage`/`sessionStorage`? |

### Red Flags in AI Output

- A controller that calls `prisma.*` directly — the repository layer was skipped
- A service function that returns early without logging on success — activity log was forgotten
- A route with no `preHandler` — likely an accidental public endpoint
- `req.body.orgId` anywhere — org scoping came from the wrong place
- A test that only tests the happy path and has no cross-firm or role-denial case

### Useful Review Questions

1. "If I replay this request with a different `orgId` in the JWT, what happens?"
2. "If a MEMBER calls this mutation, does the code stop them — or just the frontend?"
3. "If this external API call throws, does the request crash silently or degrade gracefully?"
