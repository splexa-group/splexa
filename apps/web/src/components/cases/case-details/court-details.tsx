"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { COURT_TYPE_OPTIONS } from "@/utils/options";
import type { UpdateCaseInput } from "@/types/cases";
import { Section } from "@/components/ui/section";

export function CourtDetailsSection() {
  const { register, control } = useFormContext<UpdateCaseInput>();

  return (
    <Section title="Court Details" cols={2}>
      <InputGroup
        label="Court Name"
        placeholder="Enter court name..."
        {...register("courtName")}
      />

      <Controller
        name="courtType"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Court Type"
            options={COURT_TYPE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            placeholder="Select court type..."
          />
        )}
      />
      <InputGroup
        label="Bench No."
        placeholder="Enter bench number..."
        {...register("benchNumber")}
      />
      <InputGroup
        label="State"
        placeholder="Enter state..."
        {...register("courtState")}
      />
      <InputGroup
        label="City"
        placeholder="Enter city..."
        {...register("courtCity")}
      />
    </Section>
  );
}
