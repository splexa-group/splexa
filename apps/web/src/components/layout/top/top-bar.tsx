"use client";

import { useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { TopBarContext } from "./top-bar-context";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useContext(TopBarContext);
  const config = ctx?.config ?? null;

  const isChild = pathname.split("/").filter(Boolean).length > 1;

  const displayTitle = config?.resourceTitle
    ? `${config.title} / ${config.resourceTitle}`
    : (config?.title ?? "");

  return (
    <header className="h-[60px] bg-card border-b border-line flex items-center px-4 gap-3 shrink-0 z-30">
      <button
        type="button"
        disabled={!isChild}
        onClick={() => isChild && router.back()}
        aria-label="Go back"
        className={cn(
          "w-[30px] h-[30px] flex items-center justify-center rounded-md transition-colors shrink-0",
          isChild
            ? "bg-subtle text-label hover:bg-line cursor-pointer"
            : "text-placeholder opacity-40 cursor-default",
        )}
      >
        <Icon icon={ArrowLeft} size="sm" />
      </button>

      <h1 className="text-[15px] font-semibold text-dark flex-1 truncate">
        {displayTitle}
      </h1>

      {config?.action &&
        (config.action.href ? (
          <Button asChild variant="primary" size="sm">
            <Link href={config.action.href}>
              <Icon icon={Plus} size="xs" />
              {config.action.label}
            </Link>
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={config.action.onClick}>
            <Icon icon={Plus} size="xs" />
            {config.action.label}
          </Button>
        ))}
    </header>
  );
}
