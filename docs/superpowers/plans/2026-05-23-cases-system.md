# Cases System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full backend for Clients, Cases, and Hearings modules — including scheduled_events fan-out, integration adapter stubs (storage R2, WhatsApp Interakt), and a reminder worker stub — with no frontend changes.

**Architecture:** Five-layer Fastify pattern (plugin → route → controller → service → repository) for each module. Prisma multi-file schema in `prisma/schema/`. Cross-module rule: repositories are leaf nodes (only import prisma), services never import other services — they cross-import repositories directly.

**Tech Stack:** Fastify 5.8.5, Prisma 7.8.0 (multi-file schema), Zod 4.4.3, PostgreSQL, Vitest 2.x (unit tests), node-cron (reminder worker), @aws-sdk/client-s3 (R2 storage adapter)

---

## File Structure

**New files — packages/shared:**
- `packages/shared/src/enums/client-type.ts`
- `packages/shared/src/enums/preferred-language.ts`
- `packages/shared/src/enums/party-role.ts`
- `packages/shared/src/enums/case-type.ts`
- `packages/shared/src/enums/case-status.ts`
- `packages/shared/src/enums/case-stage.ts`
- `packages/shared/src/enums/court-type.ts`
- `packages/shared/src/enums/priority.ts`
- `packages/shared/src/enums/important-date-type.ts`
- `packages/shared/src/enums/hearing-status.ts`
- `packages/shared/src/enums/hearing-purpose.ts`

**New files — Prisma enums:**
- `apps/server/prisma/schema/enums/client-type.enum.prisma`
- `apps/server/prisma/schema/enums/preferred-language.enum.prisma`
- `apps/server/prisma/schema/enums/party-role.enum.prisma`
- `apps/server/prisma/schema/enums/case-type.enum.prisma`
- `apps/server/prisma/schema/enums/case-status.enum.prisma`
- `apps/server/prisma/schema/enums/case-stage.enum.prisma`
- `apps/server/prisma/schema/enums/court-type.enum.prisma`
- `apps/server/prisma/schema/enums/priority.enum.prisma`
- `apps/server/prisma/schema/enums/important-date-type.enum.prisma`
- `apps/server/prisma/schema/enums/hearing-status.enum.prisma`
- `apps/server/prisma/schema/enums/hearing-purpose.enum.prisma`
- `apps/server/prisma/schema/enums/scheduled-event-type.enum.prisma`

**New files — Prisma models:**
- `apps/server/prisma/schema/models/client.prisma`
- `apps/server/prisma/schema/models/case.prisma`
- `apps/server/prisma/schema/models/hearing.prisma`
- `apps/server/prisma/schema/models/case-important-date.prisma`
- `apps/server/prisma/schema/models/scheduled-event.prisma`

**New files — server src:**
- `apps/server/src/constants/activity-actions.ts`
- `apps/server/src/utils/log-activity.ts`
- `apps/server/src/integrations/storage/storage-interface.ts`
- `apps/server/src/integrations/storage/r2-adapter.ts`
- `apps/server/src/integrations/storage/index.ts`
- `apps/server/src/integrations/whatsapp/whatsapp-interface.ts`
- `apps/server/src/integrations/whatsapp/interakt-adapter.ts`
- `apps/server/src/integrations/whatsapp/index.ts`
- `apps/server/src/modules/clients/schema.ts`
- `apps/server/src/modules/clients/repository.ts`
- `apps/server/src/modules/clients/service.ts`
- `apps/server/src/modules/clients/controller.ts`
- `apps/server/src/modules/clients/routes.ts`
- `apps/server/src/modules/clients/plugin.ts`
- `apps/server/src/modules/clients/__tests__/service.test.ts`
- `apps/server/src/modules/cases/schema.ts`
- `apps/server/src/modules/cases/repository.ts`
- `apps/server/src/modules/cases/service.ts`
- `apps/server/src/modules/cases/controller.ts`
- `apps/server/src/modules/cases/routes.ts`
- `apps/server/src/modules/cases/plugin.ts`
- `apps/server/src/modules/cases/__tests__/service.test.ts`
- `apps/server/src/modules/hearings/schema.ts`
- `apps/server/src/modules/hearings/repository.ts`
- `apps/server/src/modules/hearings/service.ts`
- `apps/server/src/modules/hearings/controller.ts`
- `apps/server/src/modules/hearings/routes.ts`
- `apps/server/src/modules/hearings/plugin.ts`
- `apps/server/src/modules/hearings/__tests__/service.test.ts`
- `apps/server/src/workers/reminder-worker.ts`
- `apps/server/vitest.config.ts`

**Modified files:**
- `packages/shared/src/enums/index.ts` — add 11 new exports
- `apps/server/prisma/schema/models/organization.prisma` — add back-relations
- `apps/server/prisma/schema/models/user.prisma` — add back-relations
- `apps/server/src/db/selects.ts` — add clientSelect, caseSummarySelect, hearingSummarySelect
- `apps/server/src/enums/error-code.ts` — add 5 new codes
- `apps/server/src/utils/errors.ts` — add 5 new factories
- `apps/server/src/config/env.ts` — add storage/SMS/WhatsApp env vars
- `apps/server/src/app.ts` — register 3 new modules
- `apps/server/package.json` — add vitest, node-cron, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, @types/node-cron

---

## Task 1: Install Vitest and configure test environment

**Files:**
- Create: `apps/server/vitest.config.ts`
- Modify: `apps/server/package.json`

- [ ] **Step 1: Install test dependencies**

Run from `apps/server/`:
```bash
pnpm add -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `apps/server/package.json`, add under `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 4: Verify vitest works**

```bash
cd apps/server && pnpm test
```
Expected: `No test files found` (zero tests, zero failures — just confirms vitest loads).

- [ ] **Step 5: Install runtime dependencies needed for later tasks**

```bash
pnpm add node-cron @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add -D @types/node-cron
```

Note: No SMS package needed — WhatsApp (Interakt) is the only notification channel.

- [ ] **Step 6: Commit**

```bash
git add apps/server/vitest.config.ts apps/server/package.json
git commit -m "chore: add vitest test runner and runtime deps for cases system"
```

---

## Task 2: Shared TypeScript enums (11 new files)

**Files:**
- Create: `packages/shared/src/enums/client-type.ts` through `hearing-purpose.ts`
- Modify: `packages/shared/src/enums/index.ts`

- [ ] **Step 1: Create all 11 enum files**

`packages/shared/src/enums/client-type.ts`:
```typescript
export enum ClientType {
  Individual = "Individual",
  Company = "Company",
  NGO = "NGO",
  Government = "Government",
}
```

`packages/shared/src/enums/preferred-language.ts`:
```typescript
export enum PreferredLanguage {
  English = "English",
  Hindi = "Hindi",
  Telugu = "Telugu",
  Tamil = "Tamil",
  Kannada = "Kannada",
  Malayalam = "Malayalam",
  Marathi = "Marathi",
  Bengali = "Bengali",
  Gujarati = "Gujarati",
  Punjabi = "Punjabi",
}
```

`packages/shared/src/enums/party-role.ts`:
```typescript
export enum PartyRole {
  Petitioner = "Petitioner",
  Respondent = "Respondent",
  Accused = "Accused",
  Complainant = "Complainant",
}
```

`packages/shared/src/enums/case-type.ts`:
```typescript
export enum CaseType {
  Civil = "Civil",
  Criminal = "Criminal",
  Family = "Family",
  Consumer = "Consumer",
  Labour = "Labour",
  Revenue = "Revenue",
  Writ = "Writ",
  Corporate = "Corporate",
  Other = "Other",
}
```

`packages/shared/src/enums/case-status.ts`:
```typescript
export enum CaseStatus {
  Active = "Active",
  Stayed = "Stayed",
  Disposed = "Disposed",
  Appealed = "Appealed",
}
```

`packages/shared/src/enums/case-stage.ts`:
```typescript
export enum CaseStage {
  PreTrial = "PreTrial",
  Trial = "Trial",
  Arguments = "Arguments",
  Judgment = "Judgment",
  Execution = "Execution",
}
```

`packages/shared/src/enums/court-type.ts`:
```typescript
export enum CourtType {
  DistrictCourt = "DistrictCourt",
  HighCourt = "HighCourt",
  SupremeCourt = "SupremeCourt",
  Tribunal = "Tribunal",
  ConsumerForum = "ConsumerForum",
  FamilyCourt = "FamilyCourt",
  Other = "Other",
}
```

`packages/shared/src/enums/priority.ts`:
```typescript
export enum Priority {
  High = "High",
  Medium = "Medium",
  Low = "Low",
}
```

`packages/shared/src/enums/important-date-type.ts`:
```typescript
export enum ImportantDateType {
  Limitation = "Limitation",
  BailExpiry = "BailExpiry",
  StayExpiry = "StayExpiry",
  AppealDeadline = "AppealDeadline",
  InjunctionValidity = "InjunctionValidity",
  Other = "Other",
}
```

`packages/shared/src/enums/hearing-status.ts`:
```typescript
export enum HearingStatus {
  Scheduled = "Scheduled",
  Completed = "Completed",
  Adjourned = "Adjourned",
  Cancelled = "Cancelled",
}
```

`packages/shared/src/enums/hearing-purpose.ts`:
```typescript
export enum HearingPurpose {
  Arguments = "Arguments",
  Evidence = "Evidence",
  CrossExamination = "CrossExamination",
  Order = "Order",
  Mention = "Mention",
  Settlement = "Settlement",
  Miscellaneous = "Miscellaneous",
}
```

- [ ] **Step 2: Update packages/shared/src/enums/index.ts**

Replace the file entirely:
```typescript
export * from "./designation";
export * from "./practice-type";
export * from "./user-role";
export * from "./client-type";
export * from "./preferred-language";
export * from "./party-role";
export * from "./case-type";
export * from "./case-status";
export * from "./case-stage";
export * from "./court-type";
export * from "./priority";
export * from "./important-date-type";
export * from "./hearing-status";
export * from "./hearing-purpose";
```

- [ ] **Step 3: Typecheck**

```bash
cd packages/shared && pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/enums/
git commit -m "feat(shared): add 11 enums for clients, cases, and hearings modules"
```

---

## Task 3: Prisma enums (12 .enum.prisma files)

**Files:** Create all files in `apps/server/prisma/schema/enums/`

