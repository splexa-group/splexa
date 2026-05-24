# Sidebar Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full app shell (dark sidebar, context-aware top bar, mobile bottom nav, route protection) to all protected routes in Splexa.

**Architecture:** A Next.js `(protected)/layout.tsx` composes `Sidebar`, `TopBar`, and `BottomNav`. The top bar title is driven by a React context (`TopBarContext`) that each page writes to via `useTopBar()`. Route protection lives entirely in `middleware.ts` (edge runtime) — no auth checks in page components.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, Zustand, lucide-react, TypeScript strict.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/user.ts` | Modify | Add `orgName?: string` to `AuthUser` |
| `src/middleware.ts` | Create | Edge redirect: unauthenticated → `/login`, logged-in on auth routes → `/dashboard` |
| `src/app/globals.css` | Modify | Add `.nav-item`, `.nav-item--active`, `.bottom-tab`, `.bottom-tab--active` CSS classes |
| `src/components/layout/top-bar-context.tsx` | Create | `TopBarContext`, `TopBarProvider`, `useTopBar` hook |
| `src/components/layout/bottom-nav.tsx` | Create | Mobile fixed tab bar (5 tabs, hidden on `md+`) |
| `src/components/layout/top-bar.tsx` | Create | Context-aware top bar: default (title + search) or detail (back + title) |
| `src/components/layout/sidebar.tsx` | Create | Dark sidebar: org name header, nav groups, user popover with logout |
| `src/app/(protected)/layout.tsx` | Create | Shell: composes all layout components + auth rehydration |
| `src/app/(protected)/dashboard/page.tsx` | Modify | Call `useTopBar` to register the "Dashboard" title |
| `src/app/(protected)/cases/page.tsx` | Create | Coming-soon stub, registers "Cases" title |

---

## Task 1: Add `orgName` to `AuthUser`

**Files:**
- Modify: `src/types/user.ts`

The sidebar header displays `user.orgName ?? `${user.firstName} Advocates``. The field must exist on the type even if the backend sometimes omits it.

- [ ] **Step 1: Update the type**

Replace the contents of `src/types/user.ts`:

```ts
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  orgId: string;
  orgName?: string;
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/types/user.ts
git commit -m "feat: add orgName to AuthUser type"
```

---

## Task 2: Middleware — Route Protection

**Files:**
- Create: `src/middleware.ts`

Runs on the edge before every request. Checks for the `access_token` httpOnly cookie (name defined in `apps/server/src/constants/auth.ts` as `ACCESS_TOKEN_COOKIE = "access_token"`). Does **not** validate the JWT — that is the API server's job.

Rules:
- No cookie + protected route → redirect `/login`
- Cookie present + auth route (`/login`, `/signup`) → redirect `/dashboard`
- Anything else → pass through

- [ ] **Step 1: Create `src/middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/cases',
  '/clients',
  '/calendar',
  '/documents',
  '/settings',
];

const AUTH_ROUTE_PREFIXES = ['/login', '/signup'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/cases/:path*',
    '/clients/:path*',
    '/calendar/:path*',
    '/documents/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
};
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

Start dev server: `cd apps/web && pnpm dev`

