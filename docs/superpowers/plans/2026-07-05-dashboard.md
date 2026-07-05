# Dashboard Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Dashboard — coming soon." placeholder with a read-only overview page showing 4 stat cards, upcoming hearings, upcoming deadlines, and high-priority cases.

**Architecture:** Single `GET /api/v1/dashboard` endpoint runs 7 Prisma queries in parallel and returns all page data in one request. The frontend has a single `useDashboard()` hook; the page passes data down to three presentational components. No new Prisma migrations needed.

**Tech Stack:** Fastify + Prisma (backend), Next.js App Router + React Query + date-fns (frontend), `@splexa-group/shared/enums` for enum values.

## Global Constraints

- `orgId` from `req.user.orgId` (JWT) only — never body, params, or query string
- Every tenant-scoped DB query filters by `orgId` and `deletedAt: null`
- Five backend layers: plugin → route → controller → service → repository
- No `prisma.*` outside `*-repository.ts`
- Repositories return data directly — services throw on error (no errors expected here)
- kebab-case for all file names
- No `any`, no `!`, no `@ts-ignore`
- No `logActivity` calls (read-only module)
- All endpoints require `authenticate` preHandler

---

### Task 1: Backend dashboard module

**Files:**
- Create: `apps/server/src/modules/dashboard/schema.ts`
- Create: `apps/server/src/modules/dashboard/repository.ts`
- Create: `apps/server/src/modules/dashboard/service.ts`
- Create: `apps/server/src/modules/dashboard/__tests__/service.test.ts`
- Create: `apps/server/src/modules/dashboard/controller.ts`
- Create: `apps/server/src/modules/dashboard/routes.ts`
- Create: `apps/server/src/modules/dashboard/plugin.ts`
- Modify: `apps/server/src/app.ts`

**Interfaces:**
- Produces: `GET /api/v1/dashboard` → `{ data: DashboardData }`
- `dashboardService.getData(orgId: string): Promise<DashboardData>`

- [ ] **Step 1: Write schema.ts**

Create `apps/server/src/modules/dashboard/schema.ts`:

```ts
import type { HearingPurpose, ImportantDateType } from "@splexa-group/shared/enums";

export interface UpcomingHearing {
  id:        string;
  caseId:    string;
  caseTitle: string;
  courtName: string | null;
  date:      Date;
  time:      string | null;
  purpose:   HearingPurpose | null;
}

export interface UpcomingDeadline {
  id:          string;
  caseId:      string;
  caseTitle:   string;
  dateType:    ImportantDateType;
  date:        Date;
  description: string | null;
}

export interface HighPriorityCase {
  id:              string;
  title:           string;
  caseNumber:      string | null;
  courtName:       string | null;
  nextHearingDate: Date | null;
}

export interface DashboardStats {
  activeCases:       number;
  hearingsToday:     number;
  hearingsThisWeek:  number;
  upcomingDeadlines: number;
}

export interface DashboardData {
  stats:             DashboardStats;
  upcomingHearings:  UpcomingHearing[];
  upcomingDeadlines: UpcomingDeadline[];
  highPriorityCases: HighPriorityCase[];
}
```

- [ ] **Step 2: Write repository.ts**

Create `apps/server/src/modules/dashboard/repository.ts`:

