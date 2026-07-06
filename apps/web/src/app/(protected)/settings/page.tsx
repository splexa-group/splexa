"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { SETTINGS_TAB_CONFIG } from "@/config/settings-tabs";
import { SettingsTabs } from "@/enums/settings-tabs";
import { useActiveTab } from "@/hooks/use-active-tab";
import { useOrganization, useProfile, useUpdateOrganization, useUpdateProfile } from "@/hooks/use-settings";
import { useAuthStore } from "@/store/auth-store";
import { ProfileTab, settingsFormSchema, type SettingsFormValues } from "@/components/settings/profile-tab";
import { SubscriptionTab } from "@/components/settings/subscription-tab";

export default function SettingsPage() {
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
