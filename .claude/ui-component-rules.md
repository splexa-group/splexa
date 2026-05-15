# Component Design Rules — Splexa UI

## Component Hierarchy

```
ui/           → Primitive, stateless, zero business logic
components/   → Feature components, composed from ui/
layout/       → App shell (sidebar, nav, page wrapper)
shared/       → Cross-feature, non-primitive components
```

The dependency direction is strictly one-way:

- `ui/` depends on nothing internal
- Feature components depend on `ui/`
- `layout/` depends on `ui/`
- Nothing depends on feature components of another feature

---

## `ui/` — Primitive Components

These are the building blocks. They have no knowledge of Splexa domain concepts. They could be dropped into any project.

Rules for `ui/` components:

1. Purely presentational — no data fetching, no business logic, no Zustand
2. All styling via Tailwind + CSS component classes — no inline styles
3. Fully typed props
4. Handle all their own states: loading, disabled, error display
5. Support `className` prop for extension when needed (but the caller should not need to override basic styles — if they do, the `ui/` component needs a variant)

### Standard UI Components for Splexa

```
components/ui/
├── button.tsx           # Variants: primary (cta), secondary (accent), ghost, danger
├── input.tsx            # Text input with label, error message, helper text
├── textarea.tsx
├── select.tsx
├── checkbox.tsx
├── badge.tsx            # Variants: active, adjourned, closed, today, overdue
├── card.tsx             # Base card wrapper
├── modal.tsx            # Portal-based modal with backdrop
├── drawer.tsx           # Mobile slide-up drawer (used for quick actions)
├── spinner.tsx          # Loading spinner — small, medium, large
├── toast.tsx            # Success/error/info toasts
├── empty-state.tsx      # Empty list state with icon, message, CTA
├── avatar.tsx           # Initials + optional photo
├── countdown-badge.tsx  # TODAY / TOMORROW / N days / OVERDUE
└── skeleton.tsx         # Loading skeleton for cards and lists
```

### Button Component Example

```tsx
// components/ui/button.tsx
"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[variantClasses[variant], sizeClasses[size], className]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </button>
  );
}
```

```css
/* globals.css — component classes for Button */
@layer components {
  .btn-primary {
    @apply bg-cta text-white font-semibold rounded-input;
    @apply hover:bg-cta/90 active:scale-95 transition-all;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    @apply min-h-[44px] px-4;
  }
  .btn-secondary {
    @apply bg-transparent text-accent border border-accent font-semibold rounded-input;
    @apply hover:bg-accent/10 active:scale-95 transition-all;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    @apply min-h-[44px] px-4;
  }
  .btn-ghost {
    @apply bg-transparent text-primary font-medium rounded-input;
    @apply hover:bg-primary/5 active:scale-95 transition-all;
    @apply min-h-[44px] px-4;
  }
  .btn-danger {
    @apply bg-danger text-white font-semibold rounded-input;
    @apply hover:bg-danger/90 active:scale-95 transition-all;
    @apply min-h-[44px] px-4;
  }
  .btn-sm {
    @apply text-sm px-3 min-h-[36px];
  }
  .btn-md {
    @apply text-sm;
  }
  .btn-lg {
    @apply text-base px-6 min-h-[52px];
  }
}
```

---

## Feature Components

Feature components compose `ui/` components and know about the Splexa domain.

### Case Card

```tsx
// components/cases/case-card.tsx
import type { Case, Hearing } from "@splexa/shared";
import { Badge } from "@/components/ui/badge";
import { CountdownBadge } from "@/components/ui/countdown-badge";

interface CaseCardProps {
  case_: Case & { nextHearing?: Hearing };
  onQuickAction: (
    action: "edit" | "archive" | "addHearing",
    caseId: string,
  ) => void;
}

export function CaseCard({ case_, onQuickAction }: CaseCardProps) {
  return (
    <div className="case-card">
      <div className="case-card__header">
        <span className="case-card__client-name">{case_.client.name}</span>
        <Badge
          variant={
            case_.status.toLowerCase() as "active" | "adjourned" | "closed"
          }
        >
          {case_.status}
        </Badge>
      </div>
      {/* ... */}
    </div>
  );
}
```

```css
/* globals.css */
@layer components {
  .case-card {
    @apply bg-card rounded-card border border-gray-200 p-4;
    @apply hover:shadow-md transition-shadow duration-200 cursor-pointer;
  }
  .case-card__header {
    @apply flex items-start justify-between gap-2 mb-2;
  }
  .case-card__client-name {
    @apply text-base font-semibold text-primary leading-tight;
  }
}
```

---

## State Management in Components

### When to use what

