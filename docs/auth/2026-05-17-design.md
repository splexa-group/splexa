# Auth System — Design

**Last updated:** 2026-05-17
**Branch started:** chore/authentication → chore/authetication-frontend
**Status:** Implemented (Phase 1 complete)

This document is the canonical reference for the entire auth system — backend API, data model, security constraints, and frontend architecture. It reflects what was actually built, including deviations from the original spec.

---

## Overview

Splexa uses **passwordless email OTP authentication**. No passwords. A user enters their email, receives a 6-digit code, enters it, and is logged in. Tokens are set as httpOnly cookies by the server — JavaScript never reads them.

There are two flows:
- **Login** — existing user, two steps: email → OTP
- **Signup** — new user, four steps: email → personal details → practice details → OTP

---

## Backend API Surface

```
POST   /api/v1/auth/signup              → create org + user, send OTP
POST   /api/v1/auth/otp/request         → send OTP to existing user email
POST   /api/v1/auth/otp/verify          → verify OTP, set auth cookies, return user
POST   /api/v1/auth/refresh             → exchange refresh cookie → new access cookie
POST   /api/v1/auth/logout              → revoke session, clear cookies

GET    /api/v1/auth/me                  → return current user (protected)
GET    /api/v1/auth/sessions            → list active sessions (protected)
GET    /api/v1/auth/sessions/:id        → get one session (protected)
DELETE /api/v1/auth/sessions/:id        → revoke one session (protected)
DELETE /api/v1/auth/sessions            → revoke all sessions, logout everywhere (protected)
```

Protected routes require a valid JWT in the `access_token` httpOnly cookie (`preHandler: [fastify.authenticate]`).

`/auth/logout` and `/auth/refresh` read the `refresh_token` cookie directly — they must remain accessible even when the access token has expired.

### Response Envelope

All responses follow a uniform envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "AUTH_MISSING_TOKEN", "message": "Missing access token" } }
```

The frontend axios interceptor unwraps `data` automatically — services and hooks receive the inner payload only.

---

## Data Model

### Enums (in `packages/shared/src/enums/`)

```prisma
enum UserRole    { OWNER   ADMIN   MEMBER }
enum Designation { ADVOCATE  SENIOR_ADVOCATE  JUNIOR_ADVOCATE  ASSOCIATE
                   SENIOR_ASSOCIATE  PRINCIPAL_ASSOCIATE  PARTNER  SENIOR_PARTNER
                   MANAGING_PARTNER  OF_COUNSEL  RETAINER  PARALEGAL  LEGAL_INTERN  CLERK }
enum PracticeType { CRIMINAL  CIVIL  CORPORATE  FAMILY  MATRIMONIAL  LABOUR
                    CONSTITUTIONAL  TAX  INTELLECTUAL_PROPERTY  REAL_ESTATE
                    BANKING_AND_FINANCE  ARBITRATION  CONSUMER  ENVIRONMENTAL
                    MOTOR_ACCIDENT  REVENUE  SERVICE_MATTERS  CYBER  GENERAL }
```

### Tables

```prisma
model Organization {
  id            String         @id @default(uuid())
  name          String
  practiceTypes PracticeType[] @map("practice_types")   // array — org can have multiple
  city          String
  createdBy     String         // FK → User.id (set with DEFERRED constraint)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
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
  @@map("users")
}

model OtpRequest {
  id         String    @id @default(uuid())
  email      String
  otpHash    String    // bcrypt hash — plain OTP never stored
  attempts   Int       @default(0)
  expiresAt  DateTime  // 10 minutes from creation
  verifiedAt DateTime?
  createdAt  DateTime  @default(now())
  @@index([email])
  @@map("otp_requests")
}

