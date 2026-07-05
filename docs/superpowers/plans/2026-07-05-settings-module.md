# Settings Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/settings` page with Profile (My Details + Firm Details) and Subscription tabs, backed by four new `GET`/`PATCH` endpoints on a new server-side `settings` module.

**Architecture:** Standard five-layer backend module (`settings`) with two sub-resources (`profile`, `organization`). Frontend follows the exact case-detail tab pattern — URL search params drive the active tab, `react-hook-form` + `FormProvider` manages the Profile form, React Query handles data fetching and cache invalidation.

**Tech Stack:** Fastify + Prisma (backend), Next.js App Router + React Query + react-hook-form + Zustand (frontend), shared enums from `@splexa-group/shared`.

## Global Constraints

- `orgId` must come from `req.user.orgId` (JWT) only — never body, params, or query string
- Every tenant-scoped DB query filters by `orgId`
- Five backend layers always: plugin → route → controller → service → repository
- Zod everywhere — schemas in `schema.ts`, types via `z.infer<>`
- No `any`, no `!`, no `@ts-ignore`
- No `prisma.*` outside `*-repository.ts`
- Repositories return `null` — services throw errors
- kebab-case for all file names
- No `logActivity` calls in this module (settings changes are not case-level events)
- Tab state driven by `?tab=` URL search param (same as case detail pages)
- `email` and `role` are read-only in the UI — never sent to the server

---

### Task 1: Backend settings module

**Files:**
- Modify: `apps/server/src/enums/error-code.ts`
- Modify: `apps/server/src/utils/errors.ts`
- Create: `apps/server/src/modules/settings/schema.ts`
- Create: `apps/server/src/modules/settings/repository.ts`
- Create: `apps/server/src/modules/settings/service.ts`
- Create: `apps/server/src/modules/settings/__tests__/service.test.ts`
- Create: `apps/server/src/modules/settings/controller.ts`
- Create: `apps/server/src/modules/settings/routes.ts`
- Create: `apps/server/src/modules/settings/plugin.ts`
- Modify: `apps/server/src/app.ts`

**Interfaces:**
- Produces:
  - `GET /api/v1/settings/profile` → `{ data: ProfileData }`
  - `PATCH /api/v1/settings/profile` body `UpdateProfileBody` → `{ data: ProfileData }`
  - `GET /api/v1/settings/organization` → `{ data: OrganizationData }`
  - `PATCH /api/v1/settings/organization` body `UpdateOrganizationBody` → `{ data: OrganizationData }`

- [ ] **Step 1: Add error codes**

Open `apps/server/src/enums/error-code.ts` and add one entry at the end of the `// documents` block:

```ts
// settings
ORGANIZATION_NOT_FOUND = "ORGANIZATION_NOT_FOUND",
```

Then open `apps/server/src/utils/errors.ts` and add after `documentNotFound`:

```ts
organizationNotFound: () =>
  new AppError(404, ErrorCode.ORGANIZATION_NOT_FOUND, "Organization not found."),
```

- [ ] **Step 2: Write the schema**

Create `apps/server/src/modules/settings/schema.ts`:

```ts
import { Designation, PracticeType } from "@splexa-group/shared/enums";
import { z } from "zod";

export const updateProfileBodySchema = z
  .object({
    firstName:   z.string().min(1).max(100),
    lastName:    z.string().min(1).max(100),
    phoneNumber: z.string().min(1).max(20),
    designation: z.nativeEnum(Designation),
  })
  .strict();

export const updateOrganizationBodySchema = z
  .object({
    name:          z.string().min(1).max(200),
    city:          z.string().min(1).max(100),
    practiceTypes: z.array(z.nativeEnum(PracticeType)).min(1),
  })
  .strict();

export type UpdateProfileBody       = z.infer<typeof updateProfileBodySchema>;
export type UpdateOrganizationBody  = z.infer<typeof updateOrganizationBodySchema>;
```

- [ ] **Step 3: Write the repository**