```ts
import { CaseStatus, HearingStatus, ImportantDateType, Priority } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";

import type { DashboardData } from "./schema";

const CRITICAL_DATE_TYPES = [
  ImportantDateType.Limitation,
  ImportantDateType.BailExpiry,
  ImportantDateType.StayExpiry,
  ImportantDateType.AppealDeadline,
  ImportantDateType.InjunctionValidity,
] as const;

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export const dashboardRepository = {
  async getData(orgId: string): Promise<DashboardData> {
    const now        = new Date();
    const todayStart = startOfDay(now);
    const todayEnd   = endOfDay(now);
    const week7End   = endOfDay(addDays(now, 7));
    const week14End  = endOfDay(addDays(now, 14));
    const month30End = endOfDay(addDays(now, 30));

    const [
      activeCases,
      hearingsToday,
      hearingsThisWeek,
      upcomingDeadlinesCount,
      upcomingHearings,
      upcomingDeadlines,
      highPriorityCases,
    ] = await Promise.all([
      prisma.case.count({
        where: { orgId, status: CaseStatus.Active, deletedAt: null },
      }),

      prisma.hearing.count({
        where: {
          orgId,
          status: HearingStatus.Scheduled,
          date: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
        },
      }),

      prisma.hearing.count({
        where: {
          orgId,
          status: HearingStatus.Scheduled,
          date: { gte: todayStart, lte: week7End },
          deletedAt: null,
        },
      }),

      prisma.importantDate.count({
        where: {
          orgId,
          date: { gte: todayStart, lte: month30End },
          dateType: { in: [...CRITICAL_DATE_TYPES] },
          deletedAt: null,
        },
      }),

      prisma.hearing.findMany({
        where: {
          orgId,
          status: HearingStatus.Scheduled,
          date: { gte: todayStart, lte: week14End },
          deletedAt: null,
        },
        orderBy: { date: "asc" },
        take: 5,
        include: { case: { select: { title: true, courtName: true } } },
      }),

      prisma.importantDate.findMany({
        where: {
          orgId,
          date: { gte: todayStart, lte: month30End },
          dateType: { in: [...CRITICAL_DATE_TYPES] },
          deletedAt: null,
        },
        orderBy: { date: "asc" },
        take: 5,
        include: { case: { select: { title: true } } },
      }),

      prisma.case.findMany({
        where: { orgId, status: CaseStatus.Active, priority: Priority.High, deletedAt: null },
        orderBy: [{ nextHearingDate: { sort: "asc", nulls: "last" } }],
        take: 5,
        select: { id: true, title: true, caseNumber: true, courtName: true, nextHearingDate: true },
      }),
    ]);

    return {
      stats: {
        activeCases,
        hearingsToday,
        hearingsThisWeek,
        upcomingDeadlines: upcomingDeadlinesCount,
      },
      upcomingHearings: upcomingHearings.map((h) => ({
        id:        h.id,
        caseId:    h.caseId,
        caseTitle: h.case.title,
        courtName: h.case.courtName,
        date:      h.date,
        time:      h.time,
        purpose:   h.purpose,
      })),
      upcomingDeadlines: upcomingDeadlines.map((d) => ({
        id:          d.id,
        caseId:      d.caseId,
        caseTitle:   d.case.title,
        dateType:    d.dateType,
        date:        d.date,
        description: d.description,
      })),
      highPriorityCases: highPriorityCases.map((c) => ({
        id:              c.id,
        title:           c.title,
        caseNumber:      c.caseNumber,
        courtName:       c.courtName,
        nextHearingDate: c.nextHearingDate,
      })),
    };
  },
};
```

- [ ] **Step 3: Write the failing service test**

Create `apps/server/src/modules/dashboard/__tests__/service.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardRepository } from "../repository";
import { dashboardService } from "../service";

vi.mock("../repository", () => ({
  dashboardRepository: { getData: vi.fn() },
}));

const mockData = {
  stats: { activeCases: 5, hearingsToday: 2, hearingsThisWeek: 8, upcomingDeadlines: 3 },
  upcomingHearings:  [],
  upcomingDeadlines: [],
  highPriorityCases: [],
};

beforeEach(() => vi.clearAllMocks());

describe("dashboardService.getData", () => {
  it("delegates to repository with orgId", async () => {
    vi.mocked(dashboardRepository.getData).mockResolvedValue(mockData as never);
    const result = await dashboardService.getData("org-1");
    expect(result).toEqual(mockData);
    expect(dashboardRepository.getData).toHaveBeenCalledWith("org-1");
  });
});
```

