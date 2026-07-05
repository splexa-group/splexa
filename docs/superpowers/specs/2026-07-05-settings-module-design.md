# Settings Module — Design Spec
**Date:** 2026-07-05
**Branch:** feat/documents (to be merged; settings continues on a new branch)
**Phase:** 1

---

## Overview

A `/settings` page with two tabs — **Profile** and **Subscription** — following the exact same tab pattern as the case detail module. Profile covers the user's personal details and their firm's details. Subscription is a static free-plan card with no backend.

The Settings nav item already exists in `nav-items.ts`. No new Prisma migrations are needed — all fields already exist on `User` and `Organization`.

---

## Routing & Navigation

| URL | Renders |
|---|---|
| `/settings` | Profile tab (default) |
| `/settings?tab=profile` | Profile tab |
| `/settings?tab=subscription` | Subscription tab |

Tab state is driven entirely by `?tab=` search param — same mechanism as `?tab=` on case detail pages. Uses the existing `useActiveTab` hook with a settings-specific default of `"profile"`.

No sub-tabs. `TabsNav` is used with primary tabs only.

---

## File Structure

### Frontend

| File | Purpose |
|---|---|
| `src/enums/settings-tabs.ts` | `SettingsTabs { PROFILE="profile", SUBSCRIPTION="subscription" }` |
| `src/config/settings-tabs.ts` | `SETTINGS_TAB_CONFIG: TabConfig[]` — two entries, no subTabs |
| `src/app/(protected)/settings/page.tsx` | Reads `searchParams`, renders `<TabsNav>` + tab content switch |
| `src/types/settings.ts` | `ProfileData`, `OrganizationData`, API response types |
| `src/services/settings.ts` | `settingsApi` — four functions (get/update profile, get/update org) |
| `src/hooks/use-settings.ts` | `useProfile`, `useUpdateProfile`, `useOrganization`, `useUpdateOrganization` |
| `src/components/settings/profile-tab.tsx` | Renders My Details + Firm Details sections with a shared Save footer |
| `src/components/settings/my-details-section.tsx` | Form section for user fields |
| `src/components/settings/firm-details-section.tsx` | Form section for org fields |
| `src/components/settings/subscription-tab.tsx` | Static free-plan card |

### Backend

New module at `apps/server/src/modules/settings/`:

| File | Purpose |
|---|---|
| `schema.ts` | Zod schemas for update bodies |
| `repository.ts` | Prisma reads/writes for User and Organization |
| `service.ts` | Business logic — thin pass-through for Phase 1 |
| `controller.ts` | Request handlers |
| `routes.ts` | Route registration with `authenticate` preHandler |
| `plugin.ts` | Fastify plugin wrapping routes |

Plugin registered in the main server alongside existing modules.

---

## Backend

### Endpoints

| Method | Path | Body / Response |
|---|---|---|
| `GET` | `/api/v1/settings/profile` | — / `{ data: ProfileData }` |
| `PATCH` | `/api/v1/settings/profile` | `UpdateProfileBody` / `{ data: ProfileData }` |
| `GET` | `/api/v1/settings/organization` | — / `{ data: OrganizationData }` |
| `PATCH` | `/api/v1/settings/organization` | `UpdateOrganizationBody` / `{ data: OrganizationData }` |

All four require the `authenticate` preHandler. `orgId` and `userId` come from `req.user` (JWT) only.

### Zod Schemas (`schema.ts`)

```ts
const updateProfileBodySchema = z.object({
  firstName:   z.string().min(1).max(100),
  lastName:    z.string().min(1).max(100),
  phoneNumber: z.string().min(1).max(20),
  designation: z.nativeEnum(Designation),
}).strict()

const updateOrganizationBodySchema = z.object({
  name:          z.string().min(1).max(200),
  city:          z.string().min(1).max(100),
  practiceTypes: z.array(z.nativeEnum(PracticeType)).min(1),
}).strict()
```

### Repository (`repository.ts`)

```ts
getProfile(userId, orgId)         → User | null
updateProfile(userId, orgId, data) → User
getOrganization(orgId)             → Organization | null
updateOrganization(orgId, data)    → Organization
```