- [ ] **Step 1: Create all 12 Prisma enum files**

`client-type.enum.prisma`:
```prisma
enum ClientType {
  Individual
  Company
  NGO
  Government
}
```

`preferred-language.enum.prisma`:
```prisma
enum PreferredLanguage {
  English
  Hindi
  Telugu
  Tamil
  Kannada
  Malayalam
  Marathi
  Bengali
  Gujarati
  Punjabi
}
```

`party-role.enum.prisma`:
```prisma
enum PartyRole {
  Petitioner
  Respondent
  Accused
  Complainant
}
```

`case-type.enum.prisma`:
```prisma
enum CaseType {
  Civil
  Criminal
  Family
  Consumer
  Labour
  Revenue
  Writ
  Corporate
  Other
}
```

`case-status.enum.prisma`:
```prisma
enum CaseStatus {
  Active
  Stayed
  Disposed
  Appealed
}
```

`case-stage.enum.prisma`:
```prisma
enum CaseStage {
  PreTrial
  Trial
  Arguments
  Judgment
  Execution
}
```

`court-type.enum.prisma`:
```prisma
enum CourtType {
  DistrictCourt
  HighCourt
  SupremeCourt
  Tribunal
  ConsumerForum
  FamilyCourt
  Other
}
```

`priority.enum.prisma`:
```prisma
enum Priority {
  High
  Medium
  Low
}
```

`important-date-type.enum.prisma`:
```prisma
enum ImportantDateType {
  Limitation
  BailExpiry
  StayExpiry
  AppealDeadline
  InjunctionValidity
  Other
}
```

`hearing-status.enum.prisma`:
```prisma
enum HearingStatus {
  Scheduled
  Completed
  Adjourned
  Cancelled
}
```

`hearing-purpose.enum.prisma`:
```prisma
enum HearingPurpose {
  Arguments
  Evidence
  CrossExamination
  Order
  Mention
  Settlement
  Miscellaneous
}
```

`scheduled-event-type.enum.prisma`:
```prisma
enum ScheduledEventType {
  HearingDate
  ImportantDate
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/prisma/schema/enums/
git commit -m "feat(db): add 12 prisma enums for cases system"
```

---

## Task 4: Prisma models (5 new + 2 updated)

**Files:**
- Create: 5 model files in `apps/server/prisma/schema/models/`
- Modify: `organization.prisma`, `user.prisma`

- [ ] **Step 1: Create client.prisma**

`apps/server/prisma/schema/models/client.prisma`:
```prisma
model Client {
  id                String             @id @default(uuid())
  orgId             String             @map("org_id")
  fullName          String             @map("full_name")
  phone             String
  type              ClientType
  email             String?
  address           String?
  companyName       String?            @map("company_name")
  notes             String?
  preferredLanguage PreferredLanguage? @map("preferred_language")
  createdBy         String             @map("created_by")
  createdAt         DateTime           @default(now()) @map("created_at")
  updatedAt         DateTime           @updatedAt @map("updated_at")
  deletedAt         DateTime?          @map("deleted_at")

  org     Organization @relation(fields: [orgId], references: [id])
  creator User         @relation("ClientCreator", fields: [createdBy], references: [id])
  cases   Case[]

  @@index([orgId])
  @@index([orgId, deletedAt])
  @@index([orgId, phone])
  @@map("clients")
}
```

- [ ] **Step 2: Create case.prisma**

`apps/server/prisma/schema/models/case.prisma`:
```prisma
model Case {
  id           String     @id @default(uuid())
  orgId        String     @map("org_id")

  title        String
  clientId     String     @map("client_id")
  clientRole   PartyRole  @map("client_role")

  caseNumber   String?    @map("case_number")
  caseType     CaseType?  @map("case_type")
  filingDate   DateTime?  @map("filing_date")

  courtName    String?    @map("court_name")
  courtType    CourtType? @map("court_type")
  courtState   String?    @map("court_state")
  courtCity    String?    @map("court_city")
  benchNumber  String?    @map("bench_number")

  judgeName        String?   @map("judge_name")
  judgeDesignation String?   @map("judge_designation")
  judgeUpdatedAt   DateTime? @map("judge_updated_at")

  status   CaseStatus @default(Active)
  stage    CaseStage?
  priority Priority?

  oppositeParties Json? @map("opposite_parties")

  notes String?
  tags  String[]

  nextHearingDate DateTime? @map("next_hearing_date")

  assignedTo String? @map("assigned_to")
  createdBy  String  @map("created_by")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  org          Organization        @relation(fields: [orgId], references: [id])
  client       Client              @relation(fields: [clientId], references: [id])
  creator      User                @relation("CaseCreator", fields: [createdBy], references: [id])
  assignedUser User?               @relation("CaseAssignment", fields: [assignedTo], references: [id])
  hearings     Hearing[]
  importantDates CaseImportantDate[]
  scheduledEvents ScheduledEvent[]

  @@index([orgId])
  @@index([orgId, status])
  @@index([orgId, clientId])
  @@index([orgId, deletedAt])
  @@index([orgId, nextHearingDate])
  @@map("cases")
}
```

- [ ] **Step 3: Create hearing.prisma**

`apps/server/prisma/schema/models/hearing.prisma`:
```prisma
model Hearing {
  id                String          @id @default(uuid())
  caseId            String          @map("case_id")
  orgId             String          @map("org_id")
  date              DateTime
  purpose           HearingPurpose?
  status            HearingStatus   @default(Scheduled)
  notes             String?
  nextDate          DateTime?       @map("next_date")
  adjournmentReason String?         @map("adjournment_reason")
  judgePresent      String?         @map("judge_present")
  addedBy           String          @map("added_by")
  createdAt         DateTime        @default(now()) @map("created_at")
  updatedAt         DateTime        @updatedAt @map("updated_at")
  deletedAt         DateTime?       @map("deleted_at")

  case    Case         @relation(fields: [caseId], references: [id])
  org     Organization @relation(fields: [orgId], references: [id])
  adder   User         @relation("HearingAdder", fields: [addedBy], references: [id])

  @@index([caseId])
  @@index([orgId, date])
  @@index([orgId, status])
  @@index([orgId, deletedAt])
  @@map("hearings")
}
```

- [ ] **Step 4: Create case-important-date.prisma**

`apps/server/prisma/schema/models/case-important-date.prisma`:
```prisma
model CaseImportantDate {
  id          String            @id @default(uuid())
  caseId      String            @map("case_id")
  orgId       String            @map("org_id")
  dateType    ImportantDateType @map("date_type")
  date        DateTime
  description String?
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")
  deletedAt   DateTime?         @map("deleted_at")

  case Case         @relation(fields: [caseId], references: [id])
  org  Organization @relation(fields: [orgId], references: [id])

  @@index([orgId, date])
  @@index([caseId])
  @@index([orgId, deletedAt])
  @@map("case_important_dates")
}
```

- [ ] **Step 5: Create scheduled-event.prisma**

`apps/server/prisma/schema/models/scheduled-event.prisma`:
```prisma
model ScheduledEvent {
  id           String             @id @default(uuid())
  orgId        String             @map("org_id")
  type         ScheduledEventType
  date         DateTime
  sourceId     String             @map("source_id")
  sourceType   String             @map("source_type")
  caseId       String             @map("case_id")
  notifyUserId String             @map("notify_user_id")
  notifiedAt   DateTime?          @map("notified_at")
  createdAt    DateTime           @default(now()) @map("created_at")
  updatedAt    DateTime           @updatedAt @map("updated_at")
  deletedAt    DateTime?          @map("deleted_at")

  org  Organization @relation(fields: [orgId], references: [id])
  case Case         @relation(fields: [caseId], references: [id])

  @@index([orgId, date])
  @@index([sourceId])
  @@index([orgId, deletedAt])
  @@map("scheduled_events")
}
```

- [ ] **Step 6: Update organization.prisma — add back-relations**

Add these lines inside the `Organization` model, after `auditLogs AuditLog[]`:
```prisma
  clients            Client[]
  cases              Case[]
  hearings           Hearing[]
  caseImportantDates CaseImportantDate[]
  scheduledEvents    ScheduledEvent[]
```

- [ ] **Step 7: Update user.prisma — add back-relations**

Add these lines inside the `User` model, after `auditLogs AuditLog[]`:
```prisma
  clientsCreated Client[]   @relation("ClientCreator")
  casesCreated   Case[]     @relation("CaseCreator")
  casesAssigned  Case[]     @relation("CaseAssignment")
  hearingsAdded  Hearing[]  @relation("HearingAdder")
```

- [ ] **Step 8: Commit**

```bash
git add apps/server/prisma/schema/
git commit -m "feat(db): add prisma models for clients, cases, hearings, important-dates, scheduled-events"
```

---

## Task 5: Database migration

- [ ] **Step 1: Generate Prisma client**

```bash
cd apps/server && pnpm db:generate
```
Expected: `Generated Prisma Client` with no errors. If there are schema errors, fix them before continuing.

- [ ] **Step 2: Run migration**

```bash
pnpm db:migrate --name add_cases_clients_hearings_system
```
Expected: `Your database is now in sync with your schema.` and a new migration folder created in `prisma/migrations/`.

- [ ] **Step 3: Verify Prisma types are available**

```bash
pnpm typecheck
```
Expected: zero errors (new Prisma-generated types for `Case`, `Client`, `Hearing`, etc. are available).

- [ ] **Step 4: Commit**

```bash
git add prisma/migrations/ prisma/schema/
git commit -m "feat(db): migration — add clients, cases, hearings, scheduled_events tables"
```

---

## Task 6: Foundation utilities

**Files:**
- Modify: `src/enums/error-code.ts`, `src/utils/errors.ts`, `src/config/env.ts`, `src/db/selects.ts`
- Create: `src/constants/activity-actions.ts`, `src/utils/log-activity.ts`

- [ ] **Step 1: Add new error codes to src/enums/error-code.ts**

Append to the `ErrorCode` enum (after the last existing entry):
```typescript
  // clients
  CLIENT_NOT_FOUND = "CLIENT_NOT_FOUND",

  // cases
  CASE_NOT_FOUND = "CASE_NOT_FOUND",

  // hearings
  HEARING_NOT_FOUND = "HEARING_NOT_FOUND",
  HEARING_CASE_MISMATCH = "HEARING_CASE_MISMATCH",

  // important dates
  IMPORTANT_DATE_NOT_FOUND = "IMPORTANT_DATE_NOT_FOUND",
```

