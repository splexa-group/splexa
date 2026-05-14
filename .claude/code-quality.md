# Code Quality — DRY, SOLID & Design Patterns

## The Standard

Write code as a senior engineer who has maintained production systems through bugs, scaling incidents, and team changes. Every line should be defensible in a code review with someone who cares deeply about correctness and maintainability.

This is **not** vibe-coding. It is not intern-level copy-paste. It is not over-engineered abstraction for its own sake.

---

## DRY — Don't Repeat Yourself

### What DRY Actually Means

DRY is about **knowledge duplication**, not text duplication. Two similar-looking code blocks that represent different business rules are fine to leave separate. One piece of business logic that appears in three places is a DRY violation.

### Applying DRY in This Project

**Do extract when:**

- The same business rule is encoded in multiple places (e.g., "only ADMIN can archive a case")
- The same query filter appears in multiple route handlers
- The same transformation runs on the same shape of data in 3+ places

**Do NOT extract when:**

- Two things look similar but have different reasons to change
- You would need 4 parameters and a flag to make the abstraction work
- The extraction would be harder to read than the duplication

### Extraction naming

Name extracted functions after **what they do**, not how they do it:

- `assertUserCanModifyCase(user, case)` ✅
- `checkPermissionsHelper(...)` ❌
- `validateAndReturnBooleanForCaseAccess(...)` ❌

---

## SOLID Principles — Applied Pragmatically

### Single Responsibility

Each module, class, or function has one reason to change.

```ts
// ❌ Bad — mixes HTTP handling with business logic with notification
async function createCaseHandler(req, reply) {
  const data = req.body;
  const case_ = await prisma.cases.create({ data: { ...data, orgId: req.user.orgId } });
  const hearing = await prisma.hearings.create({ data: { caseId: case_.id, ... } });
  await sendWhatsApp(req.user.mobile, `Case created: ${case_.caseNumber}`);
  reply.send(case_);
}

// ✅ Good — handler delegates, each thing is separate
async function createCaseHandler(req, reply) {
  const case_ = await caseService.create(req.user.orgId, req.body);
  reply.send(case_);
}
// caseService.create handles DB. Notification is triggered by a separate event/hook.
```

### Open/Closed

Extend behavior without modifying existing code. In this project this primarily applies to notification channels:

```ts
// ✅ Both channels implement the same interface. Adding email later = new file, not editing existing ones.
interface NotificationChannel {
  send(to: string, message: string): Promise<void>;
}
class WhatsAppChannel implements NotificationChannel { ... }
class SmsChannel implements NotificationChannel { ... }
```

### Liskov Substitution

When you extend or implement, the subtype must honor the contract of the base. Do not override a method to throw — that breaks callers.

### Interface Segregation

Do not force callers to depend on methods they don't use.

```ts
// ❌ One big service interface
interface CaseService {
  create(...): ...;
  archive(...): ...;
  exportToPdf(...): ...;
  generatePortalToken(...): ...;
}

// ✅ Separate concerns — consumers depend only on what they need
interface CaseMutationService { create(...): ...; archive(...): ...; }
interface CasePortalService { generatePortalToken(...): ...; }
```

### Dependency Inversion

High-level modules depend on abstractions. Concretely: your route handler depends on a service interface, not a Prisma call. Your service depends on a repository interface, not `prisma.cases.findMany`.

For Phase 1, full DI containers are overkill. Instead: pass the db client/service via Fastify's `decorate` pattern or function parameter injection — not imported as a global singleton inside business logic functions.

---

## Design Patterns — Use Only What Fits

### Repository Pattern (Backend)

Isolate all Prisma calls inside repository files. Service functions call repositories, never raw `prisma` directly.

```
modules/cases/
├── cases-repository.ts   # All prisma.cases.* calls live here
├── cases-service.ts      # Business logic, calls repository
├── cases-routes.ts       # Fastify route definitions, calls service
└── cases-schema.ts       # Zod validation schemas
```

This means: if Prisma changes or you switch ORM, you change the repository files only.

### Service Layer

All business logic lives in `*-service.ts`. Routes never contain business logic. Repositories never contain business logic.

```ts
// ❌ Logic in route
fastify.post("/cases", async (req, reply) => {
  if (req.user.role !== "ADMIN") throw new Error("Forbidden");
  const existing = await prisma.cases.findFirst({
    where: { caseNumber: req.body.caseNumber, orgId: req.user.orgId },
  });
  if (existing) throw new Error("Duplicate");
  // ...
});

// ✅ Logic in service
fastify.post("/cases", async (req, reply) => {
  const case_ = await caseService.create(req.user, req.body);
  reply.code(201).send(case_);
});
```

### Strategy Pattern (Notifications)

Notification channels (WhatsApp, SMS) are strategies. The notification service selects the strategy at runtime, not via a long if/else in a route.

### Plugin Pattern (Fastify)

Every module registers itself as a Fastify plugin via `fastify-plugin`. This gives proper encapsulation and avoids scope leakage.

