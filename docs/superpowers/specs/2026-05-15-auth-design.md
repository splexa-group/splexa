# Authentication — Design Spec

**Date:** 2026-05-15
**Branch:** chore/authentication
**Scope:** Phase 1 — Passwordless email OTP authentication for Splexa

---

## Overview

Splexa uses passwordless email OTP authentication. No passwords. A user enters their email, receives a 6-digit code, enters it, and gets a JWT access token. Refresh tokens are stored as httpOnly cookies. Everything is persisted in PostgreSQL — no Redis in Phase 1.

---

## API Surface

```
POST   /auth/signup              → create org + user → send OTP
POST   /auth/otp/request         → send OTP to existing user email
POST   /auth/otp/verify          → verify OTP → return access token + set refresh cookie
POST   /auth/refresh             → exchange refresh cookie for new access token
POST   /auth/logout              → revoke current session
GET    /auth/me                  → return current user + org info

GET    /auth/sessions            → list all active sessions for current user
GET    /auth/sessions/:id        → get one session
DELETE /auth/sessions/:id        → revoke one session
DELETE /auth/sessions            → revoke all sessions (logout everywhere)
```

All routes live under the `auth` Fastify plugin. Protected routes (`/auth/me`, `/auth/sessions*`) require a valid JWT via `preHandler: [fastify.authenticate]`. `/auth/logout` and `/auth/refresh` authenticate via the httpOnly cookie directly — they must remain accessible even when the access token has expired.

---

## Data Model

### Enums

```prisma
enum UserRole {
  OWNER
  ADMIN
  MEMBER
}

enum Designation {
  ADVOCATE
  SENIOR_ADVOCATE
  PARTNER
  ASSOCIATE
  CLERK
}

enum PracticeType {
  CRIMINAL
  CIVIL
  CORPORATE
  FAMILY
  LABOUR
  GENERAL
}
```

### Tables

```prisma
model Organization {
  id           String       @id @default(uuid())
  name         String
  practiceType PracticeType
  city         String
  createdBy    String       // FK → User.id
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  deletedAt    DateTime?

  creator      User         @relation("OrgCreator", fields: [createdBy], references: [id])
  members      User[]       @relation("OrgMembers")
  sessions     Session[]
  auditLogs    AuditLog[]

  @@map("organizations")
}

model User {
  id            String       @id @default(uuid())
  orgId         String
  firstName     String
  lastName      String
  email         String       @unique
  phoneNumber   String
  designation   Designation
  role          UserRole
  emailVerified Boolean      @default(false)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  deletedAt     DateTime?

  org           Organization @relation("OrgMembers", fields: [orgId], references: [id])
  createdOrgs   Organization[] @relation("OrgCreator")
  sessions      Session[]
  auditLogs     AuditLog[]

  @@map("users")
}

model OtpRequest {
  id         String    @id @default(uuid())
  email      String
  otpHash    String
  attempts   Int       @default(0)
  expiresAt  DateTime
  verifiedAt DateTime?
  createdAt  DateTime  @default(now())
  deletedAt  DateTime?

  @@index([email])
  @@map("otp_requests")
}

model Session {
  id          String    @id @default(uuid())
  userId      String
  orgId       String
  tokenHash   String    @unique  // SHA-256 of refresh token
  ipAddress   String
  userAgent   String
  expiresAt   DateTime
  revokedAt   DateTime?
  lastUsedAt  DateTime  @default(now())
  createdAt   DateTime  @default(now())
  deletedAt   DateTime?

  user        User         @relation(fields: [userId], references: [id])
  org         Organization @relation(fields: [orgId], references: [id])

  @@map("sessions")
}

model AuditLog {
  id           String    @id @default(uuid())
  orgId        String?
  userId       String?
  action       String    // ActivityAction.* constant — e.g. auth.otp_sent
  resourceType String?
  resourceId   String?
  ipAddress    String
  metadata     Json
  createdAt    DateTime  @default(now())
  deletedAt    DateTime?

  org          Organization? @relation(fields: [orgId], references: [id])
  user         User?         @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}
```

**Circular reference note:** `users.orgId → organizations` and `organizations.createdBy → users`. Resolved in signup by generating both UUIDs upfront and creating both records inside a single Prisma `$transaction`.

---

## Auth Flows

### Signup

