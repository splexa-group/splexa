# Backend Rules — Fastify, Prisma, Node.js

## Stack
- **Runtime**: Node.js (LTS)
- **Framework**: Fastify
- **ORM**: Prisma + PostgreSQL
- **Auth**: Passwordless OTP via Email (Phase 1) → Mobile OTP (Phase 2)
- **Storage**: Supabase Storage
- **Testing**: Vitest

---

## Module Layer Structure

Every module follows this layer order — no skipping, no merging layers:

```
modules/[name]/
├── [name].routes.ts       # Exports one fp()-wrapped Fastify plugin. Route declarations — full
│                          # sub-path, method, schema, preHandlers only. There is no separate
│                          # plugin.ts — routes.ts IS the plugin app.ts registers.
├── [name].controller.ts   # Request/response handling — calls service, returns data
├── [name].service.ts      # Business logic — enforces rules, calls repository
├── [name].repository.ts   # All Prisma queries — only DB access here; select shapes come from
│                          # db/selects/, never defined inline
├── [name].schema.ts       # Zod schemas for validation
├── [name].models.ts       # Module-internal types not derived from a Zod schema — optional
├── [name].helper.ts       # Pure helpers used only by this module (expiry builders, etc.) — optional
└── __tests__/
    ├── [name].service.test.ts
    └── [name].helper.test.ts   # One file per source file with real logic — not one file per module
```

### Why the Controller Layer Exists

If routes contained permission logic directly, they would become unmanageable as roles grow. The split:

- **Route**: declares its own full path (e.g. `/cases/:id`, not just `:id`), HTTP method, schema validation, and preHandlers (auth + role). Nothing else. `app.ts` registers every module's routes under the same `/api/v1` prefix — there is no per-module prefix, so the route's own path is the complete picture of what URL it serves.
- **Controller**: receives typed `req`/`reply`, calls service, sends response. One function per route. No business logic.
- **Service**: all business rules, permission assertions, orchestration.
- **Repository**: all Prisma. Never called directly from controllers or routes.

```
HTTP Request
  → Route (schema validation, preHandler: authenticate → requireRole) — same file exports the
    Fastify plugin app.ts registers, no separate plugin file
  → Controller (calls service, formats reply)
  → Service (business logic, data-level permission checks)
  → Repository (Prisma query, always scoped by orgId)
```

---

## Layer Examples

### Routes — also the plugin

There is no separate `plugin.ts`. `[name].routes.ts` defines the routes AND exports the
`fastify-plugin`-wrapped plugin that `app.ts` registers directly. Every route declares its own
full sub-path (no per-module Fastify `prefix` option) since `app.ts` registers every module under
the same single `/api/v1` prefix.

```ts
// modules/cases/cases.routes.ts
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { casesController } from './cases.controller';
import { createCaseSchema, listCasesQuerySchema, caseParamsSchema } from './cases.schema';

async function routes(router: FastifyInstance): Promise<void> {
  router.get('/cases', {
    schema: { querystring: listCasesQuerySchema },
    preHandler: [router.authenticate],
    handler: casesController.list,
  });

  router.post('/cases', {
    schema: { body: createCaseSchema },
    preHandler: [router.authenticate],
    handler: casesController.create,
  });

  router.delete('/cases/:id', {
    schema: { params: caseParamsSchema },
    preHandler: [router.authenticate],
    handler: casesController.delete,
  });
}

export const casesRoutes = fp(routes, { name: 'cases-routes' });
```

```ts
// app.ts — every module registered under the same prefix, no per-module prefix
await app.register(casesRoutes, { prefix: '/api/v1' });
```

A module with both a top-level surface and a case-scoped surface (`hearings`, `documents`,
`important-dates`) still declares both sets of routes in this one file, each with its own full
path (`/hearings`, `/hearings/:id`, `/cases/:caseId/hearings`) — never split into a second routes
file or registered with a second prefix.

Fastify validates the request against the Zod schema before the handler runs — via `@fastify/type-provider-zod` configured in `app.ts`.

### Controller

Controllers are exported as **objects**, not individual functions. They `return` data directly — a `preSerialization` hook wraps all successful responses in `{ success: true, data: ... }`. Only use `reply` when you need to set a status code or cookie.

