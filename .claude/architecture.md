# Architecture Rules — Splexa

## Project Overview

Splexa is a multi-tenant legal practice management SaaS. Stack: pnpm workspace + Turborepo monorepo.

```
root/
├── apps/
│   ├── web/          # Next.js 14 frontend (PWA)
│   └── server/       # Fastify backend (Node.js)
├── packages/
│   └── shared/       # Shared types, schemas, constants
├── .claude/          # These skill files
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Core Principles

### Multi-Tenancy is Non-Negotiable
Every database query **must** be scoped to `orgId`. There are no exceptions.
- `orgId` is always extracted from the verified JWT (`req.user.orgId`), never from request body or params
- If a query touches a resource, it must filter by `orgId`
- Any missing `orgId` scope is a critical security bug

### Security From Day One
Every route is explicitly public, authenticated, or role-restricted — decided when written, not added later. Permissions, roles, and activity logging are never deferred. See `security-rules.md`.

### No Blind Additions
Do not add infrastructure (caching, rate limiting, queues, feature flags) unless it is explicitly required by the current feature or is a specific product requirement. The only defaults are: JWT auth on protected routes, Helmet/security headers, HTTPS, input validation (Zod), and OTP rate limiting (product requirement).

### No Over-Engineering
Build the simplest thing that correctly solves the problem. No abstract factories for a single use-case. No event buses when a direct function call works.

---

## Backend Module Layer Order

Every backend module follows this layer order:

```
routes → controller → service → repository (Prisma)
```

There is no separate `plugin.ts` file. `routes.ts` itself exports the `fastify-plugin`-wrapped
Fastify plugin — a module is one registration, not two.

```
modules/[name]/
├── [name].routes.ts       # Exports one fp()-wrapped Fastify plugin. Declares every route's own
│                          # full sub-path directly (e.g. "/cases", "/cases/:id",
│                          # "/cases/:caseId/hearings") rather than relying on a per-module Fastify
│                          # prefix. app.ts registers every module under the same "/api/v1" prefix —
│                          # that is the ONLY prefix in the whole app. A module with both a
│                          # top-level surface and a case-scoped surface (hearings, documents,
│                          # important-dates) still gets one routes.ts with both sets of routes,
│                          # not two files and not two app.ts registrations.
├── [name].controller.ts   # Request/response handling
├── [name].service.ts      # Business logic
├── [name].repository.ts   # All Prisma queries — imports its select shape(s) from db/selects/,
│                          # never defines them inline and never owns them itself
├── [name].schema.ts       # Zod schemas for validation (no raw JSON Schema)
├── [name].models.ts       # Module-internal types not derived from a Zod schema — optional.
│                          # Server-assembled shapes (e.g. CreateXData combining validated input
│                          # with injected fields like orgId) and request-context interfaces
│                          # (e.g. VerifyOtpCtx) live here. Never duplicate a shape a Zod schema
│                          # already covers — derive with z.infer<> instead (see backend-rules.md).
├── [name].helper.ts       # Pure helpers used ONLY by this module — optional. The moment a second
│                          # module needs the same helper, it moves to src/utils/ instead.
└── __tests__/
    ├── [name].service.test.ts   # One file per source file that has real logic to test —
    └── [name].helper.test.ts    # not one grab-bag file per module. Mock what the file under test
                                  # imports (repository, other modules' repositories, integrations),
                                  # let pure helpers run for real.