- [ ] **Step 4: Run test — expect FAIL**

```bash
cd apps/server && pnpm test src/modules/dashboard
```

Expected: FAIL — `dashboardService` not found.

- [ ] **Step 5: Write service.ts**

Create `apps/server/src/modules/dashboard/service.ts`:

```ts
import { dashboardRepository } from "./repository";

export const dashboardService = {
  async getData(orgId: string) {
    return dashboardRepository.getData(orgId);
  },
};
```

- [ ] **Step 6: Run test — expect PASS**

```bash
cd apps/server && pnpm test src/modules/dashboard
```

Expected: 1 test, PASS.

- [ ] **Step 7: Write controller, routes, plugin**

Create `apps/server/src/modules/dashboard/controller.ts`:

```ts
import type { FastifyRequest } from "fastify";

import { dashboardService } from "./service";

export const dashboardController = {
  async getData(req: FastifyRequest) {
    const data = await dashboardService.getData(req.user.orgId);
    return { data };
  },
};
```

Create `apps/server/src/modules/dashboard/routes.ts`:

```ts
import type { FastifyInstance } from "fastify";

import { dashboardController } from "./controller";

export function dashboardRoutes(router: FastifyInstance): void {
  router.get("/", {
    preHandler: [router.authenticate],
    handler: dashboardController.getData,
  });
}
```

Create `apps/server/src/modules/dashboard/plugin.ts`:

```ts
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { dashboardRoutes } from "./routes";

export const dashboardModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(dashboardRoutes, { prefix: "/api/v1/dashboard" });
  },
  { name: "dashboard-module" },
);
```

- [ ] **Step 8: Register in app.ts**

Open `apps/server/src/app.ts`. Add the import after `settingsModule`:

```ts
import { dashboardModule } from "@/modules/dashboard/plugin";
```

Add registration after `await app.register(settingsModule)`:

```ts
await app.register(dashboardModule);
```

- [ ] **Step 9: Commit**

```bash
git add apps/server/src/modules/dashboard/ apps/server/src/app.ts
git commit -m "feat(dashboard): add dashboard backend module"
```

---

### Task 2: Frontend data layer

**Files:**
- Create: `apps/web/src/types/dashboard.ts`
- Create: `apps/web/src/services/dashboard.ts`
- Create: `apps/web/src/hooks/use-dashboard.ts`

**Interfaces:**
- Consumes: `GET /api/v1/dashboard` (from Task 1)
- Produces:
  - `useDashboard()` — `UseQueryResult<DashboardData>`
  - `dashboardKeys.all()` — `["dashboard"]`
  - Types: `DashboardData`, `DashboardStats`, `UpcomingHearing`, `UpcomingDeadline`, `HighPriorityCase`

Note: The frontend `DashboardData` uses `string` for dates (JSON serialises `Date` as ISO strings). The backend returns `Date` objects but they become strings over HTTP.

- [ ] **Step 1: Write types**

Create `apps/web/src/types/dashboard.ts`:

```ts
import type { HearingPurpose, ImportantDateType } from "@splexa-group/shared/enums";

export interface DashboardStats {
  activeCases:       number;
  hearingsToday:     number;
  hearingsThisWeek:  number;
  upcomingDeadlines: number;
}

export interface UpcomingHearing {
  id:        string;
  caseId:    string;
  caseTitle: string;
  courtName: string | null;
  date:      string;
  time:      string | null;
  purpose:   HearingPurpose | null;
}

export interface UpcomingDeadline {
  id:          string;
  caseId:      string;
  caseTitle:   string;
  dateType:    ImportantDateType;
  date:        string;
  description: string | null;
}

export interface HighPriorityCase {
  id:              string;
  title:           string;
  caseNumber:      string | null;
  courtName:       string | null;
  nextHearingDate: string | null;
}

export interface DashboardData {
  stats:             DashboardStats;
  upcomingHearings:  UpcomingHearing[];
  upcomingDeadlines: UpcomingDeadline[];
  highPriorityCases: HighPriorityCase[];
}

export interface DashboardResponse {
  data: DashboardData;
}
```

