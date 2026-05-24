# Sidebar Layout Design

**Date:** 2026-05-24  
**Status:** Approved  
**Branch:** feat/sidebar-layout

---

## Overview

Add a persistent app shell to all protected routes in Splexa. The shell consists of a dark sidebar (desktop), a context-aware top bar, and a bottom tab bar (mobile). This is the primary navigation structure for the entire authenticated app.

---

## Decisions Made

| Question | Decision |
|---|---|
| Sidebar style | Dark navy (`#0c1445`) — matches the auth panel |
| Top bar | Present on all protected pages |
| Sidebar collapse | Pure CSS — no JS/Zustand toggle |
| User menu location | Bottom-left of the sidebar |
| Notifications | Not in scope (Phase 1) |
| Sidebar header | Org name if set, else `"{firstName} Advocates"` — no "Splexa" wordmark in header |
| Nav: "Hearings" renamed | "Calendar" (`/calendar`) |
| Settings in mobile bottom bar | No — sidebar only; accessible via user popover on mobile |

---

## Responsive Behaviour

All transitions are CSS-only. No JavaScript state tracks collapse.

| Breakpoint | Layout |
|---|---|
| `< 768px` (mobile) | No sidebar. Bottom tab bar fixed at bottom. |
| `768px–1023px` (tablet / small laptop) | Sidebar present, icon-only, 56px wide. |
| `1024px+` (desktop) | Sidebar present, expanded with labels, 220px wide. |

---

## Shell Structure

```
app/(protected)/
└── layout.tsx          ← Shell: renders Sidebar + TopBar + {children} + BottomNav

components/layout/
├── sidebar.tsx          ← Desktop sidebar (hidden on mobile)
├── top-bar.tsx          ← Context-aware top bar (all sizes)
└── bottom-nav.tsx       ← Mobile tab bar (hidden on md+)
```

The `(protected)/layout.tsx` file does not yet exist. It must be created. The dashboard `page.tsx` is already present at `app/(protected)/dashboard/page.tsx`.

---

## Sidebar (`components/layout/sidebar.tsx`)

**Background:** `var(--surface-dark)` (`#0c1445`)  
**Width:** `56px` at `md`, `220px` at `lg+`  
**Hidden:** completely on `< md` (use `hidden md:flex`)

### Sections (top to bottom)

1. **Header area** — Organisation name (see Org Name Display below). At `md` (collapsed), shows initials only (first letter of the org/fallback name).
2. **Top nav group** — Dashboard, Cases, Clients, Calendar, Documents. Icon + label; at `md` label is hidden.
3. **Spacer** — `flex-1` pushes everything below it to the bottom.
4. **Bottom nav group** — Settings only. Same item style as top group.
5. **User section** — fixed at the very bottom. Shows avatar initials, name, email at `lg+`; avatar only at `md`. Click opens a small popover with profile details and a logout action.

### Nav items

Two groups, separated by a `flex-1` spacer that pushes the bottom group down:

**Top group** (main navigation):

| Label | Route | Icon (Lucide) |
|---|---|---|
| Dashboard | `/dashboard` | `LayoutDashboard` |
| Cases | `/cases` | `FileText` |
| Clients | `/clients` | `User` |
| Calendar | `/calendar` | `CalendarDays` |
| Documents | `/documents` | `File` |

**Bottom group** (sits just above the user section):

| Label | Route | Icon (Lucide) |
|---|---|---|
| Settings | `/settings` | `Settings` |

### Org Name Display

The sidebar header shows the organisation's name, not the product name. This makes the product feel like the advocate's own system.

**Priority:**
```
1. org.name (from JWT)        →  "Mehta & Associates"
2. fallback                   →  "{user.firstName} Advocates"
```

Examples:
- Org name set: "Mehta & Associates"
- No org name, user is Rajesh Kumar: "Rajesh Advocates"

At `lg+` (expanded): full name in `--brand-light` (`#60a5fa`), `font-semibold text-[15px]`, truncated with `truncate max-w-full`.  
At `md` (collapsed): first letter of the displayed name, same colour, centred.

The name is read from `useAuthStore` — `user.orgName ?? `${user.firstName} Advocates``.

---

### Active state

Active item: `bg-white/10 text-white font-medium`  
Inactive item: `text-white/50 hover:text-white/80 hover:bg-white/5`

Active detection: use `usePathname()` from `next/navigation`, match `pathname.startsWith(route)`.

### User section popover

Triggered by clicking the user row (or avatar at `md`). A small popover opens upward containing:
- Avatar + full name + email (read-only)
- "Log out" button — calls `authApi.logout()`, clears Zustand store, redirects to `/login`

Use a simple `useState` toggle for the popover. No Radix needed — keep it a positioned `div` with `useRef` + click-outside handler.

---

## Top Bar (`components/layout/top-bar.tsx`)

**Height:** `52px`  
**Background:** `var(--card)` (`#ffffff`)  
**Border:** `1px solid var(--line)` on bottom  
**Present on:** all breakpoints (mobile and desktop)

### Two modes

**Default mode** (list/section pages — Dashboard, Cases, Calendar, etc.):
```
[Page title]                    [Search pill]
```
- Left: `<h1>` with the current section name, `text-dark font-semibold text-[15px]`
- Right: search pill — `bg-subtle` rounded pill with a search icon and placeholder "Search cases, clients…". Clicking it will eventually open global search (stub for now — no functionality).

