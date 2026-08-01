"use client";

import * as React from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/utils/tailwind";

export interface SearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, onClear, value, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-3 size-4 text-placeholder pointer-events-none" />
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            "w-full rounded border border-line bg-card pl-9 pr-9 py-[9px] text-sm text-dark placeholder:text-placeholder transition-colors",
            "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
            "disabled:bg-subtle disabled:text-disabled disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 text-placeholder hover:text-secondary transition-colors"
            aria-label="Clear search"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
    );
  }
);
Search.displayName = "Search";

export { Search };