Create `apps/server/src/modules/settings/repository.ts`:

```ts
import { type Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

import type { UpdateOrganizationBody, UpdateProfileBody } from "./schema";

const profileSelect = {
  id:          true,
  firstName:   true,
  lastName:    true,
  email:       true,
  phoneNumber: true,
  designation: true,
  role:        true,
} satisfies Prisma.UserSelect;

const orgSelect = {
  id:            true,
  name:          true,
  city:          true,
  practiceTypes: true,
} satisfies Prisma.OrganizationSelect;

export const settingsRepository = {
  async getProfile(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id: userId, orgId, deletedAt: null },
      select: profileSelect,
    });
  },

  async updateProfile(userId: string, orgId: string, data: UpdateProfileBody) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: profileSelect,
    });
  },

  async getOrganization(orgId: string) {
    return prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null },
      select: orgSelect,
    });
  },

  async updateOrganization(orgId: string, data: UpdateOrganizationBody) {
    return prisma.organization.update({
      where: { id: orgId },
      data: {
        name:          data.name,
        city:          data.city,
        practiceTypes: data.practiceTypes,
        updatedAt:     new Date(),
      },
      select: orgSelect,
    });
  },
};
```

- [ ] **Step 4: Write the failing service tests**

Create `apps/server/src/modules/settings/__tests__/service.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Errors } from "@/utils/errors";

import { settingsRepository } from "../repository";
import { settingsService } from "../service";

vi.mock("../repository", () => ({
  settingsRepository: {
    getProfile:         vi.fn(),
    updateProfile:      vi.fn(),
    getOrganization:    vi.fn(),
    updateOrganization: vi.fn(),
  },
}));

const mockProfile = {
  id:          "user-1",
  firstName:   "Rajesh",
  lastName:    "Sharma",
  email:       "rajesh@example.com",
  phoneNumber: "9876543210",
  designation: "ADVOCATE",
  role:        "OWNER",
};

const mockOrg = {
  id:            "org-1",
  name:          "Sharma & Associates",
  city:          "Hyderabad",
  practiceTypes: ["CRIMINAL", "CIVIL"],
};

beforeEach(() => vi.clearAllMocks());

describe("settingsService.getProfile", () => {
  it("throws userNotFound when user does not exist", async () => {
    vi.mocked(settingsRepository.getProfile).mockResolvedValue(null);
    await expect(
      settingsService.getProfile("bad-user", "org-1"),
    ).rejects.toThrow(Errors.userNotFound());
  });

  it("returns profile data when user exists", async () => {
    vi.mocked(settingsRepository.getProfile).mockResolvedValue(mockProfile as never);
    const result = await settingsService.getProfile("user-1", "org-1");
    expect(result).toEqual(mockProfile);
    expect(settingsRepository.getProfile).toHaveBeenCalledWith("user-1", "org-1");
  });
});

describe("settingsService.updateProfile", () => {
  it("updates and returns the profile", async () => {
    const updated = { ...mockProfile, firstName: "Ravi" };
    vi.mocked(settingsRepository.updateProfile).mockResolvedValue(updated as never);
    const body = { firstName: "Ravi", lastName: "Sharma", phoneNumber: "9876543210", designation: "ADVOCATE" as never };
    const result = await settingsService.updateProfile("user-1", "org-1", body);
    expect(result).toEqual(updated);
    expect(settingsRepository.updateProfile).toHaveBeenCalledWith("user-1", "org-1", body);
  });
});

describe("settingsService.getOrganization", () => {
  it("throws organizationNotFound when org does not exist", async () => {
    vi.mocked(settingsRepository.getOrganization).mockResolvedValue(null);
    await expect(
      settingsService.getOrganization("bad-org"),
    ).rejects.toThrow(Errors.organizationNotFound());
  });

  it("returns org data when org exists", async () => {
    vi.mocked(settingsRepository.getOrganization).mockResolvedValue(mockOrg as never);
    const result = await settingsService.getOrganization("org-1");
    expect(result).toEqual(mockOrg);
    expect(settingsRepository.getOrganization).toHaveBeenCalledWith("org-1");
  });
});

describe("settingsService.updateOrganization", () => {
  it("updates and returns the organization", async () => {
    const updated = { ...mockOrg, name: "New Firm Name" };
    vi.mocked(settingsRepository.updateOrganization).mockResolvedValue(updated as never);
    const body = { name: "New Firm Name", city: "Hyderabad", practiceTypes: ["CRIMINAL"] as never };
    const result = await settingsService.updateOrganization("org-1", body);
    expect(result).toEqual(updated);
    expect(settingsRepository.updateOrganization).toHaveBeenCalledWith("org-1", body);
  });
});
```

