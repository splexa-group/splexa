"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Search } from "@/components/ui/form/search";
interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  search: string;
  onSearchChange: (s: string) => void;
}

export function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
  search,
  onSearchChange,
}: Props) {
  const label = format(new Date(year, month, 1), "MMMM yyyy");

  return (
    <FiltersBar columns="auto 1fr">
      {/* Month navigation */}
      <div className="flex items-center rounded border border-line bg-card h-10 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <span className="px-3.5 text-sm text-dark whitespace-nowrap">
          {label}
        </span>
        <div className="flex items-center m-1 rounded bg-subtle">
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center justify-center w-8 h-8 rounded text-label hover:bg-line transition-colors focus:outline-none"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center justify-center w-8 h-8 rounded text-label hover:bg-line transition-colors focus:outline-none"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <Search
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
        placeholder="Search cases..."
      />
    </FiltersBar>
  );
}
