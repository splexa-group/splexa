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
      toast.success("Settings saved");
    } catch {
      // onError handlers in mutations show the toast
    }
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
