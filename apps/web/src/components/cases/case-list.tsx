"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCases, useDeleteCase } from "@/hooks/use-cases";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { CaseTableRow } from "./case-table-row";
import { CaseCard } from "./case-card";
import type { CaseSummary } from "@/types/cases";
import { CaseStatus } from "@splexa-group/shared/enums";

const STATUS_TABS: { label: string; value: CaseStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Active", value: CaseStatus.Active },
  { label: "Stayed", value: CaseStatus.Stayed },
  { label: "Disposed", value: CaseStatus.Disposed },
];

export function CaseList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<CaseStatus | "All">("All");
  const [toDelete, setToDelete] = useState<CaseSummary | null>(null);

  const filters = {
    search: search || undefined,
    status: statusTab !== "All" ? statusTab : undefined,
  };

  const { data, isLoading } = useCases(filters);
  const deleteCase = useDeleteCase();

  const cases = data?.data ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="px-4 md:px-6 pt-4 pb-0 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-placeholder" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases, clients, case numbers…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-line bg-card text-sm text-dark placeholder:text-placeholder focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-line overflow-x-auto -mb-px">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={cn(
                "px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                statusTab === tab.value
                  ? "border-dark text-dark font-bold"
                  : "border-transparent text-placeholder hover:text-secondary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 py-2 text-xs text-placeholder">
        {isLoading ? "Loading…" : `${data?.total ?? 0} cases · sorted by next hearing`}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block flex-1 overflow-y-auto px-6">
        {!isLoading && cases.length === 0 ? (
          <EmptyState onAdd={() => router.push("/cases/new")} />
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            {/* Column headers */}
            <div className="grid px-4 py-2 bg-subtle border-b border-line grid-cols-[12px_1fr_140px_130px_70px_110px_36px]">
              {["", "Case / Number", "Client", "Court", "Status", "Next Hearing", ""].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-placeholder">
                  {h}
                </span>
              ))}
            </div>
            {cases.map((c) => (
              <CaseTableRow key={c.id} case_={c} onDelete={setToDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        {!isLoading && cases.length === 0 ? (
          <EmptyState onAdd={() => router.push("/cases/new")} />
        ) : (
          cases.map((c) => (
            <CaseCard key={c.id} case_={c} onDelete={setToDelete} />
          ))
        )}
      </div>

      <ConfirmDeleteModal
        open={!!toDelete}
        title="case"
        entityName={toDelete?.title ?? ""}
        isPending={deleteCase.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteCase.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-secondary mb-4">No cases yet.</p>
      <button
        type="button"
        onClick={onAdd}
        className="text-sm font-semibold text-brand hover:underline"
      >
        Add your first case
      </button>
    </div>
  );
}