| State Type                        | Solution                          |
| --------------------------------- | --------------------------------- |
| Local UI state (open/closed, tab) | `useState`                        |
| Server data (cases, hearings)     | React Query `useQuery`            |
| Mutations (create, update)        | React Query `useMutation`         |
| Auth session                      | Zustand `useAuthStore`            |
| Global UI (sidebar, toasts)       | Zustand                           |
| Form state                        | Controlled inputs with `useState` |

### No `useEffect` for Data Fetching

```tsx
// ❌ Never do this
const [cases, setCases] = useState([]);
useEffect(() => {
  fetch("/api/cases")
    .then((r) => r.json())
    .then(setCases);
}, []);

// ✅ Use React Query
const { data: cases, isLoading } = useCases(filters);
```

---

## Loading and Error States — Always Handle

Every component that fetches data must handle all states:

```tsx
export function CaseList({ filters }: CaseListProps) {
  const { data: cases, isLoading, isError } = useCases(filters);

  if (isLoading) return <CaseListSkeleton />;

  if (isError)
    return (
      <EmptyState
        icon="alert"
        message="Could not load cases. Please try again."
        action={{ label: "Retry", onClick: () => refetch() }}
      />
    );

  if (!cases || cases.length === 0)
    return (
      <EmptyState
        icon="briefcase"
        message="No cases yet."
        action={{ label: "Add Your First Case", href: "/cases/new" }}
      />
    );

  return (
    <div className="case-list">
      {cases.map((case_) => (
        <CaseCard
          key={case_.id}
          case_={case_}
          onQuickAction={handleQuickAction}
        />
      ))}
    </div>
  );
}
```

Never render `undefined` silently — always show the user something meaningful.

---

## Form Design

Forms follow these rules:

1. Validate on `blur` (when user leaves a field), not only on submit
2. Show inline error messages below each field — not a toast for validation errors
3. Submit button is disabled and shows spinner while submitting
4. On success: show a success toast, redirect or reset the form as appropriate
5. On error: show the error inline or as a toast, keep form data intact

```tsx
// Pattern for form submission
const createCase = useCreateCase();

async function handleSubmit() {
  try {
    await createCase.mutateAsync(formData);
    toast.success("Case created successfully");
    router.push("/cases");
  } catch (error) {
    // Error is already handled by React Query, shown in UI
  }
}

<Button
  onClick={handleSubmit}
  isLoading={createCase.isPending}
  disabled={!isValid}
>
  Create Case
</Button>;
```

---

## Responsive Design — The Contract for Every Component

Every component must work correctly on both mobile and desktop. This is not a post-build polish step — it is part of building the component. Advocates use this product on phones in court corridors. A component that only works on desktop is an incomplete component.

### The Responsive Contract

Apply these rules to every component before declaring it done:

| Rule | Mobile (`< md`) | Desktop (`md+`) |
|---|---|---|
| Layout direction | Column (`flex-col`) | Row (`lg:flex-row`) |
| Navigation | Bottom tab bar — `bottom-nav` | Left sidebar — `sidebar` |
| Action surfaces | Slide-up bottom drawer | Centered modal |
| Lists | Full-width stacked cards | Grid or table rows |
| Contextual menus | Full-screen or bottom sheet | Dropdown or popover |
| Tap targets | `min-h-[44px] min-w-[44px]` on every interactive element | Same |
| Body text | `text-base` (16px) minimum | Same |

### Mobile Rules — Applied to Every Component

1. **Minimum tap target**: `min-h-[44px] min-w-[44px]` on all interactive elements — buttons, links, list rows, icon buttons
2. **Touch feedback**: `active:scale-95` or `active:bg-*` on every touchable element — no invisible taps
3. **Readable text**: `text-base` (16px) minimum for body text on mobile — never `text-xs` for information the user must read
4. **Smooth scroll**: `-webkit-overflow-scrolling: touch` on all scrollable list containers for iOS momentum scroll
5. **No horizontal overflow**: every element uses `w-full`, `max-w-full`, or is constrained — zero horizontal scroll
6. **Safe area insets**: fixed bottom elements (nav bar, action buttons) use `pb-safe` / `env(safe-area-inset-bottom)` for notch/home-bar clearance on iOS

### CSS Pattern — Mobile-First Always

```css
/* ✅ Mobile-first — start small, expand up */
.case-list {
  @apply flex flex-col gap-3;        /* mobile: stacked */
}
@screen md {
  .case-list {
    @apply grid grid-cols-2 gap-4;   /* tablet: 2-column grid */
  }
}
@screen lg {
  .case-list {
    @apply grid-cols-3;               /* desktop: 3-column grid */
  }
}

/* ❌ Desktop-first — inverts the cascade, breaks mobile */
.case-list {
  @apply grid grid-cols-3;
}
@screen sm {
  .case-list { @apply grid-cols-1; }
}
```

