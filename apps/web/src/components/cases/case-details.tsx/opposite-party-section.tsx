"use client";

import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { PartyRole } from "@splexa-group/shared/enums";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

export function OppositePartySection() {
  const { register, control } = useFormContext<UpdateCaseInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "oppositeParties",
  });

  const addParty = () =>
    append({
      name: "",
      role: PartyRole.Respondent,
      advocateName: "",
      advocatePhone: "",
    });

  return (
    <Section
      title="Opposite Parties"
      isEmpty={fields.length === 0}
      emptyLabel="No opposite parties added."
      onAdd={addParty}
      addLabel="Add Party"
    >
      <div>
        {fields.map((field, index) => (
          <div key={field.id} className="pt-4 pb-4 first:pt-0">
            {fields.length > 1 && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-placeholder">
                  Party {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-placeholder hover:text-negative transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <InputGroup
                label="Name"
                placeholder="Enter party name..."
                required
                {...register(`oppositeParties.${index}.name`)}
              />
              <Controller
                name={`oppositeParties.${index}.role`}
                control={control}
                render={({ field: f }) => (
                  <SelectGroup
                    label="Role"
                    placeholder="Select role..."
                    options={PARTY_ROLE_OPTIONS}
                    value={f.value}
                    onChange={f.onChange}
                    required
                  />
                )}
              />
              <InputGroup
                label="Advocate Name"
                placeholder="Enter advocate name..."
                {...register(`oppositeParties.${index}.advocateName`)}
              />
              <InputGroup
                label="Advocate Phone"
                placeholder="Enter phone number..."
                {...register(`oppositeParties.${index}.advocatePhone`)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 mt-1 flex items-center justify-between">
        <Button
          type="button"
          size="sm"
          variant="primarySoft"
          onClick={addParty}
        >
          <Plus className="size-3.5" /> Add Party
        </Button>
        {fields.length === 1 && (
          <button
            type="button"
            onClick={() => remove(0)}
            className="flex items-center gap-1 text-xs text-placeholder hover:text-negative transition-colors"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        )}
      </div>
    </Section>
  );
}