- [ ] **Step 2: Write service**

Create `apps/web/src/services/dashboard.ts`:

```ts
import { GET } from "@/api/http";
import type { DashboardResponse } from "@/types/dashboard";

export const dashboardApi = {
  get: () => GET<DashboardResponse>("/dashboard"),
};
```

- [ ] **Step 3: Write hook**

Create `apps/web/src/hooks/use-dashboard.ts`:

```ts
import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/services/dashboard";

export const dashboardKeys = {
  all: () => ["dashboard"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all(),
    queryFn:  () => dashboardApi.get(),
    select:   (res) => res.data,
  });
}
```

- [ ] **Step 4: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/types/dashboard.ts \
        apps/web/src/services/dashboard.ts \
        apps/web/src/hooks/use-dashboard.ts
git commit -m "feat(dashboard): add frontend types, service, and hook"
```

---

### Task 3: StatCard component + page skeleton

**Files:**
- Create: `apps/web/src/components/dashboard/stat-card.tsx`
- Modify: `apps/web/src/app/(protected)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `useDashboard()` from Task 2
- Produces: `StatCard` component, updated page showing 4 stat cards

- [ ] **Step 1: Create StatCard**

Create `apps/web/src/components/dashboard/stat-card.tsx`:

```tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | undefined;
  icon:  LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: Props) {
  return (
    <div className="rounded-lg border border-line bg-card px-5 py-4 flex items-start gap-4">
      <div className="rounded-md bg-brand/10 p-2.5 shrink-0">
        <Icon className="size-5 text-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-secondary mb-1">{label}</p>
        {value === undefined ? (
          <div className="h-7 w-10 rounded bg-subtle animate-pulse" />
        ) : (
          <p className={cn(
            "text-2xl font-bold leading-none",
            value === 0 ? "text-secondary" : "text-dark",
          )}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update dashboard page**

Replace the contents of `apps/web/src/app/(protected)/dashboard/page.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { AlertCircle, Briefcase, Calendar, CalendarCheck } from "lucide-react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { CreateCaseModal } from "@/components/modals/create-case";
import { StatCard } from "@/components/dashboard/stat-card";
import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal  = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const { data } = useDashboard();

  usePageTitle({
    title:  "Dashboard",
    action: { label: "Add New Case", onClick: openModal },
  });

  return (
    <>
      <div className="px-4 md:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Cases"       value={data?.stats.activeCases}       icon={Briefcase} />
          <StatCard label="Today's Hearings"   value={data?.stats.hearingsToday}     icon={CalendarCheck} />
          <StatCard label="This Week"          value={data?.stats.hearingsThisWeek}  icon={Calendar} />
          <StatCard label="Upcoming Deadlines" value={data?.stats.upcomingDeadlines} icon={AlertCircle} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* UpcomingHearings — Task 4 */}
          {/* AttentionNeeded  — Task 5 */}
        </div>
      </div>

      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Verify in browser**

Start dev server (`pnpm dev` from repo root). Go to `http://localhost:3000/dashboard`.

Confirm:
- 4 stat cards render in a 2×2 grid on mobile, 4-column on desktop
- While data is loading, each value shows a grey pulse placeholder
- After data loads, numbers appear (muted/grey if 0, dark if > 0)
- "Add New Case" in the top bar still opens the modal

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/stat-card.tsx \
        apps/web/src/app/\(protected\)/dashboard/page.tsx
git commit -m "feat(dashboard): add stat cards to dashboard page"
```

---

### Task 4: Upcoming Hearings section

**Files:**
- Create: `apps/web/src/components/dashboard/upcoming-hearings.tsx`
- Modify: `apps/web/src/app/(protected)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `UpcomingHearing[]` from `useDashboard()` (Task 2)
- Produces: `UpcomingHearings` component