- [ ] **Step 5: Run tests — expect FAIL (service does not exist)**

```bash
cd apps/server && pnpm test src/modules/settings
```

Expected: FAIL — `settingsService` not found.

- [ ] **Step 6: Write the service**

Create `apps/server/src/modules/settings/service.ts`:

```ts
import { Errors } from "@/utils/errors";

import { settingsRepository } from "./repository";
import type { UpdateOrganizationBody, UpdateProfileBody } from "./schema";

export const settingsService = {
  async getProfile(userId: string, orgId: string) {
    const profile = await settingsRepository.getProfile(userId, orgId);
    if (!profile) throw Errors.userNotFound();
    return profile;
  },

  async updateProfile(userId: string, orgId: string, data: UpdateProfileBody) {
    return settingsRepository.updateProfile(userId, orgId, data);
  },

  async getOrganization(orgId: string) {
    const org = await settingsRepository.getOrganization(orgId);
    if (!org) throw Errors.organizationNotFound();
    return org;
  },

  async updateOrganization(orgId: string, data: UpdateOrganizationBody) {
    return settingsRepository.updateOrganization(orgId, data);
  },
};
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
cd apps/server && pnpm test src/modules/settings
```

Expected: 4 test files, all pass.

- [ ] **Step 8: Write the controller**

Create `apps/server/src/modules/settings/controller.ts`:

```ts
import type { FastifyReply, FastifyRequest } from "fastify";

import { settingsService } from "./service";
import type { UpdateOrganizationBody, UpdateProfileBody } from "./schema";

export const settingsController = {
  async getProfile(req: FastifyRequest) {
    const data = await settingsService.getProfile(req.user.userId, req.user.orgId);
    return { data };
  },

  async updateProfile(req: FastifyRequest<{ Body: UpdateProfileBody }>) {
    const data = await settingsService.updateProfile(req.user.userId, req.user.orgId, req.body);
    return { data };
  },

  async getOrganization(req: FastifyRequest) {
    const data = await settingsService.getOrganization(req.user.orgId);
    return { data };
  },

  async updateOrganization(req: FastifyRequest<{ Body: UpdateOrganizationBody }>) {
    const data = await settingsService.updateOrganization(req.user.orgId, req.body);
    return { data };
  },
};
```

- [ ] **Step 9: Write routes**

Create `apps/server/src/modules/settings/routes.ts`:

```ts
import type { FastifyInstance } from "fastify";

import { settingsController } from "./controller";
import { updateOrganizationBodySchema, updateProfileBodySchema } from "./schema";

export function settingsRoutes(router: FastifyInstance): void {
  router.get("/profile", {
    preHandler: [router.authenticate],
    handler: settingsController.getProfile,
  });

  router.patch("/profile", {
    schema: { body: updateProfileBodySchema },
    preHandler: [router.authenticate],
    handler: settingsController.updateProfile,
  });

  router.get("/organization", {
    preHandler: [router.authenticate],
    handler: settingsController.getOrganization,
  });

  router.patch("/organization", {
    schema: { body: updateOrganizationBodySchema },
    preHandler: [router.authenticate],
    handler: settingsController.updateOrganization,
  });
}
```

- [ ] **Step 10: Write plugin**

Create `apps/server/src/modules/settings/plugin.ts`:

```ts
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { settingsRoutes } from "./routes";

export const settingsModule = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(settingsRoutes, { prefix: "/api/v1/settings" });
  },
  { name: "settings-module" },
);
```

- [ ] **Step 11: Register the plugin in app.ts**

In `apps/server/src/app.ts`, add the import and registration:

```ts
// Add after the documentsModule import:
import { settingsModule } from "@/modules/settings/plugin";

// Add after await app.register(documentsModule):
await app.register(settingsModule);
```

- [ ] **Step 12: Commit**

```bash
git add apps/server/src/enums/error-code.ts \
        apps/server/src/utils/errors.ts \
        apps/server/src/modules/settings/ \
        apps/server/src/app.ts
git commit -m "feat(settings): add settings backend module (profile + organization endpoints)"
```

---

### Task 2: Frontend data layer

**Files:**
- Create: `apps/web/src/types/settings.ts`
- Create: `apps/web/src/services/settings.ts`
- Create: `apps/web/src/hooks/use-settings.ts`

**Interfaces:**
- Consumes: `GET /api/v1/settings/profile`, `PATCH /api/v1/settings/profile`, `GET /api/v1/settings/organization`, `PATCH /api/v1/settings/organization` (from Task 1)
- Produces:
  - `useProfile()` — `UseQueryResult<ProfileData>`
  - `useUpdateProfile()` — `UseMutationResult`
  - `useOrganization()` — `UseQueryResult<OrganizationData>`
  - `useUpdateOrganization()` — `UseMutationResult`
  - `settingsKeys.profile()`, `settingsKeys.organization()`

- [ ] **Step 1: Write types**

Create `apps/web/src/types/settings.ts`:

```ts
import type { Designation, PracticeType, UserRole } from "@splexa-group/shared/enums";

export interface ProfileData {
  id:          string;
  firstName:   string;
  lastName:    string;
  email:       string;
  phoneNumber: string;
  designation: Designation;
  role:        UserRole;
}

export interface OrganizationData {
  id:            string;
  name:          string;
  city:          string;
  practiceTypes: PracticeType[];
}

export interface ProfileResponse       { data: ProfileData }
export interface OrganizationResponse  { data: OrganizationData }

export interface UpdateProfileInput {
  firstName:   string;
  lastName:    string;
  phoneNumber: string;
  designation: Designation;
}

export interface UpdateOrganizationInput {
  name:          string;
  city:          string;
  practiceTypes: PracticeType[];
}
```

- [ ] **Step 2: Write service**

Create `apps/web/src/services/settings.ts`:

```ts
import { GET, PATCH } from "@/api/http";
import type {
  OrganizationResponse,
  ProfileResponse,
  UpdateOrganizationInput,
  UpdateProfileInput,
} from "@/types/settings";

export const settingsApi = {
  getProfile:         () => GET<ProfileResponse>("/settings/profile"),
  updateProfile:      (data: UpdateProfileInput) => PATCH<ProfileResponse>("/settings/profile", data),
  getOrganization:    () => GET<OrganizationResponse>("/settings/organization"),
  updateOrganization: (data: UpdateOrganizationInput) => PATCH<OrganizationResponse>("/settings/organization", data),
};
```

- [ ] **Step 3: Write hooks**

Create `apps/web/src/hooks/use-settings.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { settingsApi } from "@/services/settings";
import type { UpdateOrganizationInput, UpdateProfileInput } from "@/types/settings";

export const settingsKeys = {
  profile:      () => ["settings", "profile"]      as const,
  organization: () => ["settings", "organization"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn:  () => settingsApi.getProfile(),
    select:   (res) => res.data,
  });
}

export function useOrganization() {
  return useQuery({
    queryKey: settingsKeys.organization(),
    queryFn:  () => settingsApi.getOrganization(),
    select:   (res) => res.data,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => settingsApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.profile() });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update profile"),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationInput) => settingsApi.updateOrganization(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.organization() });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update firm details"),
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/types/settings.ts \
        apps/web/src/services/settings.ts \
        apps/web/src/hooks/use-settings.ts
git commit -m "feat(settings): add frontend types, service, and React Query hooks"
```