1. `POST /auth/signup` — body: `{ firstName, lastName, email, phoneNumber, designation, orgName, practiceType, city }`
2. Validate with Zod — reject unknown fields (`.strict()`)
3. Check email not already in `users` → 409 if duplicate
4. Check OTP rate limit: count `otp_requests` where `email = ? AND createdAt > now - 1hr` → 429 if ≥ `MAX_OTP_REQUESTS_PER_HOUR` (5)
5. Generate UUIDs for org and user upfront
6. Prisma `$transaction`:
   - `organizations.create` → `{ id: orgId, name: orgName, practiceType, city, createdBy: userId }`
   - `users.create` → `{ id: userId, orgId, firstName, lastName, email, phoneNumber, designation, role: OWNER, emailVerified: false }`
7. Generate 6-digit OTP via `crypto.randomInt(100000, 999999).toString()`
8. Send OTP email via Resend (send first — if Resend fails, return 503, nothing written to DB)
9. `otp_requests.create` → `{ email, otpHash: bcrypt(otp), attempts: 0, expiresAt: now + 10min }`
10. `audit_logs.create` → `{ action: ActivityAction.AUTH_OTP_SENT, ipAddress, metadata: { email: masked } }`
11. Return `201 { message: "OTP sent to your email" }`

### Login (existing user)

1. `POST /auth/otp/request` — body: `{ email }`
2. Check user exists in `users` → 404 if not
3. Check rate limit: same as signup step 4 → 429 if exceeded
4. Check lockout: latest `otp_requests` row where `email = ? AND attempts >= MAX_OTP_ATTEMPTS AND createdAt > now - 15min` → 429 if locked
5. Send OTP email via Resend (send first)
6. `otp_requests.create` → same as signup step 9
7. `audit_logs.create` → `{ action: ActivityAction.AUTH_OTP_SENT, ... }`
8. Return `200 { message: "OTP sent" }`

### OTP Verify _(closes both signup and login)_

1. `POST /auth/otp/verify` — body: `{ email, otp }`
2. Find latest `otp_requests` row: `email = ? AND verifiedAt IS NULL AND expiresAt > now ORDER BY createdAt DESC LIMIT 1` → 400 if none
3. If `attempts >= MAX_OTP_ATTEMPTS` → 429
4. `bcrypt.compare(otp, row.otpHash)`:
   - **Wrong:** increment `attempts`; write `audit_logs: AUTH_LOGIN_FAILED`; if `attempts >= MAX_OTP_ATTEMPTS` write `AUTH_ACCOUNT_LOCKED`; return 400
   - **Correct:** continue
5. `otp_requests.update` → set `verifiedAt = now`
6. `users.update` → set `emailVerified = true` (idempotent)
7. Generate access token: JWT `{ userId, orgId, role }`, 15 min, HS256
8. Generate refresh token: `crypto.randomBytes(64).toString('hex')`
9. SHA-256 hash refresh token → `sessions.create` → `{ userId, orgId, tokenHash, ipAddress, userAgent, expiresAt: now + 30days }`
10. Set cookie: `refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/auth`
11. `audit_logs.create` → `{ action: ActivityAction.AUTH_OTP_VERIFIED, userId, orgId, ... }`
12. Return `200 { accessToken, user: { id, firstName, lastName, email, role, orgId } }`

### Refresh

1. `POST /auth/refresh` — read `refresh_token` cookie → 401 if missing
2. SHA-256 hash → find `sessions` where `tokenHash = ? AND revokedAt IS NULL AND expiresAt > now` → 401 if not found
3. Find user where `id = session.userId AND deletedAt IS NULL` → 401 if not found
4. Generate new access token: JWT `{ userId, orgId, role }`, 15 min
5. `sessions.update` → set `lastUsedAt = now`
6. `audit_logs.create` → `{ action: ActivityAction.AUTH_REFRESH, userId, orgId, ... }`
7. Return `200 { accessToken }`

### Logout