- [ ] **Step 1: Create upcoming-hearings.tsx**

Create `apps/web/src/components/dashboard/upcoming-hearings.tsx`:

```tsx
"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { UpcomingHearing } from "@/types/dashboard";

interface Props {
  hearings: UpcomingHearing[];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d))    return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
}

const PURPOSE_LABELS: Record<string, string> = {
  Arguments:       "Arguments",
  Evidence:        "Evidence",
  CrossExamination:"Cross Exam.",
  Order:           "Order",
  Mention:         "Mention",
  Settlement:      "Settlement",
  Miscellaneous:   "Misc.",
};

export function UpcomingHearings({ hearings }: Props) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-line bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold text-dark">Upcoming Hearings</h3>
        <p className="text-xs text-secondary mt-0.5">Next 14 days</p>
      </div>

      {hearings.length === 0 ? (
        <EmptyState text="No hearings in the next 14 days." className="py-10" />
      ) : (
        <ul>
          {hearings.map((h, i) => (
            <li
              key={h.id}
              onClick={() => router.push(`/cases/${h.caseId}?tab=hearings`)}
              className={cn(
                "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors",
                i < hearings.length - 1 && "border-b border-line",
              )}
            >
              <div className="min-w-[76px] shrink-0">
                <span className="text-xs font-semibold text-brand">
                  {formatDateLabel(h.date)}
                </span>
                {h.time && (
                  <p className="text-xs text-secondary mt-0.5">{h.time}</p>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{h.caseTitle}</p>
                {h.courtName && (
                  <p className="text-xs text-secondary mt-0.5 truncate">{h.courtName}</p>
                )}
              </div>

              {h.purpose && (
                <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                  {PURPOSE_LABELS[h.purpose] ?? h.purpose}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into page**

Open `apps/web/src/app/(protected)/dashboard/page.tsx`. Add the import:

```ts
import { UpcomingHearings } from "@/components/dashboard/upcoming-hearings";
```

Replace the inner grid comment with the component:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <UpcomingHearings hearings={data?.upcomingHearings ?? []} />
  {/* AttentionNeeded — Task 5 */}
</div>
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Verify in browser**

Go to `http://localhost:3000/dashboard`. Confirm:

- "Upcoming Hearings" card renders below the stat cards on the left half (desktop) or full width (mobile)
- Each hearing row shows: date label in brand colour, case title, court name (if set), purpose badge (if set)
- Date shows "Today" / "Tomorrow" / "Mon 6 Jan" correctly
- Clicking a row navigates to `/cases/{caseId}?tab=hearings`
- When `upcomingHearings` is empty, the "No hearings in the next 14 days." empty state renders

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/upcoming-hearings.tsx \
        apps/web/src/app/\(protected\)/dashboard/page.tsx
git commit -m "feat(dashboard): add upcoming hearings section"
```

---

### Task 5: Attention Needed section

**Files:**
- Create: `apps/web/src/components/dashboard/attention-needed.tsx`
- Modify: `apps/web/src/app/(protected)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `UpcomingDeadline[]` and `HighPriorityCase[]` from `useDashboard()` (Task 2)
- Produces: `AttentionNeeded` component

- [ ] **Step 1: Create attention-needed.tsx**

Create `apps/web/src/components/dashboard/attention-needed.tsx`:

