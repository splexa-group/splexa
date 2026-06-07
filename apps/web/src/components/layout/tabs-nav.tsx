"use client";

import { cn } from "@/lib/utils";

export interface SubTabConfig {
  id: string;
  label: string;
}

export interface TabConfig {
  id: string;
  label: string;
  subTabs?: SubTabConfig[];
}

interface Props {
  tabs: TabConfig[];
  activeTab: string;
  activeSubTab: string;
  onNavigate: (tabId: string, subTabId?: string) => void;
}

const tabClass = "px-3 py-2 text-sm font-medium rounded transition-all";

export function TabsNav({ tabs, activeTab, activeSubTab, onNavigate }: Props) {
  const activeTabConfig = tabs.find((t) => t.id === activeTab);

  return (
    <div className="bg-card border-b border-line flex-shrink-0">
      <div className="flex justify-center px-4 py-2 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id, tab.subTabs?.[0]?.id)}
            className={cn(
              tabClass,
              activeTab === tab.id
                ? "bg-brand/8 font-medium text-brand"
                : "text-body hover:text-dark",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTabConfig?.subTabs?.length && (
        <div className="flex justify-center border-t border-line bg-subtle/90 px-4 py-2 gap-2">
          {activeTabConfig.subTabs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => onNavigate(activeTab, sub.id)}
              className={cn(
                tabClass,
                activeSubTab === sub.id
                  ? "bg-brand/8 font-medium text-brand"
                  : "text-body hover:text-dark",
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
