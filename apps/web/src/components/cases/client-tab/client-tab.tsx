"use client";

import { Controller, useFormContext } from "react-hook-form";
import Link from "next/link";
import { Lock } from "lucide-react";
import { SelectGroup } from "@/components/ui/form/select";
import { PARTY_ROLE_OPTIONS } from "@/lib/options";
import type { CaseDetail } from "@/types/cases";
import type { UpdateCaseInput } from "@/types/cases";

interface ClientTabProps {
  caseDetail: CaseDetail;
}

export function ClientTab({ caseDetail }: ClientTabProps) {
  const { control } = useFormContext<UpdateCaseInput>();

  if (!caseDetail.client) {
    return (
      <div className="bg-card border border-line rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-label mb-1">No client linked</p>
        <p className="text-xs text-placeholder">
          Edit the case to link a client.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-placeholder">
          Client Info
        </h3>
        <Link
          href={`/clients/${caseDetail.clientId}`}
          className="text-xs font-semibold text-brand hover:underline"
        >
          View full profile →
        </Link>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-label mb-1.5">
            <Lock className="size-3 text-placeholder" />
            Full Name
          </label>
          <input
            readOnly
            disabled
            value={caseDetail.client.fullName}
            className="w-full rounded-md border border-line bg-subtle px-3 py-[9px] text-sm text-secondary cursor-not-allowed"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-label mb-1.5">
            <Lock className="size-3 text-placeholder" />
            Client Type
          </label>
          <input
            readOnly
            disabled
            value={caseDetail.client.type}
            className="w-full rounded-md border border-line bg-subtle px-3 py-[9px] text-sm text-secondary cursor-not-allowed"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-label mb-1.5">
            <Lock className="size-3 text-placeholder" />
            Phone
          </label>
          <input
            readOnly
            disabled
            value={caseDetail.client.phone}
            className="w-full rounded-md border border-line bg-subtle px-3 py-[9px] text-sm text-secondary cursor-not-allowed"
          />
        </div>

        <Controller
          name="clientRole"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Role in Case"
              options={PARTY_ROLE_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              required
            />
          )}
        />
      </div>
    </div>
  );
}
