# Database Rules — Prisma + PostgreSQL

## Core Constraint: Multi-Tenancy

Every table that holds firm-specific data has a `org_id` column. Every query on those tables filters by `org_id`. This is the most important data correctness rule in Splexa.

Tables WITHOUT `org_id` (global): `organizations`, `users`, `refresh_tokens`, `otp_codes`
Tables WITH `org_id` (all others): `clients`, `cases`, `hearings`, `reminders`, `documents`, `case_updates`, `user_org_roles`

---

## Prisma Schema Rules

### Required on Every Table

```prisma
model Case {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Required on all tenant-scoped tables:
  orgId    String
  firm      Organization @relation(fields: [orgId], references: [id])

  // ... other fields
}
```

### Index Requirements

```prisma
model Case {
  // ...

  @@index([orgId])                    // Required on every tenant-scoped table
  @@index([orgId, status])            // Add compound indexes for common filter patterns
  @@index([orgId, assignedTo])        // Based on actual query patterns
}
```

### Field Naming

- Use camelCase in Prisma schema (`orgId`, `caseNumber`, `hearingDate`)
- Prisma maps these to snake_case in the DB (`org_id`, `case_number`, `hearing_date`) via `@map` or `@@map` conventions
- Use `@map("org_id")` and `@@map("cases")` to keep DB column names as snake_case

```prisma
model Case {
  id         String @id @default(cuid())
  orgId     String @map("org_id")
  caseNumber String @map("case_number")

  @@map("cases")
  @@index([orgId])
}
```

---

## Prisma Query Rules

### Always Scope by orgId

```ts
// ❌ Dangerous — returns all cases regardless of firm
const cases = await prisma.cases.findMany({ where: { status: "ACTIVE" } });

// ✅ Correct — scoped to firm
const cases = await prisma.cases.findMany({
  where: { orgId, status: "ACTIVE" },
  orderBy: { createdAt: "desc" },
});
```

### Never findUnique by ID Alone

On tenant-scoped tables, `findUnique` by ID alone will return records from other firms if the ID is known:

```ts
// ❌ Security gap — can return a case from another firm
const case_ = await prisma.cases.findUnique({ where: { id: caseId } });

// ✅ Always include orgId
const case_ = await prisma.cases.findFirst({ where: { id: caseId, orgId } });
```

### Explicit Select — No Naked Finds

Do not return entire records when only specific fields are needed:

```ts
// ❌ Returns everything including internal_notes and fee_amount
const case_ = await prisma.cases.findFirst({ where: { id, orgId } });

// ✅ Return only what the consumer needs
const case_ = await prisma.cases.findFirst({
  where: { id, orgId },
  select: {
    id: true,
    caseNumber: true,
    status: true,
    courtName: true,
    client: {
      select: { id: true, name: true, mobile: true },
    },
  },
});
```

Define a `casePublicSelect` constant in the repository for the standard "public" field set, so it is used consistently.

### Pagination

All list queries are paginated:

```ts
async findAllByOrg(orgId: string, filters: CaseFilters) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100); // cap at 100
  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.cases.findMany({
      where: { orgId, ...buildWhereClause(filters) },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.cases.count({ where: { orgId, ...buildWhereClause(filters) } }),
  ]);

  return { data, total, page, limit };
}
```

---

## Migration Rules

### Environment Setup

Three env files, all gitignored:

```
apps/server/
├── .env               ← local dev
├── .env.staging       ← staging DB credentials
└── .env.production    ← production DB credentials
```

Each file must contain `DATABASE_URL` (and optionally `DIRECT_URL` for connection poolers like Supabase/PgBouncer).

`prisma.config.ts` reads whichever file `ENV_FILE` points to, defaulting to `.env`.

---

### Scripts Reference

Run all commands from `apps/server/` or prefix with `pnpm -F @splexa/server`.

| Script | What it does |
|---|---|
| `db:migrate --name <name>` | **Dev only** — diffs schema, generates SQL migration file, applies it, regenerates client |
| `db:migrate:staging` | Runs pending migrations on staging DB |
| `db:migrate:prod` | Runs pending migrations on production DB |
| `db:migrate:status` | Shows which migrations have/haven't run (local) |
| `db:migrate:status:staging` | Shows migration status on staging |
| `db:migrate:status:prod` | Shows migration status on production |
| `db:migrate:reset` | **Dev only** — wipes DB and replays all migrations from scratch |
| `db:generate` | Regenerates Prisma client without touching DB (after `git pull`) |
| `db:studio` | Opens Prisma visual DB browser (local) |
| `db:studio:staging` | Opens Prisma visual DB browser (staging) |
| `db:push` | **Prototyping only** — pushes schema without creating a migration file |

---

### Step-by-Step: Making a Schema Change

**Step 1 — Edit the schema**

Change or add fields in `prisma/models/*.prisma`. Do not touch migration files directly.

**Step 2 — Generate and apply locally**

