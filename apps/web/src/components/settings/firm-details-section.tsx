"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { MultiSelectGroup } from "@/components/ui/form/multi-select";
import { Section } from "@/components/ui/section";
import { PRACTICE_TYPE_OPTIONS } from "@/utils/options";
import type { SettingsFormValues } from "@/components/settings/profile-tab";

export function FirmDetailsSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SettingsFormValues>();

  return (
    <Section title="Firm Details" cols={2}>
      <InputGroup
        label="Firm Name"
        required
        error={errors.orgName?.message}
        {...register("orgName")}
      />

      <InputGroup
        label="City"
        required
        error={errors.city?.message}
        {...register("city")}
      />
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
    </Section>
  );
}