---

### Task 3: Settings page + tab navigation

**Files:**
- Create: `apps/web/src/enums/settings-tabs.ts`
- Create: `apps/web/src/config/settings-tabs.ts`
- Create: `apps/web/src/app/(protected)/settings/page.tsx`

**Interfaces:**
- Consumes: `useActiveTab` from `@/hooks/use-active-tab`, `TabsNav` from `@/components/layout/tabs-nav`, `usePageTitle` from `@/components/layout/top/top-bar-context`
- Produces: `/settings` route rendering `<TabsNav>` with Profile and Subscription tabs

- [ ] **Step 1: Write enums**

Create `apps/web/src/enums/settings-tabs.ts`:

```ts
export enum SettingsTabs {
  PROFILE      = "profile",
  SUBSCRIPTION = "subscription",
}
```

- [ ] **Step 2: Write tab config**

Create `apps/web/src/config/settings-tabs.ts`:

```ts
import type { TabConfig } from "@/components/layout/tabs-nav";
import { SettingsTabs } from "@/enums/settings-tabs";

export const SETTINGS_TAB_CONFIG: TabConfig[] = [
  { id: SettingsTabs.PROFILE,      label: "Profile" },
  { id: SettingsTabs.SUBSCRIPTION, label: "Subscription" },
];
```

- [ ] **Step 3: Write the page**

Create `apps/web/src/app/(protected)/settings/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { SETTINGS_TAB_CONFIG } from "@/config/settings-tabs";
import { SettingsTabs } from "@/enums/settings-tabs";
import { useActiveTab } from "@/hooks/use-active-tab";

// Placeholder components — replaced in Tasks 4 and 5
function ProfileTabPlaceholder() {
  return <div className="p-6 text-sm text-secondary">Profile tab — coming in next task</div>;
}
function SubscriptionTabPlaceholder() {
  return <div className="p-6 text-sm text-secondary">Subscription tab — coming in next task</div>;
}

export default function SettingsPage() {
  const router = useRouter();
  const activeTab = useActiveTab(SETTINGS_TAB_CONFIG, SettingsTabs.PROFILE);

  usePageTitle({ title: "Settings" });

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
        {activeTab === SettingsTabs.PROFILE      && <ProfileTabPlaceholder />}
        {activeTab === SettingsTabs.SUBSCRIPTION && <SubscriptionTabPlaceholder />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify in browser**

Start the dev server: `pnpm dev` (from repo root). Navigate to `http://localhost:3000/settings`. Confirm:
- Settings appears in the sidebar navigation
- Two tabs render: "Profile" and "Subscription"
- Clicking each tab changes the URL (`?tab=profile`, `?tab=subscription`)
- Top bar shows "Settings"

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/enums/settings-tabs.ts \
        apps/web/src/config/settings-tabs.ts \
        apps/web/src/app/\(protected\)/settings/page.tsx