```ts
// modules/cases/cases.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { caseService } from './cases.service';
import type { CreateCaseInput, ListCasesQuery, CaseParams } from './cases.schema';

export const caseController = {
  async list(req: FastifyRequest<{ Querystring: ListCasesQuery }>) {
    return caseService.list(req.user.orgId, req.query);
  },

  async create(req: FastifyRequest<{ Body: CreateCaseInput }>, reply: FastifyReply) {
    const case_ = await caseService.create(req.user, req.body, req);
    reply.code(201);
    return case_;
  },

  async archive(req: FastifyRequest<{ Params: CaseParams }>, reply: FastifyReply) {
    await caseService.archive(req.user, req.params.id, req);
    reply.code(204);
    return null;
  },
};
```

Types (`CreateCaseInput`, `ListCasesQuery`, `CaseParams`) are all `z.infer<>` — derived from the Zod schema, never written separately.

**Rule:** Never call `reply.send()` in a controller. Just `return` the data. The `responsePlugin` (`preSerialization` hook registered in `app.ts`) wraps it automatically.

### Service
```ts
// modules/cases/cases.service.ts
import { FastifyRequest } from 'fastify';
import { casesRepository } from './cases.repository';
import { logActivity } from '@/utils/activity-logger';
import { Errors } from '@/utils/errors';
import { ActivityAction } from '@/enums/activity-action';
import type { AuthUser, CreateCaseInput, CaseFilters } from '@splexa-group/shared';

export const caseService = {
  async list(orgId: string, filters: CaseFilters) {
    return casesRepository.findAllByOrg(orgId, filters);
  },

  async create(user: AuthUser, input: CreateCaseInput, req: FastifyRequest) {
    const case_ = await casesRepository.create({ ...input, orgId: user.orgId, createdBy: user.userId });

    await logActivity({
      orgId: user.orgId,
      userId: user.userId,
      action: ActivityAction.CASE_CREATED,
      resourceType: 'case',
      resourceId: case_.id,
      metadata: { caseNumber: case_.caseNumber },
      ipAddress: req.ip,
    });

    return case_;
  },

  async archive(user: AuthUser, caseId: string, req: FastifyRequest) {
    const existing = await casesRepository.findById(caseId, user.orgId);
    if (!existing) throw Errors.caseNotFound();

    await casesRepository.softDelete(caseId, user.orgId);

    await logActivity({
      orgId: user.orgId,
      userId: user.userId,
      action: 'case.archived',
      resourceType: 'case',
      resourceId: caseId,
      metadata: { caseNumber: existing.caseNumber },
      ipAddress: req.ip,
    });
  },
};
```

### Repository
```ts
// modules/cases/cases.repository.ts
import { prisma } from '@/db/client';
import type { CreateCaseInput } from '@splexa-group/shared';

export const casesRepository = {
  async findAllByOrg(orgId: string, filters: CaseFilters) {
    return prisma.cases.findMany({
      where: { orgId, deletedAt: null, ...buildWhereClause(filters) },
      include: { client: { select: { id: true, name: true, mobile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string, orgId: string) {
    // Always include orgId — never findUnique by id alone
    return prisma.cases.findFirst({ where: { id, orgId, deletedAt: null } });
  },

  async create(data: CreateCaseInput & { orgId: string; createdBy: string }) {
    return prisma.cases.create({ data });
  },

  async softDelete(id: string, orgId: string) {
    // updateMany allows compound where — update requires a unique field alone
    const result = await prisma.cases.updateMany({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundError('Case not found');
  },
};
```

### Schema

The schema file owns all Zod schemas for the module. **No raw JSON Schema objects anywhere.** Fastify validates using Zod directly via `@fastify/type-provider-zod`. TypeScript types are always derived from schemas using `z.infer` — never written manually alongside them.

