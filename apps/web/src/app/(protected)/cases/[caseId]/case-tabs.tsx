"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CaseTabs as CaseTabsEnum } from "@/enums/case-tabs";
import { useCaseActiveTab, useCaseActiveSubTab } from "@/hooks/use-active-tab";
import { CASE_TAB_CONFIG } from "@/config/case-tabs";

interface Props {
  caseId: string;
}

export function CaseTabs({ caseId }: Props) {
  const router = useRouter();
  const activeTab = useCaseActiveTab();
  const activeSubTab = useCaseActiveSubTab(activeTab);

  const activeTabConfig = CASE_TAB_CONFIG.find((t) => t.id === activeTab);

  function navigateTo(tab: CaseTabsEnum, subTab?: string) {
    const params = new URLSearchParams({ tab });
    if (subTab) params.set("subTab", subTab);
    router.push(`/cases/${caseId}?${params.toString()}`);
  }

  return (
    <div className="bg-card border-b border-line flex-shrink-0">
      {/* Main tab row */}
      <div className="flex justify-center px-4 py-2 gap-1">
        {CASE_TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigateTo(tab.id, tab.subTabs?.[0]?.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === tab.id
                ? "bg-brand/10 text-brand"
                : "text-body hover:bg-subtle hover:text-dark",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab row — rendered automatically when the active tab has subTabs */}
      {activeTabConfig?.subTabs?.length && (
        <div className="flex justify-center border-t border-line bg-subtle/30 px-4 py-1.5 gap-1">
          {activeTabConfig.subTabs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => navigateTo(activeTab, sub.id)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                activeSubTab === sub.id
                  ? "bg-brand/10 text-brand"
                  : "text-secondary hover:text-dark hover:bg-subtle",
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