- [ ] **Step 2: Add new Errors factories to src/utils/errors.ts**

Append to the `Errors` object (before `} as const`):
```typescript
  clientNotFound: () =>
    new AppError(404, ErrorCode.CLIENT_NOT_FOUND, "Client not found."),

  caseNotFound: () =>
    new AppError(404, ErrorCode.CASE_NOT_FOUND, "Case not found."),

  hearingNotFound: () =>
    new AppError(404, ErrorCode.HEARING_NOT_FOUND, "Hearing not found."),

  hearingCaseMismatch: () =>
    new AppError(
      403,
      ErrorCode.HEARING_CASE_MISMATCH,
      "Hearing does not belong to this case.",
    ),

  importantDateNotFound: () =>
    new AppError(
      404,
      ErrorCode.IMPORTANT_DATE_NOT_FOUND,
      "Important date not found.",
    ),
```

- [ ] **Step 3: Create src/constants/activity-actions.ts**

```typescript
export const ActivityAction = {
  CLIENT_CREATED: "CLIENT_CREATED",
  CLIENT_UPDATED: "CLIENT_UPDATED",
  CLIENT_DELETED: "CLIENT_DELETED",

  CASE_CREATED: "CASE_CREATED",
  CASE_UPDATED: "CASE_UPDATED",
  CASE_STATUS_CHANGED: "CASE_STATUS_CHANGED",
  CASE_ASSIGNED: "CASE_ASSIGNED",
  CASE_DELETED: "CASE_DELETED",

  HEARING_ADDED: "HEARING_ADDED",
  HEARING_OUTCOME_UPDATED: "HEARING_OUTCOME_UPDATED",
  HEARING_DELETED: "HEARING_DELETED",
} as const;

export type ActivityActionType =
  (typeof ActivityAction)[keyof typeof ActivityAction];
```

- [ ] **Step 4: Create src/utils/log-activity.ts**

```typescript
import { prisma } from "@/db/client";
import type { ActivityActionType } from "@/constants/activity-actions";

export async function logActivity(input: {
  orgId: string;
  userId: string;
  action: ActivityActionType;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog
    .create({
      data: {
        orgId: input.orgId,
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ipAddress: input.ipAddress,
        metadata: input.metadata ?? {},
      },
    })
    .catch(() => {
      // Never block the response — audit failure is non-fatal
    });
}
```

- [ ] **Step 5: Add env vars to src/config/env.ts**

Append to the `env` object (after `EMAIL_PROVIDER`):
```typescript
  STORAGE_PROVIDER: getEnvVariable("STORAGE_PROVIDER"),
  R2_ENDPOINT: getEnvVariable("R2_ENDPOINT"),
  R2_ACCESS_KEY_ID: getEnvVariable("R2_ACCESS_KEY_ID"),
  R2_SECRET_ACCESS_KEY: getEnvVariable("R2_SECRET_ACCESS_KEY"),
  R2_BUCKET: getEnvVariable("R2_BUCKET"),

  WHATSAPP_PROVIDER: getEnvVariable("WHATSAPP_PROVIDER"),
  INTERAKT_API_KEY: getEnvVariable("INTERAKT_API_KEY"),
```

