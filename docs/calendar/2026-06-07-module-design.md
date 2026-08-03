# Calendar Module — Design Spec
**Date:** 2026-06-07
**Status:** Approved
**Scope:** Month-view calendar at `/calendar` — hearings and important dates across all cases, with quick popup to navigate to case detail.

---

## 0. Summary of Decisions

| Decision | Choice |
|---|---|
| Calendar views | Month only — no week/day/agenda views |
| Event types shown | Hearings (blue) + Important dates (amber) — visually distinct |
| Cell display | Compact chips with truncated case name; up to 2 chips + "+N more" |
| Click behaviour | Opens popup listing all events for that day |
| Popup content | Type badge + case title + purpose/description + "View Case" button |
| Mobile popup | Bottom drawer (slide up) |
| Desktop popup | Centered modal |
| Week start | Monday (Mon–Sun) |
| Weekends | Sat/Sun shown in muted grey — courts do not sit |
| Today cell | Blue left border + blue-tinted background |
| Navigation | Prev/Next arrows + "Today" button |
| Calendar library | None — custom React component using `date-fns` |
| Important dates on calendar | Excludes `HearingDate` type (auto-generated from hearings; already shown as hearing chips) |

---

## 1. Backend Changes

### 1.1 What already exists

`GET /api/v1/hearings?from=&to=&status=&caseId=&page=&limit=` is fully ready. The `hearingDetailSelect` already joins `case.title` and `case.client.fullName`. No changes needed to the hearings module.

`GET /api/v1/important-dates` exists but is missing: date range filtering, pagination, and `case.title` in the response. All three must be added.

### 1.2 New Prisma select — `db/selects.ts`

Add `importantDateCalendarSelect`:

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

### 1.3 New query schema — `modules/important-dates/schema.ts`

Add:

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

### 1.4 Repository — `modules/important-dates/repository.ts`

Add `listCrossCase`:

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
      orderBy: { date: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.importantDate.count({ where }),
  ]);

  return { data, total };
},
```

Keep the existing `listForOrg` and `listForCase` functions unchanged.

### 1.5 Service — `modules/important-dates/service.ts`

Add `listCrossCase`:

```ts
async listCrossCase(orgId: string, query: ListImportantDatesQuery) {
  return importantDatesRepository.listCrossCase(orgId, query);
},
```

### 1.6 Controller — `modules/important-dates/controller.ts`

Add `listCrossCase` handler:

```ts
async listCrossCase(req: FastifyRequest<{ Querystring: ListImportantDatesQuery }>) {
  return importantDatesService.listCrossCase(req.user.orgId, req.query);
},
```

`orgId` always from `req.user.orgId`. No `logActivity()` — this is a read-only query.

### 1.7 Route — `modules/important-dates/routes.ts`

Update the existing `GET /` route in `importantDatesRoutes` to use the new handler and querystring schema:

```ts
router.get('/', {
  schema: { querystring: listImportantDatesQuerySchema },
  preHandler: [router.authenticate],
  handler: importantDatesController.listCrossCase,
});
```

The plugin registration (`/api/v1/important-dates`) is unchanged.

### 1.8 Backend response shapes

**Hearing** (from existing cross-case endpoint, already correct):
```ts
{
  id, caseId, orgId, date, purpose, status, notes, nextDate,
  adjournmentReason, judgePresent, addedBy, createdAt, updatedAt,
  case: { id, title, client: { id, fullName } }
}
```

**Important date** (new cross-case endpoint):
```ts
{
  id, caseId, dateType, date, description, createdAt,
  case: { id, title }
}
```

---

## 2. Frontend Architecture

### 2.1 New files

```
apps/web/src/
├── app/(protected)/calendar/
│   └── page.tsx                    ← thin server component
├── components/calendar/
│   ├── calendar-view.tsx           ← 'use client' — holds currentMonth state
│   ├── calendar-header.tsx         ← prev/next arrows + "Today" button
│   ├── calendar-grid.tsx           ← 5–6 row × 7 col grid
│   ├── calendar-cell.tsx           ← date number + chips + overflow
│   ├── calendar-event-chip.tsx     ← single coloured chip (hearing | important-date)
│   └── calendar-event-popup.tsx    ← bottom drawer (mobile) / modal (desktop)
├── services/calendar.ts            ← calendarApi object
├── hooks/use-calendar.ts           ← useCalendarEvents(year, month)
└── types/calendar.ts               ← CalendarHearing, CalendarImportantDate, CalendarEvent
```

### 2.2 Types — `types/calendar.ts`

```ts
import type { HearingPurpose, HearingStatus, ImportantDateType } from '@splexa-group/shared/enums';

