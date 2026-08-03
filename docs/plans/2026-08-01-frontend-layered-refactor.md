# Frontend Layered-Structure Cleanup Implementation Plan

> **Note (2026-08-01, after this plan executed):** a follow-up conversational request renamed `lib/` → `utils/` and split a few mixed-concern files (`utils.ts` → `tailwind.ts`/`iso-date.ts`; presentation-only style/icon lookups moved back to live next to their components instead of in the helper folder). This plan's Task 1 and Task 6 below still describe the `lib/` name — `.claude/architecture.md` and `.claude/frontend-rules.md` reflect the current `utils/` reality; this plan file is left as the historical record of what was actually executed at the time.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the frontend cleanup on the existing layered (type-based) folder structure — `hooks/`, `services/`, `types/` flat at the top level, `components/[name]/` for per-feature UI — after reverting an earlier feature-based (`features/[name]/`) reorganization attempt. Fixes the concrete layout, tab-hook, and thin-page issues found earlier without changing the folder philosophy this time.

**Architecture:** No files move between top-level folder *kinds* in this plan — `hooks/`, `services/`, `types/`, `mappers/` stay flat with one file per feature; `components/[name]/` stays nested by feature, exactly as it already is. The only relocations are: `constants/options.ts` → a helper location (it mixes functions with data, so it doesn't belong in `constants/`), and the `config/[x]-tabs.ts` + `enums/[x]-tabs.ts` pairs merging into `constants/[x]-tabs.ts` (pure data + enums, a correct fit for `constants/`). Everything else is new code added in place: `PageLayout` usage, thin-page view extraction, and the tab-hook fix.

**Tech Stack:** Next.js 16 App Router, TypeScript (strict), Tailwind v4, React Query v5, Zustand, pnpm/Turborepo monorepo.

## Background — Why This Plan Exists

An earlier plan (`docs/plans/2026-08-01-frontend-feature-restructure.md`, spec at `docs/specs/2026-08-01-frontend-feature-restructure-design.md`) moved `hooks/`, `services/`, `types/`, and `components/[name]/` into `features/[name]/{hooks,services,types,components}` folders (Tasks 3–10, now reverted). After reviewing the result, feature-based was rejected in favor of keeping the original layered structure. The branch was reset to commit `02e61c2` (end of that plan's Task 2), which kept everything from Tasks 1–2 that was independent of the feature-vs-layered decision:
- `apps/web/package.json` has a `typecheck` script (`tsc --noEmit`).
- `components/layout/page-layout.tsx` exists (`PageLayout`, prop API below).
- `lib/options.ts` was moved to `constants/options.ts` — **this plan undoes that specific move** (see Global Constraints), since the file mixes functions with data.
- `components/modals/modal.tsx` + `confirm-delete.tsx` moved to `components/shared/`.
- `components/layout/sidebar/nav-items.ts` had its dead commented-out line removed and quotes normalized.

Everything this plan still needs to do was originally scoped as Tasks 9–13 of that plan, adapted here to apply to the existing flat/nested locations instead of moving anything into `features/`.

## Global Constraints

- `orgId` handling, backend layering, and all backend rules are untouched — this plan is frontend-only.
- No `any`, no `!`, no `@ts-ignore` in any new or edited code.
- Frontend files stay kebab-case.
- No raw `fetch`/`axios` in components or hooks; all API calls stay behind `services/[feature].ts` → `api/http.ts` → `api/client.ts`.
- No `useEffect` for server data — React Query only.
- Toast calls for API outcomes (`onSuccess`/`onError`) stay in the feature's hook file, never in a component.
- Comments in any new/edited code: minimal, only where something genuinely isn't obvious — no restating what a line already says.
- **`constants/` holds plain data only — string/number/object/array literals and enums. No functions.** A file that mixes both (like `options.ts`, which has `formatEnumLabel`, `toOptions`, `withNone` alongside its option-list constants) belongs in a helper location, not `constants/`.
- Every task must leave `pnpm --filter web typecheck` passing, verified **against the committed state with a clean working tree** — a repeated failure mode during the earlier (reverted) plan was an implementer verifying against an uncommitted local fix instead of the actual commit. Always: commit first, then `git status --short` (expect clean) and `pnpm --filter web typecheck` (expect pass) on that commit.
- `sed -i ''` (note the empty string argument) is required on this machine's BSD `sed`.
- `PageLayout`'s prop API (already built, in `components/layout/page-layout.tsx`) is exactly: `maxWidth?: "small" | "medium" | "large" | "full"` (default `"medium"`), `padded?: boolean` (default `true`), `children`, `className?`. `padded={false}` means `PageLayout` contributes only the max-width cap — used when the content already owns its own gutter (a `FiltersBar` + `DataTable` pair).
- Component/hook/service/type files are not renamed except two documented exceptions in the cases task below (`CaseDetails` → `CaseDetailView`, `CaseTabs` → `CaseDetailTabs`), both forced by a real naming collision or a default-export inconsistency — not style preference. A helper/util file may be renamed if its current name doesn't describe its contents, provided every import is updated and the rename is reported.
- **Feature isolation**, same rule as the original spec: a component doesn't import another feature's internals directly except (A) a hook invalidating another feature's query-key factory when genuinely coupled, and (B) the one orchestrator view for a route that's inherently a composite of several features (`CaseDetailView` composing hearings/important-dates/client/documents; `DashboardView` importing cases' `CreateCaseModal` for its own action button).

---

### Task 1: Move `options.ts` out of `constants/` into a helper location

**Files:**
- Move: `apps/web/src/constants/options.ts` → `apps/web/src/lib/options.ts`
- Modify: every current consumer's import path

**Interfaces:**
- Produces: `@/lib/options` — replaces `@/constants/options` as the import path for `DESIGNATION_OPTIONS`, `PRACTICE_TYPE_OPTIONS`, `CASE_TYPE_OPTIONS`, `CASE_STATUS_OPTIONS`, `CASE_STAGE_OPTIONS`, `COURT_TYPE_OPTIONS`, `PRIORITY_OPTIONS`, `PARTY_ROLE_OPTIONS`, `CLIENT_TYPE_OPTIONS`, `HEARING_PURPOSE_OPTIONS`, `HEARING_STATUS_OPTIONS`, `IMPORTANT_DATE_TYPE_OPTIONS`, `PREFERRED_LANGUAGE_OPTIONS`, `RELATION_TYPE_OPTIONS`, `formatEnumLabel`, `toOptions`, `withNone`.

**Reasoning:** `options.ts` mixes three functions (`formatEnumLabel`, `toOptions`, `withNone`) with plain constant arrays — per this plan's Global Constraints, that mix doesn't belong in `constants/`, which is data-only. `lib/` is the existing home for exactly this kind of generic helper (it already holds `utils.ts`, `calendar.ts`, `format-date-label.ts`), so this is a straight move back to where it was before the (reverted) feature-based plan relocated it.

- [ ] **Step 1: Move the file**

```bash
git mv apps/web/src/constants/options.ts apps/web/src/lib/options.ts
rmdir apps/web/src/constants 2>/dev/null || true
```

(`rmdir` only succeeds if `constants/` is now empty — it will be, since `options.ts` was its only file. If Task 3 or 4 below hasn't run yet, `constants/` may not exist at all yet in a from-scratch execution; either way this command is safe to run.)

- [ ] **Step 2: Fix every consumer's import path**

```bash
cd apps/web/src
grep -rl '@/constants/options' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/constants/options#@/lib/options#g'
```

- [ ] **Step 3: Verify**

Run: `grep -rl '@/constants/options' apps/web/src` — expect no output.
Commit first, then run: `git status --short` (expect clean) and `pnpm --filter web typecheck` (expect pass).

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/lib apps/web/src/constants
git add -u
git commit -m "refactor(web): move options.ts back to lib/ — mixes functions with data, not a fit for constants/"
```

---

### Task 2: Dashboard — thin-page extraction + `PageLayout`

**Files:**
- Create: `apps/web/src/components/dashboard/dashboard-view.tsx`
- Modify: `apps/web/src/app/(protected)/dashboard/page.tsx` (becomes thin)

**Interfaces:**
- Consumes: `PageLayout` from `@/components/layout/page-layout`; `CreateCaseModal` from `@/components/modals/create-case` (Exception B — dashboard is an orchestrator view importing another feature's modal for its own action button).
- Produces: `DashboardView` — exported for `page.tsx` to render.

- [ ] **Step 1: Extract the page body into `DashboardView`**

Read the current `apps/web/src/app/(protected)/dashboard/page.tsx` first to confirm it matches what's described here (it should be unchanged since before the reverted plan touched it).

Create `apps/web/src/components/dashboard/dashboard-view.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { AlertCircle, Briefcase, Calendar, CalendarCheck } from "lucide-react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { PageLayout } from "@/components/layout/page-layout";
import { CreateCaseModal } from "@/components/modals/create-case";
import { StatCard } from "./stat-card";
import { UpcomingHearings } from "./upcoming-hearings";
import { AttentionNeeded } from "./attention-needed";
import { useDashboard } from "@/hooks/use-dashboard";

export function DashboardView() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const { data, isError } = useDashboard();

  usePageTitle({
    title: "Dashboard",
    action: { label: "Add New Case", onClick: openModal },
  });

  return (
    <>
      <PageLayout maxWidth="large" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Cases" value={data?.stats.activeCases} icon={Briefcase} />
          <StatCard label="Today's Hearings" value={data?.stats.hearingsToday} icon={CalendarCheck} />
          <StatCard label="This Week" value={data?.stats.hearingsThisWeek} icon={Calendar} />
          <StatCard label="Upcoming Deadlines" value={data?.stats.upcomingDeadlines} icon={AlertCircle} />
        </div>

        {isError && (
          <p className="text-sm text-negative text-center py-8">
            Failed to load dashboard. Please refresh the page.
          </p>
        )}

        {!isError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingHearings hearings={data?.upcomingHearings} />
            <AttentionNeeded
              deadlines={data?.upcomingDeadlines}
              highPriorityCases={data?.highPriorityCases}
            />
          </div>
        )}
      </PageLayout>

      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
```

Replace `apps/web/src/app/(protected)/dashboard/page.tsx` entirely with:

```tsx
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function Page() {
  return <DashboardView />;
}
```

- [ ] **Step 2: Verify**

Commit first, then run: `git status --short` (expect clean) and `pnpm --filter web typecheck` (expect pass, zero errors — there is no cross-task dependency gap this time since cases' `CreateCaseModal` already exists at its current location).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/dashboard-view.tsx "apps/web/src/app/(protected)/dashboard/page.tsx"
git commit -m "refactor(web): extract DashboardView, wire PageLayout"
```

---

### Task 3: Settings — tabs merge + thin-page extraction + `PageLayout`

**Files:**
- Merge: `apps/web/src/config/settings-tabs.ts` + `apps/web/src/enums/settings-tabs.ts` → `apps/web/src/constants/settings-tabs.ts`
- Create: `apps/web/src/components/settings/settings-view.tsx`
- Modify: `apps/web/src/app/(protected)/settings/page.tsx` (becomes thin), `apps/web/src/components/settings/profile-tab.tsx` (swap `PageContent` → `PageLayout`)

**Interfaces:**
- Consumes: `PageLayout` from Task 1's sibling infra (already exists).
- Produces: `SettingsView`, `@/constants/settings-tabs` (`SETTINGS_TAB_CONFIG`, `SettingsTabs`).

- [ ] **Step 1: Merge the tabs config into one file**

```bash
mkdir -p apps/web/src/constants
git rm apps/web/src/config/settings-tabs.ts apps/web/src/enums/settings-tabs.ts
rmdir apps/web/src/config apps/web/src/enums 2>/dev/null || true
```

Create `apps/web/src/constants/settings-tabs.ts`:

```ts
import type { TabConfig } from "@/components/layout/tabs-nav";

export enum SettingsTabs {
  PROFILE      = "profile",
  SUBSCRIPTION = "subscription",
}

export const SETTINGS_TAB_CONFIG: TabConfig[] = [
  { id: SettingsTabs.PROFILE,      label: "Profile" },
  { id: SettingsTabs.SUBSCRIPTION, label: "Subscription" },
];
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/config/settings-tabs' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/config/settings-tabs#@/constants/settings-tabs#g'
grep -rl '@/enums/settings-tabs' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/enums/settings-tabs#@/constants/settings-tabs#g'
```

If any file ends up with two import statements both resolving to `@/constants/settings-tabs`, merge them into one by hand.

- [ ] **Step 3: Extract the page body into `SettingsView`**

Read the current `apps/web/src/app/(protected)/settings/page.tsx` first (it should still have the same 133-line body from before the reverted plan touched it).

Create `apps/web/src/components/settings/settings-view.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { SETTINGS_TAB_CONFIG, SettingsTabs } from "@/constants/settings-tabs";
import { useActiveTab } from "@/hooks/use-active-tab";
import {
  useOrganization,
  useProfile,
  useUpdateOrganization,
  useUpdateProfile,
} from "@/hooks/use-organization";
import { useAuthStore } from "@/store/auth-store";
import { ProfileTab, settingsFormSchema, type SettingsFormValues } from "./profile-tab";
import { SubscriptionTab } from "./subscription-tab";

export function SettingsView() {
  const router     = useRouter();
  const activeTab  = useActiveTab(SETTINGS_TAB_CONFIG, SettingsTabs.PROFILE);

  usePageTitle({ title: "Settings" });

  const { data: profile,      isLoading: profileLoading }      = useProfile();
  const { data: organization, isLoading: orgLoading }          = useOrganization();
  const updateProfile      = useUpdateProfile();
  const updateOrganization = useUpdateOrganization();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      firstName:     "",
      lastName:      "",
      phoneNumber:   "",
      designation:   undefined,
      orgName:       "",
      city:          "",
      practiceTypes: [],
    },
  });

  useEffect(() => {
    if (profile && organization) {
      form.reset({
        firstName:     profile.firstName,
        lastName:      profile.lastName,
        phoneNumber:   profile.phoneNumber,
        designation:   profile.designation,
        orgName:       organization.name,
        city:          organization.city,
        practiceTypes: organization.practiceTypes,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, organization]);

  const isSaving   = updateProfile.isPending || updateOrganization.isPending;
  const isLoading  = profileLoading || orgLoading;
  const isDisabled = isSaving || isLoading;

  async function onSubmit(values: SettingsFormValues) {
    try {
      await updateProfile.mutateAsync({
        firstName:   values.firstName,
        lastName:    values.lastName,
        phoneNumber: values.phoneNumber,
        designation: values.designation,
      });
      const updatedOrg = await updateOrganization.mutateAsync({
        name:          values.orgName,
        city:          values.city,
        practiceTypes: values.practiceTypes,
      });
      const currentUser = useAuthStore.getState().user;
      if (currentUser && "org" in currentUser) {
        useAuthStore.getState().setAuth({
          ...currentUser,
          org: { ...currentUser.org, name: updatedOrg.name },
        });
      }
    } catch {
      // onError handlers in mutations show the toast
    }
  }

  function handleNavigate(tabId: string) {
    router.push(`/settings?tab=${tabId}`);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabsNav
        tabs={SETTINGS_TAB_CONFIG}
        activeTab={activeTab}
        activeSubTab=""
        onNavigate={handleNavigate}
      />

      <div className="flex-1 overflow-y-auto bg-page">
        {activeTab === SettingsTabs.PROFILE && (
          <ProfileTab
            form={form}
            email={profile?.email ?? ""}
            role={profile?.role ?? ""}
            isLoading={isLoading}
          />
        )}
        {activeTab === SettingsTabs.SUBSCRIPTION && <SubscriptionTab />}
      </div>

      {activeTab === SettingsTabs.PROFILE && (
        <PageFooter
          right={
            <Button
              variant="primary"
              size="sm"
              disabled={isDisabled}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          }
        />
      )}
    </div>
  );
}
```

Replace `apps/web/src/app/(protected)/settings/page.tsx` with:

```tsx
import { SettingsView } from "@/components/settings/settings-view";

export default function Page() {
  return <SettingsView />;
}
```

- [ ] **Step 4: Swap `PageContent` for `PageLayout` in `profile-tab.tsx`**

In `apps/web/src/components/settings/profile-tab.tsx`:
- Change the import from `import { PageContent } from "@/components/layout/page-content";` to `import { PageLayout } from "@/components/layout/page-layout";`
- Change both `<PageContent width="md" className="space-y-6">` occurrences (the loading-skeleton one and the real-form one) to `<PageLayout maxWidth="medium" className="space-y-6">`, and their matching closing tags to `</PageLayout>`.

- [ ] **Step 5: Verify**

Commit first, then run: `git status --short` (expect clean) and `pnpm --filter web typecheck` (expect pass).

- [ ] **Step 6: Commit**

```bash
git add -A apps/web/src/constants apps/web/src/config apps/web/src/enums apps/web/src/components/settings "apps/web/src/app/(protected)/settings"
git commit -m "refactor(web): merge settings tabs config, extract SettingsView, wire PageLayout"
```

---

### Task 4: Cases — tabs merge + tab-hook-leak fix + `CaseDetailView`/`CaseDetailTabs` + `CasesView` + `PageLayout`

**Files:**
- Merge: `apps/web/src/config/case-tabs.ts` + `apps/web/src/enums/case-tabs.ts` → `apps/web/src/constants/case-tabs.ts`
- Modify: `apps/web/src/hooks/use-active-tab.ts` (remove `useCaseActiveTab`/`useCaseActiveSubTab`)
- Rename + rewrite: `apps/web/src/app/(protected)/cases/[caseId]/case-tabs.tsx` → `apps/web/src/components/cases/case-detail-tabs.tsx` (`CaseDetailTabs`)
- Rename + rewrite: `apps/web/src/app/(protected)/cases/[caseId]/case-details.tsx` → `apps/web/src/components/cases/case-detail-view.tsx` (`CaseDetailView`)
- Create: `apps/web/src/components/cases/cases-view.tsx`
- Modify: `apps/web/src/app/(protected)/cases/page.tsx`, `apps/web/src/app/(protected)/cases/[caseId]/page.tsx` (both become thin)
- Modify: `apps/web/src/app/(protected)/cases/cases-table.tsx` — no location change, but check its import of `case-utils` is already the correct relative path (it should be, since this plan never touched that file's location)

**Interfaces:**
- Consumes: `PageLayout`; `HearingsDetails` from `@/components/cases/hearing-details/hearings`; `ImportantDatesDetails` from `@/components/cases/important-dates/important-dates`; `ClientDetails` from `@/components/cases/client/client-details`; `Documents` from `@/components/cases/documents/documents` — all at their existing, unmoved locations (Exception B: the one orchestrator view for the case-detail composite route).
- Produces: `CasesView`, `CaseDetailView`, `CaseDetailTabs`, `@/constants/case-tabs` (`CaseTabs`, `CaseSubTabs`, `CaseTabLabel`, `CaseSubTabLabel`, `CASE_TAB_CONFIG`).

- [ ] **Step 1: Merge the tabs config into one file**

```bash
mkdir -p apps/web/src/constants
git rm apps/web/src/config/case-tabs.ts apps/web/src/enums/case-tabs.ts
rmdir apps/web/src/config apps/web/src/enums 2>/dev/null || true
```

Create `apps/web/src/constants/case-tabs.ts`:

```ts
import type { TabConfig } from "@/components/layout/tabs-nav";

export enum CaseTabs {
  CLIENT = "client",
  CASE = "case",
  HEARINGS = "hearings",
  IMPORTANT_DATES = "important-dates",
  DOCUMENTS = "documents",
}

export enum CaseSubTabs {
  DETAILS = "details",
  DESCRIPTION = "description",
  OPPOSITE_PARTIES = "opposite-parties",
}

export enum CaseTabLabel {
  CLIENT = "Client",
  CASE = "Case",
  HEARINGS = "Hearings",
  IMPORTANT_DATES = "Important Dates",
  DOCUMENTS = "Documents",
}

export enum CaseSubTabLabel {
  DETAILS = "Case Details",
  DESCRIPTION = "Case Description",
  OPPOSITE_PARTIES = "Opposite Parties",
}

export const CASE_TAB_CONFIG: TabConfig[] = [
  {
    id: CaseTabs.CASE,
    label: CaseTabLabel.CASE,
    subTabs: [
      { id: CaseSubTabs.DETAILS, label: CaseSubTabLabel.DETAILS },
      { id: CaseSubTabs.DESCRIPTION, label: CaseSubTabLabel.DESCRIPTION },
      { id: CaseSubTabs.OPPOSITE_PARTIES, label: CaseSubTabLabel.OPPOSITE_PARTIES },
    ],
  },
  { id: CaseTabs.HEARINGS, label: CaseTabLabel.HEARINGS },
  { id: CaseTabs.CLIENT, label: CaseTabLabel.CLIENT },
  { id: CaseTabs.IMPORTANT_DATES, label: CaseTabLabel.IMPORTANT_DATES },
  { id: CaseTabs.DOCUMENTS, label: CaseTabLabel.DOCUMENTS },
];
```

- [ ] **Step 2: Fix imports repo-wide**

```bash
cd apps/web/src
grep -rl '@/config/case-tabs' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/config/case-tabs#@/constants/case-tabs#g'
grep -rl '@/enums/case-tabs' . --include="*.ts" --include="*.tsx" | xargs sed -i '' 's#@/enums/case-tabs#@/constants/case-tabs#g'
```

If any file ends up with two import statements both resolving to `@/constants/case-tabs`, merge them into one by hand.

- [ ] **Step 3: Trim `hooks/use-active-tab.ts` down to the generic hooks only**

Replace the file's contents entirely:

```ts
// apps/web/src/hooks/use-active-tab.ts
"use client";

import { useSearchParams } from "next/navigation";
import type { TabConfig } from "@/components/layout/tabs-nav";

export function useActiveTab(tabs: TabConfig[], defaultTab: string): string {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const isValid = tab !== null && tabs.some((t) => t.id === tab);
  return isValid ? tab : defaultTab;
}

export function useActiveSubTab(activeTab: string, tabs: TabConfig[]): string {
  const searchParams = useSearchParams();
  const subTab = searchParams.get("subTab");
  const tabConfig = tabs.find((t) => t.id === activeTab);
  if (!tabConfig?.subTabs?.length) return "";
  const isValid = tabConfig.subTabs.some((s) => s.id === subTab);
  return isValid ? (subTab ?? tabConfig.subTabs[0].id) : tabConfig.subTabs[0].id;
}
```

This deletes `useCaseActiveTab`/`useCaseActiveSubTab` — the generic hook file was quietly importing cases-specific config, which contradicts it being "generic." Their two call sites are rewritten below to call the generic hooks directly, matching how `settings-view.tsx` already does it (Task 3).

- [ ] **Step 4: Rename + rewrite `case-tabs.tsx` → `case-detail-tabs.tsx`**

```bash
git mv "apps/web/src/app/(protected)/cases/[caseId]/case-tabs.tsx" apps/web/src/components/cases/case-detail-tabs.tsx
```

Replace its contents:

```tsx
// apps/web/src/components/cases/case-detail-tabs.tsx
"use client";

import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { useActiveTab, useActiveSubTab } from "@/hooks/use-active-tab";
import { CASE_TAB_CONFIG, CaseTabs } from "@/constants/case-tabs";

interface Props {
  caseId: string;
}

export function CaseDetailTabs({ caseId }: Props) {
  const router = useRouter();
  const activeTab = useActiveTab(CASE_TAB_CONFIG, CaseTabs.CASE) as CaseTabs;
  const activeSubTab = useActiveSubTab(activeTab, CASE_TAB_CONFIG);

  function navigateTo(tabId: string, subTabId?: string) {
    const params = new URLSearchParams({ tab: tabId });
    if (subTabId) params.set("subTab", subTabId);
    router.push(`/cases/${caseId}?${params.toString()}`);
  }

  return (
    <TabsNav
      tabs={CASE_TAB_CONFIG}
      activeTab={activeTab}
      activeSubTab={activeSubTab}
      onNavigate={navigateTo}
    />
  );
}
```

Renamed from `CaseTabs` because that name collided with the `CaseTabs` enum, forcing every call site to alias the import (`import { CaseTabs as CaseTabsNav }`). `CaseDetailTabs` matches its sibling `CaseDetailView` below and avoids "Nav," which this codebase reserves for actual site navigation (`Sidebar`, `BottomNav`) — this is an in-page tab bar, not navigation between pages.

- [ ] **Step 5: Rename + rewrite `case-details.tsx` → `case-detail-view.tsx`**

```bash
git mv "apps/web/src/app/(protected)/cases/[caseId]/case-details.tsx" apps/web/src/components/cases/case-detail-view.tsx
```

Replace its contents:

```tsx
// apps/web/src/components/cases/case-detail-view.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { CaseTabs, CaseSubTabs, CASE_TAB_CONFIG } from "@/constants/case-tabs";
import { Documents } from "@/components/cases/documents/documents";
import { CaseDetailTabs } from "./case-detail-tabs";
import { useActiveTab, useActiveSubTab } from "@/hooks/use-active-tab";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useCase, useUpdateCase, useDeleteCase } from "@/hooks/use-cases";
import { usePageLoading } from "@/components/layout/loader";
import { useAddClientToCase, useUpdateClient } from "@/hooks/use-clients";
import { CaseDetailsSection } from "@/components/cases/case-details/case-details";
import { CaseDescriptionSection } from "@/components/cases/case-details/case-description";
import { CourtDetailsSection } from "@/components/cases/case-details/court-details";
import { JudgeDetailsSection } from "@/components/cases/case-details/judge-details";
import { OppositePartySection } from "@/components/cases/case-details/opposite-parties";
import { ClientDetails } from "@/components/cases/client/client-details";
import { HearingsDetails } from "@/components/cases/hearing-details/hearings";
import { ImportantDatesDetails } from "@/components/cases/important-dates/important-dates";
import { PageFooter } from "@/components/layout/page-footer";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete";
import { UpdateCaseInput } from "@/types/cases";
import { CreateClientInput, UpdateClientInput } from "@/types/clients";
import {
  mapCaseToFormValues,
  mapClientToFormValues,
} from "@/mappers/case-form";

interface TabContentProps {
  tab: CaseTabs;
  subTab: string;
  caseId: string;
  caseForm: UseFormReturn<UpdateCaseInput>;
  clientForm: UseFormReturn<UpdateClientInput>;
}

function CaseSubTabContent({ subTab }: { subTab: string }) {
  switch (subTab) {
    case CaseSubTabs.DETAILS:
      return (
        <>
          <CaseDetailsSection />
          <CourtDetailsSection />
          <JudgeDetailsSection />
        </>
      );
    case CaseSubTabs.DESCRIPTION:
      return <CaseDescriptionSection />;
    case CaseSubTabs.OPPOSITE_PARTIES:
      return <OppositePartySection />;
    default:
      return null;
  }
}

function TabContent({
  tab,
  subTab,
  caseId,
  caseForm,
  clientForm,
}: TabContentProps) {
  switch (tab) {
    case CaseTabs.CLIENT:
      return (
        <FormProvider {...clientForm}>
          <ClientDetails />
        </FormProvider>
      );

    case CaseTabs.CASE:
      return (
        <FormProvider {...caseForm}>
          <CaseSubTabContent subTab={subTab} />
        </FormProvider>
      );

    case CaseTabs.HEARINGS:
      return <HearingsDetails caseId={caseId} />;

    case CaseTabs.IMPORTANT_DATES:
      return <ImportantDatesDetails caseId={caseId} />;

    case CaseTabs.DOCUMENTS:
      return <Documents caseId={caseId} />;

    default:
      return null;
  }
}

export function CaseDetailView({ caseId }: { caseId: string }) {
  const activeTab = useActiveTab(CASE_TAB_CONFIG, CaseTabs.CASE) as CaseTabs;
  const activeSubTab = useActiveSubTab(activeTab, CASE_TAB_CONFIG);
  const [showDelete, setShowDelete] = useState(false);

  const { data: caseDetails, isLoading } = useCase(caseId);
  const updateCase = useUpdateCase(caseId);
  const updateClient = useUpdateClient();
  const addClientToCase = useAddClientToCase(caseId);
  const deleteCase = useDeleteCase();

  usePageTitle({
    title: "Cases",
    resourceTitle: `${caseDetails?.title}${caseDetails?.caseNumber ? ` (${caseDetails.caseNumber})` : ""}`,
  });

  const caseForm = useForm<UpdateCaseInput>({
    values: caseDetails ? mapCaseToFormValues(caseDetails) : undefined,
  });

  const clientForm = useForm<UpdateClientInput>({
    values: caseDetails?.client
      ? mapClientToFormValues(caseDetails.client)
      : undefined,
  });

  usePageLoading(isLoading);

  const isEditableTab =
    activeTab === CaseTabs.CASE || activeTab === CaseTabs.CLIENT;
  const isSaving =
    activeTab === CaseTabs.CLIENT
      ? updateClient.isPending || addClientToCase.isPending
      : updateCase.isPending;

  const handleSave = async () => {
    if (activeTab === CaseTabs.CLIENT) {
      const valid = await clientForm.trigger();
      if (!valid) return;

      const data = clientForm.getValues();

      if (!caseDetails?.clientId) {
        if (!data.type) {
          toast.error("Client type is required");
          return;
        }
        const clientInput: CreateClientInput = {
          fullName: data.fullName ?? "",
          phone: data.phone ?? "",
          type: data.type,
          email: data.email,
          address: data.address,
          companyName: data.companyName,
          notes: data.notes,
          relationType: data.relationType,
          relationName: data.relationName,
          dateOfBirth: data.dateOfBirth,
          occupation: data.occupation,
        };
        await addClientToCase.mutateAsync(clientInput);
      } else {
        await updateClient.mutateAsync({
          id: caseDetails?.clientId ?? "",
          caseId,
          data,
        });
      }
    } else {
      const valid = await caseForm.trigger();
      if (!valid) return;

      const data = caseForm.getValues();
      await updateCase.mutateAsync(data);
    }
  };

  const handleDelete = async () => {
    await deleteCase.mutateAsync(caseId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CaseDetailTabs caseId={caseId} />

      <div className="flex-1 overflow-y-auto bg-page">
        <PageLayout maxWidth="medium" className="space-y-6">
          <TabContent
            tab={activeTab}
            subTab={activeSubTab}
            caseId={caseId}
            caseForm={caseForm}
            clientForm={clientForm}
          />
        </PageLayout>
      </div>

      <PageFooter
        right={
          <>
            <Button variant="negative" onClick={() => setShowDelete(true)}>
              Delete Case
            </Button>
            {isEditableTab && (
              <Button loading={isSaving} onClick={handleSave}>
                Save Changes
              </Button>
            )}
          </>
        }
      />

      <ConfirmDeleteModal
        open={showDelete}
        title="case"
        entityName={caseDetails?.title ?? ""}
        isPending={deleteCase.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

Renamed from the default-exported `CaseDetails` to the named export `CaseDetailView` — every other component in this codebase is a named export; this was the one exception, and the new name also matches what `frontend-rules.md` already documents as the intended pattern for this exact file.

Note: `maxWidth="medium"` here is narrower than this page's old implicit default (it never passed a `width` prop to the old `PageContent`, which defaulted to `width="lg"` = `max-w-4xl`). This is a deliberate fix, not a regression — case detail and settings should be the same width, and today they're inconsistently 896px vs 672px for no reason. Confirm this visually in Task 7's smoke test.

Replace `apps/web/src/app/(protected)/cases/[caseId]/page.tsx` with:

```tsx
import { use } from "react";
import { CaseDetailView } from "@/components/cases/case-detail-view";

export default function Page({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  return <CaseDetailView caseId={caseId} />;
}
```

- [ ] **Step 6: Extract the cases list page into `CasesView`**

Read the current `apps/web/src/app/(protected)/cases/page.tsx` first (it should be the same small page with local modal-open state from before).

Create `apps/web/src/components/cases/cases-view.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { PageLayout } from "@/components/layout/page-layout";
import { CasesTable } from "@/app/(protected)/cases/cases-table";
import { CreateCaseModal } from "@/components/modals/create-case";

export function CasesView() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  usePageTitle({
    title: "Cases",
    action: { label: "Add Case", onClick: openModal },
  });

  return (
    <PageLayout maxWidth="large" padded={false} className="h-full">
      <CasesTable onAdd={openModal} />
      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </PageLayout>
  );
}
```

`cases-table.tsx` stays exactly where it is (`app/(protected)/cases/cases-table.tsx`) — this plan doesn't relocate it, only imports it from its existing path. `padded={false}` means `PageLayout` only contributes the max-width cap here — `FiltersBar`/`DataTable` (rendered inside `CasesTable`) keep their own existing internal `px-4 md:px-6`, so neither needs editing.

Replace `apps/web/src/app/(protected)/cases/page.tsx` with:

```tsx
import { CasesView } from "@/components/cases/cases-view";

export default function Page() {
  return <CasesView />;
}
```

- [ ] **Step 7: Verify**

Commit first, then run: `git status --short` (expect clean) and `pnpm --filter web typecheck` (expect pass with **zero** errors).

- [ ] **Step 8: Commit**

```bash
git add -A apps/web/src/constants apps/web/src/config apps/web/src/enums apps/web/src/hooks/use-active-tab.ts apps/web/src/components/cases "apps/web/src/app/(protected)/cases"
git commit -m "refactor(web): merge case tabs config, extract CasesView/CaseDetailView, fix tab hook leak"
```

---

### Task 5: Delete unused `PageContent` and dead `.page-shell` CSS

**Files:**
- Delete: `apps/web/src/components/layout/page-content.tsx`
- Modify: `apps/web/src/app/globals.css` (remove the `.page-shell` block)

- [ ] **Step 1: Confirm `PageContent` has no remaining consumers**

Run: `grep -rl 'PageContent\|components/layout/page-content' apps/web/src`
Expected: no output. If anything remains, Task 2, 3, or 4 missed a `PageContent` usage — fix that file to use `PageLayout` before continuing.

- [ ] **Step 2: Delete it**

```bash
git rm apps/web/src/components/layout/page-content.tsx
```

- [ ] **Step 3: Delete the dead `.page-shell` CSS**

In `apps/web/src/app/globals.css`, delete:

```css
  /*  Page shell — applied to <main>; owns the horizontal gutter for all pages  */
  .page-shell {
    @apply px-4 md:px-6;
  }
```

Confirm first with `grep -rn 'page-shell' apps/web/src` that this class has zero usages anywhere (it was already unused before this refactor started, and `PageLayout`'s own `.page-layout`/`.page-layout--padded` classes, added in the earlier plan's Task 2, replace it).

- [ ] **Step 4: Verify**

Commit first, then run: `git status --short` (expect clean) and `pnpm --filter web typecheck` (expect pass).

- [ ] **Step 5: Commit**

```bash
git add -A apps/web/src
git commit -m "chore(web): delete unused PageContent and dead .page-shell CSS"
```

---

### Task 6: Update `.claude/architecture.md` and `.claude/frontend-rules.md`

**Files:**
- Modify: `.claude/architecture.md` (the "Frontend Structure" section)
- Modify: `.claude/frontend-rules.md` (a new note on `PageLayout`/tabs/nav conventions)

- [ ] **Step 1: Confirm `architecture.md`'s "Frontend Structure" section is accurate**

The layered structure being documented here is close to what `architecture.md` already describes — the main corrections needed: the route group is `(protected)`, not `(dashboard)`; `constants/` is now a real folder (data-only: `options.ts` is NOT here, it's in `lib/` — only `case-tabs.ts`/`settings-tabs.ts` are); note `constants/` is data-only, functions go in `lib/`. Update the section's code block to:

```
apps/web/src/
├── app/                  # Next.js App Router pages (thin page.tsx files — resolve params, render one view component)
│   ├── (auth)/
│   ├── (protected)/
│   └── portal/
├── components/
│   ├── ui/               # Primitive, stateless components
│   ├── layout/            # App shell (sidebar, top bar, bottom nav, PageLayout)
│   ├── shared/             # Generic, feature-agnostic components used by more than one feature (modal, confirm-delete)
│   └── [feature]/          # Feature-specific composed components — cases, hearings (nested under cases/), important-dates (nested under cases/), client (nested under cases/), documents, calendar, dashboard, settings, auth
├── hooks/                # React Query hooks — one file per feature, flat
├── services/              # API objects — one file per feature, flat
├── types/                 # Frontend-only types — one file per feature, flat
├── constants/              # Plain data only — enums + arrays (case-tabs.ts, settings-tabs.ts). No functions.
├── mappers/                # Form/API shape converters (case-form.ts)
├── lib/                    # Pure helper functions, including ones that also export constant data alongside them (utils.ts, options.ts, calendar.ts, format-date-label.ts)
├── api/                    # Axios client + typed HTTP helpers
├── store/                  # Zustand stores
└── middleware.ts
```

- [ ] **Step 2: Add the `PageLayout` + nav/tabs rules to `frontend-rules.md`**

Under the existing "App Router Structure" section (or a new section right after it — match whatever reads best in context), add:

```markdown
### Page-Level Layout — `PageLayout`

Every `page.tsx` renders through `components/layout/page-layout.tsx`'s `PageLayout` component instead of hand-rolling its own horizontal gutter or max-width:
- `maxWidth`: `"small"` (a single form section) | `"medium"` (detail/tab pages — case detail, settings) | `"large"` (list pages with a data table — cases, documents) | `"full"` (uncapped).
- `padded` (default `true`): set `false` when the content already owns its own gutter (a `FiltersBar` + `DataTable` pair) — `PageLayout` then only contributes the max-width cap.
- Calendar is the one exception — its own full-height, edge-to-edge chrome predates `PageLayout` and isn't wired through it.

### `constants/` vs `lib/`

`constants/` holds plain data only — string/number/object/array literals and enums, nothing that executes. The moment a file needs even one function alongside its data (like `options.ts`'s `formatEnumLabel`/`toOptions`/`withNone`), it belongs in `lib/` instead.

### Nav Items & Tabs — Single Source of Truth

- Sidebar/bottom-nav entries: add or change one entry in `components/layout/sidebar/nav-items.ts`'s `NAV_ITEMS` — both surfaces update from that one array.
- Tabs: each feature owns its own `constants/[name]-tabs.ts` (a `TabConfig[]` plus whatever enum backs it) and calls the generic `useActiveTab`/`useActiveSubTab` from `hooks/use-active-tab.ts` directly — never add a feature-specific wrapper hook to that file, it must stay feature-agnostic.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/architecture.md .claude/frontend-rules.md
git commit -m "docs: update architecture.md and frontend-rules.md for PageLayout/tabs/constants conventions"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full typecheck**

Run: `pnpm --filter web typecheck` — expect zero errors.

- [ ] **Step 2: Full lint**

Run: `pnpm --filter web lint` — expect pass (or only pre-existing warnings unrelated to this work).

- [ ] **Step 3: Full build**

Run: `pnpm --filter web build` — expect success.

- [ ] **Step 4: Manual smoke test**

Run: `pnpm --filter web dev`, then in a browser, for both a mobile viewport and a desktop viewport:
- `/dashboard` — stat cards, upcoming hearings, attention-needed sections render; "Add New Case" opens the modal.
- `/cases` — filters bar + table render, no doubled or missing horizontal gutter, add/edit/delete a case works, clicking a row navigates to its detail page.
- A case detail page (`/cases/[id]`) — all five tabs render and are editable/saveable; content is now capped at `medium` width (672px) instead of the old, wider, unintentional default — confirm this reads as consistent with `/settings`, not as a regression.
- `/calendar` — unchanged, still full-bleed.
- `/documents` — folder grid and file list still work.
- `/settings` — Profile and Subscription tabs both render at the same width as case detail.
- Sidebar and bottom nav both still show the same items as before.

- [ ] **Step 5: Final commit (only if the smoke test required fixes)**

```bash
git add -A
git commit -m "fix(web): address issues found in post-restructure smoke test"
```
