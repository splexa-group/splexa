# Shared Package Rules — `packages/shared`

## Purpose

`packages/shared` is the **single source of truth** for types, schemas, and constants that are used by both `apps/web` and `apps/server`. It is not a utilities dumping ground.

---

## What Belongs Here

### Domain Types

TypeScript types for the core domain entities. These are derived from the database schema but are not Prisma-specific — they represent the shapes flowing through the API.

```ts
// packages/shared/src/types/case.ts
export type CaseStatus = "ACTIVE" | "ADJOURNED" | "CLOSED";
export type HearingStatus = "SCHEDULED" | "COMPLETED" | "ADJOURNED";
export type UserRole = "ADMIN" | "MEMBER";
export type ReminderType = "3DAY" | "1DAY" | "MORNING";
export type NotificationChannel = "WHATSAPP" | "SMS";

export interface Case {
  id: string;
  orgId: string;
  clientId: string;
  caseNumber: string;
  caseType: string;
  courtName: string;
  city: string;
  status: CaseStatus;
  assignedTo: string | null;
  portalEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  orgId: string;
  hearingDate: string;
  hearingTime: string | null;
  purpose: string | null;
  status: HearingStatus;
  adjournmentReason: string | null;
  createdAt: string;
}
```

### API Contract Types

Request and response shapes for the API. These ensure the frontend and backend agree on shapes at compile time.

```ts
// packages/shared/src/types/api.ts
export interface CreateCaseInput {
  clientId: string;
  caseNumber: string;
  caseType: string;
  courtName: string;
  city: string;
  assignedTo?: string;
  feeType?: string;
  feeAmount?: number;
  internalNotes?: string;
}

export interface CaseFilters {
  status?: CaseStatus;
  assignedTo?: string;
  nextHearing?: "this_week" | "this_month" | "overdue";
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuthUser {
  userId: string;
  orgId: string;
  role: UserRole;
  name: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

### Zod Schemas — Input Only

Only Zod schemas for **create/update inputs** that the frontend also validates in forms. The same schema is used server-side for request validation (via `@fastify/type-provider-zod`) and client-side for form validation — one definition, no drift.

**What goes here:** `createCaseSchema`, `createHearingSchema`, `createClientSchema`, `updateCaseSchema` — any form the user submits.

**What does NOT go here:** query/filter schemas, route param schemas, response schemas, internal validation schemas. Those are server-only and live in `modules/[name]/[name]-schema.ts`.

```ts
// packages/shared/src/schemas/case-schemas.ts
import { z } from "zod";

export const createCaseSchema = z.object({
  clientId:      z.string().uuid(),
  caseNumber:    z.string().min(1).max(100),
  caseType:      z.string().min(1).max(100),
  courtName:     z.string().min(1).max(200),
  city:          z.string().min(1).max(100),
  assignedTo:    z.string().uuid().optional(),
  feeAmount:     z.number().positive().optional(),
  internalNotes: z.string().max(2000).optional(),
});

// Type is always derived from the schema — never written separately
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
```

Usage:
- **Server** (`cases-schema.ts`): `import { createCaseSchema } from '@splexa/shared'` → passed to Fastify route `schema: { body: createCaseSchema }`
- **Frontend** (React form): `import { createCaseSchema } from '@splexa/shared'` → used with a form library for field-level validation

### Constants

Constants that **both apps reference** — status values, role names, plan limits — live here. Constants that only the server needs (TTLs, Redis key builders, activity action names, pagination limits) live in `apps/server/src/lib/constants.ts`, not here.

```ts
// packages/shared/src/constants.ts

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export const CASE_STATUS = {
  ACTIVE: 'ACTIVE',
  ADJOURNED: 'ADJOURNED',
  CLOSED: 'CLOSED',
} as const;

export const HEARING_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  ADJOURNED: 'ADJOURNED',
} as const;

export const REMINDER_TYPES = {
  THREE_DAY: '3DAY',
  ONE_DAY: '1DAY',
  MORNING: 'MORNING',
} as const;

export const PLAN_LIMITS = {
  FREE: { maxCases: 5 },
  SOLO: { maxCases: 200 },
  FIRM: { maxCases: 1000 },
} as const;
```

Usage — always import the constant, never hardcode the string:

```ts
// ✅ Both server and frontend use these the same way
import { CASE_STATUS, USER_ROLES } from '@splexa/shared';

where: { status: CASE_STATUS.ACTIVE }
if (user.role === USER_ROLES.ADMIN)
```

Server-only constants (TTLs, Redis keys, activity action names) are documented in `backend-rules.md` and live in `apps/server/src/lib/constants.ts`.

### Pure Utility Functions

Functions with zero side-effects that are useful in both frontend and backend:

```ts
// packages/shared/src/utils/format.ts
export function formatIndianDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

export function maskMobile(mobile: string): string {
  return mobile.replace(/(\d{2})\d{6}(\d{2})/, "$1XXXXXX$2");
}

