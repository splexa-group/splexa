"use client";

import { useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/input";
import type { UpdateCaseInput } from "@/types/cases";

export function JudgeDetailsSection() {
  const { register } = useFormContext<UpdateCaseInput>();

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Judge Details
        </h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Judge Name" {...register("judgeName")} />
        <Field label="Designation" {...register("judgeDesignation")} />
      </div>
    </div>
  );
}