```bash
pnpm db:migrate --name describe_what_changed

# Good names:
# add_case_model
# add_hearing_date_to_cases
# add_index_on_org_id_sessions
# make_phone_number_nullable
```

This creates a new folder in `prisma/migrations/` with a `migration.sql` file and applies it to your local DB.

**Step 3 — Verify locally**

Run the server, test the affected feature. Make sure nothing broke.

**Step 4 — Commit schema + migration together**

```bash
git add prisma/
git commit -m "feat: add case model"
```

The migration file and the schema change must always be in the same commit. Never commit one without the other.

**Step 5 — Check staging status**

```bash
pnpm db:migrate:status:staging
```

Confirms which migrations are pending on staging before you push.

**Step 6 — Deploy to staging**

```bash
pnpm db:migrate:staging
```

Then test the feature on staging. Fix any issues before touching production.

**Step 7 — Deploy to production**

```bash
pnpm db:migrate:status:prod   # confirm what will run
pnpm db:migrate:prod
```

---

### Migration Naming Convention

Format: `verb_noun` in snake_case describing exactly what changed.

```
✅ add_case_model
✅ add_hearing_date_to_cases
✅ make_phone_number_nullable
✅ add_index_on_org_id_hearings
✅ rename_firm_to_organization

❌ update
❌ fix
❌ changes
❌ migration2
```

---

### Rules

- **Never edit an applied migration file** — if you made a mistake, fix the schema and generate a new migration
- **Never run `db:migrate` (dev) against staging or production** — it can reset the DB
- **Never run `db:push` outside of local dev** — it skips migration history entirely
- **Never run `db:migrate:reset` outside of local dev** — it destroys all data
- **Always migrate staging before production** — staging is the safety net
- **Migration files are committed to git** — they are the authoritative history of your schema
- **`db:generate` after pulling** — if a teammate changed the schema, run `db:generate` to update your local Prisma client without migrating

---

## Connection Pooling

Use a single Prisma client instance across the application. Export it from `lib/db.ts`:

