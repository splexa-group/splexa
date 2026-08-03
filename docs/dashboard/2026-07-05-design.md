# Dashboard Page — Design Spec
**Date:** 2026-07-05
**Branch:** bhaskar/feat/settings (next: new branch from main after settings merges)
**Phase:** 1

---

## Overview

Replace the current "Dashboard — coming soon." placeholder with a focused, read-only overview page. The dashboard answers two questions at a glance: **what is happening soon** (hearings) and **what needs attention** (deadlines + high-priority cases). No charts, no activity feeds, no clutter.

Primary user: an Indian advocate managing 15–25 active cases. Opens the dashboard at 9am to know what's coming up.

---

## Routing & Navigation

| URL | Renders |
|---|---|
| `/dashboard` | Dashboard page (no sub-routes, no tabs) |

The existing "Add New Case" action button stays in the top bar (`usePageTitle` action). No new nav items — `/dashboard` is already in `NAV_ITEMS`.

---

## Layout

```
┌─────────────────────────────────────────────────┐
│  [Active Cases]  [Today]  [This Week]  [Deadlines] │  ← 4 stat cards (2×2 mobile, 4-col desktop)
├────────────────────────┬────────────────────────┤
│  Upcoming Hearings     │  Attention Needed      │  ← 1-col mobile, 2-col desktop (lg breakpoint)
│  (next 5, 14 days)     │  - Upcoming Deadlines  │
│                        │  - High Priority Cases │
└────────────────────────┴────────────────────────┘
```

Page wrapper: `px-4 md:px-6 py-6 space-y-6`. No `PageContent` width constraint — the dashboard uses full-width layout. No `PageFooter` (read-only page).

---

## Section 1: Stat Cards

4 stat cards in a grid (`grid-cols-2 md:grid-cols-4 gap-4`). Display only — not clickable in Phase 1.

| Card | Icon | Value |
|---|---|---|
| Active Cases | `Briefcase` | `Case.count` where `status = Active, deletedAt = null` |
| Today's Hearings | `CalendarCheck` | `Hearing.count` where `date = today, status = Scheduled, deletedAt = null` |
| This Week | `Calendar` | `Hearing.count` where `date ∈ [today, today+7d], status = Scheduled, deletedAt = null` |
| Upcoming Deadlines | `AlertCircle` | `ImportantDate.count` where `date ∈ [today, today+30d], dateType ∈ critical set, deletedAt = null` |

"Critical" `dateType` set: `Limitation`, `BailExpiry`, `StayExpiry`, `AppealDeadline`, `InjunctionValidity`.

If value is 0, the number renders muted (`text-secondary`). No trend arrows, no sparklines.

---

## Section 2: Upcoming Hearings

Next 5 `Scheduled` hearings where `date ∈ [today, today+14d]`, sorted by `date ASC`.

Each row:
- **Date label** — "Today" / "Tomorrow" / "Wed 8 Jan" for further dates
- **Case title** — truncated at one line
- **Court name** — shown as secondary text if set; omitted if null
- **Purpose badge** — Arguments / Evidence / Order / etc., if set
- **Time** — shown inline if set

Click → navigate to `/cases/{caseId}?tab=hearings`.

Empty state: "No hearings in the next 14 days." with a calendar icon.

---

## Section 3: Attention Needed

One card with two independent sub-sections. Each sub-section is hidden when its list is empty. If both are empty, the card shows a single empty state: "Nothing needs immediate attention."

### Upcoming Deadlines

`ImportantDate` records where `date ∈ [today, today+30d]` and `dateType ∈ {Limitation, BailExpiry, StayExpiry, AppealDeadline, InjunctionValidity}`, sorted by `date ASC`, limit 5.

Each row:
- **Date label** — same format as hearings
- **Type badge** — "Limitation" / "Bail Expiry" / "Stay Expiry" / "Appeal Deadline" / "Injunction"
- **Urgency colour** — badge and date label are `text-negative` (red) if within 7 days, `text-warning` (amber) if 8–30 days
- **Case title**
- **Description** — secondary text if set

Click → `/cases/{caseId}`.

### High Priority Cases

Active cases where `priority = High`, sorted by `nextHearingDate ASC` (nulls last), limit 5.

Each row:
- **"High Priority" badge** — brand/warning colour
- **Case title**
- **Next hearing** — formatted date if set, else "No hearing scheduled" in muted text
- **Court name** — secondary text if set

Click → `/cases/{caseId}`.

---

## Backend

### New module: `apps/server/src/modules/dashboard/`

