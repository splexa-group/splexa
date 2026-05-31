"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { COURT_TYPE_OPTIONS } from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function CourtDetailsSection() {
  const { register, control } = useFormContext<UpdateCaseInput>();

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Court Details
        </h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Court Name" {...register("courtName")} />
        </div>
        <Controller
          name="courtType"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Court Type"
              options={COURT_TYPE_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Select type"
            />
          )}
        />
        <Field label="Bench No." {...register("benchNumber")} />
        <Field label="State" {...register("courtState")} />
        <Field label="City" {...register("courtCity")} />
      </div>
    </div>
  );
}
