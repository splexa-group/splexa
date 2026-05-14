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
├── [name]-plugin.ts        # Fastify plugin — registers routes
├── [name]-routes.ts        # Route declarations — path, method, schema, preHandlers only
├── [name]-controller.ts    # Request/response handling — calls service, sends reply
├── [name]-service.ts       # Business logic — enforces rules, calls repository
├── [name]-repository.ts    # All Prisma queries — only DB access here
├── [name]-schema.ts        # Zod or JSON Schema for validation
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
```ts
// modules/cases/cases-controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { caseService } from './cases-service';
import type { CreateCaseBody, ListCasesQuery, CaseParams } from './cases-schema'; // z.infer types

export async function listCasesController(
  req: FastifyRequest<{ Querystring: ListCasesQuery }>,
  reply: FastifyReply,
) {
  const cases = await caseService.list(req.user.orgId, req.query);
  return cases;
}

export async function createCaseController(
  req: FastifyRequest<{ Body: CreateCaseBody }>,
  reply: FastifyReply,
) {
  const case_ = await caseService.create(req.user, req.body, req);
  reply.code(201).send(case_);
}

export async function archiveCaseController(
  req: FastifyRequest<{ Params: CaseParams }>,
  reply: FastifyReply,
) {
  await caseService.archive(req.user, req.params.id, req);
  reply.code(204).send();
}
```

Types (`CreateCaseBody`, `ListCasesQuery`, `CaseParams`) are all `z.infer<>` — derived from the Zod schema, never written separately.

### Service
```ts
// modules/cases/cases-service.ts
import { FastifyRequest } from 'fastify';
import { casesRepository } from './cases-repository';
import { logActivity } from '@/lib/activity-logger';
import { NotFoundError } from '@/lib/errors';
import type { AuthUser, CreateCaseInput, CaseFilters } from '@splexa/shared';

export const caseService = {
  async list(orgId: string, filters: CaseFilters) {
    return casesRepository.findAllByOrg(orgId, filters);
  },

  async create(user: AuthUser, input: CreateCaseInput, req: FastifyRequest) {
    const case_ = await casesRepository.create({ ...input, orgId: user.orgId, createdBy: user.userId });

    await logActivity({
      orgId: user.orgId,
      userId: user.userId,
      action: 'case.created',
      resourceType: 'case',
      resourceId: case_.id,
      metadata: { caseNumber: case_.caseNumber },
      ipAddress: req.ip,
    });

    return case_;
  },

  async archive(user: AuthUser, caseId: string, req: FastifyRequest) {
    const existing = await casesRepository.findById(caseId, user.orgId);
    if (!existing) throw new NotFoundError('Case not found');

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
// modules/cases/cases-repository.ts
import { prisma } from '@/lib/db';
import type { CreateCaseInput } from '@splexa/shared';

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
// modules/cases/cases-schema.ts
import { z } from 'zod';
import { createCaseSchema } from '@splexa/shared'; // Reuse shared input schema — single source of truth

// Re-export the shared schema so routes only import from this file
export { createCaseSchema };
export type CreateCaseBody = z.infer<typeof createCaseSchema>;

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
- Import schemas for form-validated inputs from `@splexa/shared`. Server-only schemas (query params, route params) stay in the module schema file.
- Response schemas are not needed in Phase 1 — explicit `select` in the repository controls what is returned.

---

## Fastify `req.user` Type Augmentation

`req.user` is available on all authenticated routes. TypeScript needs a declaration merge to know its shape:

```ts
// types/fastify.d.ts (or src/types/fastify.d.ts)
import 'fastify';
import type { AuthUser } from '@splexa/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;  // { userId, orgId, role, name }
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
POST /api/auth/send-otp  { email }
  → generate 6-digit OTP
  → store in Redis (TTL 10 min, max 3 attempts, rate-limited 5/hour per email)
  → send via email provider
  → return { success: true }

POST /api/auth/verify-otp  { email, otp }
  → verify OTP, delete from Redis on success
  → if new user: create user + organization record
  → issue access token (15 min) + refresh token httpOnly cookie (30 days)
  → return { user, isNewUser }
```

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

## Activity Logging — Every Action in DB

Every meaningful user action is recorded in `activity_logs`. This is mandatory from day one. Monitor and optimize performance later — never lose the audit trail.

### Activity Log Table

```prisma
model ActivityLog {
  id           String   @id @default(cuid())
  orgId        String   @map("org_id")
  userId       String   @map("user_id")
  action       String   // 'case.created', 'hearing.added', 'member.invited' etc.
  resourceType String   @map("resource_type")
  resourceId   String?  @map("resource_id")
  metadata     Json?    // { caseNumber, oldStatus, newStatus, ... }
  ipAddress    String?  @map("ip_address")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("activity_logs")
  @@index([orgId, createdAt])
  @@index([orgId, userId])
  @@index([orgId, resourceType, resourceId])
}
```

### Activity Logger

```ts
// lib/activity-logger.ts
import { prisma } from '@/lib/db';