Standard five-layer structure:

| File | Purpose |
|---|---|
| `schema.ts` | Response types only (no request body schemas needed) |
| `repository.ts` | 5 Prisma queries, all parallel |
| `service.ts` | Calls repository, returns shaped response |
| `controller.ts` | Reads `req.user.orgId`, returns `{ data }` |
| `routes.ts` | `GET /` with `authenticate` preHandler |
| `plugin.ts` | `fastify-plugin` wrapper, prefix `/api/v1/dashboard` |

Register in `apps/server/src/app.ts` alongside existing modules.

### Endpoint

```
GET /api/v1/dashboard
Authorization: Bearer <token>
```

Response:
```ts
{
  data: {
    stats: {
      activeCases:       number
      hearingsToday:     number
      hearingsThisWeek:  number
      upcomingDeadlines: number
    }
    upcomingHearings: Array<{
      id:        string
      caseId:    string
      caseTitle: string
      courtName: string | null
      date:      string   // ISO 8601
      time:      string | null
      purpose:   HearingPurpose | null
    }>
    upcomingDeadlines: Array<{
      id:          string
      caseId:      string
      caseTitle:   string
      dateType:    ImportantDateType
      date:        string   // ISO 8601
      description: string | null
    }>
    highPriorityCases: Array<{
      id:              string
      title:           string
      caseNumber:      string | null
      courtName:       string | null
      nextHearingDate: string | null   // ISO 8601
    }>
  }
}
```

### Repository queries (all in `Promise.all`)

```ts
// today = start of current day (UTC midnight)
// Time windows: today, +7d (this week), +14d (hearings), +30d (deadlines)

1. Case.count({ where: { orgId, status: Active, deletedAt: null } })

2. Hearing.count({ where: { orgId, status: Scheduled,
     date: { gte: today, lte: endOfToday }, deletedAt: null } })

3. Hearing.count({ where: { orgId, status: Scheduled,
     date: { gte: today, lte: today+7d }, deletedAt: null } })

4. ImportantDate.count({ where: { orgId,
     date: { gte: today, lte: today+30d },
     dateType: { in: CRITICAL_DATE_TYPES }, deletedAt: null } })

5. Hearing.findMany({ where: { orgId, status: Scheduled,
     date: { gte: today, lte: today+14d }, deletedAt: null },
     orderBy: { date: asc }, take: 5,
     include: { case: { select: { title, courtName } } } })

6. ImportantDate.findMany({ where: { orgId,
     date: { gte: today, lte: today+30d },
     dateType: { in: CRITICAL_DATE_TYPES }, deletedAt: null },
     orderBy: { date: asc }, take: 5,
     include: { case: { select: { title } } } })

7. Case.findMany({ where: { orgId, status: Active, priority: High, deletedAt: null },
     orderBy: { nextHearingDate: asc }, take: 5,
     select: { id, title, caseNumber, courtName, nextHearingDate } })
```

No new migrations needed.

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `src/types/dashboard.ts` | `DashboardData`, `DashboardStats`, `UpcomingHearing`, `UpcomingDeadline`, `HighPriorityCase` |
| `src/services/dashboard.ts` | `dashboardApi.get()` |
| `src/hooks/use-dashboard.ts` | `useDashboard()` — single query, `dashboardKeys.all()` |
| `src/components/dashboard/stat-card.tsx` | Single stat card (icon + label + number) |
| `src/components/dashboard/upcoming-hearings.tsx` | Hearings list section |
| `src/components/dashboard/attention-needed.tsx` | Deadlines + high-priority cases section |
| `src/app/(protected)/dashboard/page.tsx` | Page — assembles everything, calls `usePageTitle` |

### Data flow

```
useDashboard()
  → GET /api/v1/dashboard
  → select: (res) => res.data
  → DashboardData
```

Single query for the whole page — no waterfall.

### Date labelling utility

```ts
function formatDateLabel(date: Date): string {
  if (isToday(date))    return "Today"
  if (isTomorrow(date)) return "Tomorrow"
  return format(date, "EEE d MMM")   // "Wed 8 Jan"
}
```

Uses `date-fns` (already a dependency).

---

## What Is Out of Scope (Phase 1)

- Clickable stat cards navigating to filtered list views
- Chart / graph for case volume over time
- Activity feed (no Activity model in schema)
- Timezone-aware "today" calculation (UTC is acceptable for Indian users in Phase 1)
- Overdue hearings (past-date, not actioned)
- Real-time updates / polling
- "Quick add hearing" from the dashboard