Also add stub values for the `.env` file (so dev server doesn't crash):
```bash
STORAGE_PROVIDER=r2
R2_ENDPOINT=https://stub.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=stub
R2_SECRET_ACCESS_KEY=stub
R2_BUCKET=splexa-documents

WHATSAPP_PROVIDER=interakt
INTERAKT_API_KEY=stub
```

- [ ] **Step 6: Add selects to src/db/selects.ts**

Append to `apps/server/src/db/selects.ts`:
```typescript
export const clientSelect = {
  id: true,
  orgId: true,
  fullName: true,
  phone: true,
  type: true,
  email: true,
  address: true,
  companyName: true,
  notes: true,
  preferredLanguage: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

export const caseSummarySelect = {
  id: true,
  title: true,
  caseNumber: true,
  status: true,
  priority: true,
  courtName: true,
  nextHearingDate: true,
  clientRole: true,
  client: {
    select: {
      id: true,
      fullName: true,
      phone: true,
    },
  },
} satisfies Prisma.CaseSelect;

export const hearingSummarySelect = {
  id: true,
  caseId: true,
  orgId: true,
  date: true,
  purpose: true,
  status: true,
  notes: true,
  nextDate: true,
  adjournmentReason: true,
  judgePresent: true,
  addedBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HearingSelect;
```

- [ ] **Step 7: Typecheck**

```bash
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/
git commit -m "feat: add activity-actions, log-activity, error codes, selects for cases system"
```

---

## Task 7: Integration adapter stubs

**Files:** Create 9 files in `src/integrations/storage/`, `src/integrations/sms/`, `src/integrations/whatsapp/`

- [ ] **Step 1: Create storage interface**

`apps/server/src/integrations/storage/storage-interface.ts`:
```typescript
export interface StorageProvider {
  upload(key: string, body: Buffer, mimeType: string): Promise<void>;
  presignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
```

- [ ] **Step 2: Create R2 adapter**

`apps/server/src/integrations/storage/r2-adapter.ts`:
```typescript
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/config/env";

import type { StorageProvider } from "./storage-interface";

export class R2Adapter implements StorageProvider {
  private client = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  async upload(key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }

  async presignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
    );
  }
}
```

Note: Add the missing import at the top of r2-adapter.ts:
```typescript
import { GetObjectCommand } from "@aws-sdk/client-s3";
```

- [ ] **Step 3: Create storage index**

`apps/server/src/integrations/storage/index.ts`:
```typescript
import { env } from "@/config/env";

import { R2Adapter } from "./r2-adapter";
import type { StorageProvider } from "./storage-interface";

function createStorageProvider(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case "r2":
    default:
      return new R2Adapter();
  }
}

export const storageProvider = createStorageProvider();
```

- [ ] **Step 4: Create WhatsApp interface**

`apps/server/src/integrations/whatsapp/whatsapp-interface.ts`:
```typescript
export interface WhatsAppProvider {
  sendTemplateMessage(to: string, templateName: string, params: string[]): Promise<void>;
}
```

- [ ] **Step 5: Create Interakt adapter stub**

`apps/server/src/integrations/whatsapp/interakt-adapter.ts`:
```typescript
import { env } from "@/config/env";

import type { WhatsAppProvider } from "./whatsapp-interface";

export class InteraktAdapter implements WhatsAppProvider {
  async sendTemplateMessage(
    to: string,
    templateName: string,
    params: string[],
  ): Promise<void> {
    const response = await fetch("https://api.interakt.ai/v1/public/message/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${env.INTERAKT_API_KEY}`,
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: to,
        callbackData: templateName,
        type: "Template",
        template: {
          name: templateName,
          languageCode: "en",
          bodyValues: params,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Interakt WhatsApp delivery failed: ${response.statusText}`);
    }
  }
}
```

- [ ] **Step 6: Create WhatsApp index**

`apps/server/src/integrations/whatsapp/index.ts`:
```typescript
import { env } from "@/config/env";

import { InteraktAdapter } from "./interakt-adapter";
import type { WhatsAppProvider } from "./whatsapp-interface";

function createWhatsAppProvider(): WhatsAppProvider {
  switch (env.WHATSAPP_PROVIDER) {
    case "interakt":
    default:
      return new InteraktAdapter();
  }
}

export const whatsAppProvider = createWhatsAppProvider();
```

- [ ] **Step 7: Typecheck**

```bash
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/integrations/
git commit -m "feat: add storage (R2) and WhatsApp (Interakt) adapter stubs"
```

---

## Task 8: Clients module

**Files:** `src/modules/clients/` — 6 source files + 1 test file

- [ ] **Step 1: Write failing tests for clients service**

Create `apps/server/src/modules/clients/__tests__/service.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

import { Errors } from "@/utils/errors";

import { clientsRepository } from "../repository";
import { clientsService } from "../service";

vi.mock("../repository", () => ({
  clientsRepository: {
    findByPhone: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock("@/utils/log-activity", () => ({ logActivity: vi.fn() }));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };

const mockClient = {
  id: "client-1",
  orgId: "org-1",
  fullName: "Ravi Kumar",
  phone: "+91 99999 00000",
  type: "Individual",
  email: null,
  address: null,
  companyName: null,
  notes: null,
  preferredLanguage: null,
  createdBy: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe("clientsService.create", () => {
  it("creates a client and returns it when no duplicate phone", async () => {
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue(null);
    vi.mocked(clientsRepository.create).mockResolvedValue(mockClient);

    const result = await clientsService.create(
      { fullName: "Ravi Kumar", phone: "+91 99999 00000", type: "Individual" },
      ctx,
    );

    expect(result).toEqual(mockClient);
    expect(result).not.toHaveProperty("warning");
  });

  it("returns warning when phone already exists", async () => {
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue({
      id: "existing-1",
      fullName: "Old Ravi",
    });
    vi.mocked(clientsRepository.create).mockResolvedValue(mockClient);

    const result = await clientsService.create(
      { fullName: "Ravi Kumar", phone: "+91 99999 00000", type: "Individual" },
      ctx,
    );

    expect(result).toHaveProperty("warning", "PHONE_ALREADY_EXISTS");
    expect(result).toHaveProperty("existingClientId", "existing-1");
  });
});

describe("clientsService.findById", () => {
  it("returns client when found", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(mockClient);
    const result = await clientsService.findById("client-1", "org-1");
    expect(result).toEqual(mockClient);
  });

  it("throws clientNotFound when null", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(null);
    await expect(clientsService.findById("bad-id", "org-1")).rejects.toThrow(
      Errors.clientNotFound(),
    );
  });
});

describe("clientsService.delete", () => {
  it("throws clientNotFound when client does not exist", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(null);
    await expect(clientsService.delete("bad-id", ctx)).rejects.toThrow(
      Errors.clientNotFound(),
    );
  });

  it("soft-deletes when client exists", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(mockClient);
    vi.mocked(clientsRepository.softDelete).mockResolvedValue({ count: 1 });

    await clientsService.delete("client-1", ctx);

    expect(clientsRepository.softDelete).toHaveBeenCalledWith("client-1", "org-1");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/server && pnpm test
```
Expected: `Error: Cannot find module '../repository'` or similar — confirms tests are wired but implementation is missing.

- [ ] **Step 3: Create clients/schema.ts**

`apps/server/src/modules/clients/schema.ts`:
```typescript
import {
  ClientType,
  PreferredLanguage,
} from "@splexa-group/shared/enums";
import { z } from "zod";

export const createClientSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    phone: z.string().min(7).max(20),
    type: z.enum(ClientType),
    email: z.string().email().optional(),
    address: z.string().max(500).optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
    preferredLanguage: z.enum(PreferredLanguage).optional(),
  })
  .strict();

export const updateClientSchema = z
  .object({
    fullName: z.string().min(1).max(200).optional(),
    phone: z.string().min(7).max(20).optional(),
    type: z.enum(ClientType).optional(),
    email: z.string().email().optional(),
    address: z.string().max(500).optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
    preferredLanguage: z.enum(PreferredLanguage).optional(),
  })
  .strict();

export const clientParamsSchema = z.object({ id: z.string().uuid() });

export const listClientsQuerySchema = z
  .object({
    search: z.string().optional(),
    type: z.enum(ClientType).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientParams = z.infer<typeof clientParamsSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
```

- [ ] **Step 4: Create clients/repository.ts**

`apps/server/src/modules/clients/repository.ts`:
```typescript
import { prisma } from "@/db/client";
import { clientSelect } from "@/db/selects";

import type { CreateClientInput, ListClientsQuery, UpdateClientInput } from "./schema";

export const clientsRepository = {
  async create(
    data: CreateClientInput & { orgId: string; createdBy: string },
  ) {
    return prisma.client.create({
      data: {
        orgId: data.orgId,
        fullName: data.fullName,
        phone: data.phone,
        type: data.type,
        email: data.email,
        address: data.address,
        companyName: data.companyName,
        notes: data.notes,
        preferredLanguage: data.preferredLanguage,
        createdBy: data.createdBy,
      },
      select: clientSelect,
    });
  },

  async findById(id: string, orgId: string) {
    return prisma.client.findFirst({
      where: { id, orgId, deletedAt: null },
      select: clientSelect,
    });
  },

  async findByPhone(phone: string, orgId: string) {
    return prisma.client.findFirst({
      where: { phone, orgId, deletedAt: null },
      select: { id: true, fullName: true },
    });
  },

  async list(orgId: string, query: ListClientsQuery) {
    const { search, type, page, limit } = query;
    const where = {
      orgId,
      deletedAt: null,
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              {
                companyName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: clientSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, orgId: string, data: UpdateClientInput) {
    return prisma.client.update({
      where: { id, orgId },
      data,
      select: clientSelect,
    });
  },

  async softDelete(id: string, orgId: string) {
    return prisma.client.updateMany({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};
```

- [ ] **Step 5: Create clients/service.ts**

`apps/server/src/modules/clients/service.ts`:
```typescript
import { ActivityAction } from "@/constants/activity-actions";
import { Errors } from "@/utils/errors";
import { logActivity } from "@/utils/log-activity";

import type {
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from "./schema";
import { clientsRepository } from "./repository";

type Ctx = { orgId: string; userId: string; ipAddress: string };

export const clientsService = {
  async create(input: CreateClientInput, ctx: Ctx) {
    const existing = await clientsRepository.findByPhone(input.phone, ctx.orgId);

    const client = await clientsRepository.create({
      ...input,
      orgId: ctx.orgId,
      createdBy: ctx.userId,
    });

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.CLIENT_CREATED,
      resourceType: "client",
      resourceId: client.id,
      ipAddress: ctx.ipAddress,
    });

    if (existing) {
      return {
        ...client,
        warning: "PHONE_ALREADY_EXISTS" as const,
        existingClientId: existing.id,
        existingClientName: existing.fullName,
      };
    }

    return client;
  },

  async list(orgId: string, query: ListClientsQuery) {
    return clientsRepository.list(orgId, query);
  },

  async findById(id: string, orgId: string) {
    const client = await clientsRepository.findById(id, orgId);
    if (!client) throw Errors.clientNotFound();
    return client;
  },

  async update(id: string, input: UpdateClientInput, ctx: Ctx) {
    const existing = await clientsRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.clientNotFound();

    const updated = await clientsRepository.update(id, ctx.orgId, input);

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.CLIENT_UPDATED,
      resourceType: "client",
      resourceId: id,
      ipAddress: ctx.ipAddress,
    });

    return updated;
  },

  async delete(id: string, ctx: Ctx) {
    const existing = await clientsRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.clientNotFound();

    await clientsRepository.softDelete(id, ctx.orgId);

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.CLIENT_DELETED,
      resourceType: "client",
      resourceId: id,
      ipAddress: ctx.ipAddress,
    });
  },
};
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
pnpm test
```
Expected: all tests in `clients/__tests__/service.test.ts` pass.

- [ ] **Step 7: Create clients/controller.ts**

`apps/server/src/modules/clients/controller.ts`:
```typescript
import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  ClientParams,
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from "./schema";
import { clientsService } from "./service";

export const clientsController = {
  async create(req: FastifyRequest<{ Body: CreateClientInput }>) {
    return clientsService.create(req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async list(req: FastifyRequest<{ Querystring: ListClientsQuery }>) {
    const { data, total } = await clientsService.list(
      req.user.orgId,
      req.query,
    );
    return { data, total, page: req.query.page, limit: req.query.limit };
  },

  async getById(req: FastifyRequest<{ Params: ClientParams }>) {
    return clientsService.findById(req.params.id, req.user.orgId);
  },

  async update(
    req: FastifyRequest<{ Params: ClientParams; Body: UpdateClientInput }>,
  ) {
    return clientsService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async delete(
    req: FastifyRequest<{ Params: ClientParams }>,
    reply: FastifyReply,
  ) {
    await clientsService.delete(req.params.id, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(204);
  },
};
```

- [ ] **Step 8: Create clients/routes.ts**

`apps/server/src/modules/clients/routes.ts`:
```typescript
import type { FastifyInstance } from "fastify";

import { clientsController } from "./controller";
import {
  clientParamsSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema,
} from "./schema";

export function clientsRoutes(router: FastifyInstance): void {
  router.post("/", {
    schema: { body: createClientSchema },
    preHandler: [router.authenticate],
    handler: clientsController.create,
  });

  router.get("/", {
    schema: { querystring: listClientsQuerySchema },
    preHandler: [router.authenticate],
    handler: clientsController.list,
  });

  router.get("/:id", {
    schema: { params: clientParamsSchema },
    preHandler: [router.authenticate],
    handler: clientsController.getById,
  });

  router.patch("/:id", {
    schema: { params: clientParamsSchema, body: updateClientSchema },
    preHandler: [router.authenticate],
    handler: clientsController.update,
  });

  router.delete("/:id", {
    schema: { params: clientParamsSchema },
    preHandler: [router.authenticate],
    handler: clientsController.delete,
  });
}
```

- [ ] **Step 9: Create clients/plugin.ts**

`apps/server/src/modules/clients/plugin.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { clientsRoutes } from "./routes";

export const clientsModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(clientsRoutes, { prefix: "/api/v1/clients" });
  },
  { name: "clients-module" },
);
```

- [ ] **Step 10: Typecheck**

```bash
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 11: Commit**

```bash
git add apps/server/src/modules/clients/
git commit -m "feat(clients): add clients module — CRUD + search with phone-duplicate warning"
```

---

## Task 9: Cases module — schema and repository

**Files:** `src/modules/cases/schema.ts`, `src/modules/cases/repository.ts`

- [ ] **Step 1: Create cases/schema.ts**

`apps/server/src/modules/cases/schema.ts`:
```typescript
import {
  CaseStage,
  CaseStatus,
  CaseType,
  ClientType,
  CourtType,
  ImportantDateType,
  PartyRole,
  Priority,
} from "@splexa-group/shared/enums";
import { z } from "zod";

const oppositePartySchema = z
  .object({
    name: z.string().min(1).max(200),
    role: z.enum(PartyRole),
    advocateName: z.string().max(200).optional(),
    advocatePhone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
  })
  .strict();

const newClientSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    phone: z.string().min(7).max(20),
    type: z.enum(ClientType),
  })
  .strict();

export const createCaseSchema = z
  .object({
    title: z.string().min(1).max(300),
    clientRole: z.enum(PartyRole),
    clientId: z.string().uuid().optional(),
    newClient: newClientSchema.optional(),
    caseNumber: z.string().max(100).optional(),
    caseType: z.enum(CaseType).optional(),
    filingDate: z.string().datetime({ offset: true }).optional(),
    courtName: z.string().max(200).optional(),
    courtType: z.enum(CourtType).optional(),
    courtState: z.string().max(100).optional(),
    courtCity: z.string().max(100).optional(),
    benchNumber: z.string().max(50).optional(),
    judgeName: z.string().max(200).optional(),
    judgeDesignation: z.string().max(200).optional(),
    status: z.enum(CaseStatus).default("Active"),
    stage: z.enum(CaseStage).optional(),
    priority: z.enum(Priority).optional(),
    oppositeParties: z.array(oppositePartySchema).optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().max(50)).optional(),
    assignedTo: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasClientId = !!data.clientId;
    const hasNewClient = !!data.newClient;
    if (hasClientId && hasNewClient) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either clientId or newClient, not both",
        path: ["clientId"],
      });
    }
    if (!hasClientId && !hasNewClient) {
      ctx.addIssue({
        code: "custom",
        message: "Either clientId or newClient is required",
        path: ["clientId"],
      });
    }
  });

export const updateCaseSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    clientRole: z.enum(PartyRole).optional(),
    caseNumber: z.string().max(100).optional(),
    caseType: z.enum(CaseType).optional(),
    filingDate: z.string().datetime({ offset: true }).optional(),
    courtName: z.string().max(200).optional(),
    courtType: z.enum(CourtType).optional(),
    courtState: z.string().max(100).optional(),
    courtCity: z.string().max(100).optional(),
    benchNumber: z.string().max(50).optional(),
    judgeName: z.string().max(200).optional(),
    judgeDesignation: z.string().max(200).optional(),
    status: z.enum(CaseStatus).optional(),
    stage: z.enum(CaseStage).optional(),
    priority: z.enum(Priority).optional(),
    oppositeParties: z.array(oppositePartySchema).optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().max(50)).optional(),
    assignedTo: z.string().uuid().optional(),
  })
  .strict();

