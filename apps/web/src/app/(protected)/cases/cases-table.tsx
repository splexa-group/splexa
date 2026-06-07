"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCases, useDeleteCase } from "@/hooks/use-cases";
import { usePageLoading } from "@/components/layout/loader";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { Select } from "@/components/ui/form/select";
import { Search } from "@/components/ui/form/search";
import { FiltersBar } from "@/components/ui/filters-bar";
import { DataTable } from "@/components/ui/data-table";
import { Menu } from "@/components/ui/menu";
import { Pencil, Trash2 } from "lucide-react";
import { CaseSummary, CaseFilters } from "@/types/cases";
import { CaseStatus } from "@splexa-group/shared/enums";
import { CASE_STATUS_OPTIONS, CASE_SORT_OPTIONS } from "@/lib/options";
import {
  priorityBorderClass,
  statusBadgeClass,
  formatHearingDate,
} from "../../../components/cases/case-utils";

const PAGE_SIZE = 30;

function isCaseStatus(v: string): v is CaseStatus {
  return (Object.values(CaseStatus) as string[]).includes(v);
}

const SORT_BY_VALUES: NonNullable<CaseFilters["sortBy"]>[] = [
  "hearingDate",
  "createdAt",
];

function isSortBy(v: string): v is NonNullable<CaseFilters["sortBy"]> {
  return SORT_BY_VALUES.includes(v as NonNullable<CaseFilters["sortBy"]>);
}

const COLUMNS = [
  "Case",
  "Number",
  "Client",
  "Court",
  "Status",
  "Next Hearing",
  "",
];

const COLUMN_WIDTHS = "200px 200px 1fr 130px 120px 120px 35px";

export function CasesTable({ onAdd }: { onAdd?: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<CaseSummary | null>(null);

  const filters: CaseFilters = {
    search: search || undefined,
    status: isCaseStatus(status) ? status : undefined,
    sortBy: isSortBy(sortBy) ? sortBy : undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading } = useCases(filters);
  const deleteCase = useDeleteCase();
  const cases = data?.data ?? [];

  usePageLoading(isLoading);

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteCase.mutateAsync(toDelete.id);
    setToDelete(null);
  };

  const rows = cases.map((c) => {
    return {
      key: c.id,
      onClick: () => router.push(`/cases/${c.id}`),
      className: cn(
        priorityBorderClass(c.priority),
        (c.status === CaseStatus.Stayed || c.status === CaseStatus.Disposed) &&
          "opacity-40",
      ),
      cells: [
        <p key="title" className="text-sm text-body truncate pr-4">
          {c.title}
        </p>,

        <p key="number" className="text-sm text-body pr-4 truncate">
          {c.caseNumber ?? "No case number"}
        </p>,

        <p key="client" className="text-sm text-body pr-4 truncate">
          {c.client?.fullName ?? "No client"}
        </p>,

        <p key="court" className="text-sm text-body pr-4 truncate">
          {c.courtName ?? "No court"}
        </p>,

        <span
          key="status"
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-sm w-fit",
            statusBadgeClass(c.status),
          )}
        >
          {c.status}
        </span>,

        <span key="hearing" className="text-sm text-body pr-4 truncate">
          {formatHearingDate(c.nextHearingDate)}
        </span>,

        <div key="actions" onClick={(e) => e.stopPropagation()}>
          <Menu
            items={[
              {
                label: "Edit",
                icon: Pencil,
                onClick: () => router.push(`/cases/${c.id}`),
              },
              {
                label: "Delete",
                icon: Trash2,
                onClick: () => setToDelete(c),
                danger: true,
              },
            ]}
          />
        </div>,
      ],
    };
  });

  return (
    <div className="flex flex-col h-full">
      <FiltersBar columns="1fr 300px 300px">
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          placeholder="Search cases, clients, case numbers..."
        />
        <Select
          options={CASE_STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          onClear={() => {
            setStatus("");
            setPage(1);
          }}
          placeholder="Filter by status..."
        />
        <Select
          options={CASE_SORT_OPTIONS}
          value={sortBy}
          onChange={setSortBy}
          onClear={() => {
            setSortBy("");
            setPage(1);
          }}
          placeholder="Sort by..."
        />
      </FiltersBar>

      <DataTable
        columns={COLUMNS}
        columnWidths={COLUMN_WIDTHS}
        rows={rows}
        emptyStateText="No cases found."
        emptyStateAction={
          onAdd ? { label: "Add new case", onClick: onAdd } : undefined
        }
        page={page}
        totalRows={data?.total ?? 0}
        onPageChange={setPage}
      />

      <ConfirmDeleteModal
        open={!!toDelete}
        title="case"
        entityName={toDelete?.title ?? ""}
        isPending={deleteCase.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