export interface LogActivityInput {
  orgId: string;
  userId: string;
  action: ActivityActionValue;  // typed — no freeform strings
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  await prisma.activityLogs.create({ data: input }).catch((err) => {
    // Never let logging failure break the main operation — log and continue
    console.error('Activity log write failed', { err, action: input.action });
  });
}
```

### Action Names — Use `ActivityAction` Constants

Never pass a raw string to `logActivity`. Define all action names in `lib/constants.ts` and import from there. This makes actions consistent, searchable, and refactorable.

```ts
// lib/constants.ts
export const ActivityAction = {
  AUTH_OTP_SENT:       'auth.otp_sent',
  AUTH_OTP_VERIFIED:   'auth.otp_verified',
  AUTH_LOGIN_FAILED:   'auth.login_failed',
  AUTH_LOGOUT:         'auth.logout',
  AUTH_ACCOUNT_LOCKED: 'auth.account_locked',
  AUTH_REFRESH:        'auth.refresh',
  CASE_CREATED:        'case.created',
  CASE_UPDATED:        'case.updated',
  CASE_ARCHIVED:       'case.archived',
  HEARING_ADDED:       'hearing.added',
  HEARING_UPDATED:     'hearing.updated',
  HEARING_ADJOURNED:   'hearing.adjourned',
  DOCUMENT_UPLOADED:   'document.uploaded',
  DOCUMENT_DELETED:    'document.deleted',
  CLIENT_CREATED:      'client.created',
  CLIENT_UPDATED:      'client.updated',
  MEMBER_INVITED:      'member.invited',
  MEMBER_REMOVED:      'member.removed',
  PORTAL_ENABLED:      'portal.enabled',
  PORTAL_LINK_SHARED:  'portal.link_shared',
  REMINDER_SENT:       'reminder.sent',
  REMINDER_FAILED:     'reminder.failed',
  SETTINGS_UPDATED:    'settings.updated',
} as const;

export type ActivityActionValue = typeof ActivityAction[keyof typeof ActivityAction];
```

Usage:
```ts
import { ActivityAction } from '@/lib/constants';
await logActivity({ action: ActivityAction.CASE_CREATED, ... });
```

---

## Server Constants — `lib/constants.ts`

All server-side magic values live here. No raw numbers, strings, or Redis key patterns anywhere else in the codebase.

```ts
// lib/constants.ts

// Auth thresholds
export const MAX_OTP_ATTEMPTS = 3;
export const OTP_LOCKOUT_MINUTES = 15;
export const MAX_OTP_REQUESTS_PER_HOUR = 5;
export const OTP_TTL_SECONDS = 600;           // 10 minutes
export const ACCESS_TOKEN_EXPIRY_SECONDS = 900; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Redis key builders — one place for all key structure
export const redisKeys = {
  otp:       (email: string)  => `otp:${email}`,
  otpRate:   (email: string)  => `otp_rate:${email}`,
  blacklist: (userId: string) => `blacklist:${userId}`,
} as const;

// ActivityAction and ActivityActionValue defined above in Activity Logging section
```

Import in services and repositories:
```ts
import { MAX_OTP_ATTEMPTS, OTP_TTL_SECONDS, redisKeys, ActivityAction } from '@/lib/constants';
```

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
// lib/integrations/email/index.ts
import { createEmailProvider } from './email-factory';
export const emailProvider = createEmailProvider();
```

### Rules

- All application code imports from `@/lib/integrations/email` — never from an adapter or SDK directly.
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
3. Security (helmet, cors)
4. Db decorate (Prisma client)
5. Redis decorate
6. Auth decorators (authenticate, requireRole)
7. Modules (auth, cases, hearings, clients, documents, dashboard, notifications, team)
```

---

## Error Handling

```ts
// lib/errors.ts
export class AppError extends Error {
  constructor(public message: string, public statusCode: number, public code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class AuthError extends AppError {
  constructor(msg = 'Unauthorized') { super(msg, 401, 'AUTH_ERROR'); }
}
export class ForbiddenError extends AppError {
  constructor(msg = 'Forbidden') { super(msg, 403, 'FORBIDDEN'); }
}
export class NotFoundError extends AppError {
  constructor(msg = 'Not found') { super(msg, 404, 'NOT_FOUND'); }
}
export class ValidationError extends AppError {
  constructor(msg: string) { super(msg, 400, 'VALIDATION_ERROR'); }
}
```

Client response is always: `{ "error": "Case not found", "code": "NOT_FOUND" }` — no stack traces, no Prisma errors, no internals.

---

## Alias Imports

```ts
// tsconfig paths
{ "@/*": ["./src/*"], "@splexa/shared": ["../../packages/shared/src"] }

// ✅
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import type { CaseStatus } from '@splexa/shared';

// ❌
import { prisma } from '../../../lib/db';
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
- [ ] New action is logged via `logActivity` with correct `action` name from the standard list

**Types**
- [ ] Fastify request is typed: `FastifyRequest<{ Body: X }>` / `{ Params: X }` / `{ Querystring: X }`
- [ ] No `any`, no `!`, no `@ts-ignore`
- [ ] New shared types added to `packages/shared` if used by frontend too

**Schema**
- [ ] Request schema has `additionalProperties: false`
- [ ] Required fields are listed in `required: [...]`

**Tests**
- [ ] Cross-firm isolation test exists if a new resource type was added
- [ ] Role-based access test exists if a new permission rule was added