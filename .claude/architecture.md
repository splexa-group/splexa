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

Every backend module follows this exact five-layer structure:

```
plugin → routes → controller → service → repository (Prisma)
```

```
modules/[name]/
├── plugin.ts          # Fastify plugin registration
├── routes.ts          # Route declarations + preHandlers
├── controller.ts      # Request/response handling
├── service.ts         # Business logic + activity logging
├── repository.ts      # All Prisma queries
├── schema.ts          # Zod schemas for validation (no raw JSON Schema)
├── helper.ts          # Pure helpers (date builders, token expiry, etc.) — optional
└── __tests__/
    └── [name].test.ts
```

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
│   ├── dashboard/
│   ├── notifications/
│   ├── organizations/
│   └── team/
├── config/           # Runtime config only — env.ts (Zod-validated), logger.ts
├── constants/        # Compile-time values — auth.ts, misc.ts, index.ts
├── db/               # db/client.ts — Prisma singleton with PrismaPg adapter
├── enums/            # Server-only enums — error-code.ts, env.ts
├── integrations/     # Third-party provider adapters
│   └── email/        # email-interface.ts, resend-adapter.ts, index.ts
├── plugins/          # Fastify plugin registrations — error-handler, response, auth-guard
├── types/            # types/fastify.d.ts (req.user augmentation), types/auth.ts
├── utils/            # Pure utilities — crypto.ts, errors.ts, jwt.ts
├── app.ts            # Builds and exports the Fastify app (all registrations)
└── index.ts          # Entry point — calls app.ts, starts listening
```

Modules are **self-contained**. A module exports a Fastify plugin and does not reach into another module's internal files. If module A needs something from module B, it is either in `packages/shared` or exposed via a service function.

---

## Frontend Structure

```
apps/web/src/
├── app/                  # Next.js App Router pages (thin page.tsx files)
│   ├── (auth)/
│   ├── (dashboard)/
│   └── portal/
├── components/
│   ├── ui/               # Primitive, stateless components
│   └── [feature]/        # Feature-specific composed components
├── hooks/                # React Query hooks (one file per feature)
├── lib/
│   └── api/              # Typed API client functions
├── stores/               # Zustand stores
├── types/                # Frontend-only types (not in shared)
└── styles/               # globals.css with design tokens
```

---

## File Naming — Entire Repo

**kebab-case everywhere**, no exceptions:

```
cases-service.ts      ✅      casesService.ts       ❌
cases-controller.ts   ✅      CasesController.ts    ❌
use-cases-query.ts    ✅      useCasesQuery.ts      ❌
case-card.tsx         ✅      CaseCard.tsx          ❌
```

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