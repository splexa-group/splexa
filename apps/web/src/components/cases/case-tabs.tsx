"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CaseTab } from "@/hooks/use-active-tab";

const TABS: { id: CaseTab; label: string }[] = [
  { id: "case", label: "Case" },
  { id: "client", label: "Client" },
  { id: "hearings", label: "Hearings" },
  { id: "documents", label: "Documents" },
  { id: "important-dates", label: "Important Dates" },
];

interface Props {
  caseId: string;
}

export function CaseTabs({ caseId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") ?? "case") as CaseTab;

  return (
    <div className="flex overflow-x-auto border-b border-line -mb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => router.push(`/cases/${caseId}?tab=${tab.id}`)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
            active === tab.id
              ? "border-dark text-dark font-bold"
              : "border-transparent text-placeholder hover:text-secondary",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
