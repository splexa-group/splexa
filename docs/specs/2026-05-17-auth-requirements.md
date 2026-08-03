# Auth System — Requirements

**Last updated:** 2026-05-17

Decisions and constraints that drive the auth design. Read this when adding features or changing auth behaviour — the "why" is here.

---

## Functional Requirements

### Passwordless OTP

- Users authenticate with email + 6-digit numeric OTP only. No passwords.
- OTP is valid for 10 minutes.
- After 3 wrong OTP attempts the OTP is locked for 15 minutes. No further attempts are accepted until the user requests a new code.
- A user can request at most 5 OTPs per hour per email. Exceeding this returns 429.
- When a new OTP is requested, all previous pending OTPs for that email are invalidated. A stale intercepted code cannot be used after a newer one is issued.
- OTP is sent via email only (no SMS in Phase 1).

### Signup

- A new user creates an account by providing: first name, last name, email, phone number, designation, org name, practice types (one or more), city.
- Signup creates an org and a user in the same transaction. The first user of an org has `role = OWNER`.
- `practiceTypes` is an array — an org can practice multiple areas of law simultaneously.
- After signup the user verifies their email with an OTP before getting access.
- An email address can only be registered once. Attempting to sign up with an existing email returns 409.
- Orphaned accounts (signed up but never verified) block re-registration of the same email. Accepted trade-off in Phase 1 — addressed in Phase 2.

### Login

- An existing user logs in by entering their email. The server sends an OTP to that email.
- If the email is not registered, the server returns 404. The frontend displays a message indicating the account does not exist.
- Successful OTP verification creates a session and logs the user in.

### Sessions

- Sessions are stored in PostgreSQL. No Redis in Phase 1.
- Access token: 15-minute JWT, delivered as an httpOnly cookie (`Path=/`).
- Refresh token: 30-day random token (SHA-256 hashed in DB), delivered as an httpOnly cookie (`Path=/api/v1/auth`).
- The access token is silently refreshed using the refresh cookie when any request returns 401. The user sees no interruption.
- A user can have multiple active sessions (one per device/browser).
- Users can list, inspect, and revoke individual sessions or all sessions at once.
- Logout revokes the current session and clears both cookies.

### Route Protection

- All routes under `(protected)/` require authentication.
- Route protection lives in `middleware.ts` — not inside page components.
- Unauthenticated requests to protected routes redirect to `/login`.

---

## Security Requirements

1. **`orgId` from JWT only** — `req.user.orgId` from the verified JWT. Never from body, params, or query. A tenant cannot access another tenant's data by sending a different `orgId`.

2. **Tokens never in JavaScript** — Access and refresh tokens are httpOnly cookies. JavaScript has no access. The Zustand store holds only the user object.

3. **Tokens never in logs** — OTP plaintext, JWTs, and refresh tokens are never written to application logs. Email addresses are masked (`a***@gmail.com`) in audit logs.

4. **Refresh token stored hashed** — The plain refresh token is never stored. The DB holds a SHA-256 hash. Even if the DB is compromised, tokens cannot be replayed without the plain value.

5. **OTP stored hashed** — OTP is bcrypt-hashed before storage. The plain value is only held in memory during a single request.

6. **Send-first rule** — The email is sent before anything is written to the DB. If the email provider fails, the operation returns 503 and nothing is persisted. This prevents orphaned DB rows with no corresponding email.

7. **Atomic signup** — Org + user + OTP request are created in a single Prisma transaction. A failed transaction leaves no partial state.

8. **SameSite=Strict** — Both cookies are `SameSite=Strict`, preventing CSRF attacks.

9. **Refresh cookie path restriction** — The refresh token cookie is scoped to `Path=/api/v1/auth`. The browser only sends it to auth endpoints, not to every API call.

10. **Post-logout token validity** — After logout, the access token is still technically valid for up to 15 minutes (no server-side blacklist in Phase 1). This is accepted — the 15-minute window is short, and a blacklist adds Redis dependency.

---

## UX Requirements

- Every step of the auth forms shows a spinner while the API call is in progress.
- Submit buttons are disabled until required fields are valid.
- OTP boxes auto-focus the next box on input, support backspace to go back, and support paste of a full 6-digit code.
- A resend button appears after a 60-second cooldown. It is disabled during the cooldown and while a resend is in progress.
- Error messages come from the server's `error.message` field — they already describe what happened (e.g. "You have 2 attempts remaining"). The frontend does not re-write them.
- Fallback error: `"Something went wrong. Please try again."` when no server message is available.
- The OTP boxes reset and the error state is shown when a wrong code is entered (user sees the red highlight and types again).
- Login: two steps — email then OTP. Back button on OTP step returns to email step.
- Signup: four steps — email → personal → practice → OTP. Back button on each step returns to the previous step. Data is preserved when going back.

---

## Technical Decisions

### Why no passwords?

Passwords add complexity: storage, hashing, reset flows, breach risks. OTP-only is simpler, secure enough for Phase 1, and common in Indian B2B SaaS. No password reset flow needed.

### Why httpOnly cookies instead of Authorization headers?

httpOnly cookies prevent XSS from stealing tokens. `SameSite=Strict` prevents CSRF. An `Authorization: Bearer` header would require JS to read the token from storage (localStorage = XSS risk; in-memory Zustand = lost on reload and can't use standard browser cookie behaviour). Cookies win for auth.

### Why separate cookie paths for access and refresh tokens?

The refresh token cookie is scoped to `/api/v1/auth` so the browser only sends it to auth endpoints. If it were `Path=/`, every API request would carry the refresh token — unnecessary exposure.

### Why bcrypt for OTPs instead of a faster hash?

OTPs are low-entropy (6 digits = 1,000,000 possibilities). A fast hash like SHA-256 would be trivially brute-forced offline if someone got the hash. bcrypt's cost factor makes offline brute-force infeasible for the 10-minute window.

### Why PostgreSQL sessions instead of Redis?

Phase 1 constraint: no Redis dependency. PostgreSQL is already there. The session table is small and rarely queried. If session lookup becomes a bottleneck, Redis is the Phase 2 upgrade path.

### Why practiceTypes as an array?

A law firm often practices multiple areas. Requiring one type forced firms to pick one arbitrarily. An array lets them accurately represent their scope. The field is a Prisma `PracticeType[]` mapped to a PostgreSQL array column.

### Why invalidate old OTPs before issuing new ones?

If a user requests a new OTP, any intercepted old code should no longer work. Invalidating previous pending OTPs (setting `verifiedAt = now`) prevents replay of stale codes after a newer one is verified.

### Why send email before writing to DB?

If we write the DB row first and then the email send fails, the user gets a 503 but there's now an OTP row in the DB that will never be used. Over time this creates noise and inflates rate-limit counts. Send-first keeps the DB clean — a failed delivery means nothing was written.

### Why axios instead of fetch?

The silent 401 → refresh → retry pattern is much cleaner with axios interceptors than with raw fetch. The interceptor is written once in `api/client.ts` and works for every API call in the app transparently. With fetch this logic would need to be duplicated or wrapped in a higher-order function.

### Why React Hook Form instead of controlled inputs?

Auth forms have validation requirements (required fields, email format, min-length) and submit state. RHF handles validation, `isValid`, `isSubmitting`, and field registration with less code than controlled state. `Controller` is used for Radix UI components that don't expose a ref-compatible API (Select, MultiSelect).
