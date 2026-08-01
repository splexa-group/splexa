"use client";

import { PartyRole } from "@splexa-group/shared/enums";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { Modal } from "@/components/shared/modal";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";

export interface PartyFormData {
  name: string;
  role: PartyRole;
  advocateName: string;
  advocatePhone: string;
}

export const DEFAULT_PARTY_FORM: PartyFormData = {
  name: "",
  role: PartyRole.RESPONDENT,
  advocateName: "",
  advocatePhone: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  editIndex: number | null;
  form: PartyFormData;
  nameError: string;
  onChange: (field: keyof PartyFormData, value: string) => void;
  onSave: () => void;
}

export function OppositePartyModal({
  open,
  onClose,
  editIndex,
  form,
  nameError,
  onChange,
  onSave,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editIndex !== null ? "Edit Opposite Party" : "Add Opposite Party"}
      onSave={onSave}
      saveLabel={editIndex !== null ? "Save Changes" : "Add Party"}
    >
      <div className="p-5 grid grid-cols-2 gap-4">
        <InputGroup
          label="Name"
          required
          placeholder="Enter party name..."
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          error={nameError}
        />
        <SelectGroup
          label="Role"
          required
          options={PARTY_ROLE_OPTIONS}
          value={form.role}
          onChange={(v) => onChange("role", v)}
        />
        <InputGroup
          label="Advocate Name"
          placeholder="Enter advocate name..."
          value={form.advocateName}
          onChange={(e) => onChange("advocateName", e.target.value)}
        />
        <InputGroup
          label="Advocate Phone"
          placeholder="Enter phone number..."
          value={form.advocatePhone}
          onChange={(e) => onChange("advocatePhone", e.target.value)}
        />
      </div>
    </Modal>
  );
}
