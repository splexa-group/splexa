"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PartyRole } from "@splexa-group/shared/enums";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modals/modal";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";
import type { UpdateCaseInput } from "@/types/cases";

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

const ROLE_STYLES: Record<PartyRole, string> = {
  [PartyRole.Petitioner]: "bg-brand-soft text-brand",
  [PartyRole.Respondent]: "bg-amber-muted text-amber-dark",
  [PartyRole.Accused]: "bg-negative-muted text-negative",
  [PartyRole.Complainant]: "bg-positive-muted text-positive-dark",
};

function RoleBadge({ role }: { role: PartyRole }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_STYLES[role] ?? "bg-subtle text-secondary"}`}>
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
            <Button type="button" size="sm" variant="primarySoft" onClick={openAdd}>
              <Plus className="size-3.5" /> Add Party
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start justify-between gap-3 rounded border border-line bg-card px-4 py-3"
            >
              {/* Left — name + role + advocate */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-dark truncate">{field.name}</p>
                  <RoleBadge role={field.role} />
                </div>
                {(field.advocateName || field.advocatePhone) && (
                  <p className="text-xs text-secondary truncate">
                    {field.advocateName}
                    {field.advocateName && field.advocatePhone && " · "}
                    {field.advocatePhone}
                  </p>
                )}
              </div>

              {/* Right — actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(index)}
                  className="p-1.5 rounded text-placeholder hover:text-label hover:bg-subtle transition-colors"
                  aria-label="Edit"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1.5 rounded text-placeholder hover:text-negative hover:bg-negative-muted transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
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
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              {editIndex !== null ? "Save Changes" : "Add Party"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