```

File naming inside a module is **`[module-name].[role].ts`** — the module name is repeated
deliberately (e.g. `cases.controller.ts`, `important-dates.repository.ts`), not left generic
(`controller.ts`), so a search result or an open editor tab is unambiguous without needing the
folder path.

Prisma `select` shapes never live inside a module folder — see "Backend Module Boundaries" below
and `database-rules.md` for the `db/selects/` pattern.

See `backend-rules.md` for full examples of each layer.

---

## `packages/shared` — What Goes There

Only add to `packages/shared` if:
1. Used by **both** `apps/web` and `apps/server`, OR
2. A pure domain type / constant that is the single source of truth

Good: Zod schemas, TypeScript domain types, shared constants (`CASE_STATUS`, `USER_ROLES`), pure utility functions (`formatIndianDate`, `maskEmail`).

Bad: Anything importing from `fastify`, `next`, `react`, `prisma`. Business logic. UI components. DB queries.

---

## Backend Module Boundaries

```
apps/server/src/
├── modules/
│   ├── auth/
│   ├── cases/
│   ├── hearings/
│   ├── clients/
│   ├── documents/
│   ├── important-dates/
│   ├── dashboard/
│   └── settings/
├── config/           # Runtime config only — env.ts (Zod-validated), logger.ts
├── constants/        # Compile-time values — auth.ts, misc.ts (no index.ts barrel — import the
│                      # concrete file). Every duration constant is milliseconds (e.g. OTP_TTL_MS,
│                      # REFRESH_TOKEN_EXPIRY_MS), each with a human-readable comment, except the
│                      # ones a specific API forces into a different unit (cookie maxAge = seconds —
│                      # converted at the point of use via utils/date-time.ts, never stored as its
│                      # own separate constant).
├── db/
│   ├── client.ts     # Prisma singleton with PrismaPg adapter
│   └── selects/      # One file per entity — [entity].select.ts. The ONLY place a Prisma `select`
│                      # shape lives, regardless of which module(s) query that entity. A select that
│                      # composes another entity's shape (e.g. case.select.ts embedding
│                      # client/hearing/important-date selects) imports the sibling file directly —
│                      # this is a neutral layer, so that import is not a module-boundary violation.
├── enums/            # Server-only enums — error-code.ts, env.ts
├── integrations/     # Third-party provider adapters
│   └── email/        # email-interface.ts, resend-adapter.ts, index.ts
├── models/           # Cross-cutting TS types with no owning module, not derived from a Zod
│                      # schema — e.g. RawJwtPayload (models/auth.ts, used by utils/jwt.ts and,
│                      # through it, the global auth-guard plugin — not auth-module-private),
│                      # ServiceContext (models/service-context.ts). Distinct from
│                      # packages/shared/models, which is for types shared between apps/server and
│                      # apps/web specifically.
├── plugins/          # Fastify plugin registrations — error-handler, response, auth-guard
├── types/            # types/fastify.d.ts (req.user augmentation) only
├── utils/            # Cross-cutting pure utilities used by more than one module — date-time.ts
│                      # (msAgo/msFromNow/msToSeconds/msToMinutes), errors.ts, jwt.ts, misc.ts
│                      # (UUID — used by both auth and documents). A helper used by only one module
│                      # belongs in that module's [name].helper.ts instead, not here — e.g.
│                      # generateOtp/hashToken/generateRefreshToken live in auth.helper.ts because
│                      # nothing outside auth calls them.
├── app.ts            # Builds the Fastify app — registers every module under the single "/api/v1"
│                      # prefix (see backend-rules.md's Plugin Registration Order)
└── index.ts          # Entry point — calls app.ts, starts listening
```

Modules are **self-contained**: a module's controller/service/repository/schema/models/helper files
are private to it. Two deliberate exceptions:
1. **`db/selects/`** — every module's select shape lives there, not in the module folder. Prisma
   select composition (a case embedding its own hearings) is a data-shape concern, not a
   module-privacy concern.
2. **Cross-module repository calls for read/write on a genuinely related entity** — e.g.
   `hearings.repository.ts` calling `casesRepository.updateNextHearingDate(...)` — are accepted
   practice, since the call still goes through the owning module's repository rather than reaching
   past it into raw Prisma. What's still forbidden is reaching into another module's
   controller/service/schema/models, or calling `prisma.*` directly on an entity another module owns.

---

## Frontend Structure

```
apps/web/src/
├── app/                  # Next.js App Router pages (thin page.tsx files — resolve params, render one view component)
│   ├── (auth)/
│   ├── (protected)/
│   └── portal/
├── components/
│   ├── ui/               # Primitive, stateless components
│   ├── layout/            # App shell (sidebar, top bar, bottom nav, PageLayout)
│   ├── shared/             # Generic, feature-agnostic components used by more than one feature (modal, confirm-delete)
│   └── [feature]/          # Feature-specific composed components — cases, hearing-details (nested under cases/), important-dates (nested under cases/), client (nested under cases/), documents, calendar, dashboard, settings, auth
├── hooks/                # React Query hooks — one file per feature, flat
├── services/              # API objects — one file per feature, flat
├── types/                 # Frontend-only types — one file per feature, flat
├── constants/              # Plain data only — enums + arrays (case-tabs.ts, settings-tabs.ts). No functions.
├── mappers/                # Form/API shape converters (case-form.ts)
├── utils/                  # Pure helper functions, one concern per file (tailwind.ts, iso-date.ts, options.ts, calendar.ts, format-date-label.ts, format-hearing-date.ts). Presentation-only lookups (icon/color/class maps for one component) stay colocated with that component instead — see Component Architecture below.
├── api/                    # Axios client + typed HTTP helpers
├── store/                  # Zustand stores
└── middleware.ts
```

---

## File Naming — Entire Repo

**kebab-case for standalone/top-level files** — config, plugins, frontend components/hooks, and
anything that isn't inside a backend module folder:

```
use-cases-query.ts      ✅      useCasesQuery.ts       ❌
case-card.tsx           ✅      CaseCard.tsx           ❌
error-handler.plugin.ts ✅
```

**Inside a backend module (`apps/server/src/modules/[name]/`)**, files use
**`[module-name].[role].ts`** — the module name is repeated, dot-separated from the role:

```
cases.controller.ts        ✅      controller.ts          ❌ (ambiguous without the folder path)
important-dates.service.ts ✅      important-dates-service.ts ❌ (hyphen, not dot, is wrong here)
```

Same pattern in `db/selects/` (`case.select.ts`, `hearing.select.ts`) — one file per entity,
named after the entity, dot-suffixed with what the file is.

Framework exceptions (match what the framework requires):
- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` — Next.js App Router
- `middleware.ts` — Next.js
- `next.config.ts`, `tailwind.config.ts` — config files
- `README.md`, `Dockerfile`, `CHANGELOG.md` — conventions