**Detail mode** (any `[id]` route — case detail, client detail, etc.):
```
[← back button]  [Resource title]  [· type tag]
```
- Left: back button — `bg-subtle` `30×30px` rounded square with a left chevron icon. On click: `router.back()`.
- Centre: resource title passed as a prop, `text-dark font-semibold text-[15px]`, truncated with `truncate`.
- After title: optional type tag — e.g. "· Civil", `text-placeholder text-xs`.

### Props interface

```ts
// Two discriminated variants
type TopBarProps =
  | { variant: 'default'; title: string }
  | { variant: 'detail'; title: string; typeTag?: string };
```

Page components pass these props. The `(protected)/layout.tsx` does **not** own the top bar title — each page/feature component renders `<TopBar>` directly (or via a layout context pattern — see Architecture note below).

### Architecture note — title ownership

Next.js App Router layouts cannot receive dynamic props from child pages. Two valid approaches:

**Option A (recommended): Slot via layout context.**  
`layout.tsx` provides a `TopBarContext` with `setTopBar(props)`. Each page calls `useTopBar()` in a `useEffect` to register its title. `TopBar` reads from context.

**Option B: TopBar rendered per-page.**  
Each page renders `<TopBar>` itself (not in the layout). Layout only renders `<Sidebar>` and `<BottomNav>`. `TopBar` sits inside the page's scrollable area.

Option A keeps the top bar visually fixed and consistent. Option B is simpler but causes a layout shift when navigating. **Use Option A.**

---

## Bottom Nav (`components/layout/bottom-nav.tsx`)

**Height:** `58px`  
**Background:** `var(--card)`  
**Border:** `1px solid var(--line)` on top  
**Position:** `fixed bottom-0 left-0 right-0`  
**Visible:** mobile only (`md:hidden`)

### Tabs (5 items)

| Label | Route | Icon |
|---|---|---|
| Dashboard | `/dashboard` | `LayoutDashboard` |
| Cases | `/cases` | `FileText` |
| Clients | `/clients` | `User` |
| Calendar | `/calendar` | `CalendarDays` |
| Docs | `/documents` | `File` |

Settings is not in the bottom tab bar — it is accessible via the sidebar on desktop and via the user popover on mobile.

Active tab: icon and label in `--brand` (`#1e40af`), label `font-semibold`.  
Inactive tab: icon and label in `--text-placeholder`.  
Tap target: each tab `flex-1 min-h-[44px]` — meets the 44px minimum.

---

## Protected Layout (`app/(protected)/layout.tsx`)

```tsx
export default function ProtectedLayout({ children }) {
  return (
    <TopBarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-page pb-[58px] md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </TopBarProvider>
  );
}
```

`pb-[58px]` on mobile prevents content being hidden behind the fixed bottom nav. On `md+` this padding is removed.

---

## Files to Create

| File | Purpose |
|---|---|
| `middleware.ts` | Edge middleware — auth + auth-route redirects |
| `app/(protected)/layout.tsx` | Protected shell — new file |
| `app/(protected)/cases/page.tsx` | Cases stub — "coming soon" placeholder |
| `components/layout/sidebar.tsx` | Dark sidebar — new file |
| `components/layout/top-bar.tsx` | Context-aware top bar — new file |
| `components/layout/bottom-nav.tsx` | Mobile tab bar — new file |
| `components/layout/top-bar-context.tsx` | Context + provider + hook — new file |

---

## Files to Update

| File | Change |
|---|---|
| `app/(protected)/dashboard/page.tsx` | Call `useTopBar({ variant: 'default', title: 'Dashboard' })` |
| `app/globals.css` | Add `.nav-item`, `.nav-item--active`, `.bottom-tab`, `.bottom-tab--active` component classes |

---

## Route Protection (`middleware.ts`)

Next.js middleware runs on the edge before any page renders. It is the only place that enforces auth redirects — no page component does its own auth check.

### Rules

| Situation | Action |
|---|---|
| No `access_token` cookie + visiting a protected route | Redirect to `/login` |
| Has `access_token` cookie + visiting `/login` or `/signup` | Redirect to `/dashboard` |
| All other cases | Pass through |

### Protected route matcher

All routes under `/(protected)` are protected. The middleware `config.matcher` targets:
```
/dashboard/:path*
/cases/:path*
/clients/:path*
/calendar/:path*
/documents/:path*
/settings/:path*
```

### Auth route matcher

`/login` and `/signup` redirect to `/dashboard` when a session cookie is present.

### Implementation

```ts
// apps/web/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/dashboard', '/cases', '/clients', '/calendar', '/documents', '/settings'];
const AUTH_ROUTES = ['/login', '/signup'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/cases/:path*', '/clients/:path*',
            '/calendar/:path*', '/documents/:path*', '/settings/:path*',
            '/login', '/signup'],
};
```

> **Note:** Middleware only checks for the cookie's presence, not its validity. The API server validates the JWT on every request. If the token is expired, the Axios 401 interceptor triggers a refresh — or redirects to `/login` on failure. No JWT verification happens in middleware.

---

## Cases Page Stub (`app/(protected)/cases/page.tsx`)

A placeholder page so navigation to `/cases` does not 404. Uses `useTopBar` with `variant: 'default'`.

```tsx
// Simple coming-soon stub — replace when Cases module is built
export default function CasesPage() { ... }
```

Content: centred text "Cases — coming soon." matching the existing dashboard stub style (`text-secondary text-sm`).

---

## Out of Scope

- Global search functionality (search pill is a visual stub only)
- Notifications
- Profile edit page
- Calendar, Clients, Documents, Settings stub pages (only Dashboard and Cases stubs are in scope)
- JWT validation in middleware (presence check only — API validates the token)
