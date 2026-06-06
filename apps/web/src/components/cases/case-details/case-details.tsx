"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import {
  CASE_STAGE_OPTIONS,
  CASE_STATUS_OPTIONS,
  CASE_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";
import { DatePicker } from "@/components/ui/form/date-picker";

export function CaseDetailsSection() {
  const { register, control } = useFormContext<UpdateCaseInput>();

  return (
    <Section title="Case Details" cols={3}>
      <InputGroup
        label="Case Title"
        required
        type="text"
        autoComplete="off"
        placeholder="Enter case title..."
        {...register("title", {
          required: true,
        })}
      />
      <InputGroup
        label="Case Number"
        type="text"
        autoComplete="off"
        placeholder="Enter case number..."
        {...register("caseNumber")}
      />
      <Controller
        name="caseType"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Case Type"
            options={CASE_TYPE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            onClear={() => field.onChange("")}
            placeholder="Select type..."
          />
        )}
      />
      <Controller
        name="filingDate"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="Filing Date"
            value={field.value ?? ""}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        name="stage"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Stage"
            options={CASE_STAGE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            onClear={() => field.onChange("")}
            placeholder="Select stage..."
          />
        )}
      />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Status"
            options={CASE_STATUS_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            placeholder="Select status..."
          />
        )}
      />
      <Controller
        name="priority"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            onClear={() => field.onChange("")}
            placeholder="Select priority..."
          />
        )}
      />
    </Section>
  );
}
