"use client";

import { z } from "zod";
import { Designation, FirmType, PracticeType, States } from "@splexa-group/shared/enums";
import { FormProvider, type UseFormReturn } from "react-hook-form";
import { PageLayout } from "@/components/layout/page-layout";
import { FirmDetailsSection } from "@/components/settings/firm-details-section";
import { MyDetailsSection } from "@/components/settings/my-details-section";

export const settingsFormSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phoneNumber: z.string().min(1, "Required").max(20),
  designation: z.nativeEnum(Designation),
  orgName: z.string().min(1, "Required").max(200),
  city: z.string().min(1, "Required").max(100),
  state: z.nativeEnum(States),
  firmType: z.nativeEnum(FirmType),
  practiceTypes: z.array(z.nativeEnum(PracticeType)).min(1, "Select at least one"),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface Props {
  form: UseFormReturn<SettingsFormValues>;
  email: string;
  role: string;
  isLoading: boolean;
}

export function ProfileTab({ form, email, role, isLoading }: Props) {
  if (isLoading) {
    return (
      <PageLayout maxWidth="medium" className="space-y-6">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded border border-line bg-card animate-pulse" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <FormProvider {...form}>
      <PageLayout maxWidth="medium" className="space-y-6">
        <MyDetailsSection email={email} role={role} />
        <FirmDetailsSection />
      </PageLayout>
    </FormProvider>
  );
}
