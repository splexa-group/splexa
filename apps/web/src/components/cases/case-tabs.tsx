"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CaseTabs as Tabs } from "@/enums/case-tabs";
import { useCaseActiveTab } from "@/hooks/use-active-tab";

const TABS: { id: Tabs; label: string }[] = [
  { id: Tabs.CASE, label: "Case" },
  { id: Tabs.CLIENT, label: "Client" },
  { id: Tabs.HEARINGS, label: "Hearings" },
  { id: Tabs.DOCUMENTS, label: "Documents" },
  { id: Tabs.IMPORTANT_DATES, label: "Important Dates" },
];

interface Props {
  caseId: string;
}

export function CaseTabs({ caseId }: Props) {
  const router = useRouter();
  const active = useCaseActiveTab();

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
