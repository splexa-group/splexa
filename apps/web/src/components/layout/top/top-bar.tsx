"use client";

import { useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
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