1. `POST /auth/logout` — read `refresh_token` cookie → 401 if missing
2. SHA-256 hash → find session → `sessions.update` set `revokedAt = now`
3. Clear cookie: `refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
4. `audit_logs.create` → `{ action: ActivityAction.AUTH_LOGOUT, userId, orgId, ... }`
5. Return `200`

### GET /auth/me

1. Protected — requires valid JWT (`preHandler: [fastify.authenticate]`)
2. `users.findFirst` where `id = req.user.userId AND deletedAt IS NULL`, include `org`
3. Return `{ id, firstName, lastName, email, role, designation, emailVerified, org: { id, name, practiceType, city } }`

### Sessions

- `GET /auth/sessions` — list `sessions` where `userId = req.user.userId AND revokedAt IS NULL AND expiresAt > now`; return `{ id, ipAddress, userAgent, createdAt, lastUsedAt }`
- `GET /auth/sessions/:id` — single session scoped to `req.user.userId` → 404 if not found or belongs to another user
- `DELETE /auth/sessions/:id` — set `revokedAt = now`; write `audit_logs: AUTH_SESSION_REVOKED`; return `200`
- `DELETE /auth/sessions` — set `revokedAt = now` on **all** active sessions for `req.user.userId` including the current session; clear the refresh cookie; write `audit_logs: AUTH_ALL_SESSIONS_REVOKED`; return `200`

---

## Email Service (Resend)

### File structure

```
apps/server/src/lib/integrations/
└── email/
    ├── index.ts            ← factory — only import point for app code
    ├── email-interface.ts  ← EmailProvider interface
    └── resend-adapter.ts   ← Resend SDK implementation
```

App code imports only from `email/index.ts`. Swapping providers only touches the adapter.

### OTP email

```
Subject: Your Splexa verification code
Body:    Your code is 483920. It expires in 10 minutes.
         Do not share this code with anyone.
```

Plain text for Phase 1.

### Send-first rule

Send via Resend **before** writing `otp_requests` row.
- Resend failure → `503 { error: "Failed to send OTP, please try again" }` — nothing written to DB
- Resend success → insert `otp_requests` row

### Required env vars

```
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com
```

Both validated at startup in `config/env.ts` — server crashes immediately if missing.

---

## Security Constraints

| Rule | Detail |
|---|---|
| OTP | 6 digits, 10-min TTL, bcrypt hashed in DB |
| OTP attempts | Max 3 per OTP request — lockout for 15 min after hitting max |
| OTP rate limit | Max 5 requests per hour per email (`MAX_OTP_REQUESTS_PER_HOUR`) |
| Access token | JWT HS256, 15-min expiry, `{ userId, orgId, role }` only |
| Access token storage | Zustand (memory) on client — never localStorage or sessionStorage |
| Refresh token | 30-day expiry, SHA-256 hashed in `sessions` table |
| Refresh token storage | httpOnly + Secure + SameSite=Strict cookie |
| Post-logout access token | Valid for up to 15 min (no blacklist in Phase 1 — acceptable trade-off) |
| `orgId` source | Always `req.user.orgId` from verified JWT — never body, params, or query |
| Logging | Never log raw OTP, JWT, or refresh token. Mask email in logs. |

---

## Activity Log Actions

| Constant | When |
|---|---|
| `ActivityAction.AUTH_OTP_SENT` | OTP sent (signup or login) |
| `ActivityAction.AUTH_OTP_VERIFIED` | OTP verified successfully |
| `ActivityAction.AUTH_LOGIN_FAILED` | Wrong OTP entered |
| `ActivityAction.AUTH_ACCOUNT_LOCKED` | Attempts hit max |
| `ActivityAction.AUTH_REFRESH` | Access token refreshed |
| `ActivityAction.AUTH_LOGOUT` | Explicit logout |
| `ActivityAction.AUTH_SESSION_REVOKED` | Single session deleted |
| `ActivityAction.AUTH_ALL_SESSIONS_REVOKED` | All sessions deleted |

---

## Backend Layer Structure

```
modules/auth/
├── auth-plugin.ts        ← registers routes with Fastify
├── auth-route.ts         ← paths + Zod schemas + preHandlers
├── auth-controller.ts    ← calls service, sends reply
├── auth-service.ts       ← business logic, OTP, token generation
└── auth-repository.ts    ← all Prisma queries
```

Schemas for request bodies (`SignupSchema`, `OtpRequestSchema`, `OtpVerifySchema`) live in `packages/shared/src/schemas/auth.ts` — used by both server and frontend forms.

---

## What Is Out of Scope (Phase 1)

- Invite flow (`/auth/invite`) — separate spec
- Redis caching or blacklisting — Phase 2
- Refresh token rotation — Phase 2
- HTML email templates — when design system is ready
- Social login (Google, etc.) — not planned
- Two-factor authentication — not planned
