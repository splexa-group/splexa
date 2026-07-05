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
