"use client";

import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { PartyRole } from "@splexa-group/shared/enums";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";
import { UpdateCaseInput } from "@/types/cases";
import { Button } from "@/components/ui/button";

export function OppositePartySection() {
  const { register, control } = useFormContext<UpdateCaseInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "oppositeParties",
  });

  return (
    <Section
      title="Opposite Parties"
      action={
        <Button
          type="button"
          // variant="primarySoft"
          onClick={() =>
            append({
              name: "",
              role: PartyRole.Respondent,
              advocateName: "",
              advocatePhone: "",
            })
          }
        >
          Add Party
        </Button>
      }
    >
      {fields.length === 0 && (
        <p className="text-[13px] text-placeholder text-center py-2">
          No opposite parties added.
        </p>
      )}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="border border-line rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-secondary">
                Party {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-negative hover:text-negative/80 transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup
                label="Name"
                placeholder="Enter party name"
                required
                {...register(`oppositeParties.${index}.name`)}
              />
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
    </Section>
  );
}