model Session {
  id          String    @id @default(uuid())
  userId      String
  orgId       String
  tokenHash   String    @unique  // SHA-256 of refresh token — plain token never stored
  ipAddress   String
  userAgent   String
  expiresAt   DateTime  // 30 days from creation
  revokedAt   DateTime?
  lastUsedAt  DateTime  @default(now())
  createdAt   DateTime  @default(now())
  @@map("sessions")
}
```

**Circular reference:** `users.orgId → organizations` and `organizations.createdBy → users`. Solved in signup by generating both UUIDs upfront and creating org + user inside a single Prisma `$transaction` with `SET CONSTRAINTS ALL DEFERRED`.

---

## Auth Flows

### Signup

The frontend collects all fields before calling the backend (email → personal → practice → submit). The backend creates org + user + OTP atomically in one call.

1. `POST /auth/signup` — body: `{ firstName, lastName, email, phoneNumber, designation, orgName, practiceTypes: string[], city }`
2. Validate with Zod strict schema — reject unknown fields
3. Check email not in `users` → 409 if duplicate
4. Check OTP rate limit: `countRecentOtpRequests(email)` — max 5/hour → 429 if exceeded
5. Generate org UUID + user UUID upfront
6. Hash OTP with bcrypt
7. Send OTP email via Resend **first** — if delivery fails, throw 503, nothing written to DB
8. Prisma `$transaction`: create org → create user → create OTP request (atomic — no partial state)
9. Return `201`

### Login (Request OTP)

1. `POST /auth/otp/request` — body: `{ email }`
2. Check user exists → 404 if not
3. Check OTP rate limit → 429 if exceeded (5/hour)
4. Check lockout: `findBlockedEmail(email, MAX_OTP_ATTEMPTS)` — OTP row with `attempts >= 3` in last 15 min → 429 if locked
5. Invalidate all existing pending OTPs for this email (prevents replay of stale codes)
6. Send OTP email via Resend
7. Create new OTP request row
8. Return `200`

### OTP Verify (closes both signup and login)

1. `POST /auth/otp/verify` — body: `{ email, otp }`
2. Find user → 404 if not found
3. Find latest active OTP (`verifiedAt IS NULL AND expiresAt > now`) → 400 if none
4. If `attempts >= MAX_OTP_ATTEMPTS` → 429 locked
5. `bcrypt.compare(otp, row.otpHash)`:
   - **Wrong:** increment `attempts`; if now at max → 429 locked; else 400 with remaining count
   - **Correct:** continue
6. Mark OTP verified, mark `emailVerified = true` on user
7. Generate access token (JWT 15 min) + refresh token (random 64 bytes)
8. SHA-256 hash refresh token → create `Session` row
9. Set both tokens as httpOnly cookies:
   - `access_token`: Path=/, 15 min
   - `refresh_token`: Path=/api/v1/auth, 30 days
   - Both: HttpOnly, SameSite=Strict, Secure=true in production
10. Return `200 { user: { id, firstName, lastName, email, role, orgId } }` — **no tokens in body**

### Refresh

1. `POST /auth/refresh` — reads `refresh_token` cookie
2. Hash → find active session → 401 if not found
3. Find user → 401 if not found
4. Issue new access token
5. Update `session.lastUsedAt`
6. Return `200` — the new `access_token` is set as a cookie by the response

### Logout

1. `POST /auth/logout` — reads `refresh_token` cookie
2. Hash → find session → mark `revokedAt = now`
3. Clear both cookies with `Max-Age=0`
4. Return `200`

---

## Security Constraints

| Rule | Detail |
|---|---|
| OTP format | 6 numeric digits, 10-min TTL, bcrypt-hashed in DB |
| OTP attempts | Max 3 wrong attempts per OTP request → 15-min lockout |
| OTP rate limit | Max 5 OTP requests per hour per email |
| OTP replay | Previous pending OTPs are invalidated before issuing a new one |
| OTP atomicity | Signup: org + user + OTP created in one transaction — no partial state |
| Access token | JWT HS256, 15-min expiry, `{ userId, orgId, role }` payload only |
| Access token storage | httpOnly cookie (Path=/) — JS cannot read it |
| Refresh token storage | httpOnly cookie (Path=/api/v1/auth) — JS cannot read it |
| Refresh token DB | SHA-256 hashed — plain token never stored |
| `orgId` source | Always `req.user.orgId` from verified JWT — never body, params, or query |
| Logging | Never log raw OTP, JWT, or refresh token — mask email in logs |
| Post-logout access token | Valid for up to 15 min (no blacklist in Phase 1 — accepted trade-off) |

---

## Backend Layer Structure

```
modules/auth/
├── plugin.ts       ← registers routes with Fastify under /api/v1/auth
├── routes.ts       ← paths + Zod schemas + preHandlers
├── controller.ts   ← calls service, returns data (no reply.send())
├── service.ts      ← business logic, OTP, token generation
├── repository.ts   ← all Prisma queries
├── schema.ts       ← Zod request body schemas (server-only)
└── helper.ts       ← cookie helpers, OTP expiry, token expiry
```

### Repository Functions (auth)

| Function | What it does |
|---|---|
| `findUserByEmail(email)` | Find active user by email |
| `findUserById(userId)` | Find active user by id, includes org |
| `createOrgAndUser(...)` | Transactionally create org + user + OTP request |
| `invalidateActiveOtps(email)` | Mark all pending OTPs for email as verified (prevents replay) |
| `createOtpRequest(email, hash, expiry)` | Insert new OTP row |
| `countRecentOtpRequests(email)` | Count OTP requests in last hour (rate limit check) |
| `findLatestActiveOtp(email)` | Find latest unverified non-expired OTP |
| `findBlockedEmail(email, maxAttempts)` | Find OTP row with `attempts >= max` in last 15 min (lockout check) |
| `incrementOtpAttempts(id)` | Increment attempt count on wrong OTP |
| `markOtpVerified(id)` | Set `verifiedAt = now` |
| `markEmailVerified(userId)` | Set `emailVerified = true` on user |
| `createSession(data)` | Create refresh token session row |
| `findActiveSessionByTokenHash(hash)` | Find non-expired, non-revoked session |
| `updateSessionLastUsed(id)` | Bump `lastUsedAt` on refresh |
| `revokeSession(id)` | Set `revokedAt = now` |
| `revokeAllUserSessions(userId)` | Revoke all sessions for user |

---

## Email Service

Provider: Resend. Send-first rule: email is sent before anything is written to DB. If send fails → 503, nothing persisted.

```
apps/server/src/integrations/email/
├── index.ts            ← singleton export — only import point for app code
├── email-interface.ts  ← EmailProvider interface
└── resend-adapter.ts   ← Resend SDK implementation
```

OTP email subject: `"Your Splexa verification code"`
Body: `"Your code is {OTP}. It expires in 10 minutes. Do not share this code with anyone."`

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

## Frontend Architecture

### Stack

- **Framework:** Next.js 16.2.4, App Router
- **Styling:** Tailwind CSS v4 (`@theme inline` two-layer token system)
- **Server state:** TanStack React Query v5
- **Client state:** Zustand (user object only — no tokens in JS)
- **Forms:** React Hook Form with `Controller` for Radix UI inputs
- **HTTP client:** Axios with interceptor for silent 401 → refresh → retry
- **Toasts:** Sonner

### File Structure

```
apps/web/src/
├── api/
│   ├── client.ts                   ← Axios instance + 401 interceptor (refresh + retry)
│   └── http.ts                     ← Typed GET/POST/PUT/PATCH/DELETE helpers
├── services/
│   └── auth.ts                     ← authApi object: me, signup, requestOtp, verifyOtp, refresh, logout
├── hooks/
│   └── use-auth.ts                 ← useMutation hooks: useRequestOtp, useVerifyOtp, useSignup
│                                     (toasts live here — see Toast Placement Rules)
├── store/
│   └── auth-store.ts               ← Zustand: { user, setAuth, clearAuth }
├── types/
│   ├── auth.ts                     ← VerifyOtpResponse, SignupPayload
│   ├── user.ts                     ← AuthUser interface
│   └── misc.ts                     ← ApiErrorResponse, shared types
├── lib/
│   ├── utils.ts                    ← cn(), maskEmail()
│   └── options.ts                  ← DESIGNATION_OPTIONS, PRACTICE_TYPE_OPTIONS (from shared enums)
├── components/
│   ├── ui/
│   │   ├── button.tsx              ← Button + buttonVariants (cva)
│   │   ├── input.tsx               ← Input + InputGroup (label + input + error)
│   │   ├── select.tsx              ← Radix Select primitives
│   │   ├── multi-select.tsx        ← MultiSelectGroup (chips + dropdown, controlled)
│   │   ├── otp-input.tsx           ← 6-box OTP input (auto-focus, backspace, paste)
│   │   ├── icon.tsx
│   │   ├── logo.tsx
│   │   └── ...
│   └── auth/
│       ├── auth-layout.tsx         ← 40/60 split wrapper (left panel + right form area)
│       ├── auth-panel.tsx          ← Shared left panel content component
│       ├── login-form/
│       │   ├── index.tsx           ← Step state machine (email | otp)
│       │   ├── email-step.tsx      ← Email input + submit → requestOtp
│       │   └── otp-step.tsx        ← OTP input + verify + resend timer
│       └── signup-form/
│           ├── index.tsx           ← Step state machine (email | personal | practice | otp)
│           ├── personal-step.tsx   ← Name + designation + phone
│           ├── practice-step.tsx   ← OrgName + practiceTypes (multi-select) + city → signup
│           └── otp-step.tsx        ← OTP input + verify + resend (re-calls signup)
├── app/
│   ├── layout.tsx                  ← Root layout: Inter font, providers
│   ├── globals.css                 ← Tailwind v4 @theme inline + CSS variables
│   ├── page.tsx                    ← Redirects to /login
│   ├── providers.tsx               ← QueryClientProvider + Toaster
│   ├── providers/
│   │   ├── index.tsx
│   │   ├── query-provider.tsx
│   │   └── toast-provider.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx          ← Login page + metadata
│   │   └── signup/page.tsx         ← Signup page + metadata
│   └── (protected)/
│       └── dashboard/page.tsx      ← Dashboard stub (redirect target)
```

### Axios Client Architecture

The HTTP layer has three layers:

1. **`api/client.ts`** — Axios instance with `baseURL`, `withCredentials: true`, and the 401 interceptor. The interceptor catches 401s, calls `/auth/refresh` (cookie-based), retries the original request once. If refresh fails, redirects to `/login`. The response interceptor also unwraps the `{ success, data }` envelope automatically.

2. **`api/http.ts`** — Thin typed helpers: `GET<T>`, `POST<T>`, `PUT<T>`, `PATCH<T>`, `DELETE<T>`. Each delegates to the axios instance.

3. **`services/[feature].ts`** — Feature-level API objects. `services/auth.ts` exports `authApi` with typed methods per endpoint. Hooks import from here.

The Next.js proxy rewrite (`next.config.ts`) rewrites `/api/v1/*` to the backend, solving CORS. The axios `baseURL` is `NEXT_PUBLIC_API_URL` (set to the Next.js app URL in dev), and all service calls use paths like `/auth/me` (the rewrite adds `/api/v1` prefix).

### Auth Store

```ts
// store/auth-store.ts
interface AuthState {
  user: AuthUser | null;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}
```

The store holds **only the user object** — no access token. Access and refresh tokens are httpOnly cookies; JS cannot read them. The store is cleared on logout. On page reload the user is null until a `/auth/me` call rehydrates it.

### Token Flow (Login → Dashboard)

```
User enters email + OTP
  → verifyOtp.mutateAsync()
  → POST /api/v1/auth/otp/verify
  → Server sets access_token cookie (15 min, Path=/) and refresh_token cookie (30 days, Path=/api/v1/auth)
  → Server returns { user }
  → onSuccess: setAuth(user), toast.success("Welcome back!"), router.push("/dashboard")

Dashboard page loads
  → GET /api/v1/auth/me  (access_token cookie sent automatically)
  → Server validates JWT, returns user + org
  → useMe() query populates the page

15 minutes later — access token expires
  → Any API call returns 401
  → Axios interceptor catches it
  → POST /api/v1/auth/refresh  (refresh_token cookie sent — Path=/api/v1/auth matches)
  → Server issues new access_token cookie
  → Interceptor retries the original request
  → User sees no interruption

30 days later — refresh token expires
  → POST /api/v1/auth/refresh returns 401
  → Axios interceptor's refresh attempt fails
  → window.location.href = "/login"  (hard redirect, clears client state)
```

### Toast Placement Rules

**Toasts for API outcomes belong in the hook's `onSuccess`/`onError`, not in the component.**

```ts
// ✅ Correct — hook owns the API result toast
export function useRequestOtp() {
  return useMutation({
    mutationFn: ({ email }) => authApi.requestOtp(email),
    onSuccess: (_, { email }) => toast.info(`Code sent to ${maskEmail(email)}`),
    onError: (err) => toast.error(err.message || "Failed to send code. Try again."),
  });
}

// ❌ Wrong — component calling mutateAsync and showing its own toast
const requestOtp = useRequestOtp();
async function handleSubmit() {
  await requestOtp.mutateAsync({ email });
  toast.info("Code sent!"); // duplicates what the hook already does
}
```

**Local / UX toasts (not from an API call) belong in the component.**

```ts
// ✅ A local validation or UX event — component is the right place
function handleTooManySteps() {
  toast.warning("Please complete the current step first.");
}
```

Rule summary:
| Toast trigger | Where |
|---|---|
| API call succeeded | hook `onSuccess` |
| API call failed | hook `onError` |
| Local validation failed (no API involved) | component |
| UX event (no API involved) | component |

When a component calls `mutateAsync` and needs to do something **after** success (like transition step), it does that in a `try/catch` — not via a separate toast:

```ts
// The hook shows the toast. The component handles the step transition.
async function handleSubmit({ email }) {
  await requestOtp.mutateAsync({ email }); // hook fires onSuccess toast
  onSuccess(email);                         // component advances the step
}
```

### Query Keys and Invalidation

Define a `*Keys` factory object in every hook file that has `useQuery` calls. Keep all keys in one place — never hardcode strings in components.

```ts
// hooks/use-cases.ts
export const caseKeys = {
  all: ['cases'] as const,
  list: (filters: CaseFilters) => ['cases', 'list', filters] as const,
  detail: (id: string) => ['cases', 'detail', id] as const,
};
```

Invalidate in `onSuccess` of the mutation that changes the data:

```ts
export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => casesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.list({}) }); // or caseKeys.all
    },
  });
}
```

Standard invalidation rules:
| Mutation | Invalidate |
|---|---|
| Create resource | `keys.all` (covers all lists) |
| Update resource | `keys.detail(id)` + `keys.all` |
| Delete / archive resource | `keys.all` |
| Logout | `queryClient.clear()` — wipe everything |
| Login (`verifyOtp`) | No invalidation — fresh session, no stale data yet |

Auth mutations (`useRequestOtp`, `useVerifyOtp`, `useSignup`) are fire-and-forget mutations that don't cache query data, so they have no `queryKey` and no invalidation.

---

## Color Tokens

Defined in `globals.css` as CSS variables. Used in Tailwind via `@theme inline`.

| Token (CSS var) | Value | Tailwind utility | Usage |
|---|---|---|---|
| `--panel` | `#0c1445` | `bg-panel` | Left auth panel gradient start |
| `--panel-mid` | `#1e3a8a` | `bg-panel-mid` | Left panel gradient end |
| `--primary` | `#1e40af` | `bg-primary` | Buttons, links, focus rings |
| `--primary-hover` | `#1e3a8a` | `bg-primary-hover` | Button hover |
| `--primary-tint` | `#dbeafe` | `bg-primary-tint` | Selected row bg, chip bg |
| `--border` | `#e2e8f0` | `border-border` | Input borders, dividers |
| `--text` | `#0f172a` | `text-dark` | Body text, headings |
| `--text-secondary` | `#475569` | `text-secondary` | Labels, captions |
| `--text-muted` | `#94a3b8` | `text-disabled` | Placeholders, disabled |
| `--brand` | `#1e40af` | `text-brand` | Links, brand accents |

Left panel gradient: `linear-gradient(160deg, #0c1445 0%, #1e3a8a 100%)`

---

## Toast / Feedback Messages

| Event | Type | Message |
|---|---|---|
| OTP sent | Info | `Code sent to a***@gmail.com` |
| OTP invalid | Error | Backend message (includes remaining attempts) |
| OTP locked | Error | Backend message |
| Rate limited | Error | Backend message |
| Account created / signed in | Success | `"Welcome to Splexa!"` / `"Welcome back!"` |
| Email already registered | Error | `"An account with this email already exists."` |
| Network / unknown error | Error | `"Something went wrong. Please try again."` |

---

## SEO Metadata

| Page | `robots` | Notes |
|---|---|---|
| `/login` | `noindex, nofollow` | No reason to index |
| `/signup` | `index, follow` | Acquisition entry point — should be discoverable |

---

## Out of Scope (Phase 1)

- Invite flow (`/auth/invite`) — separate spec
- Redis caching / blacklisting — Phase 2
- Refresh token rotation — Phase 2
- HTML email templates — when design system is ready
- Social login — not planned
- Middleware route protection — needed before dashboard is functional
- `/auth/me` called on dashboard load — stub page only in Phase 1
