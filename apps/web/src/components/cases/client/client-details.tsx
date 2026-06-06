"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { PARTY_ROLE_OPTIONS, CLIENT_TYPE_OPTIONS } from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function ClientTab() {
  const { register, control } = useFormContext<UpdateCaseInput>();

  return (
    <Section title="Client Information" cols={2}>
      <InputGroup
        label="Full Name"
        placeholder="Enter full name..."
        {...register("client.fullName")}
      />
      <Controller
        name="client.type"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Client Type"
            options={CLIENT_TYPE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
          />
        )}
      />
      <InputGroup
        label="Phone"
        placeholder="Enter phone number..."
        {...register("client.phone")}
      />
      <InputGroup
        label="Email"
        placeholder="Enter email address..."
        {...register("client.email")}
      />
      <Controller
        name="clientRole"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Role in Case"
            options={PARTY_ROLE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
          />
        )}
      />
    </Section>
  );
}
