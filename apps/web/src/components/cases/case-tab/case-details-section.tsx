"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { TextareaField } from "@/components/ui/form/textarea";
import { Section } from "@/components/ui/section";
import {
  CASE_STAGE_OPTIONS,
  CASE_STATUS_OPTIONS,
  CASE_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function CaseDetailsSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<UpdateCaseInput>();

  return (
    <Section title="Case Details" cols={3}>
      <div className="col-span-full">
        <Field
          label="Case Title"
          error={errors.title?.message}
          {...register("title")}
        />
      </div>
      <Field label="Case Number" {...register("caseNumber")} />
      <Controller
        name="caseType"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Case Type"
            options={CASE_TYPE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            placeholder="Select type"
          />
        )}
      />
      <Field label="Filing Date" type="date" {...register("filingDate")} />
      <Controller
        name="stage"
        control={control}
        render={({ field }) => (
          <SelectGroup
            label="Stage"
            options={CASE_STAGE_OPTIONS}
            value={field.value ?? ""}
            onChange={field.onChange}
            placeholder="Select stage"
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
            placeholder="Select priority"
          />
        )}
      />
      <div className="col-span-full">
        <TextareaField
          label="Description"
          rows={4}
          error={errors.description?.message}
          {...register("description")}
        />
      </div>
    </Section>
  );
}