export interface CalendarHearing {
  id: string;
  caseId: string;
  date: string;
  purpose: HearingPurpose | null;
  status: HearingStatus;
  notes: string | null;
  case: { id: string; title: string; };
}

export interface CalendarImportantDate {
  id: string;
  caseId: string;
  dateType: ImportantDateType;
  date: string;
  description: string | null;
  case: { id: string; title: string; };
}

export type CalendarEventKind = 'hearing' | 'important-date';

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  caseId: string;
  caseTitle: string;
  date: string;
  label: string;       // HearingPurpose label or ImportantDateType label
  status?: HearingStatus;
}

export type CalendarEventMap = Map<string, CalendarEvent[]>; // key: 'YYYY-MM-DD'
```

### 2.3 Service — `services/calendar.ts`

The backend `listCrossCase` functions return `{ data: T[]; total: number }`. Use that shape directly — do not use `PaginatedResult<T>` from shared (which also includes `page` and `limit`).

```ts
import { GET } from '@/api/http';
import type { CalendarHearing, CalendarImportantDate } from '@/types/calendar';

interface CalendarPageResult<T> { data: T[]; total: number; }

export const calendarApi = {
  hearings: (from: string, to: string) =>
    GET<CalendarPageResult<CalendarHearing>>('/hearings', {
      params: { from, to, limit: 200 },
    }),
  importantDates: (from: string, to: string) =>
    GET<CalendarPageResult<CalendarImportantDate>>('/important-dates', {
      params: { from, to, limit: 200 },
    }),
};
```

### 2.4 Hook — `hooks/use-calendar.ts`

```ts
export const calendarKeys = {
  all: ['calendar'] as const,
  month: (year: number, month: number) => ['calendar', 'month', year, month] as const,
};

export function useCalendarEvents(year: number, month: number): {
  eventMap: CalendarEventMap;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  // gridFrom/gridTo span the full visible grid (including padding days from adjacent months)
  const { gridFrom, gridTo } = getGridRange(year, month);

  const hearingsQuery = useQuery({
    queryKey: [...calendarKeys.month(year, month), 'hearings'],
    queryFn: () => calendarApi.hearings(gridFrom, gridTo),
  });

  const datesQuery = useQuery({
    queryKey: [...calendarKeys.month(year, month), 'important-dates'],
    queryFn: () => calendarApi.importantDates(gridFrom, gridTo),
  });

  // Both queries run in parallel. Neither blocks the other.

  const eventMap = useMemo(
    () => buildEventMap(hearingsQuery.data?.data, datesQuery.data?.data),
    [hearingsQuery.data, datesQuery.data],
  );

  return {
    eventMap,
    isLoading: hearingsQuery.isLoading || datesQuery.isLoading,
    isError: hearingsQuery.isError || datesQuery.isError,
    refetch: () => { hearingsQuery.refetch(); datesQuery.refetch(); },
  };
}
```

`getGridRange(year, month)` returns ISO datetime strings for the Monday that starts the grid and the Sunday that ends it (always a 5 or 6 week grid).

`buildEventMap` iterates both arrays and produces a `Map<string, CalendarEvent[]>` keyed by `"YYYY-MM-DD"` (IST local date, not UTC).

### 2.5 Page — `app/(protected)/calendar/page.tsx`

```tsx
import { CalendarView } from '@/components/calendar/calendar-view';

