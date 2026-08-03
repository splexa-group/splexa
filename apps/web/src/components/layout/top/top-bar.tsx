"use client";

import { useContext } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { TopBarContext } from "./top-bar-context";

export function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ctx = useContext(TopBarContext);
  const config = ctx?.config ?? null;

  // /documents is the one flat route that drills into a resource via a query
  // param (?caseId=) instead of a deeper path segment — pathname alone can't
  // see that, so it's checked explicitly here rather than treating every
  // search param as "child" (that would wrongly enable back on filtered list
  // pages like /cases?status=... which never leave the top-level list).
  const isDocumentsCaseView = pathname === "/documents" && !!searchParams.get("caseId");
  const isChild = pathname.split("/").filter(Boolean).length > 1 || isDocumentsCaseView;

  const displayTitle = config?.resourceTitle
    ? `${config.title} / ${config.resourceTitle}`
    : (config?.title ?? "");

  return (
    <header className="h-[60px] bg-card border-b border-line flex items-center px-4 gap-3 shrink-0 z-30">
      <Button
        variant="secondarySoft"
        size="icon"
        disabled={!isChild}
        onClick={() => router.back()}
        aria-label="Go back"
        className="shrink-0"
      >
        <Icon icon={ArrowLeft} size="sm" />
      </Button>

      <h1 className="text-[15px] font-semibold text-dark flex-1 truncate">{displayTitle}</h1>

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
