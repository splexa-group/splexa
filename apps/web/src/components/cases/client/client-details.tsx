"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { TextareaGroup } from "@/components/ui/form/textarea";
import { SelectGroup } from "@/components/ui/form/select";
import { DatePicker } from "@/components/ui/form/date-picker";
import { Section } from "@/components/ui/section";
import { CLIENT_TYPE_OPTIONS, RELATION_TYPE_OPTIONS } from "@/constants/options";
import type { UpdateClientInput } from "@/types/clients";

export function ClientDetails() {
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
      <InputGroup
        label="Company Name"
        placeholder="Enter company name..."
        {...register("companyName")}
      />
      <InputGroup
        label="Address"
        placeholder="Enter address..."
        {...register("address")}
      />
      <Controller
        name="relationType"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Relation"
            options={RELATION_TYPE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            placeholder="Select relation..."
          />
        )}
      />
      <InputGroup
        label="Relation Name"
        placeholder="Enter father's/husband's name..."
        {...register("relationName")}
      />
      <Controller
        name="dateOfBirth"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="Date of Birth"
            value={field.value ?? ""}
            onChange={field.onChange}
          />
        )}
      />
      <InputGroup
        label="Occupation"
        placeholder="Enter occupation..."
        {...register("occupation")}
      />
      <TextareaGroup
        label="Notes"
        placeholder="Enter notes..."
        className="col-span-2"
        rows={4}
        {...register("notes")}
      />
    </Section>
  );
}
