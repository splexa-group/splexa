"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { CLIENT_TYPE_OPTIONS } from "@/lib/options";
import type { UpdateClientInput } from "@/types/clients";

export function ClientTab() {
  const { register, control } = useFormContext<UpdateClientInput>();

  return (
    <Section title="Client Information" cols={2}>
      <InputGroup
        label="Full Name"
        placeholder="Enter full name..."
        {...register("fullName")}
      />
      <Controller
        name="type"
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
        {...register("phone")}
      />
      <InputGroup
        label="Email"
        placeholder="Enter email address..."
        {...register("email")}
      />
    </Section>
  );
}