export default function CalendarPage() {
  return <CalendarView />;
}
```

No params, no `'use client'`.

### 2.6 `CalendarView` — `components/calendar/calendar-view.tsx`

`'use client'`. Owns `currentYear` and `currentMonth` state (initialised to today). Renders `CalendarHeader` + `CalendarGrid`. Manages which day's popup is open (`selectedDate: string | null`).

### 2.7 `CalendarHeader` — `components/calendar/calendar-header.tsx`

Props: `year`, `month`, `onPrev`, `onNext`, `onToday`.

Renders: `‹  June 2026  ›` centered, `Today` button right-aligned. On mobile the `Today` button collapses to an icon to preserve space.

### 2.8 `CalendarGrid` — `components/calendar/calendar-grid.tsx`

Props: `year`, `month`, `eventMap`, `selectedDate`, `onSelectDate`, `isLoading`, `isError`, `onRetry`.

Loading state: renders the same grid structure with grey placeholder chips (skeleton).  
Error state: renders a single full-width `EmptyState` with retry.  
Normal: renders day-of-week header row (Mon–Sun) then 5 or 6 `CalendarCell` rows.

### 2.9 `CalendarCell` — `components/calendar/calendar-cell.tsx`

Props: `date` (Date object), `events: CalendarEvent[]`, `isToday`, `isCurrentMonth`, `isSelected`, `onClick`.

- Date number: `text-dark` if current month, `text-disabled` if padding day
- Today: `bg-brand-soft border-l-2 border-brand` (blue left border + tint)
- Events: first 2 as `CalendarEventChip`, remainder as `+N more` text in `text-brand text-xs`
- Min cell height: `min-h-[60px]` desktop, `min-h-[52px]` mobile
- Tap target: full cell is clickable if events exist; `cursor-pointer active:bg-subtle`
- Padding days (outside current month): chips hidden, date number muted, non-interactive

### 2.10 `CalendarEventChip` — `components/calendar/calendar-event-chip.tsx`

Props: `event: CalendarEvent`.

- Hearing: `bg-brand-soft text-brand`
- Important date: `bg-amber-muted text-amber`
- Content: truncated `caseTitle` with `text-[10px]` and `truncate`

### 2.11 `CalendarEventPopup` — `components/calendar/calendar-event-popup.tsx`

Props: `date: string`, `events: CalendarEvent[]`, `onClose`, `open: boolean`.

- Mobile (`< md`): `fixed inset-x-0 bottom-0` bottom drawer with drag handle, slide-up animation, backdrop overlay
- Desktop (`md+`): centered modal (reuse existing `Modal` primitive from `components/ui/modal.tsx`)

Each event card inside the popup:
- Type badge: `HEARING` (blue) or date type label e.g. `DEADLINE` (amber)
- Case title (`font-semibold text-dark`)
- Purpose / description (`text-secondary text-sm`)
- "View Case" button → `router.push('/cases/[caseId]')` → closes popup

Empty popup state (if `events.length === 0`): not rendered — cells with no events are not interactive.

---

## 3. Data Flow

```
CalendarView (state: year, month, selectedDate)
  │
  ├── useCalendarEvents(year, month)
  │     ├── calendarApi.hearings(gridFrom, gridTo)     → GET /api/v1/hearings?from=&to=&limit=200
  │     ├── calendarApi.importantDates(gridFrom, gridTo) → GET /api/v1/important-dates?from=&to=&limit=200
  │     └── buildEventMap() → Map<'YYYY-MM-DD', CalendarEvent[]>
  │
  ├── CalendarHeader  ← prev/next/today handlers change year+month state
  ├── CalendarGrid    ← receives eventMap, passes slice to each CalendarCell
  └── CalendarEventPopup ← open when selectedDate !== null
```

Month change → `currentYear`/`currentMonth` state updates → React Query refetches with new grid range → `eventMap` rebuilds → grid re-renders.

---

## 4. Date Handling

All dates are in **IST (UTC+5:30)**. The backend stores dates as UTC timestamps.

- `getGridRange(year, month)` computes the Monday of the first week visible and the Sunday of the last week visible, expressed as ISO datetime strings with `+05:30` offset.
- `buildEventMap` converts each event's UTC `date` to IST local date string (`YYYY-MM-DD`) as the map key.
- `isToday` compares the cell date to `new Date()` using IST local date, not UTC midnight.

`date-fns` must be added to the web app: `pnpm add date-fns --filter web`. It handles all date math: `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, `isSameDay`, `isSameMonth`, `format`. Week-start option `{ weekStartsOn: 1 }` (Monday) must be passed to any `startOfWeek` / `endOfWeek` call.

---

## 5. Responsive Behaviour

| Element | Mobile (`< md`) | Desktop (`md+`) |
|---|---|---|
| Calendar page | Full width, no sidebar | Sidebar + content area |
| Cell height | `min-h-[52px]` | `min-h-[60px]` |
| Chips per cell | Up to 2 | Up to 2 |
| Day header labels | Single letter: M T W T F S S | Full: Mon Tue Wed Thu Fri Sat Sun |
| Popup | Bottom drawer, full width | Centered modal, `max-w-sm` |
| Header "Today" | Icon only (`CalendarDays`) | "Today" text button |

All interactive elements: `min-h-[44px] min-w-[44px]` tap target. Navigation arrows are `44×44px` touch areas regardless of visual icon size.

---

## 6. Loading and Error States

**Loading:** The `CalendarGrid` renders the full grid skeleton — same cell layout with 1–2 grey shimmer bars per cell. The header is still interactive (user can navigate months before data loads).

**Error:** Full-width `EmptyState` inside the grid area: "Could not load calendar." with a Retry button that calls `refetch()`.

**Empty month:** Cells render with only the date number. No empty state message — a blank calendar is correct and expected.

---

## 7. Sidebar Nav

The `Calendar` nav item (`/calendar`, `CalendarDays` icon) already exists in `nav-items.ts`. No changes needed.

---

## 8. What Is NOT in Scope

- Adding hearings or important dates from the calendar — all creation happens from the case detail page
- Week or day views
- Filtering by court or case status
- Drag-and-drop rescheduling
- Swipe gesture navigation on mobile (arrow buttons are sufficient for Phase 1)