git commit -m "feat(settings): add settings page with tab navigation"
```

---

### Task 4: Profile tab — My Details + Firm Details

**Files:**
- Create: `apps/web/src/components/settings/my-details-section.tsx`
- Create: `apps/web/src/components/settings/firm-details-section.tsx`
- Create: `apps/web/src/components/settings/profile-tab.tsx`
- Modify: `apps/web/src/app/(protected)/settings/page.tsx`

**Interfaces:**
- Consumes:
  - `useProfile()`, `useOrganization()`, `useUpdateProfile()`, `useUpdateOrganization()` from `@/hooks/use-settings`
  - `ProfileData`, `OrganizationData` from `@/types/settings`
  - `Section` from `@/components/ui/section`
  - `PageContent` from `@/components/layout/page-content`
  - `PageFooter` from `@/components/layout/page-footer`
  - `InputGroup` from `@/components/ui/form/input`
  - `SelectGroup` from `@/components/ui/form/select`
  - `MultiSelectGroup` from `@/components/ui/form/multi-select`
  - `Button` from `@/components/ui/button`
  - `useAuthStore` from `@/store/auth-store`
  - `useFormContext`, `FormProvider`, `useForm`, `Controller` from `react-hook-form`
  - `Designation`, `PracticeType` enums from `@splexa-group/shared/enums`

- [ ] **Step 1: Check for existing options in `apps/web/src/lib/options.ts`**

Open `apps/web/src/lib/options.ts`. If `DESIGNATION_OPTIONS` and `PRACTICE_TYPE_OPTIONS` already exist, skip to Step 3. If they do not exist, add them in Step 2.

- [ ] **Step 2: Add designation and practice-type options (only if not already present)**

Add to `apps/web/src/lib/options.ts`:

```ts
import { Designation, PracticeType } from "@splexa-group/shared/enums";

export const DESIGNATION_OPTIONS = [
  { value: Designation.ADVOCATE,           label: "Advocate" },
  { value: Designation.SENIOR_ADVOCATE,    label: "Senior Advocate" },
  { value: Designation.JUNIOR_ADVOCATE,    label: "Junior Advocate" },
  { value: Designation.ASSOCIATE,          label: "Associate" },
  { value: Designation.SENIOR_ASSOCIATE,   label: "Senior Associate" },
  { value: Designation.PRINCIPAL_ASSOCIATE,label: "Principal Associate" },
  { value: Designation.PARTNER,            label: "Partner" },
  { value: Designation.SENIOR_PARTNER,     label: "Senior Partner" },
  { value: Designation.MANAGING_PARTNER,   label: "Managing Partner" },
  { value: Designation.OF_COUNSEL,         label: "Of Counsel" },
  { value: Designation.RETAINER,           label: "Retainer" },
  { value: Designation.PARALEGAL,          label: "Paralegal" },
  { value: Designation.LEGAL_INTERN,       label: "Legal Intern" },
  { value: Designation.CLERK,              label: "Clerk" },
];

export const PRACTICE_TYPE_OPTIONS = [
  { value: PracticeType.CRIMINAL,               label: "Criminal" },
  { value: PracticeType.CIVIL,                  label: "Civil" },
  { value: PracticeType.CORPORATE,              label: "Corporate" },
  { value: PracticeType.FAMILY,                 label: "Family" },
  { value: PracticeType.MATRIMONIAL,            label: "Matrimonial" },
  { value: PracticeType.LABOUR,                 label: "Labour" },
  { value: PracticeType.CONSTITUTIONAL,         label: "Constitutional" },
  { value: PracticeType.TAX,                    label: "Tax" },
  { value: PracticeType.INTELLECTUAL_PROPERTY,  label: "Intellectual Property" },
  { value: PracticeType.REAL_ESTATE,            label: "Real Estate" },
  { value: PracticeType.IMMIGRATION,            label: "Immigration" },
  { value: PracticeType.HUMAN_RIGHTS,           label: "Human Rights" },
  { value: PracticeType.ENVIRONMENTAL,          label: "Environmental" },
  { value: PracticeType.CONSUMER,               label: "Consumer" },
  { value: PracticeType.ARBITRATION,            label: "Arbitration" },
  { value: PracticeType.BANKING,                label: "Banking" },
  { value: PracticeType.INSURANCE,              label: "Insurance" },
  { value: PracticeType.MEDIA_ENTERTAINMENT,    label: "Media & Entertainment" },
  { value: PracticeType.CYBER_LAW,              label: "Cyber Law" },
];
```

- [ ] **Step 3: Write My Details section**

Create `apps/web/src/components/settings/my-details-section.tsx`:

```tsx
"use client";

import { Lock } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { DESIGNATION_OPTIONS } from "@/lib/options";
import type { SettingsFormValues } from "@/components/settings/profile-tab";

interface Props {
  email: string;
  role:  string;
}

