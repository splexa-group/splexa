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

Every module follows this exact five-layer order — no skipping, no merging layers:

```
modules/[name]/
├── plugin.ts       # Fastify plugin — registers routes
├── routes.ts       # Route declarations — path, method, schema, preHandlers only
├── controller.ts   # Request/response handling — calls service, returns data
├── service.ts      # Business logic — enforces rules, calls repository
├── repository.ts   # All Prisma queries — only DB access here
├── schema.ts       # Zod schemas for validation
├── helper.ts       # Pure helpers (expiry builders, etc.) — optional
└── __tests__/
    └── [name].test.ts
```

### Why the Controller Layer Exists

If routes contained permission logic directly, they would become unmanageable as roles grow. The split:

- **Route**: declares path, HTTP method, schema validation, and preHandlers (auth + role). Nothing else.
- **Controller**: receives typed `req`/`reply`, calls service, sends response. One function per route. No business logic.
- **Service**: all business rules, permission assertions, orchestration.
- **Repository**: all Prisma. Never called directly from controllers or routes.

```
HTTP Request
  → Plugin (registered in server.ts)
  → Route (schema validation, preHandler: authenticate → requireRole)
  → Controller (calls service, formats reply)
  → Service (business logic, data-level permission checks)
  → Repository (Prisma query, always scoped by orgId)
```

---

## Layer Examples

### Plugin
```ts
// modules/cases/cases-plugin.ts
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { registerCasesRoutes } from './cases-routes';

export const casesPlugin = fp(async (fastify: FastifyInstance) => {
  registerCasesRoutes(fastify);
}, { name: 'cases-plugin' });
```

### Routes
```ts
// modules/cases/cases-routes.ts
import { FastifyInstance } from 'fastify';
import { createCaseSchema, listCasesQuerySchema, caseParamsSchema } from './cases-schema';
import { listCasesController, createCaseController, archiveCaseController } from './cases-controller';

export function registerCasesRoutes(fastify: FastifyInstance) {
  fastify.get('/cases', {
    schema: { querystring: listCasesQuerySchema },
    preHandler: [fastify.authenticate],
  }, listCasesController);

  fastify.post('/cases', {
    schema: { body: createCaseSchema },
    preHandler: [fastify.authenticate],
  }, createCaseController);

  fastify.delete('/cases/:id', {
    schema: { params: caseParamsSchema },
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')],
  }, archiveCaseController);
}
```

Fastify validates the request against the Zod schema before the handler runs — via `@fastify/type-provider-zod` configured in `app.ts`.

### Controller

Controllers are exported as **objects**, not individual functions. They `return` data directly — a `preSerialization` hook wraps all successful responses in `{ success: true, data: ... }`. Only use `reply` when you need to set a status code or cookie.

```ts
// modules/cases/controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { caseService } from './service';
import type { CreateCaseInput, ListCasesQuery, CaseParams } from './schema';

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
// modules/cases/service.ts
import { FastifyRequest } from 'fastify';
import { casesRepository } from './repository';
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
// modules/cases/repository.ts
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
// modules/cases/schema.ts
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
POST /api/v1/auth/signup  { email, firstName, lastName }       ← new users
POST /api/v1/auth/otp/request  { email }                      ← returning users (login)
  → check rate limit (max 5 OTPs/hour per email) via DB count
  → generate 6-digit OTP, bcrypt-hash it
  → send via email provider
  → store OtpRequest row in PostgreSQL (expiresAt = now + 10 min)

POST /api/v1/auth/otp/verify  { email, otp }
  → find latest active OtpRequest for email
  → bcrypt.compare(otp, otpRequest.otpHash)
  → on failure: increment attempts (lock after MAX_OTP_ATTEMPTS)
  → on success: mark OTP verified, mark user emailVerified
  → issue access token (15 min JWT, in httpOnly cookie)
  → create Session row (hashed refresh token, 30 days)
  → return { user, accessToken }
```

**OTP is stored in PostgreSQL** (`OtpRequest` model), not Redis. Redis is not used for OTP in Phase 1.

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

```ts
// src/constants/auth.ts
export const MAX_OTP_ATTEMPTS = 3;
export const OTP_LOCKOUT_MINUTES = 15;
export const MAX_OTP_REQUESTS_PER_HOUR = 5;
export const OTP_TTL_MINUTES = 10;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// src/constants/misc.ts
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
```

Import in services and repositories — there is no root `@/constants` barrel, import from the concrete file:
```ts
import { MAX_OTP_ATTEMPTS, OTP_TTL_MINUTES } from '@/constants/auth';
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
7. Modules (auth, cases, hearings, clients, documents, dashboard, notifications, team)
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