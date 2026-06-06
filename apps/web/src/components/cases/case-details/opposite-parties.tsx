"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash2, Pencil, Scale } from "lucide-react";
import { PartyRole } from "@splexa-group/shared/enums";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modals/modal";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

// ---------------------------------------------------------------------------
// Role dot badge
// ---------------------------------------------------------------------------

const ROLE_BADGE_STYLES: Record<PartyRole, string> = {
  [PartyRole.Petitioner]: "bg-brand-soft text-brand",
  [PartyRole.Respondent]: "bg-brand-soft text-brand",
  [PartyRole.Accused]: "bg-negative-muted text-negative",
  [PartyRole.Complainant]: "bg-positive-muted text-positive-dark",
};

function RoleDotBadge({ role }: { role: PartyRole }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${ROLE_BADGE_STYLES[role] ?? "bg-subtle text-secondary"}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {role}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Party form state
// ---------------------------------------------------------------------------

interface PartyFormData {
  name: string;
  role: PartyRole;
  advocateName: string;
  advocatePhone: string;
}

const DEFAULT_FORM: PartyFormData = {
  name: "",
  role: PartyRole.Respondent,
  advocateName: "",
  advocatePhone: "",
};

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function OppositePartySection() {
  const { control } = useFormContext<UpdateCaseInput>();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "oppositeParties",
  });

  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<PartyFormData>(DEFAULT_FORM);
  const [nameError, setNameError] = useState("");

  function openAdd() {
    setForm(DEFAULT_FORM);
    setEditIndex(null);
    setNameError("");
    setOpen(true);
  }

  function openEdit(index: number) {
    const f = fields[index];
    setForm({
      name: f.name ?? "",
      role: f.role ?? PartyRole.Respondent,
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

  function set(field: keyof PartyFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name") setNameError("");
  }

  return (
    <>
      <Section
        title="Opposite Parties"
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
              {/* Name */}
              <span className="text-sm font-semibold text-dark truncate">
                {field.name}
              </span>

              {/* Role badge */}
              <div>
                {field.role && <RoleDotBadge role={field.role} />}
              </div>

              {/* Advocate */}
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

              {/* Actions */}
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

      {/* Add / Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editIndex !== null ? "Edit Opposite Party" : "Add Opposite Party"}
      >
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputGroup
              label="Name"
              required
              placeholder="Enter party name..."
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={nameError}
            />
            <SelectGroup
              label="Role"
              required
              options={PARTY_ROLE_OPTIONS}
              value={form.role}
              onChange={(v) => set("role", v as PartyRole)}
            />
            <InputGroup
              label="Advocate Name"
              placeholder="Enter advocate name..."
              value={form.advocateName}
              onChange={(e) => set("advocateName", e.target.value)}
            />
            <InputGroup
              label="Advocate Phone"
              placeholder="Enter phone number..."
              value={form.advocatePhone}
              onChange={(e) => set("advocatePhone", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {editIndex !== null ? "Save Changes" : "Add Party"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