| Test | Expected |
|---|---|
| Open `http://localhost:3000/dashboard` (no cookie) | Redirects to `/login` |
| Log in via OTP flow | Lands on `/dashboard` |
| While logged in, open `http://localhost:3000/login` | Redirects to `/dashboard` |
| Log out and open `http://localhost:3000/cases` | Redirects to `/login` |

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat: add edge middleware for route protection"
```

---

## Task 3: CSS Component Classes

**Files:**
- Modify: `src/app/globals.css`

Add four component classes used by `Sidebar` and `BottomNav`. Must go inside `@layer components` so Tailwind processes `@apply` correctly.

- [ ] **Step 1: Append to `globals.css`**

Add this block at the end of `src/app/globals.css`:

```css
@layer components {
  /* ── Sidebar nav item ──────────────────────────────── */
  .nav-item {
    @apply flex items-center gap-3 rounded-lg px-3 py-2 min-h-[36px];
    @apply text-[13px] text-white/50 transition-colors cursor-pointer;
    @apply hover:bg-white/5 hover:text-white/75;
  }
  .nav-item--active {
    @apply bg-white/10 text-white font-medium;
  }

  /* ── Mobile bottom tab ─────────────────────────────── */
  .bottom-tab {
    @apply flex flex-1 flex-col items-center justify-center gap-[3px] min-h-[44px] cursor-pointer;
    @apply text-[9px] text-placeholder;
  }
  .bottom-tab--active {
    @apply text-brand font-semibold;
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat: add nav-item and bottom-tab CSS component classes"
```

---

## Task 4: TopBar Context

**Files:**
- Create: `src/components/layout/top-bar-context.tsx`

Provides a way for any page to register its top bar configuration. The `TopBar` component reads from this context. Each page calls `useTopBar()` and then `setTopBar(config)` inside a `useEffect`.

- [ ] **Step 1: Create `src/components/layout/top-bar-context.tsx`**

```tsx
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type TopBarConfig =
  | { variant: 'default'; title: string }
  | { variant: 'detail'; title: string; typeTag?: string };

interface TopBarContextValue {
  config: TopBarConfig | null;
  setTopBar: (config: TopBarConfig) => void;
}

const TopBarContext = createContext<TopBarContextValue | null>(null);

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [config, setTopBar] = useState<TopBarConfig | null>(null);

  return (
    <TopBarContext.Provider value={{ config, setTopBar }}>
      {children}
    </TopBarContext.Provider>
  );
}

export function useTopBar() {
  const ctx = useContext(TopBarContext);
  if (!ctx) throw new Error('useTopBar must be used inside TopBarProvider');
  return ctx;
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/top-bar-context.tsx
git commit -m "feat: add TopBar context and provider"
```

---

## Task 5: BottomNav

**Files:**
- Create: `src/components/layout/bottom-nav.tsx`

Fixed bottom tab bar visible only on mobile (`md:hidden`). 5 tabs. Active state driven by `usePathname`.

- [ ] **Step 1: Create `src/components/layout/bottom-nav.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  User,
  CalendarDays,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';

const TABS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Cases',     href: '/cases',     icon: FileText },
  { label: 'Clients',   href: '/clients',   icon: User },
  { label: 'Calendar',  href: '/calendar',  icon: CalendarDays },
  { label: 'Docs',      href: '/documents', icon: File },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[58px] bg-card border-t border-line flex items-center z-40">
      {TABS.map(({ label, href, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn('bottom-tab', active && 'bottom-tab--active')}
          >
            <Icon icon={icon} size="md" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/bottom-nav.tsx
git commit -m "feat: add mobile BottomNav component"
```

---

## Task 6: TopBar

**Files:**
- Create: `src/components/layout/top-bar.tsx`

Reads `config` from `TopBarContext`. Two visual modes: `default` (title + search stub) and `detail` (back button + title + optional type tag). Height 52px, white background, border bottom.

- [ ] **Step 1: Create `src/components/layout/top-bar.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Search } from 'lucide-react';
import { useTopBar } from './top-bar-context';
import { Icon } from '@/components/ui/icon';

export function TopBar() {
  const { config } = useTopBar();
  const router = useRouter();

  return (
    <header className="h-[52px] bg-card border-b border-line flex items-center px-5 gap-3 shrink-0 z-30">
      {!config || config.variant === 'default' ? (
        <>
          <h1 className="text-[15px] font-semibold text-dark flex-1 truncate">
            {config?.title ?? ''}
          </h1>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-subtle text-[12px] text-placeholder cursor-default"
            tabIndex={-1}
            aria-label="Search"
          >
            <Icon icon={Search} size="xs" />
            <span className="hidden sm:inline">Search cases, clients…</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-[30px] h-[30px] flex items-center justify-center rounded-lg bg-subtle text-label hover:bg-line transition-colors shrink-0"
            aria-label="Go back"
          >
            <Icon icon={ChevronLeft} size="sm" />
          </button>
          <h1 className="text-[15px] font-semibold text-dark truncate">
            {config.title}
          </h1>
          {config.typeTag && (
            <span className="text-xs text-placeholder shrink-0">· {config.typeTag}</span>
          )}
        </>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/top-bar.tsx
git commit -m "feat: add context-aware TopBar component"
```

---

## Task 7: Sidebar

**Files:**
- Create: `src/components/layout/sidebar.tsx`

Dark navy sidebar. Hidden on `< md`. Icon-only at `md` (56px). Expanded at `lg+` (220px). Shows org name (or `{firstName} Advocates`) in header. User popover at bottom-left with profile info and logout.

- [ ] **Step 1: Create `src/components/layout/sidebar.tsx`**

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  User,
  CalendarDays,
  File,
  Settings,
  LogOut,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/services/auth';

const TOP_NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Cases',     href: '/cases',     icon: FileText },
  { label: 'Clients',   href: '/clients',   icon: User },
  { label: 'Calendar',  href: '/calendar',  icon: CalendarDays },
  { label: 'Documents', href: '/documents', icon: File },
];

const BOTTOM_NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className={cn('nav-item', active && 'nav-item--active')}>
      <Icon icon={icon} size="sm" />
      <span className="hidden lg:block truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? (user.orgName ?? `${user.firstName} Advocates`)
    : '';
  const initial = displayName.charAt(0).toUpperCase();

  const avatarInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push('/login');
    }
  }

  return (
    <aside className="hidden md:flex flex-col md:w-14 lg:w-[220px] bg-surface-dark shrink-0 h-screen overflow-hidden">
      {/* Header — org name */}
      <div className="h-[52px] flex items-center px-4 border-b border-white/[0.07] shrink-0">
        <span className="hidden lg:block text-[15px] font-semibold text-brand-light truncate">
          {displayName}
        </span>
        <span className="lg:hidden text-[15px] font-semibold text-brand-light mx-auto">
          {initial}
        </span>
      </div>

      {/* Top nav group */}
      <nav className="flex flex-col gap-1 px-2 pt-3 flex-1 overflow-y-auto">
        {TOP_NAV.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname.startsWith(href)}
          />
        ))}
      </nav>

      {/* Bottom nav group + user */}
      <div className="px-2 pb-2 flex flex-col gap-1">
        {BOTTOM_NAV.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname.startsWith(href)}
          />
        ))}

        {/* User section */}
        <div className="relative mt-1" ref={popoverRef}>
          {/* Popover */}
          {popoverOpen && (
            <div className="absolute bottom-full mb-2 left-0 right-0 lg:right-auto lg:w-[196px] bg-card border border-line rounded-lg shadow-lg p-3 z-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                  {avatarInitials}
                </div>
                <div className="min-w-0 hidden lg:block">
                  <p className="text-[12px] font-medium text-dark truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-secondary truncate">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[12px] text-negative hover:bg-negative-muted transition-colors"
              >
                <Icon icon={LogOut} size="xs" />
                Log out
              </button>
            </div>
          )}

          {/* User row trigger */}
          <button
            type="button"
            onClick={() => setPopoverOpen((v) => !v)}
            className="flex items-center gap-2 w-full rounded-lg px-2 py-2 hover:bg-white/5 transition-colors border-t border-white/[0.07] pt-3 mt-1"
          >
            <div className="w-[30px] h-[30px] rounded-full bg-brand flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              {avatarInitials}
            </div>
            <div className="hidden lg:flex flex-col items-start min-w-0 flex-1">
              <span className="text-[12px] font-medium text-white truncate w-full text-left">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-white/40 truncate w-full text-left">
                {user?.email}
              </span>
            </div>
            <Icon icon={MoreVertical} size="xs" className="hidden lg:block text-white/30 shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/sidebar.tsx
git commit -m "feat: add dark Sidebar component with org name and user popover"
```

---

## Task 8: Protected Layout + Auth Rehydration

**Files:**
- Create: `src/app/(protected)/layout.tsx`

Composes `Sidebar`, `TopBar`, `BottomNav` into the app shell. Also handles **auth rehydration**: on page refresh, the Zustand store is empty (in-memory only). An `AuthRehydrator` client component calls `authApi.me()` once on mount if `user` is null, repopulating the store. If the call fails, the 401 interceptor redirects to `/login`.

- [ ] **Step 1: Create `src/app/(protected)/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import { TopBarProvider } from '@/components/layout/top-bar-context';
import { TopBar } from '@/components/layout/top-bar';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AuthRehydrator } from '@/components/layout/auth-rehydrator';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <TopBarProvider>
      <AuthRehydrator />
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

- [ ] **Step 2: Create `src/components/layout/auth-rehydrator.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/services/auth';

export function AuthRehydrator() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (user) return;
    authApi.me().then(setAuth).catch(() => {
      // 401 interceptor in api/client.ts handles redirect to /login
    });
  }, [user, setAuth]);

  return null;
}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(protected\)/layout.tsx apps/web/src/components/layout/auth-rehydrator.tsx
git commit -m "feat: add protected layout shell with auth rehydration"
```

---

## Task 9: Update Dashboard Page

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

The dashboard page must register its title with `TopBarContext` so `TopBar` renders "Dashboard". Needs `'use client'` because it calls the `useTopBar` hook.

- [ ] **Step 1: Replace `src/app/(protected)/dashboard/page.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useTopBar } from '@/components/layout/top-bar-context';

export default function DashboardPage() {
  const { setTopBar } = useTopBar();

  useEffect(() => {
    setTopBar({ variant: 'default', title: 'Dashboard' });
  }, [setTopBar]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-secondary text-sm">Dashboard — coming soon.</p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(protected\)/dashboard/page.tsx
git commit -m "feat: connect dashboard page to TopBar context"
```

---

## Task 10: Cases Stub Page

**Files:**
- Create: `src/app/(protected)/cases/page.tsx`

Prevents `/cases` from 404ing. Registers its title with `TopBarContext`. Same coming-soon style as the dashboard stub.

- [ ] **Step 1: Create `src/app/(protected)/cases/page.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useTopBar } from '@/components/layout/top-bar-context';

export default function CasesPage() {
  const { setTopBar } = useTopBar();

  useEffect(() => {
    setTopBar({ variant: 'default', title: 'Cases' });
  }, [setTopBar]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-secondary text-sm">Cases — coming soon.</p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify full layout in browser**

Start dev server: `cd apps/web && pnpm dev`. Log in via OTP.

| Check | Expected |
|---|---|
| Desktop (≥1024px) — Dashboard | Sidebar expanded (220px), org name or `{firstName} Advocates` in header, "Dashboard" in top bar |
| Desktop — click Cases in sidebar | Navigates to `/cases`, top bar shows "Cases" |
| Resize to 768–1023px | Sidebar collapses to 56px icons-only, labels hidden, initial shown in header |
| Resize to < 768px | Sidebar hidden, bottom tab bar visible |
| Mobile — all 5 tabs present | Dashboard, Cases, Clients, Calendar, Docs |
| Click user row in sidebar | Popover opens with name, email, Log out button |
| Click Log out | Cookie cleared, redirected to `/login` |
| Refresh page on `/dashboard` | Sidebar still shows user info (auth rehydration works) |
| Navigate to `/login` while logged in | Redirects to `/dashboard` |
| Open `/cases` while logged out | Redirects to `/login` |

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(protected\)/cases/page.tsx
git commit -m "feat: add cases stub page"
```
