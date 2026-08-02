"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { CaseStatus, CaseType } from "@splexa-group/shared/enums";
import { formatIndianDate } from "@splexa-group/shared/utils";

import { ConfirmDeleteModal } from "@/components/shared/confirm-delete";
import { usePageLoading } from "@/components/layout/loader";
import { DataTable } from "@/components/ui/data-table";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Search } from "@/components/ui/form/search";
import { Select } from "@/components/ui/form/select";
import { Menu } from "@/components/ui/menu";
import { useCases, useDeleteCase } from "@/hooks/use-cases";
import { CaseFilters, CaseSummary } from "@/types/cases";
import { deadlineUrgencyPillClass, getDeadlineUrgency } from "@/utils/deadline-urgency";
import { formatHearingDate } from "@/utils/format-hearing-date";
import { CASE_STATUS_OPTIONS, CASE_TYPE_OPTIONS, formatEnumLabel } from "@/utils/options";
import { cn } from "@/utils/tailwind";

import { priorityBorderClass, statusBadgeClass } from "./case-styles";

const PAGE_SIZE = 30;

function isCaseStatus(v: string): v is CaseStatus {
  return (Object.values(CaseStatus) as string[]).includes(v);
}

function isCaseType(v: string): v is CaseType {
  return (Object.values(CaseType) as string[]).includes(v);
}

const COLUMNS = ["Case", "Number", "Client", "Court", "Status", "Next Hearing", ""];

const COLUMN_WIDTHS = "200px 200px 1fr 130px 120px 120px 35px";

export function CasesTable({ onAdd }: { onAdd?: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [caseType, setCaseType] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<CaseSummary | null>(null);

  const filters: CaseFilters = {
    search: search || undefined,
    status: isCaseStatus(status) ? status : undefined,
    caseType: isCaseType(caseType) ? caseType : undefined,
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
    const isOverdue =
      !!c.nextHearingDate && getDeadlineUrgency(c.nextHearingDate).urgency === "overdue";

    return {
      key: c.id,
      onClick: () => router.push(`/cases/${c.id}`),
      className: cn(
        priorityBorderClass(c.priority),
        (c.status === CaseStatus.STAYED || c.status === CaseStatus.DISPOSED) && "opacity-40",
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
          {formatEnumLabel(c.status)}
        </span>,

        <div key="hearing" className="pr-4 flex flex-col gap-1">
          <p className="text-sm text-body truncate">
            {isOverdue
              ? formatIndianDate(c.nextHearingDate as string)
              : formatHearingDate(c.nextHearingDate)}
          </p>
          {isOverdue && (
            <span
              className={cn(
                "inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold",
                deadlineUrgencyPillClass("overdue"),
              )}
            >
              Overdue
            </span>
          )}
        </div>,

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
          options={CASE_TYPE_OPTIONS}
          value={caseType}
          onChange={setCaseType}
          onClear={() => {
            setCaseType("");
            setPage(1);
          }}
          placeholder="Filter by case type..."
        />
      </FiltersBar>

      <DataTable
        columns={COLUMNS}
        columnWidths={COLUMN_WIDTHS}
        rows={rows}
        emptyStateText="No cases found."
        emptyStateAction={onAdd ? { label: "Add new case", onClick: onAdd } : undefined}
        page={page}
        pageSize={PAGE_SIZE}
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