export function getHearingCountdown(hearingDate: string): string {
  const today = new Date();
  const hearing = new Date(hearingDate);
  const diffDays = Math.ceil(
    (hearing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "TOMORROW";
  if (diffDays < 0) return "OVERDUE";
  return `${diffDays} days`;
}
```

---

## What Does NOT Belong Here

| Thing | Why Not |
|---|---|
| Prisma client or any `@prisma/*` import | Backend-only |
| Fastify types or plugins | Backend-only |
| React components or hooks | Frontend-only |
| `next/*` imports | Frontend-only |
| Browser APIs | Frontend-only |
| Query/filter Zod schemas (e.g. `listCasesQuerySchema`) | Server-only — frontend never validates query params |
| Route param schemas (e.g. `caseParamsSchema`) | Server-only routing concern |
| Response schemas | Server-only — frontend just receives typed data |
| Notification sending logic | Backend service concern |
| API call functions (`fetch`, axios) | Frontend `lib/api/` concern |
| Database query logic | Backend repository concern |
| Environment config | Each app manages its own |

If you find yourself wanting to put something in `shared` that would require importing from `fastify` or `react`, stop — it goes in the relevant app.

---

## Package Structure

```
packages/shared/
├── src/
│   ├── enums/
│   │   ├── user-role.ts
│   │   ├── designation.ts
│   │   ├── practice-type.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── organization.ts
│   │   ├── api.ts              # Request/response shapes
│   │   └── index.ts
│   └── (constants.ts, utils/ — add when needed by both apps)
├── dist/                       # Built output — gitignored, generated by tsup
├── package.json
├── tsup.config.ts
└── tsconfig.json
```

### Conditional Exports (subpath imports)

The shared package uses **subpath exports** — import by category, not a single barrel:

```ts
// ✅ Import from the correct subpath
import { UserRole } from '@splexa-group/shared/enums';
import type { AuthUser } from '@splexa-group/shared/types';

// ❌ No single @splexa-group/shared barrel — use the subpaths
import { UserRole } from '@splexa-group/shared';
```

`package.json` exports map:
```json
{
  "exports": {
    "./enums": { "types": "./src/enums/index.ts", "default": "./dist/enums/index.js" },
    "./types": { "types": "./src/types/index.ts", "default": "./dist/types/index.js" }
  }
}
```

---

## Package Configuration

```json
// packages/shared/package.json
{
  "name": "@splexa-group/shared",
  "type": "module",
  "exports": {
    "./enums": { "types": "./src/enums/index.ts", "default": "./dist/enums/index.js" },
    "./types": { "types": "./src/types/index.ts", "default": "./dist/types/index.js" }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  }
}
```

Build uses **tsup** with `format: ["esm"]`. The `types` condition in exports points to `.ts` source (used by TypeScript), `default` points to `.js` dist (used at runtime by Node).

**No `zod` in shared** — Zod schemas for form inputs (create/update) live in the server module's `schema.ts`, not in shared. The frontend uses its own validation (TBD).

---

## Workspace Reference

Both apps reference the shared package via pnpm workspace:

```json
// apps/server/package.json and apps/web/package.json
{
  "dependencies": {
    "@splexa-group/shared": "workspace:*"
  }
}
```

Turbo ensures `packages/shared` is built before the apps in the pipeline:

```json
// turbo.json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":   { "dependsOn": ["^dev"], "cache": false, "persistent": true }
  }
}
```

**Important:** When running `dev`, Turbo runs `pnpm dev` in `packages/shared` (tsup --watch) first, then starts the server. The server's `tsx watch` resolves shared imports from the built `dist/` files — if you change shared source, tsup rebuilds it automatically and tsx restarts the server.

---

## Adding to Shared — Checklist

Before adding anything to `packages/shared`:

- [ ] Is this used by **both** `apps/web` and `apps/server`?
- [ ] Is it free of any platform-specific import (`fastify`, `react`, `next`, `prisma`, `node:fs`)?
- [ ] Is it a pure function or a type/schema/constant?
- [ ] Would a different location (app-specific `lib/`, `types/`, or `utils/`) be more appropriate?

If any answer is "no" to the first three, it does not belong in shared.

---

## Forbidden — Shared Package

| Forbidden | Why |
|---|---|
| Importing `fastify`, `@fastify/*` | Backend-only — would break web bundle |
| Importing `react`, `next`, `next/*` | Frontend-only — would break server bundle |
| Importing `@prisma/client` | Backend-only |
| Business logic with side effects | Shared must be pure — no DB calls, no API calls, no logging |
| Duplicating a type that already exists in shared | Single source of truth — update the existing type |
| `export * from` a file that contains platform-specific code | Barrel export carries the bad import into both bundles |

---

## How to Add a New Shared Type — Step by Step

1. Create the type file in the correct folder (`types/`, `schemas/`, `utils/`)
2. Export the type from that file
3. Re-export it from the folder's `index.ts`
4. Re-export it from `packages/shared/src/index.ts`
5. Use `import type { MyType } from '@splexa/shared'` in the consuming apps

```ts
// 1. packages/shared/src/types/reminder.ts
export type ReminderType = '3DAY' | '1DAY' | 'MORNING';
export interface Reminder { id: string; caseId: string; type: ReminderType; ... }

// 2. packages/shared/src/types/index.ts
export * from './reminder';

// 3. packages/shared/src/index.ts — already re-exports from ./types, nothing to add

// 4. In apps/server or apps/web
import type { Reminder, ReminderType } from '@splexa/shared';
```

---

## AI Agent Self-Check — Shared Package

Before declaring shared package work done:

- [ ] New type/schema/constant is genuinely used by both apps (not just anticipated)
- [ ] No platform-specific import in any shared file
- [ ] New item exported from the folder `index.ts` and from `packages/shared/src/index.ts`
- [ ] `PaginatedResult<T>` used (not `PaginatedResponse`) — consistent naming across all files
- [ ] Zod schemas infer their TypeScript type: `export type X = z.infer<typeof xSchema>`
- [ ] Constants use `as const` so values are literal types, not widened to `string`