```tsx
"use client";

import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { HighPriorityCase, UpcomingDeadline } from "@/types/dashboard";

interface Props {
  deadlines:         UpcomingDeadline[];
  highPriorityCases: HighPriorityCase[];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d))    return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
}

function isUrgent(dateStr: string): boolean {
  return differenceInCalendarDays(new Date(dateStr), new Date()) <= 7;
}

const DATE_TYPE_LABELS: Record<string, string> = {
  Limitation:         "Limitation",
  BailExpiry:         "Bail Expiry",
  StayExpiry:         "Stay Expiry",
  AppealDeadline:     "Appeal Deadline",
  InjunctionValidity: "Injunction",
};

export function AttentionNeeded({ deadlines, highPriorityCases }: Props) {
  const router  = useRouter();
  const isEmpty = deadlines.length === 0 && highPriorityCases.length === 0;

  return (
    <div className="rounded-lg border border-line bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold text-dark">Attention Needed</h3>
        <p className="text-xs text-secondary mt-0.5">Deadlines & high-priority cases</p>
      </div>

      {isEmpty ? (
        <EmptyState text="Nothing needs immediate attention." className="py-10" />
      ) : (
        <div>
          {deadlines.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-secondary uppercase tracking-wide">
                Upcoming Deadlines
              </p>
              <ul>
                {deadlines.map((d, i) => {
                  const urgent = isUrgent(d.date);
                  return (
                    <li
                      key={d.id}
                      onClick={() => router.push(`/cases/${d.caseId}`)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors",
                        i < deadlines.length - 1 && "border-b border-line",
                      )}
                    >
                      <div className="min-w-[76px] shrink-0">
                        <span className={cn(
                          "text-xs font-semibold",
                          urgent ? "text-negative" : "text-secondary",
                        )}>
                          {formatDateLabel(d.date)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{d.caseTitle}</p>
                        {d.description && (
                          <p className="text-xs text-secondary mt-0.5 truncate">{d.description}</p>
                        )}
                      </div>

                      <span className={cn(
                        "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
                        urgent
                          ? "bg-negative-muted text-negative"
                          : "bg-subtle text-secondary",
                      )}>
                        {DATE_TYPE_LABELS[d.dateType] ?? d.dateType}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {highPriorityCases.length > 0 && (
            <div className={cn(deadlines.length > 0 && "border-t border-line")}>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-secondary uppercase tracking-wide">
                High Priority Cases
              </p>
              <ul>
                {highPriorityCases.map((c, i) => (
                  <li
                    key={c.id}
                    onClick={() => router.push(`/cases/${c.id}`)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors",
                      i < highPriorityCases.length - 1 && "border-b border-line",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{c.title}</p>
                      <p className="text-xs text-secondary mt-0.5 truncate">
                        {c.nextHearingDate
                          ? `Next hearing: ${formatDateLabel(c.nextHearingDate)}`
                          : "No hearing scheduled"}
                        {c.courtName ? ` · ${c.courtName}` : ""}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-negative-muted text-negative">
                      High Priority
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into page**

Open `apps/web/src/app/(protected)/dashboard/page.tsx`. Add import:

```ts
import { AttentionNeeded } from "@/components/dashboard/attention-needed";
```

Replace the inner grid to include both components:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <UpcomingHearings hearings={data?.upcomingHearings ?? []} />
  <AttentionNeeded
    deadlines={data?.upcomingDeadlines ?? []}
    highPriorityCases={data?.highPriorityCases ?? []}
  />
</div>
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Verify in browser**

Go to `http://localhost:3000/dashboard`. Confirm:

- "Attention Needed" card renders on the right half (desktop) or below Upcoming Hearings (mobile)
- "Upcoming Deadlines" sub-section shows with date label in red for items ≤ 7 days away, grey otherwise; badge shows date type label
- "High Priority Cases" sub-section shows below (with divider), each row shows case title + next hearing date and "High Priority" badge
- If either sub-section is empty it's hidden; if both empty, single "Nothing needs immediate attention." empty state renders
- Clicking any row navigates to `/cases/{caseId}`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/attention-needed.tsx \
        apps/web/src/app/\(protected\)/dashboard/page.tsx
git commit -m "feat(dashboard): add attention needed section, complete dashboard page"
```
