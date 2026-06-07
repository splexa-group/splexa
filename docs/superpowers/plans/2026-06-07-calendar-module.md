# Calendar Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a month-view calendar page at `/calendar` that shows an advocate's hearings and important dates across all cases, with chip-style event display and a tap-to-popup for quick case navigation.

**Architecture:** Backend upgrades the existing `GET /api/v1/important-dates` endpoint to support date-range filtering and return `case.title`. Frontend builds a custom React calendar grid (no library) using `date-fns` for date math, two parallel React Query fetches (hearings + important dates), and a bottom-drawer/modal popup on mobile/desktop.

**Tech Stack:** Fastify + Prisma (backend), Next.js 16 App Router + React Query v5 + Tailwind v4 + Radix Dialog + `date-fns` (frontend), Vitest (tests)

---

## File Map

**Backend — modified files:**
| File | Change |
|---|---|
| `apps/server/src/db/selects.ts` | Add `importantDateCalendarSelect` |
| `apps/server/src/modules/important-dates/schema.ts` | Add `listImportantDatesQuerySchema` + `ListImportantDatesQuery` type |
| `apps/server/src/modules/important-dates/repository.ts` | Add `listCrossCase(orgId, query)` |
| `apps/server/src/modules/important-dates/service.ts` | Add `listCrossCase(orgId, query)` |
| `apps/server/src/modules/important-dates/controller.ts` | Add `listCrossCase` handler |
| `apps/server/src/modules/important-dates/routes.ts` | Wire `GET /` to new handler + schema |
| `apps/server/src/modules/important-dates/__tests__/service.test.ts` | Add `listCrossCase` test |

**Frontend — new files:**
| File | Responsibility |
|---|---|
| `apps/web/src/types/calendar.ts` | `CalendarHearing`, `CalendarImportantDate`, `CalendarEvent`, `CalendarEventMap` |
| `apps/web/src/services/calendar.ts` | `calendarApi` — two typed GET calls |
| `apps/web/src/hooks/use-calendar.ts` | `useCalendarEvents`, `getGridRange`, `getGridDays`, `buildEventMap`, `calendarKeys` |
| `apps/web/src/components/calendar/calendar-event-chip.tsx` | Single coloured chip (hearing=blue, date=amber) |
| `apps/web/src/components/calendar/calendar-header.tsx` | Month label + prev/next/today buttons |
| `apps/web/src/components/calendar/calendar-cell.tsx` | One day cell — date number, chips, overflow count |
| `apps/web/src/components/calendar/calendar-event-popup.tsx` | Bottom drawer (mobile) / centered modal (desktop) — events for a day |
| `apps/web/src/components/calendar/calendar-grid.tsx` | 7-col grid with day headers, loading skeleton, error state |
| `apps/web/src/components/calendar/calendar-view.tsx` | `'use client'` root — owns `year`, `month`, `selectedDateKey` state |
| `apps/web/src/app/(protected)/calendar/page.tsx` | Thin server component — renders `CalendarView` |

**Frontend — modified files:**
| File | Change |
|---|---|
| `apps/web/src/app/globals.css` | Add calendar CSS component classes |

---

## Task 1: Backend — DB select and query schema

**Files:**
- Modify: `apps/server/src/db/selects.ts`
- Modify: `apps/server/src/modules/important-dates/schema.ts`

- [ ] **Step 1: Add `importantDateCalendarSelect` to `db/selects.ts`**

Open `apps/server/src/db/selects.ts`. After the `importantDateSelect` block (around line 78), add:

```ts
export const importantDateCalendarSelect = {
  id: true,
  caseId: true,
  dateType: true,
  date: true,
  description: true,
  createdAt: true,
  case: {
    select: {
      id: true,
      title: true,
    },
  },
} satisfies Prisma.ImportantDateSelect;
```

- [ ] **Step 2: Add query schema to `modules/important-dates/schema.ts`**

Append to the end of `apps/server/src/modules/important-dates/schema.ts`:

