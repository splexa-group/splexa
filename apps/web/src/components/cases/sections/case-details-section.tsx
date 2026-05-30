"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { TextareaField } from "@/components/ui/textarea";
import {
  CASE_STAGE_OPTIONS,
  CASE_STATUS_OPTIONS,
  CASE_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function CaseDetailsSection() {
  const { register, control, formState: { errors } } = useFormContext<UpdateCaseInput>();

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Case Details
        </h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
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
        <div className="md:col-span-3">
          <TextareaField
            label="Description"
            rows={4}
            error={errors.description?.message}
            {...register("description")}
          />
        </div>
      </div>
    </div>
  );
}
