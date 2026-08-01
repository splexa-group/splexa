"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash2, Pencil, Scale } from "lucide-react";
import { PartyRole } from "@splexa-group/shared/enums";
import { CaseSubTabLabel } from "@/constants/case-tabs";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { RoleDotBadge } from "@/components/cases/role-badge";
import {
  OppositePartyModal,
  DEFAULT_PARTY_FORM,
  type PartyFormData,
} from "@/components/modals/opposite-party";
import type { UpdateCaseInput } from "@/types/cases";

export function OppositePartySection() {
  const { control } = useFormContext<UpdateCaseInput>();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "oppositeParties",
  });

  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<PartyFormData>(DEFAULT_PARTY_FORM);
  const [nameError, setNameError] = useState("");

  function openAdd() {
    setForm(DEFAULT_PARTY_FORM);
    setEditIndex(null);
    setNameError("");
    setOpen(true);
  }

  function openEdit(index: number) {
    const f = fields[index];
    setForm({
      name: f.name ?? "",
      role: f.role ?? PartyRole.RESPONDENT,
      advocateName: f.advocateName ?? "",
      advocatePhone: f.advocatePhone ?? "",
    });
    setEditIndex(index);
    setNameError("");
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      setNameError("Name is required");
      return;
    }
    if (editIndex !== null) {
      update(editIndex, form);
    } else {
      append(form);
    }
    setOpen(false);
  }

  function handleChange(field: keyof PartyFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name") setNameError("");
  }

  return (
    <>
      <Section
        title={CaseSubTabLabel.OPPOSITE_PARTIES}
        isEmpty={fields.length === 0}
        emptyLabel="No opposite parties added yet."
        onAdd={openAdd}
        addLabel="Add Party"
        action={
          fields.length > 0 ? (
            <Button type="button" onClick={openAdd}>
              Add Party
            </Button>
          ) : undefined
        }
      >
        <div className="rounded border border-line bg-card overflow-hidden">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-4 px-4 py-3 border-b border-line last:border-b-0"
            >
              <span className="text-sm font-semibold text-dark truncate">{field.name}</span>

              <div>{field.role && <RoleDotBadge role={field.role} />}</div>

              <span className="flex items-center gap-1.5 text-sm text-secondary truncate">
                {field.advocateName ? (
                  <>
                    <Scale className="size-3.5 shrink-0" />
                    {field.advocateName}
                  </>
                ) : (
                  <span className="text-placeholder">—</span>
                )}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(index)}
                  className="p-2 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                  aria-label="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 rounded bg-negative-muted text-negative hover:opacity-80 transition-opacity"
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/** Modals */}
      <OppositePartyModal
        open={open}
        onClose={() => setOpen(false)}
        editIndex={editIndex}
        form={form}
        nameError={nameError}
        onChange={handleChange}
        onSave={handleSave}
      />
    </>
  );
}
