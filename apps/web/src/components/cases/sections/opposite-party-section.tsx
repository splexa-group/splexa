"use client";

import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { PartyRole } from "@splexa-group/shared/enums";
import { Field } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function OppositePartySection() {
  const { register, control } = useFormContext<UpdateCaseInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "oppositeParties",
  });

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Opposite Party
        </h3>
        <button
          type="button"
          onClick={() => append({ name: "", role: PartyRole.Respondent, advocateName: "", advocatePhone: "" })}
          className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <Plus className="size-3" /> Add party
        </button>
      </div>
      <div className="p-4 space-y-4">
        {fields.length === 0 && (
          <p className="text-xs text-placeholder text-center py-2">No opposite parties added.</p>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="border border-line rounded-lg p-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-secondary">Party {index + 1}</span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-negative hover:text-negative/80 transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" required {...register(`oppositeParties.${index}.name`)} />
              <Controller
                name={`oppositeParties.${index}.role`}
                control={control}
                render={({ field: f }) => (
                  <SelectGroup
                    label="Role"
                    options={PARTY_ROLE_OPTIONS}
                    value={f.value}
                    onChange={f.onChange}
                    required
                  />
                )}
              />
              <Field label="Advocate name" {...register(`oppositeParties.${index}.advocateName`)} />
              <Field label="Advocate phone" {...register(`oppositeParties.${index}.advocatePhone`)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