```ts
export const listImportantDatesQuerySchema = z
  .object({
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(200).default(50),
  })
  .strict();

export type ListImportantDatesQuery = z.infer<typeof listImportantDatesQuerySchema>;
```

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/db/selects.ts apps/server/src/modules/important-dates/schema.ts
git commit -m "feat(calendar): add importantDateCalendarSelect and list query schema"
```

---

## Task 2: Backend — Repository `listCrossCase`

**Files:**
- Modify: `apps/server/src/modules/important-dates/repository.ts`

- [ ] **Step 1: Add `listCrossCase` to the repository**

Open `apps/server/src/modules/important-dates/repository.ts`.

Add these imports at the top (alongside existing ones):
```ts
import type { Prisma } from "@prisma/client";
import { importantDateCalendarSelect } from "@/db/selects";
import type { ListImportantDatesQuery } from "./schema";
```

Add the `listCrossCase` method to the `importantDatesRepository` object (after `listForCase`):

```ts
async listCrossCase(orgId: string, query: ListImportantDatesQuery) {
  const { from, to, page, limit } = query;
  const where: Prisma.ImportantDateWhereInput = {
    orgId,
    deletedAt: null,
    dateType: { not: ImportantDateType.HearingDate },
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: parseDate(from) } : {}),
            ...(to ? { lte: parseDate(to) } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.importantDate.findMany({
      where,
      select: importantDateCalendarSelect,
      orderBy: { date: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.importantDate.count({ where }),
  ]);

  return { data, total };
},
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/server && pnpm tsc --noEmit
```

Expected: no errors. Fix any type errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/modules/important-dates/repository.ts
git commit -m "feat(calendar): add importantDatesRepository.listCrossCase"
```

---

## Task 3: Backend — Service `listCrossCase` and tests

**Files:**
- Modify: `apps/server/src/modules/important-dates/service.ts`
- Modify: `apps/server/src/modules/important-dates/__tests__/service.test.ts`

- [ ] **Step 1: Write the failing test**

Open `apps/server/src/modules/important-dates/__tests__/service.test.ts`.

In the `vi.mock('../repository', ...)` block, add `listCrossCase` to the mocked object:

```ts
vi.mock("../repository", () => ({
  importantDatesRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    listCrossCase: vi.fn(),   // add this line
  },
}));
```

Then append the new `describe` block at the end of the file:

```ts
describe("importantDatesService.listCrossCase", () => {
  it("delegates to repository with orgId and query", async () => {
    const mockResult = { data: [], total: 0 };
    vi.mocked(importantDatesRepository.listCrossCase).mockResolvedValue(
      mockResult as never,
    );

    const query = { page: 1, limit: 50 };
    const result = await importantDatesService.listCrossCase("org-1", query);

    expect(result).toEqual(mockResult);
    expect(importantDatesRepository.listCrossCase).toHaveBeenCalledWith(
      "org-1",
      query,
    );
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd apps/server && pnpm test -- --reporter=verbose modules/important-dates
```

Expected: FAIL — `importantDatesService.listCrossCase is not a function`

- [ ] **Step 3: Add `listCrossCase` to the service**

Open `apps/server/src/modules/important-dates/service.ts`.

Add the import for `ListImportantDatesQuery` at the top:
```ts
import type { CreateImportantDateInput, ListImportantDatesQuery, UpdateImportantDateInput } from "./schema";
```

Add the method to `importantDatesService` (after `listForCase`):

```ts
async listCrossCase(orgId: string, query: ListImportantDatesQuery) {
  return importantDatesRepository.listCrossCase(orgId, query);
},
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd apps/server && pnpm test -- --reporter=verbose modules/important-dates
```

Expected: PASS — all important-dates service tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/modules/important-dates/service.ts \
        apps/server/src/modules/important-dates/__tests__/service.test.ts
git commit -m "feat(calendar): add importantDatesService.listCrossCase with tests"
```

---

## Task 4: Backend — Controller and route wiring

**Files:**
- Modify: `apps/server/src/modules/important-dates/controller.ts`
- Modify: `apps/server/src/modules/important-dates/routes.ts`

- [ ] **Step 1: Add `listCrossCase` controller handler**

Open `apps/server/src/modules/important-dates/controller.ts`.

Add `ListImportantDatesQuery` to the imports from `./schema`:
```ts
import type {
  CaseParams,
  CreateImportantDateInput,
  ImportantDateParams,
  ListImportantDatesQuery,
  UpdateImportantDateInput,
} from "./schema";
```

Add the `listCrossCase` handler to `importantDatesController` (after `listForOrg`):

```ts
async listCrossCase(
  req: FastifyRequest<{ Querystring: ListImportantDatesQuery }>,
) {
  return importantDatesService.listCrossCase(req.user.orgId, req.query);
},
```

`orgId` always comes from `req.user.orgId` (JWT). No `logActivity()` — this is a read-only query.

- [ ] **Step 2: Update the route**

Open `apps/server/src/modules/important-dates/routes.ts`.

Add `listImportantDatesQuerySchema` to the imports from `./schema`:
```ts
import {
  caseParamsSchema,
  createImportantDateSchema,
  importantDateParamsSchema,
  listImportantDatesQuerySchema,
  updateImportantDateSchema,
} from "./schema";
```

Replace the existing `router.get('/', ...)` in `importantDatesRoutes`:
```ts
export function importantDatesRoutes(router: FastifyInstance): void {
  router.get("/", {
    schema: { querystring: listImportantDatesQuerySchema },
    preHandler: [router.authenticate],
    handler: importantDatesController.listCrossCase,
  });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/server && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all server tests**

```bash
cd apps/server && pnpm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/modules/important-dates/controller.ts \
        apps/server/src/modules/important-dates/routes.ts
git commit -m "feat(calendar): wire GET /important-dates to listCrossCase handler"
```

---

## Task 5: Frontend — Install `date-fns` and create types

**Files:**
- Create: `apps/web/src/types/calendar.ts`

- [ ] **Step 1: Install `date-fns`**

```bash
pnpm add date-fns --filter web
```

Expected: `date-fns` appears in `apps/web/package.json` dependencies.

- [ ] **Step 2: Create `types/calendar.ts`**

Create `apps/web/src/types/calendar.ts`:

```ts
import type {
  HearingPurpose,
  HearingStatus,
  ImportantDateType,
} from "@splexa-group/shared/enums";

export interface CalendarHearing {
  id: string;
  caseId: string;
  date: string;
  purpose: HearingPurpose | null;
  status: HearingStatus;
  notes: string | null;
  case: { id: string; title: string };
}

export interface CalendarImportantDate {
  id: string;
  caseId: string;
  dateType: ImportantDateType;
  date: string;
  description: string | null;
  case: { id: string; title: string };
}

export type CalendarEventKind = "hearing" | "important-date";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  caseId: string;
  caseTitle: string;
  date: string;
  label: string;
  status?: HearingStatus;
}

export type CalendarEventMap = Map<string, CalendarEvent[]>;
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/web/src/types/calendar.ts
git commit -m "feat(calendar): add date-fns and calendar types"
```

---

## Task 6: Frontend — Service and hook

**Files:**
- Create: `apps/web/src/services/calendar.ts`
- Create: `apps/web/src/hooks/use-calendar.ts`

- [ ] **Step 1: Create `services/calendar.ts`**

Create `apps/web/src/services/calendar.ts`:

```ts
import { GET } from "@/api/http";
import type { CalendarHearing, CalendarImportantDate } from "@/types/calendar";

interface CalendarPageResult<T> {
  data: T[];
  total: number;
}

export const calendarApi = {
  hearings: (from: string, to: string) =>
    GET<CalendarPageResult<CalendarHearing>>("/hearings", {
      params: { from, to, limit: 200 },
    }),

  importantDates: (from: string, to: string) =>
    GET<CalendarPageResult<CalendarImportantDate>>("/important-dates", {
      params: { from, to, limit: 200 },
    }),
};
```

- [ ] **Step 2: Create `hooks/use-calendar.ts`**

Create `apps/web/src/hooks/use-calendar.ts`:

```ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from "date-fns";

import { calendarApi } from "@/services/calendar";
import type {
  CalendarEvent,
  CalendarEventMap,
  CalendarHearing,
  CalendarImportantDate,
} from "@/types/calendar";
import { HearingPurpose, ImportantDateType } from "@splexa-group/shared/enums";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const calendarKeys = {
  all: ["calendar"] as const,
  hearings: (year: number, month: number) =>
    ["calendar", "hearings", year, month] as const,
  importantDates: (year: number, month: number) =>
    ["calendar", "important-dates", year, month] as const,
};

// ─── Date utilities ───────────────────────────────────────────────────────────

export function getGridDays(year: number, month: number): Date[] {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getGridRange(
  year: number,
  month: number,
): { gridFrom: string; gridTo: string } {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const start = new Date(gridStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(gridEnd);
  end.setHours(23, 59, 59, 999);

  return { gridFrom: start.toISOString(), gridTo: end.toISOString() };
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const HEARING_PURPOSE_LABELS: Record<HearingPurpose, string> = {
  [HearingPurpose.Arguments]: "Arguments",
  [HearingPurpose.Evidence]: "Evidence",
  [HearingPurpose.CrossExamination]: "Cross Examination",
  [HearingPurpose.Order]: "Order",
  [HearingPurpose.Mention]: "Mention",
  [HearingPurpose.Settlement]: "Settlement",
  [HearingPurpose.Miscellaneous]: "Miscellaneous",
};

const IMPORTANT_DATE_TYPE_LABELS: Record<ImportantDateType, string> = {
  [ImportantDateType.HearingDate]: "Hearing Date",
  [ImportantDateType.Limitation]: "Limitation",
  [ImportantDateType.BailExpiry]: "Bail Expiry",
  [ImportantDateType.StayExpiry]: "Stay Expiry",
  [ImportantDateType.AppealDeadline]: "Appeal Deadline",
  [ImportantDateType.InjunctionValidity]: "Injunction Validity",
  [ImportantDateType.Other]: "Other",
};

// ─── Event map builder ────────────────────────────────────────────────────────

function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  return toDateKey(d);
}

export function buildEventMap(
  hearings: CalendarHearing[] | undefined,
  importantDates: CalendarImportantDate[] | undefined,
): CalendarEventMap {
  const map: CalendarEventMap = new Map();

  function push(key: string, event: CalendarEvent) {
    const existing = map.get(key) ?? [];
    map.set(key, [...existing, event]);
  }

  for (const h of hearings ?? []) {
    push(toLocalDateKey(h.date), {
      id: h.id,
      kind: "hearing",
      caseId: h.caseId,
      caseTitle: h.case.title,
      date: h.date,
      label: h.purpose ? HEARING_PURPOSE_LABELS[h.purpose] : "Hearing",
      status: h.status,
    });
  }

  for (const d of importantDates ?? []) {
    push(toLocalDateKey(d.date), {
      id: d.id,
      kind: "important-date",
      caseId: d.caseId,
      caseTitle: d.case.title,
      date: d.date,
      label: IMPORTANT_DATE_TYPE_LABELS[d.dateType],
    });
  }

  return map;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCalendarEvents(
  year: number,
  month: number,
): {
  eventMap: CalendarEventMap;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { gridFrom, gridTo } = getGridRange(year, month);

  const hearingsQuery = useQuery({
    queryKey: calendarKeys.hearings(year, month),
    queryFn: () => calendarApi.hearings(gridFrom, gridTo),
  });

  const datesQuery = useQuery({
    queryKey: calendarKeys.importantDates(year, month),
    queryFn: () => calendarApi.importantDates(gridFrom, gridTo),
  });

  // Both queries run in parallel — neither blocks the other.
  const eventMap = useMemo(
    () => buildEventMap(hearingsQuery.data?.data, datesQuery.data?.data),
    [hearingsQuery.data, datesQuery.data],
  );

  return {
    eventMap,
    isLoading: hearingsQuery.isLoading || datesQuery.isLoading,
    isError: hearingsQuery.isError || datesQuery.isError,
    refetch: () => {
      hearingsQuery.refetch();
      datesQuery.refetch();
    },
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services/calendar.ts apps/web/src/hooks/use-calendar.ts
git commit -m "feat(calendar): add calendarApi service and useCalendarEvents hook"
```

---

## Task 7: Frontend — CSS component classes

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add calendar CSS classes to `globals.css`**

In `apps/web/src/app/globals.css`, inside the `@layer components { ... }` block, append:

```css
/* ─── Calendar ─────────────────────────────────────────────── */
.calendar-page {
  @apply flex flex-col h-full overflow-hidden bg-page;
}

.calendar-header {
  @apply flex items-center justify-between px-4 py-3 bg-card border-b border-line flex-shrink-0;
}

.calendar-nav-btn {
  @apply flex items-center justify-center size-[44px] rounded text-secondary;
  @apply hover:bg-subtle hover:text-dark transition-colors active:bg-line;
}

.calendar-month-label {
  @apply text-base font-bold text-dark w-40 text-center;
}

.calendar-today-btn {
  @apply flex items-center justify-center px-3 h-[36px] min-w-[44px] rounded;
  @apply border border-line text-sm font-medium text-brand;
  @apply hover:bg-brand-soft transition-colors active:scale-95;
}

.calendar-cell {
  @apply border-r border-b border-line p-1.5 min-h-[60px] bg-card overflow-hidden;
  @apply md:min-h-[80px] md:p-2;
}

.calendar-cell--today {
  @apply bg-brand-soft/30 border-l-[3px] border-l-brand;
}

.calendar-cell--outside {
  @apply bg-page;
}

.calendar-date-num {
  @apply block text-right text-[11px] font-semibold text-dark;
  @apply md:text-xs;
}

.calendar-chip {
  @apply block text-[9px] font-medium px-1 py-px rounded truncate w-full leading-tight;
  @apply md:text-[10px];
}

.calendar-chip--hearing {
  @apply bg-brand-soft text-brand;
}

.calendar-chip--date {
  @apply bg-amber-muted text-amber;
}

.calendar-popup-event {
  @apply flex items-center gap-3 p-3 border border-line rounded-lg;
}

.calendar-popup-view-btn {
  @apply shrink-0 px-3 h-[36px] min-w-[44px] rounded bg-brand text-white;
  @apply text-xs font-semibold hover:bg-brand-dark transition-colors active:scale-95;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(calendar): add calendar CSS component classes"
```

---

## Task 8: Frontend — `CalendarEventChip`

**Files:**
- Create: `apps/web/src/components/calendar/calendar-event-chip.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/calendar/calendar-event-chip.tsx`:

```tsx
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface Props {
  event: CalendarEvent;
}

export function CalendarEventChip({ event }: Props) {
  return (
    <span
      className={cn(
        "calendar-chip",
        event.kind === "hearing"
          ? "calendar-chip--hearing"
          : "calendar-chip--date",
      )}
      title={event.caseTitle}
    >
      {event.caseTitle}
    </span>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/calendar/calendar-event-chip.tsx
git commit -m "feat(calendar): add CalendarEventChip component"
```

---

## Task 9: Frontend — `CalendarHeader`

**Files:**
- Create: `apps/web/src/components/calendar/calendar-header.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/calendar/calendar-header.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({ year, month, onPrev, onNext, onToday }: Props) {
  const label = format(new Date(year, month, 1), "MMMM yyyy");

  return (
    <div className="calendar-header">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="calendar-nav-btn"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="calendar-month-label">{label}</span>
        <button
          type="button"
          onClick={onNext}
          className="calendar-nav-btn"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={onToday}
        className="calendar-today-btn"
        aria-label="Go to today"
      >
        <span className="hidden sm:inline">Today</span>
        <CalendarDays className="size-4 sm:hidden" aria-hidden="true" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/calendar/calendar-header.tsx
git commit -m "feat(calendar): add CalendarHeader component"
```

---

## Task 10: Frontend — `CalendarCell`

**Files:**
- Create: `apps/web/src/components/calendar/calendar-cell.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/calendar/calendar-cell.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";
import { CalendarEventChip } from "./calendar-event-chip";

interface Props {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function CalendarCell({
  date,
  events,
  isToday,
  isCurrentMonth,
  isLoading,
  onClick,
}: Props) {
  const hasEvents = isCurrentMonth && events.length > 0;
  const visibleEvents = events.slice(0, 2);
  const overflowCount = events.length - visibleEvents.length;

  return (
    <div
      className={cn(
        "calendar-cell",
        isToday && "calendar-cell--today",
        !isCurrentMonth && "calendar-cell--outside",
        hasEvents && "cursor-pointer active:bg-subtle",
      )}
      onClick={hasEvents ? onClick : undefined}
      role={hasEvents ? "button" : undefined}
      tabIndex={hasEvents ? 0 : undefined}
      onKeyDown={
        hasEvents ? (e) => e.key === "Enter" && onClick() : undefined
      }
    >
      <span
        className={cn(
          "calendar-date-num",
          isToday && "!text-brand font-bold",
          !isCurrentMonth && "!text-disabled",
        )}
      >
        {date.getDate()}
      </span>

      {isLoading && isCurrentMonth && (
        <div className="space-y-0.5 mt-1">
          <div className="h-3 bg-subtle animate-pulse rounded w-full" />
        </div>
      )}

      {!isLoading && hasEvents && (
        <div className="space-y-0.5 mt-1">
          {visibleEvents.map((event) => (
            <CalendarEventChip key={event.id} event={event} />
          ))}
          {overflowCount > 0 && (
            <span className="block text-[9px] text-brand font-medium pl-1 md:text-[10px]">
              +{overflowCount} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/calendar/calendar-cell.tsx
git commit -m "feat(calendar): add CalendarCell component"
```

---

## Task 11: Frontend — `CalendarEventPopup`

**Files:**
- Create: `apps/web/src/components/calendar/calendar-event-popup.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/calendar/calendar-event-popup.tsx`:

```tsx
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface Props {
  dateKey: string;
  events: CalendarEvent[];
  open: boolean;
  onClose: () => void;
}

export function CalendarEventPopup({ dateKey, events, open, onClose }: Props) {
  const router = useRouter();

  const formattedDate = dateKey
    ? new Date(dateKey + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  function handleViewCase(caseId: string) {
    onClose();
    router.push(`/cases/${caseId}`);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            // Mobile: full-width bottom sheet
            "fixed inset-x-0 bottom-0 z-50 max-h-[80vh] bg-card rounded-t-xl shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            // Desktop: centered modal
            "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2",
            "md:-translate-x-1/2 md:-translate-y-1/2",
            "md:w-full md:max-w-sm md:rounded-xl",
            "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95",
            "md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0",
          )}
        >
          {/* Drag handle — mobile only */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-line" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div>
              <Dialog.Title className="text-sm font-semibold text-dark">
                {formattedDate}
              </Dialog.Title>
              <p className="text-xs text-secondary">
                {events.length} event{events.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex items-center justify-center size-[44px] rounded text-placeholder hover:text-secondary hover:bg-subtle transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Event list */}
          <div className="overflow-y-auto p-3 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="calendar-popup-event">
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mb-1",
                      event.kind === "hearing"
                        ? "bg-brand-soft text-brand"
                        : "bg-amber-muted text-amber",
                    )}
                  >
                    {event.kind === "hearing" ? "Hearing" : event.label}
                  </span>
                  <p className="text-sm font-semibold text-dark truncate">
                    {event.caseTitle}
                  </p>
                  <p className="text-xs text-secondary">{event.label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleViewCase(event.caseId)}
                  className="calendar-popup-view-btn"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/calendar/calendar-event-popup.tsx
git commit -m "feat(calendar): add CalendarEventPopup component"
```

---

## Task 12: Frontend — `CalendarGrid`

**Files:**
- Create: `apps/web/src/components/calendar/calendar-grid.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/calendar/calendar-grid.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { getGridDays, toDateKey } from "@/hooks/use-calendar";
import type { CalendarEventMap } from "@/types/calendar";
import { CalendarCell } from "./calendar-cell";

const DAY_LABELS_DESKTOP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_MOBILE = ["M", "T", "W", "T", "F", "S", "S"];

interface Props {
  year: number;
  month: number;
  eventMap: CalendarEventMap;
  onSelectDate: (dateKey: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function CalendarGrid({
  year,
  month,
  eventMap,
  onSelectDate,
  isLoading,
  isError,
  onRetry,
}: Props) {
  const gridDays = getGridDays(year, month);
  const todayKey = toDateKey(new Date());

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          text="Could not load calendar."
          action={{ label: "Retry", onClick: onRetry }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 bg-subtle border-b border-line flex-shrink-0">
        {DAY_LABELS_DESKTOP.map((label, i) => (
          <div
            key={label + i}
            className={cn(
              "py-2 text-center text-[10px] font-semibold border-r border-line last:border-r-0 md:text-xs",
              i >= 5 ? "text-placeholder" : "text-secondary",
            )}
          >
            <span className="hidden md:inline">{DAY_LABELS_DESKTOP[i]}</span>
            <span className="md:hidden">{DAY_LABELS_MOBILE[i]}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 overflow-hidden content-start">
        {gridDays.map((day) => {
          const key = toDateKey(day);
          return (
            <CalendarCell
              key={key}
              date={day}
              events={isLoading ? [] : (eventMap.get(key) ?? [])}
              isToday={key === todayKey}
              isCurrentMonth={day.getMonth() === month}
              isLoading={isLoading}
              onClick={() => onSelectDate(key)}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/calendar/calendar-grid.tsx
git commit -m "feat(calendar): add CalendarGrid component"
```

---

## Task 13: Frontend — `CalendarView` and page

**Files:**
- Create: `apps/web/src/components/calendar/calendar-view.tsx`
- Create: `apps/web/src/app/(protected)/calendar/page.tsx`

- [ ] **Step 1: Create `CalendarView`**

Create `apps/web/src/components/calendar/calendar-view.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { CalendarEventPopup } from "./calendar-event-popup";

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const { eventMap, isLoading, isError, refetch } = useCalendarEvents(
    year,
    month,
  );

  function handlePrev() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function handleNext() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function handleToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  const selectedEvents = selectedDateKey
    ? (eventMap.get(selectedDateKey) ?? [])
    : [];

  return (
    <div className="calendar-page">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />
      <CalendarGrid
        year={year}
        month={month}
        eventMap={eventMap}
        onSelectDate={setSelectedDateKey}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />
      <CalendarEventPopup
        dateKey={selectedDateKey ?? ""}
        events={selectedEvents}
        open={!!selectedDateKey}
        onClose={() => setSelectedDateKey(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the page**

Create `apps/web/src/app/(protected)/calendar/page.tsx`:

```tsx
import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  return <CalendarView />;
}
```

- [ ] **Step 3: Verify full TypeScript compile**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/calendar/calendar-view.tsx \
        apps/web/src/app/\(protected\)/calendar/page.tsx
git commit -m "feat(calendar): add CalendarView and calendar page"
```

---

## Task 14: End-to-end smoke test

- [ ] **Step 1: Start both apps**

In one terminal:
```bash
cd apps/server && pnpm dev
```

In another:
```bash
cd apps/web && pnpm dev
```

- [ ] **Step 2: Manual smoke test checklist**

Open the app in the browser (http://localhost:3000). Log in.

**Navigation:**
- [ ] Click "Calendar" in the sidebar → lands on `/calendar`
- [ ] Page shows current month and year in the header
- [ ] "Today" cell has a blue left border and is visually distinct
- [ ] Weekends (Sat/Sun) day headers are in muted grey

**Navigation controls:**
- [ ] Click `‹` → goes to previous month, URL stays at `/calendar`
- [ ] Click `›` → goes to next month
- [ ] Click `Today` → returns to current month

**Events (add test data first if needed — use the case detail page to add a hearing today):**
- [ ] Days with hearings show blue chips with truncated case name
- [ ] Days with important dates show amber chips
- [ ] Days with 3+ events show "+N more" text
- [ ] Days with no events show only the date number

**Popup:**
- [ ] Tap/click a day with events → popup opens
- [ ] Popup shows date in header, event count
- [ ] Each event shows correct type badge (HEARING=blue, date type=amber)
- [ ] Each event shows case title and label
- [ ] "View" button navigates to the correct case detail page
- [ ] Popup closes when clicking the X or overlay

**Responsive (resize browser to mobile width):**
- [ ] Calendar grid cells shrink but remain usable
- [ ] Day headers show single letter (M T W T F S S)
- [ ] Popup slides up from the bottom as a drawer

**Error state:**
- [ ] Stop the server, refresh calendar → error state with "Retry" button appears

- [ ] **Step 3: Run all server tests one final time**

```bash
cd apps/server && pnpm test
```

Expected: all tests pass.

- [ ] **Step 4: Final commit if any fixes were made during testing**

```bash
git add -p   # stage only changed files
git commit -m "fix(calendar): address smoke test findings"
```