export function MyDetailsSection({ email, role }: Props) {
  const { register, control, formState: { errors } } = useFormContext<SettingsFormValues>();

  return (
    <Section title="My Details" cols={2}>
      <InputGroup
        label="First Name"
        required
        error={errors.firstName?.message}
        {...register("firstName")}
      />
      <InputGroup
        label="Last Name"
        required
        error={errors.lastName?.message}
        {...register("lastName")}
      />
      <InputGroup
        label="Phone Number"
        required
        error={errors.phoneNumber?.message}
        {...register("phoneNumber")}
      />
      <Controller
        name="designation"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Designation"
            required
            options={DESIGNATION_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.designation?.message}
          />
        )}
      />
      {/* Read-only fields — not form inputs */}
      <div className="rounded border border-line bg-subtle px-3.5 pt-[18px] pb-3.5 md:col-span-2">
        <p className="text-[13px] font-medium text-label/70 leading-none mb-1.5">Email</p>
        <div className="flex items-center gap-2">
          <Lock className="size-3.5 text-placeholder shrink-0" />
          <p className="text-sm font-medium text-secondary">{email}</p>
        </div>
        <p className="mt-1.5 text-xs text-secondary">Email cannot be changed.</p>
      </div>
      <div className="rounded border border-line bg-subtle px-3.5 pt-[18px] pb-3.5">
        <p className="text-[13px] font-medium text-label/70 leading-none mb-2">Role</p>
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-soft text-brand border border-brand/20 capitalize">
          {role.toLowerCase()}
        </span>
      </div>
    </Section>
  );
}
```

- [ ] **Step 4: Write Firm Details section**

Create `apps/web/src/components/settings/firm-details-section.tsx`:

```tsx
"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { MultiSelectGroup } from "@/components/ui/form/multi-select";
import { Section } from "@/components/ui/section";
import { PRACTICE_TYPE_OPTIONS } from "@/lib/options";
import type { SettingsFormValues } from "@/components/settings/profile-tab";

export function FirmDetailsSection() {
  const { register, control, formState: { errors } } = useFormContext<SettingsFormValues>();

  return (
    <Section title="Firm Details" cols={2}>
      <div className="md:col-span-2">
        <InputGroup
          label="Firm Name"
          required
          error={errors.orgName?.message}
          {...register("orgName")}
        />
      </div>
      <InputGroup
        label="City"
        required
        error={errors.city?.message}
        {...register("city")}
      />
      <div className="md:col-span-2">
        <Controller
          name="practiceTypes"
          control={control}
          render={({ field }) => (
            <MultiSelectGroup
              label="Practice Types"
              required
              options={PRACTICE_TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.practiceTypes?.message}
            />
          )}
        />
      </div>
    </Section>
  );
}
```

- [ ] **Step 5: Write Profile tab**

Create `apps/web/src/components/settings/profile-tab.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Designation, PracticeType } from "@splexa-group/shared/enums";
import { PageContent } from "@/components/layout/page-content";
import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useOrganization, useProfile, useUpdateOrganization, useUpdateProfile } from "@/hooks/use-settings";
import { FirmDetailsSection } from "@/components/settings/firm-details-section";
import { MyDetailsSection } from "@/components/settings/my-details-section";

export interface SettingsFormValues {
  firstName:     string;
  lastName:      string;
  phoneNumber:   string;
  designation:   Designation;
  orgName:       string;
  city:          string;
  practiceTypes: PracticeType[];
}

