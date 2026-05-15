# Security Rules — Splexa

## Why This Matters

Splexa stores confidential legal case data. A breach — data leak across organizations, unauthorized case access, stolen client contacts — is existential. Security is not a feature to add later. It is built into every layer from day one.

---

## Roles & Security — From Day One

Do not write a single route, service, or repository function without asking:
1. Who is allowed to call this?
2. Is the data scoped to the correct organization?
3. Is this action logged?

These three questions apply to every piece of code that touches user data.

---

## Authentication — Passwordless Email OTP

Phase 1 uses **email OTP only**. No passwords. No magic links.

- User enters email → 6-digit OTP sent to that email → user enters OTP → authenticated
- OTP: 6 digits, 10-minute TTL, max 3 attempts before 15-minute lockout
- Rate limit: max 5 OTP requests per hour per email address
- OTP stored hashed in Redis. Deleted from Redis immediately after successful verification.

### JWT Access Token
- Algorithm: HS256 with a secret ≥ 256 bits (or RS256 with key pair)
- Expiry: **15 minutes**
- Storage: in-memory on client (Zustand) — never `localStorage` or `sessionStorage`
- Payload: `{ userId, orgId, role }` — only these three fields. `orgId` is the tenant identifier.
- Never log the raw token

### Refresh Token
- Expiry: **30 days**
- Storage: httpOnly + Secure + SameSite=Strict cookie — JavaScript cannot read it
- DB storage: store SHA-256 hash of the token in `refresh_tokens` table, not the token itself
- Blacklist: on logout, add token hash to Redis set `blacklist:{userId}`. Check before issuing new access token.

### OTP Rate Limiting
The OTP send endpoint has a specific, product-required rate limit: **max 5 OTP requests per hour per email**. This is not general rate limiting — it is a targeted business rule on this one endpoint.

Implementation: `redisKeys.otpRate(email)` → count, 1-hour TTL. Increment on send, reject at ≥ `MAX_OTP_REQUESTS_PER_HOUR`. Use the constants — never hardcode 5 or the key pattern inline.

---

## Multi-Tenancy — The Most Critical Rule

Every database query on any tenant-scoped table must filter by `orgId`. No exceptions.

### Rules

1. `orgId` comes from the **verified JWT payload** (`req.user.orgId`) — never from request body, query params, or path params
2. Every Prisma query on a tenant-scoped table includes `WHERE org_id = $orgId`
3. Never use `prisma.cases.findUnique({ where: { id } })` — always `prisma.cases.findFirst({ where: { id, orgId } })`
4. When a resource exists but belongs to a different organization: return **404**, not 403. A 403 reveals that the resource exists.

### Verification Test (Required for Every Resource)

Write a test that proves:
> Given a valid JWT for org A, when requesting a case that belongs to org B, the response is 404.

This test must exist for cases, hearings, documents, clients, and any other organization-scoped resource.

---

## Role-Based Access Control

Two roles from day one: `ADMIN` and `MEMBER`. Design for more roles in Phase 2 — the infrastructure is there from the start.

| Action | ADMIN | MEMBER |
|---|---|---|
| Create/edit cases | ✅ | ✅ (assigned cases only) |
| Archive/delete cases | ✅ | ❌ |
| View all org cases | ✅ | Own assigned cases |
| Manage team members | ✅ | ❌ |
| Export case data | ✅ | ❌ |
| Enable client portal | ✅ | ✅ (for assigned cases) |

**Route-level**: `preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')]` for admin-only routes.

**Data-level**: In the service layer, check if the authenticated user has access to the specific resource (e.g., a MEMBER can only edit cases assigned to them).

Both levels are required. The frontend hiding a button is not access control.

---

## Activity Logging — Security Audit Trail

Every meaningful action is logged to `activity_logs`. This is a security requirement, not just a nice-to-have. Who did what, to which resource, from which IP, and when — this is the basis of any security investigation.

Logged for security specifically:
- `auth.otp_sent` — who requested an OTP and for which email
- `auth.otp_verified` — successful verifications
- `auth.login_failed` — failed OTP attempts (with attempt count)
- `auth.account_locked` — lockout events
- `auth.logout` — explicit logouts
- `auth.refresh` — token refreshes
- `member.invited` / `member.removed` — team changes
- Any access to a document or case update visible to client

Refer to `backend-rules.md` for the full `logActivity` implementation.

---

## Input Validation

- All inputs validated via Zod schemas using `@fastify/type-provider-zod` — no raw JSON Schema objects anywhere
- Zod object schemas use `.strict()` on request bodies to reject unknown fields, or at minimum never use `.passthrough()`
- File uploads: validate MIME type by reading file magic bytes (not just Content-Type header). Reject executable file types.
- Maximum file size: 10MB per upload

