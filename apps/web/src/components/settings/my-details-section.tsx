"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { DESIGNATION_OPTIONS } from "@/constants/options";
import type { SettingsFormValues } from "@/components/settings/profile-tab";

interface Props {
  email: string;
  role: string;
}

export function MyDetailsSection({ email, role }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SettingsFormValues>();

  return (
    <Section title="Personal Details" cols={2}>
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
      <InputGroup
        label="Email"
        value={email}
        disabled
        readOnly
      />
      <InputGroup
        label="Role"
        value={role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
        disabled
        readOnly
      />
    </Section>
  );
}