---

## Variable and Function Naming

Use names that explain **what** the thing is or does. No single-letter variables outside of loop counters or mathematical formulas. No abbreviations unless universally understood (`req`, `res`, `id`, `db`).

```ts
// ❌
const d = await getD(u.fId);
const r = d.filter((x) => x.s === "ACTIVE");

// ✅
const cases = await getCasesForFirm(user.orgId);
const activeCases = cases.filter((c) => c.status === "ACTIVE");
```

Booleans are named as questions: `isActive`, `hasAccess`, `canArchive`, `isVerified`.

Functions are named as actions: `createCase`, `archiveCase`, `sendReminder`, `buildPortalUrl`.

---

## What "Clean Code" Means Here

1. **If it needs a comment to explain what it does, rename it.** Comments explain _why_, not _what_.
2. **No commented-out code** in commits — delete it. Git has history.
3. **No `TODO` comments without a linked issue** — they accumulate forever.
4. **Early returns over nested ifs.** If the precondition fails, return fast.
5. **Functions do one thing.** If you use "and" to describe what a function does, split it.
6. **No magic numbers or strings.** Use named constants.

---

## No Magic Values — Constants, Enums, and Types

Any value that has a business meaning, appears in more than one place, or is a threshold / limit / timeout must be named. A hardcoded literal is only acceptable when it is universally obvious and used exactly once in a self-documenting context.

### What Needs a Constant

| Magic value | Named form |
|---|---|
| `if (attempts >= 3)` | `MAX_OTP_ATTEMPTS = 3` |
| `ttl: 600` | `OTP_TTL_SECONDS = 600` |
| `where: { status: 'ACTIVE' }` | `CASE_STATUS.ACTIVE` |
| `role: 'ADMIN'` | `USER_ROLES.ADMIN` |
| `action: 'case.created'` | `ActivityAction.CASE_CREATED` |
| `redis.get(\`otp:${mobile}\`)` | `redisKeys.otp(mobile)` |
| `Math.min(limit, 100)` | `MAX_PAGE_SIZE = 100` |
| `expiry: 15 * 60 * 1000` | `ACCESS_TOKEN_EXPIRY_MS = 900_000` |

### Where Constants Live

| Scope | Location |
|---|---|
| Used by both apps (statuses, roles, plan limits) | `packages/shared/src/constants.ts` |
| Backend only (TTLs, expiry durations, activity actions, Redis key builders) | `apps/server/src/lib/constants.ts` |
| Frontend only (animation durations, z-index ladder) | `apps/web/src/lib/constants.ts` |
| Single module only | Top of the relevant service or schema file — not dumped in a global constants file |

### Status Strings — Always Use the Constant

```ts
// ❌ Hardcoded — silent mismatch if the value ever changes; not searchable
const active = cases.filter(c => c.status === 'ACTIVE');

// ✅ Constant — a typo is a TypeScript error; renaming is a one-file change
import { CASE_STATUS } from '@splexa/shared';
const active = cases.filter(c => c.status === CASE_STATUS.ACTIVE);
```

### Activity Action Names — Never Freeform Strings

```ts
// ❌ Freeform — 'case_created', 'case.created', 'Case Created' are all different
await logActivity({ action: 'case.created' });

// ✅ Typed constant — consistent, searchable, impossible to typo
import { ActivityAction } from '@/lib/constants';
await logActivity({ action: ActivityAction.CASE_CREATED });
```

### Redis Keys — Always Use Builders

```ts
// ❌ Raw strings scattered across the codebase — one typo breaks the entire flow
await redis.get(`otp:${mobile}`);
await redis.setEx(`otp_rate:${mobile}`, 3600, '1');

// ✅ Typed builders — consistent format, one place to change if the key structure changes
import { redisKeys } from '@/lib/constants';
await redis.get(redisKeys.otp(mobile));
await redis.setEx(redisKeys.otpRate(mobile), OTP_RATE_WINDOW_SECONDS, '1');
```

### When a Literal Is Acceptable

A hardcoded value is acceptable when **all three** conditions are true:

1. It is universally understood without context (HTTP status `201`, `0`, `1`, `true`)
2. It is used exactly once and the surrounding code makes the meaning self-evident
3. Changing it would never affect any other code path

```ts
// ✅ Acceptable — 201 is a universally understood HTTP status; used once
reply.code(201).send(case_);

// ✅ Acceptable — the expression is the documentation
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ✅ Acceptable — test data literals in __tests__/ files
const user = makeUser({ orgId: 'org-a', role: 'ADMIN' });

// ❌ Not acceptable — 3 has business meaning (max OTP attempts)
if (attempts >= 3) lockAccount();

// ❌ Not acceptable — used in multiple places
prisma.cases.findMany({ take: 20 });  // and elsewhere: Math.min(limit, 20)
```

---

## TypeScript Type Safety

Types are documentation that the compiler enforces. Weakening them shifts bugs from compile time to runtime.

### Rules