---

## Client Portal — Public Access Security

The client portal (`GET /api/portal/:token`) has no authentication. Rules:

1. `portal_token` is a **cryptographically random UUID** (128-bit) — not sequential, not guessable
2. Query must be: `WHERE portal_token = $token AND portal_enabled = true` — both conditions
3. Portal returns ONLY: case number, court name, hearing dates, client-visible updates, names of client-visible documents
4. Portal NEVER returns: `org_id`, internal notes, fee details, lawyer internal data, documents not explicitly marked client-visible
5. Token is regeneratable by ADMIN (old link becomes invalid)

---

## Document Storage Security

- Documents in Supabase Storage, private bucket
- Backend generates short-lived signed URLs (15-minute expiry) on demand
- `documents` table stores the storage path, not the URL — URLs are generated fresh at request time
- Before generating a signed URL: verify `document.orgId === req.user.orgId`
- Client-visible documents: only documents with `is_visible_to_client = true` can be accessed via client portal

---

## HTTPS and Transport

- HTTPS enforced everywhere — no HTTP in production
- Register `@fastify/helmet` globally in `plugins/security.ts` — default config is sufficient for Phase 1
- Cookies: `Secure`, `HttpOnly`, `SameSite=Strict`
- HSTS header on all responses

---

## What Not to Log (Privacy)

- Never log raw OTP values
- Never log JWT tokens or refresh tokens
- Never log raw passwords (there are none in Phase 1, but applies to Phase 2)
- Mask email in logs when possible: `s***@gmail.com`
- Never log full request bodies (may contain sensitive case data)

Structured logging via Pino (built into Fastify). No `console.log` in production.

---

## Dependency Security

- Run `pnpm audit` before adding any package
- Reject packages with known high/critical vulnerabilities
- Check last publish date — reject if > 1 year with no activity
- Pin major versions in `package.json`
- Re-run `pnpm audit` in CI on every PR

---

## Environment Variable Security

Validate all required env vars at startup — crash immediately with a clear error if missing:

```ts
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string().email(),
});

export const env = envSchema.parse(process.env);
```

Never access `process.env` directly in business logic — always import from `@/config/env`.

---

---

## Forbidden — Security

| Forbidden | Why |
|---|---|
| `orgId` from `req.body`, `req.params`, or `req.query` | Must come from verified JWT (`req.user.orgId`) only |
| `findUnique({ where: { id } })` on tenant tables | Cross-tenant data leak — include `orgId` always |
| `update` or `softDelete` without `orgId` in `where` | Cross-tenant mutation |
| Logging raw OTP, JWT token, or refresh token | Credential exposure |
| Logging full request body | May contain sensitive case or client data |
| Exposing Prisma errors or stack traces to the client | Leaks implementation internals |
| Client portal returning `orgId`, fees, or internal notes | Portal is read-only view of approved fields only |
| Generating signed storage URLs without checking `doc.orgId === req.user.orgId` | Cross-tenant file access |
| `additionalProperties` in raw JSON Schema on a route | Use Zod with `.strict()` — no raw JSON Schema |
| Hardcoding OTP attempt limit as `3` | Use `MAX_OTP_ATTEMPTS` from `lib/constants.ts` |
| Inline Redis key strings like `` `otp:${email}` `` | Use `redisKeys.otp(email)` — one place for all key patterns |

---

## AI Agent Self-Check — Security

Before declaring any feature complete that touches data access or auth:

**Auth & tokens**
- [ ] Every new protected route has `preHandler: [fastify.authenticate]`
- [ ] Admin-only routes have `preHandler: [fastify.authenticate, fastify.requireRole('ADMIN')]`
- [ ] JWT payload used is `req.user` — verified by the auth plugin, not passed from client
- [ ] Access token stored in Zustand (memory) only — never `localStorage` or `sessionStorage`

**Multi-tenancy**
- [ ] Every DB query on a tenant-scoped table filters by `orgId` from `req.user.orgId`
- [ ] `findFirst` used (not `findUnique`) on tenant tables, always with `{ id, orgId }`
- [ ] Wrong-org request returns 404, not 403

**Activity logging**
- [ ] Every mutation calls `logActivity` with an `ActivityAction.*` constant (not a raw string)
- [ ] Auth events logged: OTP sent, OTP verified, login failed, account locked, logout

**Input validation**
- [ ] Zod schema used for all request body, query, and params — no raw JSON Schema
- [ ] Sensitive fields (`internalNotes`, `feeAmount`) excluded from API responses via explicit `select`

**Cross-org isolation test**
- [ ] If a new resource type was added: a test exists proving org A's JWT cannot access org B's resource