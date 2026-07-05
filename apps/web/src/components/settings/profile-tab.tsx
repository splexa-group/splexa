"use client";

import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Designation, PracticeType } from "@splexa-group/shared/enums";
import { PageContent } from "@/components/layout/page-content";
import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useOrganization, useProfile, useUpdateOrganization, useUpdateProfile } from "@/hooks/use-settings";
import { FirmDetailsSection } from "@/components/settings/firm-details-section";
import { MyDetailsSection } from "@/components/settings/my-details-section";

const settingsFormSchema = z.object({
  firstName:     z.string().min(1, "Required"),
  lastName:      z.string().min(1, "Required"),
  phoneNumber:   z.string().min(1, "Required").max(20),
  designation:   z.nativeEnum(Designation),
  orgName:       z.string().min(1, "Required").max(200),
  city:          z.string().min(1, "Required").max(100),
  practiceTypes: z.array(z.nativeEnum(PracticeType)).min(1, "Select at least one"),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function ProfileTab() {
  const { data: profile, isLoading: profileLoading }      = useProfile();
  const { data: organization, isLoading: orgLoading }     = useOrganization();
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
  const isDisabled = isSaving || profileLoading || orgLoading;

  if (profileLoading || orgLoading) {
    return (
      <PageContent width="md" className="space-y-6">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded border border-line bg-card animate-pulse" />
          ))}
        </div>
      </PageContent>
    );
  }

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
      // Keep the auth store's orgName in sync
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth({ ...currentUser, orgName: updatedOrg.data.name });
      }
    } catch {
      // onError handlers in mutations show the toast
    }
  }

  return (
    <>
      <FormProvider {...form}>
        <PageContent width="md" className="space-y-6">
          <MyDetailsSection email={profile?.email ?? ""} role={profile?.role ?? ""} />
          <FirmDetailsSection />
        </PageContent>
      </FormProvider>
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
    </>
  );
}
