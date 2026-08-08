"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { MultiSelectGroup } from "@/components/ui/form/multi-select";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { FIRM_TYPE_OPTIONS, PRACTICE_TYPE_OPTIONS, STATE_OPTIONS } from "@/utils/options";
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

      <Controller
        name="firmType"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Firm Type"
            required
            options={FIRM_TYPE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.firmType?.message}
          />
        )}
      />

      <InputGroup label="City" required error={errors.city?.message} {...register("city")} />

      <Controller
        name="state"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="State"
            required
            options={STATE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.state?.message}
          />
        )}
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
