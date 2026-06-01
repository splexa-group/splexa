"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CaseTabs as Tabs } from "@/enums/case-tabs";
import { useCaseActiveTab } from "@/hooks/use-active-tab";

const TABS: { id: Tabs; label: string }[] = [
  { id: Tabs.CASE, label: "Case Details" },
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
    <div className="flex justify-center bg-card border-b border-line flex-shrink-0">
      <div className="flex items-center gap-2 py-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => router.push(`/cases/${caseId}?tab=${tab.id}`)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-all",
              active === tab.id
                ? "bg-brand-soft/40 text-brand"
                : "text-body hover:bg-subtle/80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