export const listCasesQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.enum(CaseStatus).optional(),
    caseType: z.enum(CaseType).optional(),
    priority: z.enum(Priority).optional(),
    courtType: z.enum(CourtType).optional(),
    clientId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export const caseParamsSchema = z.object({ id: z.string().uuid() });

export const createImportantDateSchema = z
  .object({
    dateType: z.enum(ImportantDateType),
    date: z.string().datetime({ offset: true }),
    description: z.string().max(500).optional(),
  })
  .strict();

export const updateImportantDateSchema = z
  .object({
    dateType: z.enum(ImportantDateType).optional(),
    date: z.string().datetime({ offset: true }).optional(),
    description: z.string().max(500).optional(),
  })
  .strict();

export const importantDateParamsSchema = z.object({
  id: z.string().uuid(),
  dateId: z.string().uuid(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type ListCasesQuery = z.infer<typeof listCasesQuerySchema>;
export type CaseParams = z.infer<typeof caseParamsSchema>;
export type CreateImportantDateInput = z.infer<typeof createImportantDateSchema>;
export type UpdateImportantDateInput = z.infer<typeof updateImportantDateSchema>;
export type ImportantDateParams = z.infer<typeof importantDateParamsSchema>;
```

- [ ] **Step 2: Create cases/repository.ts**

`apps/server/src/modules/cases/repository.ts`:
```typescript
import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { caseSummarySelect, clientSelect, hearingSummarySelect } from "@/db/selects";

import type {
  CreateImportantDateInput,
  ListCasesQuery,
  UpdateImportantDateInput,
} from "./schema";

const caseDetailSelect = {
  id: true,
  orgId: true,
  title: true,
  clientId: true,
  clientRole: true,
  caseNumber: true,
  caseType: true,
  filingDate: true,
  courtName: true,
  courtType: true,
  courtState: true,
  courtCity: true,
  benchNumber: true,
  judgeName: true,
  judgeDesignation: true,
  judgeUpdatedAt: true,
  status: true,
  stage: true,
  priority: true,
  oppositeParties: true,
  notes: true,
  tags: true,
  nextHearingDate: true,
  assignedTo: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  client: { select: clientSelect },
  hearings: {
    where: { deletedAt: null },
    orderBy: { date: "desc" as const },
    take: 5,
    select: hearingSummarySelect,
  },
  importantDates: {
    where: { deletedAt: null },
    orderBy: { date: "asc" as const },
    select: {
      id: true,
      dateType: true,
      date: true,
      description: true,
      createdAt: true,
    },
  },
} satisfies Prisma.CaseSelect;

type CreateCaseData = {
  orgId: string;
  createdBy: string;
  title: string;
  clientId: string;
  clientRole: string;
  caseNumber?: string;
  caseType?: string;
  filingDate?: Date;
  courtName?: string;
  courtType?: string;
  courtState?: string;
  courtCity?: string;
  benchNumber?: string;
  judgeName?: string;
  judgeDesignation?: string;
  status?: string;
  stage?: string;
  priority?: string;
  oppositeParties?: Prisma.InputJsonValue;
  notes?: string;
  tags?: string[];
  assignedTo?: string;
};

export const casesRepository = {
  async create(data: CreateCaseData) {
    return prisma.case.create({ data, select: caseDetailSelect });
  },

  async createInTx(tx: Prisma.TransactionClient, data: CreateCaseData) {
    return tx.case.create({ data, select: caseDetailSelect });
  },

  async findById(id: string, orgId: string) {
    return prisma.case.findFirst({
      where: { id, orgId, deletedAt: null },
      select: caseDetailSelect,
    });
  },

  async list(orgId: string, query: ListCasesQuery) {
    const { search, status, caseType, priority, courtType, clientId, page, limit } =
      query;
    const where: Prisma.CaseWhereInput = {
      orgId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(caseType ? { caseType } : {}),
      ...(priority ? { priority } : {}),
      ...(courtType ? { courtType } : {}),
      ...(clientId ? { clientId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { caseNumber: { contains: search, mode: "insensitive" } },
              { courtName: { contains: search, mode: "insensitive" } },
              { client: { fullName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.case.findMany({
        where,
        select: caseSummarySelect,
        orderBy: [{ nextHearingDate: "asc" }, { updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, data: Prisma.CaseUpdateInput) {
    return prisma.case.update({ where: { id }, data, select: caseDetailSelect });
  },

  async softDeleteCascade(id: string, orgId: string) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.case.updateMany({
        where: { id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.hearing.updateMany({
        where: { caseId: id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.caseImportantDate.updateMany({
        where: { caseId: id, orgId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.scheduledEvent.updateMany({
        where: { caseId: id, deletedAt: null },
        data: { deletedAt: now },
      });
    });
  },

  async updateNextHearingDate(
    caseId: string,
    orgId: string,
    tx: Prisma.TransactionClient,
  ) {
    const nextHearing = await tx.hearing.findFirst({
      where: {
        caseId,
        orgId,
        status: "Scheduled",
        date: { gte: new Date() },
        deletedAt: null,
      },
      orderBy: { date: "asc" },
      select: { date: true },
    });

    await tx.case.updateMany({
      where: { id: caseId, orgId },
      data: { nextHearingDate: nextHearing?.date ?? null },
    });
  },

  // Important dates
  async createImportantDate(
    data: CreateImportantDateInput & { caseId: string; orgId: string },
    notifyUserId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const importantDate = await tx.caseImportantDate.create({
        data: {
          caseId: data.caseId,
          orgId: data.orgId,
          dateType: data.dateType,
          date: new Date(data.date),
          description: data.description,
        },
      });

      await tx.scheduledEvent.create({
        data: {
          orgId: data.orgId,
          type: "ImportantDate",
          date: new Date(data.date),
          sourceId: importantDate.id,
          sourceType: "important-date",
          caseId: data.caseId,
          notifyUserId,
        },
      });

      return importantDate;
    });
  },

  async findImportantDateById(id: string, caseId: string, orgId: string) {
    return prisma.caseImportantDate.findFirst({
      where: { id, caseId, orgId, deletedAt: null },
    });
  },

  async updateImportantDate(
    id: string,
    caseId: string,
    orgId: string,
    data: UpdateImportantDateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.caseImportantDate.update({
        where: { id },
        data: {
          ...(data.dateType ? { dateType: data.dateType } : {}),
          ...(data.date ? { date: new Date(data.date) } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
        },
      });

      if (data.date) {
        await tx.scheduledEvent.updateMany({
          where: { sourceId: id, deletedAt: null },
          data: { date: new Date(data.date) },
        });
      }

      return updated;
    });
  },

  async softDeleteImportantDate(id: string, orgId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.caseImportantDate.updateMany({
        where: { id, orgId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await tx.scheduledEvent.updateMany({
        where: { sourceId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
  },
};
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/modules/cases/schema.ts apps/server/src/modules/cases/repository.ts
git commit -m "feat(cases): add cases schema and repository"
```

---

## Task 10: Cases module — service, controller, routes, plugin + tests

- [ ] **Step 1: Write failing tests for cases service**

Create `apps/server/src/modules/cases/__tests__/service.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

import { Errors } from "@/utils/errors";

import { clientsRepository } from "@/modules/clients/repository";
import { casesRepository } from "../repository";
import { casesService } from "../service";

vi.mock("../repository", () => ({
  casesRepository: {
    create: vi.fn(),
    createInTx: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    softDeleteCascade: vi.fn(),
    createImportantDate: vi.fn(),
    findImportantDateById: vi.fn(),
    updateImportantDate: vi.fn(),
    softDeleteImportantDate: vi.fn(),
  },
}));

vi.mock("@/modules/clients/repository", () => ({
  clientsRepository: { findById: vi.fn() },
}));

vi.mock("@/utils/log-activity", () => ({ logActivity: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { $transaction: vi.fn() } }));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };
const mockCase = { id: "case-1", orgId: "org-1", title: "Test Case", status: "Active", clientId: "client-1" };
const mockClient = { id: "client-1", orgId: "org-1", fullName: "Ravi Kumar" };

beforeEach(() => vi.clearAllMocks());

describe("casesService.create with clientId", () => {
  it("throws clientNotFound when clientId does not belong to org", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(null);

    await expect(
      casesService.create(
        { title: "Test", clientRole: "Petitioner", clientId: "bad-id", status: "Active" },
        ctx,
      ),
    ).rejects.toThrow(Errors.clientNotFound());
  });

  it("creates case when clientId is valid", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(mockClient as never);
    vi.mocked(casesRepository.create).mockResolvedValue(mockCase as never);

    const result = await casesService.create(
      { title: "Test", clientRole: "Petitioner", clientId: "client-1", status: "Active" },
      ctx,
    );

    expect(result).toEqual(mockCase);
    expect(casesRepository.create).toHaveBeenCalled();
  });
});

describe("casesService.findById", () => {
  it("throws caseNotFound when null", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(null);
    await expect(casesService.findById("bad-id", "org-1")).rejects.toThrow(
      Errors.caseNotFound(),
    );
  });
});

describe("casesService.delete", () => {
  it("throws caseNotFound when case does not exist", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(null);
    await expect(casesService.delete("bad-id", ctx)).rejects.toThrow(
      Errors.caseNotFound(),
    );
  });

  it("cascade-deletes when case exists", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(mockCase as never);
    vi.mocked(casesRepository.softDeleteCascade).mockResolvedValue(undefined as never);

    await casesService.delete("case-1", ctx);
    expect(casesRepository.softDeleteCascade).toHaveBeenCalledWith("case-1", "org-1");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm test
```
Expected: errors because `casesService` doesn't exist yet.

- [ ] **Step 3: Create cases/service.ts**

`apps/server/src/modules/cases/service.ts`:
```typescript
import { prisma } from "@/db/client";
import { ActivityAction } from "@/constants/activity-actions";
import { Errors } from "@/utils/errors";
import { logActivity } from "@/utils/log-activity";
import { clientsRepository } from "@/modules/clients/repository";

import type {
  CreateCaseInput,
  CreateImportantDateInput,
  ListCasesQuery,
  UpdateCaseInput,
  UpdateImportantDateInput,
} from "./schema";
import { casesRepository } from "./repository";

type Ctx = { orgId: string; userId: string; ipAddress: string };

export const casesService = {
  async create(input: CreateCaseInput, ctx: Ctx) {
    const { newClient, clientId, ...caseFields } = input;

    if (clientId) {
      const client = await clientsRepository.findById(clientId, ctx.orgId);
      if (!client) throw Errors.clientNotFound();

      const createdCase = await casesRepository.create({
        orgId: ctx.orgId,
        createdBy: ctx.userId,
        clientId,
        title: caseFields.title,
        clientRole: caseFields.clientRole,
        caseNumber: caseFields.caseNumber,
        caseType: caseFields.caseType,
        filingDate: caseFields.filingDate ? new Date(caseFields.filingDate) : undefined,
        courtName: caseFields.courtName,
        courtType: caseFields.courtType,
        courtState: caseFields.courtState,
        courtCity: caseFields.courtCity,
        benchNumber: caseFields.benchNumber,
        judgeName: caseFields.judgeName,
        judgeDesignation: caseFields.judgeDesignation,
        status: caseFields.status,
        stage: caseFields.stage,
        priority: caseFields.priority,
        oppositeParties: caseFields.oppositeParties as never,
        notes: caseFields.notes,
        tags: caseFields.tags,
        assignedTo: caseFields.assignedTo,
      });

      await logActivity({
        orgId: ctx.orgId,
        userId: ctx.userId,
        action: ActivityAction.CASE_CREATED,
        resourceType: "case",
        resourceId: createdCase.id,
        ipAddress: ctx.ipAddress,
      });

      return createdCase;
    }

    // newClient path — create client and case atomically
    const result = await prisma.$transaction(async (tx) => {
      const createdClient = await tx.client.create({
        data: {
          orgId: ctx.orgId,
          fullName: newClient!.fullName,
          phone: newClient!.phone,
          type: newClient!.type,
          createdBy: ctx.userId,
        },
        select: { id: true },
      });

      return casesRepository.createInTx(tx, {
        orgId: ctx.orgId,
        createdBy: ctx.userId,
        clientId: createdClient.id,
        title: caseFields.title,
        clientRole: caseFields.clientRole,
        caseNumber: caseFields.caseNumber,
        caseType: caseFields.caseType,
        filingDate: caseFields.filingDate ? new Date(caseFields.filingDate) : undefined,
        courtName: caseFields.courtName,
        courtType: caseFields.courtType,
        courtState: caseFields.courtState,
        courtCity: caseFields.courtCity,
        benchNumber: caseFields.benchNumber,
        judgeName: caseFields.judgeName,
        judgeDesignation: caseFields.judgeDesignation,
        status: caseFields.status,
        stage: caseFields.stage,
        priority: caseFields.priority,
        oppositeParties: caseFields.oppositeParties as never,
        notes: caseFields.notes,
        tags: caseFields.tags,
        assignedTo: caseFields.assignedTo,
      });
    });

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.CLIENT_CREATED,
      resourceType: "client",
      resourceId: result.client.id,
      ipAddress: ctx.ipAddress,
    });

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.CASE_CREATED,
      resourceType: "case",
      resourceId: result.id,
      ipAddress: ctx.ipAddress,
    });

    return result;
  },

  async list(orgId: string, query: ListCasesQuery) {
    return casesRepository.list(orgId, query);
  },

  async findById(id: string, orgId: string) {
    const c = await casesRepository.findById(id, orgId);
    if (!c) throw Errors.caseNotFound();
    return c;
  },

  async update(id: string, input: UpdateCaseInput, ctx: Ctx) {
    const existing = await casesRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();

    const judgeChanged =
      (input.judgeName !== undefined && input.judgeName !== existing.judgeName) ||
      (input.judgeDesignation !== undefined &&
        input.judgeDesignation !== existing.judgeDesignation);

    const updateData: Record<string, unknown> = { ...input };
    if (input.filingDate) updateData.filingDate = new Date(input.filingDate);
    if (judgeChanged) updateData.judgeUpdatedAt = new Date();

    const updated = await casesRepository.update(id, updateData as never);

    const action =
      input.status && input.status !== existing.status
        ? ActivityAction.CASE_STATUS_CHANGED
        : input.assignedTo !== undefined && input.assignedTo !== existing.assignedTo
          ? ActivityAction.CASE_ASSIGNED
          : ActivityAction.CASE_UPDATED;

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action,
      resourceType: "case",
      resourceId: id,
      ipAddress: ctx.ipAddress,
    });

    return updated;
  },

  async delete(id: string, ctx: Ctx) {
    const existing = await casesRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();

    await casesRepository.softDeleteCascade(id, ctx.orgId);

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.CASE_DELETED,
      resourceType: "case",
      resourceId: id,
      ipAddress: ctx.ipAddress,
    });
  },

  // Important dates
  async createImportantDate(
    caseId: string,
    input: CreateImportantDateInput,
    ctx: Ctx,
  ) {
    const existing = await casesRepository.findById(caseId, ctx.orgId);
    if (!existing) throw Errors.caseNotFound();

    const notifyUserId = existing.assignedTo ?? existing.createdBy;

    return casesRepository.createImportantDate(
      { ...input, caseId, orgId: ctx.orgId },
      notifyUserId,
    );
  },

  async updateImportantDate(
    caseId: string,
    dateId: string,
    input: UpdateImportantDateInput,
    ctx: Ctx,
  ) {
    const date = await casesRepository.findImportantDateById(
      dateId,
      caseId,
      ctx.orgId,
    );
    if (!date) throw Errors.importantDateNotFound();

    return casesRepository.updateImportantDate(dateId, caseId, ctx.orgId, input);
  },

  async deleteImportantDate(caseId: string, dateId: string, ctx: Ctx) {
    const date = await casesRepository.findImportantDateById(
      dateId,
      caseId,
      ctx.orgId,
    );
    if (!date) throw Errors.importantDateNotFound();

    await casesRepository.softDeleteImportantDate(dateId, ctx.orgId);
  },
};
```

Note: the `newClient` transaction returns the case directly from `createInTx`. Remove the `result.client.id` reference — the client ID isn't returned. Update the logActivity calls for the newClient path to use `result.clientId` instead:
```typescript
    await logActivity({
      ...
      action: ActivityAction.CLIENT_CREATED,
      resourceType: "client",
      resourceId: result.clientId,  // clientId is on the case record
      ...
    });
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test
```
Expected: all cases service tests pass.

- [ ] **Step 5: Create cases/controller.ts**

`apps/server/src/modules/cases/controller.ts`:
```typescript
import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CaseParams,
  CreateCaseInput,
  CreateImportantDateInput,
  ImportantDateParams,
  ListCasesQuery,
  UpdateCaseInput,
  UpdateImportantDateInput,
} from "./schema";
import { casesService } from "./service";

export const casesController = {
  async create(req: FastifyRequest<{ Body: CreateCaseInput }>) {
    return casesService.create(req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async list(req: FastifyRequest<{ Querystring: ListCasesQuery }>) {
    const { data, total } = await casesService.list(req.user.orgId, req.query);
    return { data, total, page: req.query.page, limit: req.query.limit };
  },

  async getById(req: FastifyRequest<{ Params: CaseParams }>) {
    return casesService.findById(req.params.id, req.user.orgId);
  },

  async update(
    req: FastifyRequest<{ Params: CaseParams; Body: UpdateCaseInput }>,
  ) {
    return casesService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async delete(
    req: FastifyRequest<{ Params: CaseParams }>,
    reply: FastifyReply,
  ) {
    await casesService.delete(req.params.id, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(204);
  },

  async createImportantDate(
    req: FastifyRequest<{ Params: CaseParams; Body: CreateImportantDateInput }>,
  ) {
    return casesService.createImportantDate(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async updateImportantDate(
    req: FastifyRequest<{
      Params: ImportantDateParams;
      Body: UpdateImportantDateInput;
    }>,
  ) {
    return casesService.updateImportantDate(
      req.params.id,
      req.params.dateId,
      req.body,
      {
        orgId: req.user.orgId,
        userId: req.user.userId,
        ipAddress: req.ip,
      },
    );
  },

  async deleteImportantDate(
    req: FastifyRequest<{ Params: ImportantDateParams }>,
    reply: FastifyReply,
  ) {
    await casesService.deleteImportantDate(
      req.params.id,
      req.params.dateId,
      {
        orgId: req.user.orgId,
        userId: req.user.userId,
        ipAddress: req.ip,
      },
    );
    reply.code(204);
  },
};
```

- [ ] **Step 6: Create cases/routes.ts**

`apps/server/src/modules/cases/routes.ts`:
```typescript
import type { FastifyInstance } from "fastify";

import { casesController } from "./controller";
import {
  caseParamsSchema,
  createCaseSchema,
  createImportantDateSchema,
  importantDateParamsSchema,
  listCasesQuerySchema,
  updateCaseSchema,
  updateImportantDateSchema,
} from "./schema";

export function casesRoutes(router: FastifyInstance): void {
  router.post("/", {
    schema: { body: createCaseSchema },
    preHandler: [router.authenticate],
    handler: casesController.create,
  });

  router.get("/", {
    schema: { querystring: listCasesQuerySchema },
    preHandler: [router.authenticate],
    handler: casesController.list,
  });

  router.get("/:id", {
    schema: { params: caseParamsSchema },
    preHandler: [router.authenticate],
    handler: casesController.getById,
  });

  router.patch("/:id", {
    schema: { params: caseParamsSchema, body: updateCaseSchema },
    preHandler: [router.authenticate],
    handler: casesController.update,
  });

  router.delete("/:id", {
    schema: { params: caseParamsSchema },
    preHandler: [router.authenticate],
    handler: casesController.delete,
  });

  router.post("/:id/important-dates", {
    schema: { params: caseParamsSchema, body: createImportantDateSchema },
    preHandler: [router.authenticate],
    handler: casesController.createImportantDate,
  });

  router.patch("/:id/important-dates/:dateId", {
    schema: {
      params: importantDateParamsSchema,
      body: updateImportantDateSchema,
    },
    preHandler: [router.authenticate],
    handler: casesController.updateImportantDate,
  });

  router.delete("/:id/important-dates/:dateId", {
    schema: { params: importantDateParamsSchema },
    preHandler: [router.authenticate],
    handler: casesController.deleteImportantDate,
  });
}
```

- [ ] **Step 7: Create cases/plugin.ts**

`apps/server/src/modules/cases/plugin.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { casesRoutes } from "./routes";

export const casesModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(casesRoutes, { prefix: "/api/v1/cases" });
  },
  { name: "cases-module" },
);
```

- [ ] **Step 8: Typecheck**

```bash
pnpm typecheck
```
Expected: zero errors. If there are type errors in `service.ts` around `result.client.id`, fix per the note in Step 3.

- [ ] **Step 9: Commit**

```bash
git add apps/server/src/modules/cases/
git commit -m "feat(cases): add cases module — CRUD, important dates, and scheduled-events fan-out"
```

---

## Task 11: Hearings module — schema and repository

- [ ] **Step 1: Create hearings/schema.ts**

`apps/server/src/modules/hearings/schema.ts`:
```typescript
import { HearingPurpose, HearingStatus } from "@splexa-group/shared/enums";
import { z } from "zod";

export const createHearingSchema = z
  .object({
    date: z.string().datetime({ offset: true }),
    purpose: z.enum(HearingPurpose).optional(),
    notes: z.string().max(2000).optional(),
    judgePresent: z.string().max(200).optional(),
  })
  .strict();

export const updateHearingSchema = z
  .object({
    status: z.enum(HearingStatus).optional(),
    notes: z.string().max(2000).optional(),
    nextDate: z.string().datetime({ offset: true }).optional(),
    adjournmentReason: z.string().max(500).optional(),
    judgePresent: z.string().max(200).optional(),
    purpose: z.enum(HearingPurpose).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === "Adjourned" && !data.nextDate) {
      ctx.addIssue({
        code: "custom",
        message: "nextDate is required when status is Adjourned",
        path: ["nextDate"],
      });
    }
  });

export const caseHearingParamsSchema = z.object({
  caseId: z.string().uuid(),
});

export const hearingParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listHearingsQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    status: z.enum(HearingStatus).optional(),
    caseId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type CreateHearingInput = z.infer<typeof createHearingSchema>;
export type UpdateHearingInput = z.infer<typeof updateHearingSchema>;
export type CaseHearingParams = z.infer<typeof caseHearingParamsSchema>;
export type HearingParams = z.infer<typeof hearingParamsSchema>;
export type ListHearingsQuery = z.infer<typeof listHearingsQuerySchema>;
```

- [ ] **Step 2: Create hearings/repository.ts**

`apps/server/src/modules/hearings/repository.ts`:
```typescript
import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { hearingSummarySelect } from "@/db/selects";
import { casesRepository } from "@/modules/cases/repository";

import type { CreateHearingInput, ListHearingsQuery } from "./schema";

const hearingDetailSelect = {
  ...hearingSummarySelect,
  case: {
    select: {
      id: true,
      title: true,
      client: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.HearingSelect;

export const hearingsRepository = {
  async create(
    data: CreateHearingInput & {
      caseId: string;
      orgId: string;
      addedBy: string;
      notifyUserId: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const hearing = await tx.hearing.create({
        data: {
          caseId: data.caseId,
          orgId: data.orgId,
          date: new Date(data.date),
          purpose: data.purpose,
          notes: data.notes,
          judgePresent: data.judgePresent,
          addedBy: data.addedBy,
          status: "Scheduled",
        },
        select: hearingSummarySelect,
      });

      await casesRepository.updateNextHearingDate(data.caseId, data.orgId, tx);

      await tx.scheduledEvent.create({
        data: {
          orgId: data.orgId,
          type: "HearingDate",
          date: new Date(data.date),
          sourceId: hearing.id,
          sourceType: "hearing",
          caseId: data.caseId,
          notifyUserId: data.notifyUserId,
        },
      });

      return hearing;
    });
  },

  async findById(id: string, orgId: string) {
    return prisma.hearing.findFirst({
      where: { id, orgId, deletedAt: null },
      select: hearingDetailSelect,
    });
  },

  async findByCaseId(caseId: string, orgId: string) {
    return prisma.hearing.findMany({
      where: { caseId, orgId, deletedAt: null },
      select: hearingSummarySelect,
      orderBy: { date: "desc" },
    });
  },

  async listCrossCase(orgId: string, query: ListHearingsQuery) {
    const { from, to, status, caseId, page, limit } = query;
    const where: Prisma.HearingWhereInput = {
      orgId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(caseId ? { caseId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.hearing.findMany({
        where,
        select: hearingDetailSelect,
        orderBy: { date: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hearing.count({ where }),
    ]);

    return { data, total };
  },

  async update(
    id: string,
    caseId: string,
    orgId: string,
    data: {
      status?: string;
      notes?: string;
      nextDate?: string;
      adjournmentReason?: string;
      judgePresent?: string;
      purpose?: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.hearing.update({
        where: { id },
        data: {
          ...(data.status ? { status: data.status as never } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.nextDate ? { nextDate: new Date(data.nextDate) } : {}),
          ...(data.adjournmentReason !== undefined
            ? { adjournmentReason: data.adjournmentReason }
            : {}),
          ...(data.judgePresent !== undefined
            ? { judgePresent: data.judgePresent }
            : {}),
          ...(data.purpose ? { purpose: data.purpose as never } : {}),
        },
        select: hearingSummarySelect,
      });

      await casesRepository.updateNextHearingDate(caseId, orgId, tx);

      if (data.nextDate) {
        const existingEvent = await tx.scheduledEvent.findFirst({
          where: { sourceId: id, deletedAt: null },
        });

        if (existingEvent) {
          await tx.scheduledEvent.updateMany({
            where: { sourceId: id, deletedAt: null },
            data: { date: new Date(data.nextDate) },
          });
        } else {
          const hearing = await tx.hearing.findFirst({
            where: { id },
            select: { caseId: true, orgId: true },
          });
          if (hearing) {
            const parentCase = await tx.case.findFirst({
              where: { id: hearing.caseId },
              select: { assignedTo: true, createdBy: true },
            });
            await tx.scheduledEvent.create({
              data: {
                orgId,
                type: "HearingDate",
                date: new Date(data.nextDate),
                sourceId: id,
                sourceType: "hearing",
                caseId,
                notifyUserId: parentCase?.assignedTo ?? parentCase?.createdBy ?? "",
              },
            });
          }
        }
      }

      return updated;
    });
  },

  async softDelete(id: string, caseId: string, orgId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.hearing.updateMany({
        where: { id, orgId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      await casesRepository.updateNextHearingDate(caseId, orgId, tx);

      await tx.scheduledEvent.updateMany({
        where: { sourceId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
  },
};
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/modules/hearings/schema.ts apps/server/src/modules/hearings/repository.ts
git commit -m "feat(hearings): add hearings schema and repository with transaction logic"
```

---

## Task 12: Hearings module — service, controller, routes, plugin + tests

- [ ] **Step 1: Write failing tests for hearings service**

Create `apps/server/src/modules/hearings/__tests__/service.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

import { Errors } from "@/utils/errors";
import { casesRepository } from "@/modules/cases/repository";

import { hearingsRepository } from "../repository";
import { hearingsService } from "../service";

vi.mock("../repository", () => ({
  hearingsRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByCaseId: vi.fn(),
    listCrossCase: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock("@/modules/cases/repository", () => ({
  casesRepository: { findById: vi.fn() },
}));

vi.mock("@/utils/log-activity", () => ({ logActivity: vi.fn() }));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };
const mockCase = {
  id: "case-1",
  orgId: "org-1",
  assignedTo: null,
  createdBy: "user-1",
};
const mockHearing = { id: "hearing-1", caseId: "case-1", orgId: "org-1", status: "Scheduled" };

beforeEach(() => vi.clearAllMocks());

describe("hearingsService.create", () => {
  it("throws caseNotFound when case does not belong to org", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(null);

    await expect(
      hearingsService.create(
        "case-1",
        { date: new Date().toISOString() },
        ctx,
      ),
    ).rejects.toThrow(Errors.caseNotFound());
  });

  it("creates hearing when case exists", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(mockCase as never);
    vi.mocked(hearingsRepository.create).mockResolvedValue(mockHearing as never);

    const result = await hearingsService.create(
      "case-1",
      { date: new Date().toISOString() },
      ctx,
    );

    expect(result).toEqual(mockHearing);
    expect(hearingsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ caseId: "case-1", orgId: "org-1" }),
    );
  });
});

describe("hearingsService.update", () => {
  it("throws hearingNotFound when hearing does not exist", async () => {
    vi.mocked(hearingsRepository.findById).mockResolvedValue(null);

    await expect(
      hearingsService.update("bad-id", { status: "Completed" }, ctx),
    ).rejects.toThrow(Errors.hearingNotFound());
  });
});

describe("hearingsService.delete", () => {
  it("throws hearingNotFound when hearing does not exist", async () => {
    vi.mocked(hearingsRepository.findById).mockResolvedValue(null);

    await expect(hearingsService.delete("bad-id", ctx)).rejects.toThrow(
      Errors.hearingNotFound(),
    );
  });

  it("soft-deletes when hearing exists", async () => {
    vi.mocked(hearingsRepository.findById).mockResolvedValue(mockHearing as never);
    vi.mocked(hearingsRepository.softDelete).mockResolvedValue(undefined as never);

    await hearingsService.delete("hearing-1", ctx);

    expect(hearingsRepository.softDelete).toHaveBeenCalledWith(
      "hearing-1",
      "case-1",
      "org-1",
    );
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm test
```
Expected: errors because `hearingsService` doesn't exist yet.

- [ ] **Step 3: Create hearings/service.ts**

`apps/server/src/modules/hearings/service.ts`:
```typescript
import { ActivityAction } from "@/constants/activity-actions";
import { Errors } from "@/utils/errors";
import { logActivity } from "@/utils/log-activity";
import { casesRepository } from "@/modules/cases/repository";

import type {
  CreateHearingInput,
  ListHearingsQuery,
  UpdateHearingInput,
} from "./schema";
import { hearingsRepository } from "./repository";

type Ctx = { orgId: string; userId: string; ipAddress: string };

export const hearingsService = {
  async create(caseId: string, input: CreateHearingInput, ctx: Ctx) {
    const parentCase = await casesRepository.findById(caseId, ctx.orgId);
    if (!parentCase) throw Errors.caseNotFound();

    const notifyUserId = parentCase.assignedTo ?? parentCase.createdBy;

    const hearing = await hearingsRepository.create({
      ...input,
      caseId,
      orgId: ctx.orgId,
      addedBy: ctx.userId,
      notifyUserId,
    });

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.HEARING_ADDED,
      resourceType: "hearing",
      resourceId: hearing.id,
      ipAddress: ctx.ipAddress,
    });

    return hearing;
  },

  async listForCase(caseId: string, orgId: string) {
    const parentCase = await casesRepository.findById(caseId, orgId);
    if (!parentCase) throw Errors.caseNotFound();
    return hearingsRepository.findByCaseId(caseId, orgId);
  },

  async listCrossCase(orgId: string, query: ListHearingsQuery) {
    return hearingsRepository.listCrossCase(orgId, query);
  },

  async update(id: string, input: UpdateHearingInput, ctx: Ctx) {
    const hearing = await hearingsRepository.findById(id, ctx.orgId);
    if (!hearing) throw Errors.hearingNotFound();

    const updated = await hearingsRepository.update(
      id,
      hearing.caseId,
      ctx.orgId,
      input,
    );

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.HEARING_OUTCOME_UPDATED,
      resourceType: "hearing",
      resourceId: id,
      ipAddress: ctx.ipAddress,
    });

    return updated;
  },

  async delete(id: string, ctx: Ctx) {
    const hearing = await hearingsRepository.findById(id, ctx.orgId);
    if (!hearing) throw Errors.hearingNotFound();

    await hearingsRepository.softDelete(id, hearing.caseId, ctx.orgId);

    await logActivity({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: ActivityAction.HEARING_DELETED,
      resourceType: "hearing",
      resourceId: id,
      ipAddress: ctx.ipAddress,
    });
  },
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test
```
Expected: all 3 test files pass.

- [ ] **Step 5: Create hearings/controller.ts**

`apps/server/src/modules/hearings/controller.ts`:
```typescript
import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CaseHearingParams,
  CreateHearingInput,
  HearingParams,
  ListHearingsQuery,
  UpdateHearingInput,
} from "./schema";
import { hearingsService } from "./service";

export const hearingsController = {
  async create(
    req: FastifyRequest<{ Params: CaseHearingParams; Body: CreateHearingInput }>,
  ) {
    return hearingsService.create(req.params.caseId, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async listForCase(req: FastifyRequest<{ Params: CaseHearingParams }>) {
    return hearingsService.listForCase(req.params.caseId, req.user.orgId);
  },

  async listCrossCase(req: FastifyRequest<{ Querystring: ListHearingsQuery }>) {
    const { data, total } = await hearingsService.listCrossCase(
      req.user.orgId,
      req.query,
    );
    return { data, total, page: req.query.page, limit: req.query.limit };
  },

  async update(
    req: FastifyRequest<{ Params: HearingParams; Body: UpdateHearingInput }>,
  ) {
    return hearingsService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async delete(
    req: FastifyRequest<{ Params: HearingParams }>,
    reply: FastifyReply,
  ) {
    await hearingsService.delete(req.params.id, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(204);
  },
};
```

- [ ] **Step 6: Create hearings/routes.ts**

`apps/server/src/modules/hearings/routes.ts`:
```typescript
import type { FastifyInstance } from "fastify";

import { hearingsController } from "./controller";
import {
  caseHearingParamsSchema,
  createHearingSchema,
  hearingParamsSchema,
  listHearingsQuerySchema,
  updateHearingSchema,
} from "./schema";

export function hearingsRoutes(router: FastifyInstance): void {
  // Cross-case list (dashboard / calendar)
  router.get("/", {
    schema: { querystring: listHearingsQuerySchema },
    preHandler: [router.authenticate],
    handler: hearingsController.listCrossCase,
  });

  // Per-case routes
  router.post("/cases/:caseId/hearings", {
    schema: { params: caseHearingParamsSchema, body: createHearingSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.create,
  });

  router.get("/cases/:caseId/hearings", {
    schema: { params: caseHearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.listForCase,
  });

  // Standalone hearing mutations
  router.patch("/:id", {
    schema: { params: hearingParamsSchema, body: updateHearingSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.update,
  });

  router.delete("/:id", {
    schema: { params: hearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.delete,
  });
}
```

- [ ] **Step 7: Create hearings/plugin.ts**

`apps/server/src/modules/hearings/plugin.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { hearingsRoutes } from "./routes";

export const hearingsModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(hearingsRoutes, { prefix: "/api/v1/hearings" });
  },
  { name: "hearings-module" },
);
```

Note: the routes for `/api/v1/cases/:caseId/hearings` are registered under the `/api/v1/hearings` prefix in the plugin. This means the full path becomes `/api/v1/hearings/cases/:caseId/hearings`. To match the spec (`/api/v1/cases/:caseId/hearings`), the case-scoped hearing routes should be registered in `casesRoutes` instead, or the hearings plugin should use a different prefix. Simplest fix: move `POST /cases/:caseId/hearings` and `GET /cases/:caseId/hearings` into `cases/routes.ts` and only register the standalone `PATCH /hearings/:id`, `DELETE /hearings/:id`, and `GET /hearings` in the hearings plugin.

Update `apps/server/src/modules/hearings/routes.ts` to only have standalone routes:
```typescript
export function hearingsRoutes(router: FastifyInstance): void {
  router.get("/", {
    schema: { querystring: listHearingsQuerySchema },
    preHandler: [router.authenticate],
    handler: hearingsController.listCrossCase,
  });

  router.patch("/:id", {
    schema: { params: hearingParamsSchema, body: updateHearingSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.update,
  });

  router.delete("/:id", {
    schema: { params: hearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.delete,
  });
}
```

Then add the case-scoped hearing routes to `apps/server/src/modules/cases/routes.ts`:
```typescript
// Add these imports at the top of cases/routes.ts:
import { caseHearingParamsSchema, createHearingSchema } from "@/modules/hearings/schema";
import { hearingsController } from "@/modules/hearings/controller";

// Add these routes inside casesRoutes():
  router.post("/:caseId/hearings", {
    schema: { params: caseHearingParamsSchema, body: createHearingSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.create,
  });

  router.get("/:caseId/hearings", {
    schema: { params: caseHearingParamsSchema },
    preHandler: [router.authenticate],
    handler: hearingsController.listForCase,
  });
```

- [ ] **Step 8: Typecheck**

```bash
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 9: Commit**

```bash
git add apps/server/src/modules/hearings/
git commit -m "feat(hearings): add hearings module — CRUD with nextHearingDate recalculation and scheduled-events"
```

---

## Task 13: app.ts registration + reminder worker

- [ ] **Step 1: Register all new modules in app.ts**

Update `apps/server/src/app.ts`:
```typescript
import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "@/config/env";
import { fastifyLogger } from "@/config/logger";
import { authModule } from "@/modules/auth/plugin";
import { casesModule } from "@/modules/cases/plugin";
import { clientsModule } from "@/modules/clients/plugin";
import { hearingsModule } from "@/modules/hearings/plugin";
import { authGuardPlugin } from "@/plugins/auth-guard.plugin";
import { errorHandlerPlugin } from "@/plugins/error-handler.plugin";
import { responsePlugin } from "@/plugins/response.plugin";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: fastifyLogger });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorHandlerPlugin);
  await app.register(responsePlugin);
  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(authGuardPlugin);
  await app.register(authModule);
  await app.register(clientsModule);
  await app.register(casesModule);
  await app.register(hearingsModule);

  return app;
}
```

- [ ] **Step 2: Create reminder worker stub**

`apps/server/src/workers/reminder-worker.ts`:
```typescript
import cron from "node-cron";

import { prisma } from "@/db/client";

export function startReminderWorker(): void {
  // Runs every morning at 7:00 AM IST (01:30 UTC)
  cron.schedule("30 1 * * *", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await prisma.scheduledEvent.findMany({
      where: {
        date: { gte: today, lte: tomorrow },
        notifiedAt: null,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        date: true,
        caseId: true,
        notifyUserId: true,
        sourceType: true,
      },
    });

    for (const event of events) {
      try {
        // TODO: look up user phone by event.notifyUserId, then call whatsAppProvider.sendTemplateMessage()

        await prisma.scheduledEvent.update({
          where: { id: event.id },
          data: { notifiedAt: new Date() },
        });
      } catch {
        // Log and continue — one failure should not block other notifications
      }
    }
  });
}
```

- [ ] **Step 3: Wire reminder worker into server startup**

Read `apps/server/src/index.ts` to see where the server starts, then add:
```typescript
import { startReminderWorker } from "@/workers/reminder-worker";

// After app.listen():
startReminderWorker();
```

- [ ] **Step 4: Final typecheck**

```bash
pnpm typecheck
```
Expected: zero errors across the entire server.

- [ ] **Step 5: Run all tests**

```bash
pnpm test
```
Expected: all tests pass (3 test files, ~12 test cases).

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/app.ts apps/server/src/workers/
git commit -m "feat: register clients, cases, hearings modules and add reminder worker stub"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Client CRUD + phone duplicate warning | Task 8 |
| Case CRUD + newClient inline creation | Task 10 |
| Case search across 4 fields | Task 9 (repository.list) |
| Case important dates (CRUD) | Task 9 (repository) + Task 10 (service/routes) |
| Important dates → scheduled_events fan-out | Task 9 (repository.createImportantDate) |
| Hearing CRUD | Task 11–12 |
| nextHearingDate recalculation on every hearing mutation | Task 11 (repository) |
| Hearing → scheduled_events upsert | Task 11 (repository.create/update) |
| Cascade soft-delete (case → hearings, dates, events) | Task 9 (repository.softDeleteCascade) |
| `orgId` always from JWT | All controllers use `req.user.orgId` |
| All mutations log activity | All services call `logActivity()` |
| Adapter pattern for storage/WhatsApp | Task 7 |
| R2 storage adapter | Task 7 |
| Reminder worker | Task 13 |
| Vitest setup | Task 1 |

**Business rule check:**
- `nextDate` required when `status = Adjourned` → enforced by Zod `superRefine` in hearings schema ✓
- `clientId` XOR `newClient` → enforced by Zod `superRefine` in cases schema ✓
- `judgeUpdatedAt` auto-set → handled in cases service.update ✓
- Soft delete uses `updateMany` with both `id` and `orgId` → checked in all repositories ✓
- Repos return null, services throw → verified in all service files ✓

**Gaps identified:** none — all spec requirements are covered.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-23-cases-system.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast parallel iteration

**2. Inline Execution** — execute tasks in this session using executing-plans skill, sequential with checkpoints

Which approach?