- **No `any`** — ever. Use `unknown` and narrow it, or fix the upstream type.
- **No type assertions (`as X`)** without a one-line comment explaining why the compiler can't infer it.
- **No non-null assertions (`!`)** unless you can prove it — prefer an early return guard.
- **No `@ts-ignore` or `@ts-expect-error`** without a linked issue or explanation.
- Return types on all exported functions — inferred return types are fine for internal helpers.

```ts
// ❌
function getUser(id: any): any { ... }
const name = (user as Admin).name;
const email = user!.email;

// ✅
function getUser(id: string): Promise<User | null> { ... }
if (!isAdmin(user)) throw new ForbiddenError();
const name = user.name;
if (!user.email) throw new ValidationError('Email required');
```

### Zod is the boundary

All external input (request bodies, query strings, env vars, DB reads from external sources) goes through a Zod schema before touching typed code. Never cast unvalidated input.

---

## Async / Promise Discipline

Async bugs are the hardest to trace. These rules eliminate the common class of them.

- **Never create a floating promise.** Every `async` call is either `await`ed or explicitly returned.
- **Never `.catch(() => {})` silently.** If you suppress an error, log it at minimum and explain why.
- **Propagate, don't swallow.** Let errors bubble to the Fastify error handler — it knows what to do.
- **No `async` functions that don't `await`.** Remove the keyword; sync functions are clearer.
- **Sequential vs parallel deliberately.** Use `Promise.all` when operations are independent; `await` sequentially when one depends on the other or order matters.

```ts
// ❌ Floating promise — fire-and-forget hidden bug
sendReminder(userId);

// ❌ Silent swallow
await sendReminder(userId).catch(() => {});

// ✅ Explicit non-critical path — logged, not swallowed
await sendReminder(userId).catch((err) => logger.warn({ err }, 'reminder send failed'));

// ❌ Unnecessary sequential — doubles latency
const cases = await casesRepository.findAll(orgId);
const hearings = await hearingsRepository.findAll(orgId);

// ✅ Parallel — independent queries
const [cases, hearings] = await Promise.all([
  casesRepository.findAll(orgId),
  hearingsRepository.findAll(orgId),
]);
```

---

## Forbidden — Never Do These

Explicit prohibitions for AI agents and human reviewers alike. No exceptions without an architecture-level decision.

| Forbidden | Why |
|---|---|
| `prisma.*` directly in a controller or route | Bypasses repository layer; untestable |
| `process.env.X` in business logic | Bypasses validated env config; breaks startup checks |
| Importing one module's internals from another module | Breaks module isolation |
| Catching an error and re-throwing a generic `new Error('something failed')` | Destroys stack trace and type information |
| `console.log` in committed code | Use the Fastify logger (`req.log`, `app.log`) |
| Hardcoded org IDs, user IDs, or any tenant identifiers | Multi-tenancy bug waiting to happen |
| Returning raw Prisma model shapes to the API response | Leaks internal schema; use mapped types |
| Mutations inside a `GET` handler | Violates HTTP semantics; causes cache bugs |
| `DELETE` or `UPDATE` without a `WHERE orgId =` clause | Cross-tenant data destruction |
| Hardcoded status string `'ACTIVE'` instead of `CASE_STATUS.ACTIVE` | Silent mismatch if the value changes; non-searchable |
| Freeform activity action string `'case.created'` | Use `ActivityAction.CASE_CREATED` — consistent across modules |
| Raw Redis key string `` `otp:${x}` `` inline | Use `redisKeys.otp(x)` — one place to change the key structure |
| Magic threshold or limit number without a named constant | Business rule buried in code; changing it requires grep |

---

## AI Agent Self-Check — Before Declaring Work Done

Before saying a task is complete, verify each item:

**Correctness**
- [ ] All new code is reachable — no dead branches
- [ ] `orgId` scope is present on every query that touches tenant data
- [ ] No floating promises introduced
- [ ] Zod validation exists at every request boundary

**Type safety**
- [ ] No `any`, `@ts-ignore`, or unexplained `as X` added
- [ ] Exported functions have explicit return types

**Layer discipline**
- [ ] No Prisma calls outside repository files
- [ ] No business logic in routes or controllers
- [ ] No cross-module internal imports

**Quality**
- [ ] No `console.log` left in
- [ ] No commented-out code
- [ ] No TODO without a linked issue
- [ ] New files follow kebab-case naming
- [ ] File stays under 400–600 lines

**No magic values**
- [ ] No magic number for a threshold, limit, or timeout — use a named constant
- [ ] No hardcoded status string (`'ACTIVE'`) — use `CASE_STATUS.ACTIVE`
- [ ] No hardcoded role string (`'ADMIN'`) — use `USER_ROLES.ADMIN`
- [ ] No freeform activity action string — use `ActivityAction.*`
- [ ] No raw Redis key string — use `redisKeys.*`

**Tests**
- [ ] New behaviour has a test or a documented reason it cannot be tested at this layer