export function ProfileTab() {
  const { data: profile }      = useProfile();
  const { data: organization } = useOrganization();
  const updateProfile      = useUpdateProfile();
  const updateOrganization = useUpdateOrganization();

  const form = useForm<SettingsFormValues>({
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

  const isSaving = updateProfile.isPending || updateOrganization.isPending;

  async function onSubmit(values: SettingsFormValues) {
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
    // Keep the auth store's orgName in sync
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setAuth({ ...currentUser, orgName: updatedOrg.data.name });
    }
    toast.success("Settings saved");
  }

  return (
    <>
      <FormProvider {...form}>
        <PageContent width="md" className="space-y-6">
          {profile && (
            <MyDetailsSection email={profile.email} role={profile.role} />
          )}
          <FirmDetailsSection />
        </PageContent>
      </FormProvider>
      <PageFooter
        right={
          <Button
            variant="primary"
            size="sm"
            disabled={isSaving}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        }
      />
    </>
  );
}
```

- [ ] **Step 6: Replace placeholder in page.tsx**

Open `apps/web/src/app/(protected)/settings/page.tsx` and replace the `ProfileTabPlaceholder` import and usage:

```tsx
// Remove:
function ProfileTabPlaceholder() {
  return <div className="p-6 text-sm text-secondary">Profile tab — coming in next task</div>;
}

// Add import at top:
import { ProfileTab } from "@/components/settings/profile-tab";

// Replace in JSX:
// Before: {activeTab === SettingsTabs.PROFILE && <ProfileTabPlaceholder />}
// After:
{activeTab === SettingsTabs.PROFILE && <ProfileTab />}
```

- [ ] **Step 7: Verify in browser**

Navigate to `http://localhost:3000/settings`. On the Profile tab:
- My Details section shows form fields populated from the API
- Email shows with lock icon and "Email cannot be changed." note
- Role shows as a badge
- Firm Details section shows firm name, city, and practice types multi-select
- "Save Changes" button saves both profile and organization
- Toast "Settings saved" appears on success

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/options.ts \
        apps/web/src/components/settings/my-details-section.tsx \
        apps/web/src/components/settings/firm-details-section.tsx \
        apps/web/src/components/settings/profile-tab.tsx \
        apps/web/src/app/\(protected\)/settings/page.tsx
git commit -m "feat(settings): add Profile tab with My Details and Firm Details sections"
```

---

### Task 5: Subscription tab

**Files:**
- Create: `apps/web/src/components/settings/subscription-tab.tsx`
- Modify: `apps/web/src/app/(protected)/settings/page.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`
- Produces: Static free-plan card rendered on the Subscription tab

- [ ] **Step 1: Write the subscription tab**

Create `apps/web/src/components/settings/subscription-tab.tsx`:

```tsx
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLAN_FEATURES = [
  "Unlimited cases",
  "Hearing reminders",
  "Document storage",
  "Up to 3 team members",
];

export function SubscriptionTab() {
  return (
    <div className="px-4 md:px-6 py-6">
      <div className="max-w-sm border border-line rounded-lg bg-card p-6 space-y-5">
        <div>
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Current Plan</p>
          <h2 className="text-lg font-semibold text-dark">Free</h2>
        </div>

        <ul className="space-y-2.5">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-body">
              <Check className="size-4 text-positive shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          variant="primary"
          size="sm"
          disabled
          title="Coming soon"
          className="w-full"
        >
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace placeholder in page.tsx**

Open `apps/web/src/app/(protected)/settings/page.tsx` and replace the `SubscriptionTabPlaceholder`:

```tsx
// Remove:
function SubscriptionTabPlaceholder() {
  return <div className="p-6 text-sm text-secondary">Subscription tab — coming in next task</div>;
}

// Add import at top:
import { SubscriptionTab } from "@/components/settings/subscription-tab";

// Replace in JSX:
// Before: {activeTab === SettingsTabs.SUBSCRIPTION && <SubscriptionTabPlaceholder />}
// After:
{activeTab === SettingsTabs.SUBSCRIPTION && <SubscriptionTab />}
```

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/settings?tab=subscription`. Confirm:
- Free plan card renders with "Current Plan" / "Free" header
- Four feature lines with check icons
- "Upgrade Plan" button is visible but disabled
- No network requests made on this tab

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/settings/subscription-tab.tsx \
        apps/web/src/app/\(protected\)/settings/page.tsx
git commit -m "feat(settings): add Subscription tab with free plan card"
```
