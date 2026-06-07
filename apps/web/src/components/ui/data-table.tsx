"use client";

import { type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export interface DataTableRow {
  key: string;
  cells: ReactNode[];
  onClick?: () => void;
  className?: string;
}

export interface DataTableProps {
  columns: ReactNode[];
  columnWidths: string;
  rows: DataTableRow[];
  emptyStateText?: string;
  emptyStateAction?: { label: string; onClick: () => void };
  page?: number;
  pageSize?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable({
  columns,
  columnWidths,
  rows,
  emptyStateText = "No results found",
  emptyStateAction,
  page = 1,
  pageSize = 10,
  totalRows = 0,
  onPageChange,
}: DataTableProps) {
  const isEmpty = rows.length === 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalRows);
  const showPagination = !isEmpty && totalRows > pageSize;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        {isEmpty ? (
          <EmptyState text={emptyStateText} action={emptyStateAction} />
        ) : (
          <div className="bg-card border border-line rounded overflow-hidden min-w-max md:min-w-0">
            {/* Header */}
            <div
              className="grid px-4 py-3 bg-subtle border-b border-line"
              style={{ gridTemplateColumns: columnWidths }}
            >
              {columns.map((col, i) => (
                <div
                  key={i}
                  className="text-xs font-semibold uppercase tracking-widest text-secondary"
                >
                  {col}
                </div>
              ))}
            </div>

            {rows.map((row) => (
                <div
                  key={row.key}
                  role={row.onClick ? "button" : "row"}
                  tabIndex={row.onClick ? 0 : undefined}
                  onKeyDown={
                    row.onClick
                      ? (e) => e.key === "Enter" && row.onClick?.()
                      : undefined
                  }
                  onClick={row.onClick}
                  className={cn(
                    "grid px-4 border-b border-line last:border-b-0 min-h-[54px] items-center",
                    row.onClick && "cursor-pointer hover:bg-surface transition-colors",
                    row.className,
                  )}
                  style={{ gridTemplateColumns: columnWidths }}
                >
                  {row.cells.map((cell, i) => (
                    <div key={i}>{cell}</div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between py-3 border-t border-line bg-card shrink-0">
          <p className="text-xs text-secondary tabular-nums">
            Showing {from}–{to} of {totalRows}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded text-placeholder hover:text-secondary hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ArrowLeft className="size-4" />
            </button>
            <span className="text-xs text-secondary tabular-nums min-w-[48px] text-center">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded text-placeholder hover:text-secondary hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