```ts
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

The global singleton prevents multiple instances during hot reloads in development.

For production: configure `DATABASE_URL` with `?connection_limit=10&pool_timeout=20` based on your server's capacity. Do not configure this without measuring actual connection needs.

---

## Soft Deletes

Cases are soft-deleted (archived), not hard-deleted. Add a `deletedAt` timestamp pattern:

```prisma
model Case {
  // ...
  deletedAt DateTime? @map("deleted_at")

  @@index([orgId, deletedAt]) // For filtering out deleted
}
```

All case queries add `deletedAt: null` to the where clause by default. The archive operation sets `deletedAt` to the current timestamp.

```ts
// casesRepository
async softDelete(id: string, orgId: string) {
  // updateMany allows compound where without a unique constraint
  const result = await prisma.cases.updateMany({
    where: { id, orgId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundError('Case not found');
}

async findAllByOrg(orgId: string, filters: CaseFilters) {
  return prisma.cases.findMany({
    where: {
      orgId,
      deletedAt: null, // Always exclude archived cases unless explicitly requested
      ...buildWhereClause(filters),
    },
  });
}
```

---

## Transactions

Use `prisma.$transaction` when multiple writes must succeed or fail together:

```ts
// Creating a case and its first hearing atomically
const [case_, hearing] = await prisma.$transaction([
  prisma.cases.create({ data: caseData }),
  prisma.hearings.create({ data: hearingData }),
]);
```

For interactive transactions (where the second operation depends on the result of the first):

```ts
const result = await prisma.$transaction(async (tx) => {
  const case_ = await tx.cases.create({ data: caseData });
  const hearing = await tx.hearings.create({
    data: { ...hearingData, caseId: case_.id },
  });
  return { case_, hearing };
});
```

---

## Redis Usage

Redis is used for:

1. **OTP storage**: key `redisKeys.otp(email)` → `{ hash, attempts }` with 10-minute TTL
2. **OTP rate limit**: key `redisKeys.otpRate(email)` → count with 1-hour TTL
3. **Refresh token blacklist**: key `redisKeys.blacklist(userId)` → Set of revoked token hashes
4. **Access token (DO NOT use Redis for this)**: Access tokens are stateless JWTs — validate signature, no Redis lookup

Redis is NOT used for caching API responses in Phase 1 — add this only when a specific query is proven slow.

```ts
// lib/redis.ts
import { createClient } from "redis";
import { env } from "@/config/env";

export const redis = createClient({ url: env.REDIS_URL });
await redis.connect();
```

Always use `redisKeys.*` builders from `lib/constants.ts` — never inline raw key strings:

```ts
import { redisKeys, OTP_TTL_SECONDS, MAX_OTP_ATTEMPTS } from '@/lib/constants';

// ✅ Correct — key structure is in one place
await redis.setEx(redisKeys.otp(email), OTP_TTL_SECONDS, JSON.stringify({ hash, attempts: 0 }));
const raw = await redis.get(redisKeys.otp(email));

// ❌ Wrong — key pattern duplicated, typo-prone
await redis.setEx(`otp:${email}`, 600, JSON.stringify({ hash, attempts: 0 }));
```

---

## Repository Naming Conventions

AI agents must follow these function signatures. Consistent naming lets services read predictably across all modules.

```ts
// Standard repository contract — use these names exactly
findById(id: string, orgId: string): Promise<T | null>
findAllByOrg(orgId: string, filters: Filters): Promise<PaginatedResult<T>>
create(data: CreateInput): Promise<T>
update(id: string, orgId: string, data: UpdateInput): Promise<T>
softDelete(id: string, orgId: string): Promise<void>
exists(id: string, orgId: string): Promise<boolean>
```

**Null handling contract:**
- Repositories return `T | null` — they never throw `NotFoundError`.
- The **service layer** throws `NotFoundError` after checking for null.
- This keeps repositories dumb and testable.

```ts
// ❌ Throwing in repository — wrong layer
async findById(id: string, orgId: string) {
  const case_ = await prisma.cases.findFirst({ where: { id, orgId } });
  if (!case_) throw new NotFoundError('Case not found'); // ❌
  return case_;
}

// ✅ Return null, let the service decide
async findById(id: string, orgId: string) {
  return prisma.cases.findFirst({ where: { id, orgId, deletedAt: null } });
}

// ✅ Service layer owns the 404 decision
async getCase(user: AuthUser, caseId: string) {
  const case_ = await casesRepository.findById(caseId, user.orgId);
  if (!case_) throw new NotFoundError('Case not found');
  return case_;
}
```

---

## Select Constants

Define reusable select shapes as typed constants in the repository file. Never repeat the same field list across multiple query calls.

```ts
// cases-repository.ts
import { Prisma } from '@prisma/client';

const casePublicSelect = {
  id: true,
  caseNumber: true,
  status: true,
  courtName: true,
  nextHearingDate: true,
  createdAt: true,
  client: {
    select: { id: true, name: true, mobile: true },
  },
  assignedTo: {
    select: { id: true, name: true },
  },
} satisfies Prisma.CaseSelect;

// Use in every query that returns cases to the API
async findById(id: string, orgId: string) {
  return prisma.cases.findFirst({
    where: { id, orgId, deletedAt: null },
    select: casePublicSelect,
  });
}
```

Using `satisfies Prisma.CaseSelect` gives compile-time checking that every selected field exists on the model.

---

## When to Use $transaction

| Situation | Rule |
|---|---|
| Two or more writes must succeed or fail together | Always use `$transaction` |
| Read then conditional write (check-then-act) | Use interactive `$transaction(async tx => ...)` |
| Single write | No transaction needed |
| Read + unrelated write in the same request | No transaction needed — they are independent |
| Pagination (count + findMany) | Use batch `$transaction([...])` for consistency |

---

## Forbidden — Database

Explicit prohibitions. No exceptions without an architecture-level decision.

| Forbidden | Why |
|---|---|
| `prisma.*` outside of `*-repository.ts` files | Bypasses repository layer; breaks testability |
| `findUnique` by `id` alone on tenant-scoped tables | Cross-tenant data leak |
| `update` without `orgId` in `where` on tenant tables | Cross-tenant mutation risk |
| `prisma.migrate.reset` on any shared environment | Destroys all data |
| `prisma.$queryRaw` with string interpolation | SQL injection |
| Missing `deletedAt: null` on case/tenant queries | Returns archived records as active |
| Omitting `select` on API-facing queries | Leaks internal fields (fees, notes) |
| `prisma.db push` on non-local environments | Bypasses migration history |
| Editing an already-applied migration file | Breaks migration state permanently |

---

## AI Agent Self-Check — Database Code

Before declaring DB-related work done, verify:

**Query safety**
- [ ] Every query on a tenant-scoped table includes `orgId` in `where`
- [ ] No `findUnique` by id alone on tenant tables — use `findFirst` with `{ id, orgId }`
- [ ] All case/document queries include `deletedAt: null` unless explicitly fetching archived

**Schema**
- [ ] New tenant-scoped table has `orgId String @map("org_id")`
- [ ] New table has `@@index([orgId])` at minimum
- [ ] New table has `createdAt` and `updatedAt` fields
- [ ] All column names mapped to snake_case via `@map`

**Repository shape**
- [ ] Function names match conventions (`findById`, `findAllByOrg`, `softDelete`, etc.)
- [ ] Repository functions return `null` — not throw — when record not found
- [ ] API-facing queries use a named `select` constant, not a full record return
- [ ] Multi-write operations wrapped in `$transaction`

**Mutations**
- [ ] `softDelete` uses `updateMany` with `{ id, orgId }` — not `update` with id alone
- [ ] `update` repository functions include `orgId` in `where`

**Migration**
- [ ] New migration file created after schema change (`pnpm db:migrate --name ...`)
- [ ] Migration name is snake_case and describes exactly what changed
- [ ] Schema file and migration file committed together in the same commit
- [ ] Never edited an existing applied migration file
- [ ] Staging migrated and verified before production