All queries filter by both `userId`/`orgId` as relevant — no cross-tenant access.

### Service (`service.ts`)

- `getProfile` — calls `getProfile`, throws `NotFoundError` on null
- `updateProfile` — calls `updateProfile`
- `getOrganization` — calls `getOrganization`, throws `NotFoundError` on null
- `updateOrganization` — calls `updateOrganization`

No `logActivity` calls for Phase 1 (settings changes are not case-level events).

### Controller (`controller.ts`)

Each handler reads `req.user.orgId` / `req.user.userId` from JWT, delegates to service, returns `{ data: result }`.

---

## Frontend

### Types (`types/settings.ts`)

```ts
interface ProfileData {
  id: string
  firstName: string
  lastName: string
  email: string        // read-only in UI
  phoneNumber: string
  designation: Designation
  role: UserRole       // read-only in UI
}

interface OrganizationData {
  id: string
  name: string
  city: string
  practiceTypes: PracticeType[]
}
```

### React Query Keys & Hooks (`hooks/use-settings.ts`)

```ts
export const settingsKeys = {
  profile:      () => ["settings", "profile"] as const,
  organization: () => ["settings", "organization"] as const,
}

useProfile()           → useQuery  → GET /settings/profile
useUpdateProfile()     → useMutation → PATCH /settings/profile
useOrganization()      → useQuery  → GET /settings/organization
useUpdateOrganization() → useMutation → PATCH /settings/organization
```

### Page (`app/(protected)/settings/page.tsx`)

```tsx
"use client"
// reads ?tab= via useActiveTab(SETTINGS_TAB_CONFIG, SettingsTabs.PROFILE)
// renders:
//   <TabsNav tabs={SETTINGS_TAB_CONFIG} activeTab={...} onNavigate={...} />
//   <div className="flex-1 overflow-y-auto bg-page">
//     {tab === "profile"      && <ProfileTab />}
//     {tab === "subscription" && <SubscriptionTab />}
//   </div>
```

`usePageTitle({ title: "Settings" })` — no action button needed.

### Profile Tab (`components/settings/profile-tab.tsx`)

Two `<Section>` blocks inside a `react-hook-form` `<FormProvider>`. Single `<PageFooter>` with a Save button that fires both mutations in sequence (profile first, then org).

On successful save: invalidate `settingsKeys.profile()` and `settingsKeys.organization()`. If `orgName` is stored in the Zustand auth store, update it after the org mutation succeeds.

#### My Details Section

```
<Section title="My Details" cols={2}>
  firstName  | lastName
  phoneNumber | designation (Select)
  email (read-only, full width, lock icon)
  role  (read-only badge, full width)
</Section>
```

`email` and `role` rendered as read-only display rows — not form inputs. A small note under email: `"Email cannot be changed."`.

#### Firm Details Section

```
<Section title="Firm Details" cols={2}>
  name (full width)
  city | — (single col)
  practiceTypes (MultiSelect, full width)
</Section>
```

### Subscription Tab (`components/settings/subscription-tab.tsx`)

Static — no hooks, no API calls.

```
<div className="px-4 md:px-6 py-6">
  <div className="max-w-sm border border-line rounded-lg bg-card p-6 space-y-4">
    <div>
      <p class="text-xs text-secondary uppercase tracking-wide">Current Plan</p>
      <h2 class="text-lg font-semibold text-dark">Free</h2>
    </div>
    <ul class="space-y-2 text-sm text-body">
      ✓ Unlimited cases
      ✓ Hearing reminders
      ✓ Document storage
      ✓ Up to 3 team members
    </ul>
    <Button variant="primary" disabled title="Coming soon">
      Upgrade Plan
    </Button>
  </div>
</div>
```

---

## What Is Explicitly Out of Scope (Phase 1)

- Role-based edit restrictions (all users can edit all fields for now)
- Email change / reverification flow
- Team member management (invite, remove, role change)
- Notification / reminder preferences
- Billing integration
- Password management (OTP-based auth, no passwords)
- Data export
- Appearance / theme settings
