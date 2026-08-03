"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientType } from "@splexa-group/shared/enums";

import { usePageLoading } from "@/components/layout/loader";
import { DataTable } from "@/components/ui/data-table";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Search } from "@/components/ui/form/search";
import { Select } from "@/components/ui/form/select";
import { useClients } from "@/hooks/use-clients";
import type { ClientFilters } from "@/types/clients";
import { CLIENT_TYPE_OPTIONS } from "@/utils/options";

const PAGE_SIZE = 30;

function isClientType(v: string): v is ClientType {
  return (Object.values(ClientType) as string[]).includes(v);
}

const COLUMNS = ["Name", "Type", "Phone", "Email"];

const COLUMN_WIDTHS = "1fr 140px 180px 1fr";

export function ClientsTable({ onAdd }: { onAdd?: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const filters: ClientFilters = {
    search: search || undefined,
    type: isClientType(type) ? type : undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading } = useClients(filters);
  const clients = data?.data ?? [];

  usePageLoading(isLoading);

  const rows = clients.map((c) => ({
    key: c.id,
    onClick: () => router.push(`/clients/${c.id}`),
    cells: [
      <p key="name" className="text-sm text-body truncate pr-4">
        {c.fullName}
      </p>,

      <p key="type" className="text-sm text-body pr-4 truncate">
        {c.type}
      </p>,

      <p key="phone" className="text-sm text-body pr-4 truncate">
        {c.phone}
      </p>,

      <p key="email" className="text-sm text-body pr-4 truncate">
        {c.email ?? "NA"}
      </p>,
    ],
  }));

  return (
    <div className="flex flex-col h-full">
      <FiltersBar columns="1fr 240px">
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          placeholder="Search clients, phone, email, company..."
        />
        <Select
          options={CLIENT_TYPE_OPTIONS}
          value={type}
          onChange={setType}
          onClear={() => {
            setType("");
            setPage(1);
          }}
          placeholder="Filter by type..."
        />
      </FiltersBar>

      <DataTable
        columns={COLUMNS}
        columnWidths={COLUMN_WIDTHS}
        rows={rows}
        emptyStateText="No clients found."
        emptyStateAction={onAdd ? { label: "Add new client", onClick: onAdd } : undefined}
        page={page}
        pageSize={PAGE_SIZE}
        totalRows={data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