```ts
// modules/cases/cases.schema.ts
import { z } from 'zod';
import { createCaseSchema } from '@splexa-group/shared'; // Reuse shared input schema — single source of truth

// Re-export the shared schema so routes only import from this file
export { createCaseSchema };
export type CreateCaseInput = z.infer<typeof createCaseSchema>;

// Server-only: query params are not used by the frontend for form validation
export const listCasesQuerySchema = z.object({
  status:     z.enum(['ACTIVE', 'ADJOURNED', 'CLOSED']).optional(),
  assignedTo: z.string().uuid().optional(),
  search:     z.string().max(200).optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCasesQuery = z.infer<typeof listCasesQuerySchema>;

// Server-only: route params
export const caseParamsSchema = z.object({ id: z.string().cuid() });
export type CaseParams = z.infer<typeof caseParamsSchema>;
```

**Rules:**
- No raw JSON Schema — Zod only. `@fastify/type-provider-zod` converts Zod to ajv internally.
- Types always come from `z.infer<typeof schema>` — never write a separate interface that duplicates a schema.
- Import schemas for form-validated inputs from `@splexa-group/shared/schemas`. Server-only schemas (query params, route params) stay in the module schema file.
- Response schemas are not needed in Phase 1 — explicit `select` in the repository controls what is returned.

---

## Fastify `req.user` Type Augmentation

`req.user` is available on all authenticated routes. TypeScript needs a declaration merge to know its shape:

```ts
// src/types/fastify.d.ts
import 'fastify';
import type { AuthUser } from '@splexa-group/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;  // { userId, orgId, role }
  }
}
```

This file must be included in `tsconfig.json`'s `include` array. Without it, every `req.user` access is a TypeScript error or requires a cast.

---

## Authentication — Passwordless Email OTP (Phase 1)

Phase 1 is **email-only, passwordless**. User enters email → receives 6-digit OTP → enters OTP → authenticated or registered. No passwords, no magic links.

Phase 2 adds mobile OTP (WhatsApp/SMS). The auth module is designed so adding a new channel means adding a new delivery adapter — not rewriting the flow.

### Flow
```
POST /api/v1/auth/signup  { email, ..., firstName, lastName, orgName, practiceTypes, firmType,
                             city, state }                     ← new users, creates Organization + User
POST /api/v1/auth/otp/request  { email }                      ← returning users (login)
  → check rate limit (max requests/hour per email) via DB count
  → generate 6-digit OTP, bcrypt-hash it
  → send via email provider
  → invalidate any previous still-pending OTP for this email (invalidatedAt), then store the new
    OtpRequest row in PostgreSQL (expiresAt = now + OTP_TTL_MS)

POST /api/v1/auth/otp/verify  { email, otp }
  → find the latest non-verified, non-invalidated OtpRequest for email (deliberately not filtered
    by expiresAt at the query level — see below)
  → no row at all → 404 "no OTP requested"; row exists but expired → 422 "code expired, request a
    new one" (two distinct errors, not one generic "not found")
  → bcrypt.compare(otp, otpRequest.otpHash)
  → on failure: increment attempts (lock after MAX_OTP_ATTEMPTS)
  → on success: mark OTP verified, mark user emailVerified
  → issue access token (JWT, in httpOnly cookie)
  → create Session row (refreshTokenHash — a SHA-256 hash of the raw refresh token, never the raw
    token itself)
  → return { user, accessToken, refreshToken }
```

**OTP is stored in PostgreSQL** (`OtpRequest` model), not Redis. Redis is not used for OTP in Phase 1.

**Why "not found" and "expired" are different errors:** the repository's OTP lookup deliberately
does **not** filter by `expiresAt` in its `where` clause — only by `verifiedAt: null` and
`invalidatedAt: null`. If it filtered by expiry too, the service couldn't tell "no OTP was ever
requested" apart from "one was requested but it's now expired" — both would come back as `null`.
The expiry check happens in the service instead, after the row is fetched, so it can throw the
correct one of the two errors.

**`invalidatedAt` vs `verifiedAt` on `OtpRequest`:** these are two different, non-overlapping
outcomes and must never share a column. `verifiedAt` means the user actually entered the correct
code. `invalidatedAt` means this OTP was superseded by a newer request before anyone touched it
(requesting a fresh OTP invalidates any still-pending previous one, closing a replay gap — an
attacker holding an intercepted earlier code can't submit it after the user verifies with a newer
one). Writing "invalidated because superseded" into the same `verifiedAt` column would corrupt any
future audit/analytics query that reads `verifiedAt IS NOT NULL` expecting it to mean "genuinely
verified."