---

## File Length Limit

No file exceeds **400–600 lines**. When approaching this limit: split by responsibility, not by size. Name the extracted file after what it does — not `utils.ts`.

---

## External Integrations — Adapter + Factory Pattern

Any third-party service (email, SMS, WhatsApp) lives behind an interface in `lib/integrations/`. The application code never imports directly from a provider SDK — it imports from the integration index file, which uses a **factory** to resolve the correct **adapter** at runtime.

### Structure

```
lib/integrations/
├── email/
│   ├── email-provider.ts       # Interface (adapter contract)
│   ├── adapters/
│   │   ├── resend.ts           # Resend adapter
│   │   ├── sendgrid.ts         # SendGrid adapter
│   │   └── ses.ts              # AWS SES adapter
│   ├── email-factory.ts        # Factory: resolves adapter from config
│   └── index.ts                # Export: emailProvider = emailFactory()
├── sms/
│   ├── sms-provider.ts
│   ├── adapters/
│   │   └── twilio.ts
│   ├── sms-factory.ts
│   └── index.ts
```

### Factory Resolution Order

1. **Environment variable** — e.g. `EMAIL_PROVIDER=sendgrid`
2. **Default** — hardcoded fallback in the factory (e.g. `resend`)

```ts
// email-factory.ts
export async function emailFactory(): Promise<EmailProvider> {
  const provider = await getIntegrationConfig('email') ?? env.EMAIL_PROVIDER ?? 'resend';
  switch (provider) {
    case 'sendgrid': return new SendGridAdapter();
    case 'ses':      return new SESAdapter();
    default:         return new ResendAdapter();
  }
}
```

### Rules

- Each adapter implements the interface — never exposes SDK types to callers.
- Swapping providers: add a new adapter file, register it in the factory switch. Nothing else changes.
- To override globally: set `EMAIL_PROVIDER=ses` in the environment.

---

## Environment Config

- Variables live in app-level `.env` files
- `.env.example` is always committed alongside `.env` with all keys, empty values
- Validated at startup via Zod in `config/env.ts` — crash fast if required vars missing
- Never access `process.env` directly in business logic — import from `@/config/env`

---

## Error Handling Philosophy

- Typed error classes in `lib/errors.ts` (`AuthError`, `ForbiddenError`, `NotFoundError`, `ValidationError`)
- Errors propagate to a single Fastify `setErrorHandler` — never swallowed in place
- Client-facing messages are plain English — "OTP expired. Please request a new one."
- Internal error details are logged but never sent to the client

---

## Dependency Rules

- All changes via `pnpm` — never `npm` or `yarn`
- Before adding: check publish date, check CVEs via `pnpm audit`, check weekly downloads
- After removing a feature: remove its dependencies immediately
- Internal package imports use workspace aliases (`@splexa-group/shared/enums`, `@splexa-group/shared/models`) not relative paths