### Drawer vs Modal — When to Use Which

| Context | Mobile | Desktop |
|---|---|---|
| Add hearing form | Slide-up drawer (full-screen) | Modal |
| Quick status update | Slide-up drawer (half-screen) | Inline popover |
| Confirmation (archive, delete) | Bottom sheet | Centered modal |
| Full record creation | Full-page route | Modal or side panel |

### Navigation Structure

```tsx
/* The layout renders the correct nav for each breakpoint — components do not decide this */
<div className="hidden lg:block">
  <Sidebar />              {/* Desktop only */}
</div>
<div className="lg:hidden fixed bottom-0 w-full">
  <BottomNav />            {/* Mobile only */}
</div>
```

Individual feature components never render navigation. They render content only, and the layout shell handles nav placement.

---

## Accessibility

Keep accessibility simple but correct:

- All interactive elements are `<button>` or `<a>` — not `<div onClick>`
- Form inputs have associated `<label>` elements
- Images have `alt` text
- Focus ring is visible — do not remove `outline` without an alternative
- Error messages are associated with their inputs via `aria-describedby`
- Modal has `role="dialog"` and `aria-modal="true"` and traps focus

---

## Component File Structure

Each component file follows this order:

```tsx
'use client'; // if needed — only if using hooks or event handlers

// Imports (grouped, blank lines between groups)
import { useState } from 'react';
import type { Case } from '@splexa/shared';
import { Button } from '@/components/ui/button';

// Types/interfaces (local to this file)
interface CaseCardProps {
  case_: Case;
  onArchive?: (id: string) => void;
}

// Main component (default or named export)
export function CaseCard({ case_, onArchive }: CaseCardProps) {
  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Derived values
  const isOverdue = new Date(case_.nextHearing) < new Date();

  // Handlers
  function handleArchive() {
    onArchive?.(case_.id);
  }

  // Render
  return (
    <div className="case-card">
      {/* ... */}
    </div>
  );
}

// Sub-components (only if small and tightly coupled, otherwise separate file)
function CaseCardMenu({ ... }) { ... }
```

---

## Forbidden — UI Components

| Forbidden | Why |
|---|---|
| `useEffect` + `fetch` for server data | Use React Query `useQuery` — hooks handle loading/error/cache |
| Raw `fetch(...)` in any component or hook | Use the typed client from `lib/api/` |
| `localStorage.setItem('token', ...)` | Tokens in Zustand (memory) only |
| `'use client'` on a page file | Default to Server Component; push the boundary down to the leaf |
| `<div onClick={...}>` for interactive elements | Use `<button>` or `<a>` — required for accessibility |
| Inline `style={{}}` for static values | Use Tailwind classes or CSS component classes |
| More than 4 Tailwind classes on one element | Extract to a CSS component class in `globals.css` |
| Raw hex colors (`#1A1A2E`) in className | Use design token classes (`text-primary`, `bg-cta`) |
| Interactive element without `min-h-[44px]` | Touch target too small — fails mobile UX standard |
| Rendering `null` or `undefined` silently on error | Always show loading skeleton, error state, or empty state |
| `any` type in component props | Fix the prop type — use the domain type from `@splexa/shared` |
| Importing from another feature's components | Features are independent — share only through `ui/` or `shared/` |

---

## AI Agent Self-Check — UI Components

Before declaring a component complete:

**Data fetching**
- [ ] Server data uses React Query (`useQuery`, `useMutation`) — no `useEffect` + `fetch`
- [ ] API calls go through `lib/api/` typed client — no raw `fetch`
- [ ] Loading state renders `<Skeleton />` or `<Spinner />`
- [ ] Error state renders `<EmptyState />` with a retry or fallback
- [ ] Empty list renders `<EmptyState />` with a CTA

**Forms**
- [ ] Submit button is disabled and shows spinner while `mutation.isPending`
- [ ] Validation errors show inline below each field, not as a toast
- [ ] Form data is preserved on error (not reset)

**Mobile**
- [ ] All interactive elements have `min-h-[44px]`
- [ ] No fixed-width element wider than the viewport

**Accessibility**
- [ ] All interactive elements are `<button>` or `<a>` — not `<div onClick>`
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages linked to inputs via `aria-describedby`

**Styling**
- [ ] Color values use design tokens, not raw hex
- [ ] Elements with 5+ Tailwind classes use a CSS component class in `globals.css`
- [ ] `'use client'` only on components that actually use hooks or event handlers
