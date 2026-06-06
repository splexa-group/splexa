"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  trigger?: ReactNode;
}

export function Menu({ items, trigger }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="p-1.5 rounded text-secondary hover:text-label hover:bg-subtle transition-colors outline-none"
            aria-label="Actions"
          >
            <MoreHorizontal color="currentColor" className="size-4" />
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className={cn(
            "z-50 min-w-[160px] bg-card border border-line rounded shadow-md py-1",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenu.Item
                key={item.label}
                onSelect={item.onClick}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-sm font-medium cursor-default select-none outline-none transition-colors",
                  item.danger
                    ? "text-negative data-[highlighted]:bg-negative-muted"
                    : "text-label data-[highlighted]:bg-subtle",
                )}
              >
                {Icon && <Icon className="size-3.5 shrink-0" />}
                {item.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