**Concurrent signup**: `signup()` checks `findUserByEmail` before creating the org/user, but that
check-then-act has a real race — two concurrent signups for the same email can both pass the check.
The DB's unique constraint on `User.email` is the actual guard; the service catches the resulting
`Prisma.PrismaClientKnownRequestError` with `code === "P2002"` and converts it into the same
`Errors.emailTaken()` the earlier check would have thrown, rather than letting a raw 500 through.

**`logout()` never throws** on a missing/invalid refresh token — it treats "nothing to revoke" as
success, not an error. A logout call is not proving the caller has a session; it's just clearing
one if it exists. The controller always calls `clearAuthCookies(reply)` after, so `logout` throwing
would skip clearing cookies on the exact request whose whole purpose is to clear them.

**Revoking a single session (`DELETE /auth/sessions/:id`)** checks whether the session being
revoked is the one authenticating the current request (by comparing it against the session tied to
the request's own refresh-token cookie, checked *before* the revoke so the "active" filter still
matches) and clears cookies if so — otherwise the browser that just revoked its own session would
keep a still-valid access token (JWTs aren't checked against the `Session` table on every request)
for the rest of its lifetime.

---

## Role & Permission System — From Day One

Every route is explicitly: public, authenticated, or role-restricted. This is decided when the route is written, not added later.

### Fastify Auth Decorators

```ts
// plugins/auth.ts
fastify.decorate('authenticate', async (req, reply) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new AuthError('Missing token');
  req.user = verifyAccessToken(token); // { userId, orgId, role }
});

fastify.decorate('requireRole', (role: UserRole) => async (req, reply) => {
  if (req.user.role !== role) throw new ForbiddenError(`Requires ${role} role`);
});
```

**Route-level preHandlers** handle role rules (e.g., ADMIN only). **Service-level assertions** handle data-level rules (e.g., can this user access this specific case). Both are always required — never skip either.

---

## Activity Logging — Phase 2 Scope, Not Built

**Not a Phase 1 requirement** — see `developer-workflow.md`'s Phase 1 Scope Discipline. Do not implement `logActivity`, `ActivityAction`, or an `AuditLog` table in Phase 1. The blueprint below is kept for when Phase 2 picks this up — do not treat its presence here as evidence it exists in the codebase.

### Activity Log Table

```prisma
model AuditLog {
  id           String    @id @default(uuid())
  orgId        String?   @map("org_id")
  userId       String?   @map("user_id")
  action       String    // 'case.created', 'hearing.added', etc. — see ActivityAction enum
  resourceType String?   @map("resource_type")
  resourceId   String?   @map("resource_id")
  ipAddress    String    @map("ip_address")
  metadata     Json      // { caseNumber, oldStatus, newStatus, ... }
  createdAt    DateTime  @default(now()) @map("created_at")

  @@map("audit_logs")
  @@index([orgId, createdAt])
  @@index([userId])
}
```

### Activity Logger

```ts
// src/utils/activity-logger.ts
import { logger } from '@/config/logger';
import { prisma } from '@/db/client';
import type { ActivityAction } from '@/enums/activity-action';

export interface LogActivityInput {
  orgId?: string;
  userId?: string;
  action: ActivityAction;  // typed — no freeform strings
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  await prisma.auditLog.create({ data: { ...input, metadata: input.metadata ?? {} } }).catch((err) => {
    // Never let logging failure break the main operation — log and continue
    logger.error({ err, action: input.action }, 'activity-logger: failed to write audit log');
  });
}
```

### Action Names — Use the `ActivityAction` Enum

Never pass a raw string to `logActivity`. Action names are a TS `enum` in `src/enums/activity-action.ts` — the same pattern as `ErrorCode` (`src/enums/error-code.ts`), not a `const` object. This makes actions consistent, searchable, and refactorable.

```ts
// src/enums/activity-action.ts
export enum ActivityAction {
  AUTH_SIGNUP = 'auth.signup',
  AUTH_OTP_SENT = 'auth.otp_sent',
  AUTH_OTP_VERIFIED = 'auth.otp_verified',
  AUTH_LOGIN_FAILED = 'auth.login_failed',
  AUTH_ACCOUNT_LOCKED = 'auth.account_locked',
  AUTH_REFRESH = 'auth.refresh',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_SESSION_REVOKED = 'auth.session_revoked',
  CASE_CREATED = 'case.created',
  CASE_UPDATED = 'case.updated',
  CASE_ARCHIVED = 'case.archived',
  CASE_CLIENT_ADDED = 'case.client_added',
  CLIENT_CREATED = 'client.created',
  CLIENT_UPDATED = 'client.updated',
  CLIENT_ARCHIVED = 'client.archived',
  HEARING_ADDED = 'hearing.added',
  HEARING_UPDATED = 'hearing.updated',
  HEARING_DELETED = 'hearing.deleted',
  IMPORTANT_DATE_CREATED = 'important_date.created',
  IMPORTANT_DATE_UPDATED = 'important_date.updated',
  IMPORTANT_DATE_DELETED = 'important_date.deleted',
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_RENAMED = 'document.renamed',
  DOCUMENT_DELETED = 'document.deleted',
  PROFILE_UPDATED = 'settings.profile_updated',
  ORGANIZATION_UPDATED = 'settings.organization_updated',
  // Add new members here as features that need audit logging are built
  // (e.g. member invites, portal sharing, reminder delivery).
}
```

Usage:
```ts
import { ActivityAction } from '@/enums/activity-action';
await logActivity({ action: ActivityAction.CASE_CREATED, ... });
```

---

## Server Constants — `src/constants/`

All server-side compile-time values live here. Split by domain:

```
src/constants/
├── auth.ts    # OTP thresholds, token TTLs, cookie names
└── misc.ts    # Pagination defaults, upload limits
```

No `index.ts` barrel — import from the concrete file (`@/constants/auth`, `@/constants/misc`). Categorical string identifiers (like `ActivityAction`, `ErrorCode`) belong in `src/enums/` as TS `enum`, not here — `constants/` is for primitive config values.

**Every duration constant is milliseconds** — the single unit `Date.now()` and `new Date(Date.now() ± x)` both work with natively, with no conversion at the call site. Each still gets a
human-readable comment since raw ms values aren't self-explanatory:

```ts
// src/constants/auth.ts
export const MAX_OTP_ATTEMPTS = 3;
export const OTP_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_OTP_REQUESTS_PER_HOUR = 5;
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const REFRESH_TOKEN_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
export const OTP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// src/constants/misc.ts
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
```

The one exception forced into a different unit: a cookie's `Max-Age` is seconds per the HTTP spec —
that conversion happens at the point of use via `utils/date-time.ts`'s `msToSeconds()`, not as a
separately-tracked constant duplicating the ms one.

```ts
// src/utils/date-time.ts — shared ms helpers, used wherever a module needs "since X ms ago" or
// "X ms from now" instead of hand-rolling new Date(Date.now() ± x) at every call site
export function msAgo(ms: number): Date { return new Date(Date.now() - ms); }
export function msFromNow(ms: number): Date { return new Date(Date.now() + ms); }
export function msToSeconds(ms: number): number { return Math.floor(ms / 1000); }
export function msToMinutes(ms: number): number { return Math.floor(ms / (60 * 1000)); }
```

Import in services and repositories — there is no root `@/constants` barrel, import from the concrete file:
```ts
import { MAX_OTP_ATTEMPTS, OTP_TTL_MS } from '@/constants/auth';
import { msFromNow } from '@/utils/date-time';
```

**Note:** `redisKeys` builders are not implemented — Redis is not used in Phase 1 (see OTP storage note above). `ActivityAction` and `logActivity` are also not implemented — Phase 2 scope, see the "Activity Logging" section above.

---

## External Integrations — Adapter + Factory Pattern

Any third-party service (email, SMS, WhatsApp) is wrapped behind an interface (the adapter contract). A factory resolves the correct adapter at runtime based on env config or DB config. Swapping providers takes 3–5 hours, not days. Application code never imports from a provider SDK directly.

### 1. Interface (adapter contract)

```ts
// lib/integrations/email/email-provider.ts
export interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<{ messageId: string }>;
}
```

### 2. Adapters — one file per provider

```ts
// lib/integrations/email/adapters/resend.ts
import { Resend } from 'resend';
import { env } from '@/config/env';
import type { EmailProvider } from '../email-provider';

export class ResendAdapter implements EmailProvider {
  private client = new Resend(env.RESEND_API_KEY);

  async send(to: string, subject: string, html: string) {
    const result = await this.client.emails.send({ from: env.EMAIL_FROM, to, subject, html });
    return { messageId: result.id };
  }
}
```

```ts
// lib/integrations/email/adapters/sendgrid.ts
import sgMail from '@sendgrid/mail';
import { env } from '@/config/env';
import type { EmailProvider } from '../email-provider';

export class SendGridAdapter implements EmailProvider {
  constructor() { sgMail.setApiKey(env.SENDGRID_API_KEY); }

  async send(to: string, subject: string, html: string) {
    const [response] = await sgMail.send({ from: env.EMAIL_FROM, to, subject, html });
    return { messageId: response.headers['x-message-id'] };
  }
}
```

### 3. Factory — resolves adapter from config

Resolution order: **env var → default fallback**. To support per-tenant DB config, replace `env.EMAIL_PROVIDER` with a DB lookup.

```ts
// lib/integrations/email/email-factory.ts
import { env } from '@/config/env';
import { ResendAdapter } from './adapters/resend';
import { SendGridAdapter } from './adapters/sendgrid';
import type { EmailProvider } from './email-provider';

export function createEmailProvider(): EmailProvider {
  switch (env.EMAIL_PROVIDER) {
    case 'sendgrid': return new SendGridAdapter();
    default:         return new ResendAdapter();
  }
}
```

### 4. Index — the only import point for application code

```ts
// integrations/email/index.ts
import { createEmailProvider } from './email-factory';
export const emailProvider = createEmailProvider();
```

### Rules

- All application code imports from `@/integrations/email` — never from an adapter or SDK directly.
- To add a provider: create a new adapter file, add a case to the factory switch. Nothing else changes.
- To switch globally: set `EMAIL_PROVIDER=sendgrid` in the environment.
- To support per-tenant switching: replace `env.EMAIL_PROVIDER` in the factory with a DB config lookup.
- Same structure applies to SMS, WhatsApp, and any future integration.

---

## Zod Type Provider Setup

Register once in `app.ts` so every route can use Zod schemas directly:

```ts
// app.ts
import { serializerCompiler, validatorCompiler } from '@fastify/type-provider-zod';

export async function buildApp() {
  const app = Fastify({ logger: true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ... register plugins, modules
  return app;
}
```

After this, passing a Zod schema to `schema: { body: myZodSchema }` in any route just works — Fastify validates, coerces, and TypeScript infers the type.

---

## Fastify Hook Order

- `onRequest`: JWT authentication
- `preHandler`: role checks, resource access checks
- `setErrorHandler`: centralized error formatting (one place, all errors)

### Plugin Registration Order in `app.ts`
```
1. setValidatorCompiler / setSerializerCompiler  (Zod type provider)
2. Env validation (crash fast on missing vars)
3. errorHandlerPlugin       (must be first — catches errors from all subsequent plugins)
4. responsePlugin           (preSerialization hook — wraps success responses)
5. @fastify/cookie          (cookie parsing — needed before auth reads cookies)
6. authGuardPlugin          (decorates fastify.authenticate, fastify.requireRole)
7. Every module's routes, each registered under the SAME "/api/v1" prefix — there is no
   per-module prefix. A module's own route paths (e.g. "/cases", "/cases/:caseId/hearings")
   are the complete picture of what it serves; app.ts is the one place that shows every
   mounted module.
```

```ts
// app.ts
await app.register(authRoutes, { prefix: "/api/v1" });
await app.register(casesRoutes, { prefix: "/api/v1" });
await app.register(hearingsRoutes, { prefix: "/api/v1" });
// ...every module, same prefix, one registration each — no plugin.ts, no nested prefix
```

---

## Response Envelope

All API responses use a uniform envelope. Controllers **never call `reply.send()`** — they just `return` data.

**Success** (status < 400) — wrapped automatically by `responsePlugin` (`preSerialization` hook):
```json
{ "success": true, "data": { ... } }
```

**Error** (status >= 400) — formatted by `errorHandlerPlugin`:
```json
{ "success": false, "error": { "code": "USER_NOT_FOUND", "message": "No account found with that email" } }
```

## Error Handling

Errors are created via the `Errors` factory in `src/utils/errors.ts`. Never construct `AppError` directly in services — use the factory:

```ts
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) { super(message); }
}

export const Errors = {
  userNotFound:    () => new AppError(404, 'USER_NOT_FOUND', 'No account found with that email'),
  emailTaken:      () => new AppError(409, 'EMAIL_TAKEN', 'Email is already registered'),
  sessionExpired:  () => new AppError(401, 'SESSION_EXPIRED', 'Invalid or expired session'),
  forbidden:       (msg = 'Access denied') => new AppError(403, 'FORBIDDEN', msg),
  // ... add new entries here as new error cases arise
} as const;
```

Usage in services:
```ts
import { Errors } from '@/utils/errors';

const user = await authRepository.findUserByEmail(email);
if (!user) throw Errors.userNotFound();
```

Error codes live in `src/enums/error-code.ts`. No freeform strings — always use the enum.

Client never sees stack traces, Prisma errors, or internal details. The `errorHandlerPlugin` catches all `AppError` instances and formats them into the standard envelope.

---

## Alias Imports

```ts
// tsconfig paths: "@/*" maps to "./src/*"

// ✅
import { prisma } from '@/db/client';
import { Errors } from '@/utils/errors';
import { signAccessToken } from '@/utils/jwt';
import { MAX_OTP_ATTEMPTS } from '@/constants';
import { emailProvider } from '@/integrations/email';
import type { UserRole } from '@splexa-group/shared/enums';

// ❌
import { prisma } from '../../../db/client';
import { prisma } from '@/lib/db';           // lib/ no longer exists
```

---

## TypeScript Strictness

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

No `any`. No `!` non-null assertions. All exported functions have explicit return types. All Fastify requests are typed: `FastifyRequest<{ Body: CreateCaseInput }>`.

---

## Forbidden — Backend

| Forbidden | Why |
|---|---|
| Business logic in a route or controller | Untestable; violates layer contract |
| Prisma calls outside `*-repository.ts` | Bypasses repository layer |
| `findUnique` by `id` alone on tenant tables | Cross-tenant data leak |
| `update`/`softDelete` without `orgId` in where | Cross-tenant mutation |
| `orgId` from request body or params | Must come from JWT (`req.user.orgId`) only |
| Missing `additionalProperties: false` on request schema | Unknown fields pass validation silently |
| Importing one module's internals from another module | Breaks encapsulation — use a service export |
| Swallowing errors silently (empty catch `{}`) | Hides failures from the audit trail |
| `console.log` in committed code | Use `req.log` / `fastify.log` |
| Returning raw Prisma model to API response | Leaks internal schema fields |

---

## AI Agent Self-Check — Backend Code

Before declaring backend work done:

**Layer discipline**
- [ ] Route only has: path, method, schema, preHandlers — no logic
- [ ] Controller only calls service + sends reply — no business logic
- [ ] Service owns all business rules, permission checks, activity logging
- [ ] Repository owns all Prisma calls — nothing else does

**Security**
- [ ] Every new route has `preHandler: [fastify.authenticate]` (or is explicitly public with a comment)
- [ ] Every mutation route has the correct `requireRole` preHandler where spec requires it
- [ ] Every tenant-scoped DB query has `orgId` from `req.user.orgId`
- [ ] `softDelete` / `update` use `updateMany` with `{ id, orgId }` — not `update` by id alone

**Types**
- [ ] Fastify request is typed: `FastifyRequest<{ Body: X }>` / `{ Params: X }` / `{ Querystring: X }`
- [ ] No `any`, no `!`, no `@ts-ignore`
- [ ] New shared types added to `packages/shared` if used by frontend too

**Schema**
- [ ] Request body Zod schema is not `.passthrough()` — unknown fields are stripped (default) or rejected (`.strict()`)
- [ ] Required fields are non-optional in the Zod schema (no `.optional()` on them)

**Tests**
- [ ] Cross-firm isolation test exists if a new resource type was added
- [ ] Role-based access test exists if a new permission rule was added