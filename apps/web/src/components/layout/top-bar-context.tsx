'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type TopBarAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

export interface TopBarConfig {
  title: string;
  resourceTitle?: string;
  action?: TopBarAction;
}

interface TopBarContextValue {
  config: TopBarConfig | null;
  setConfig: (config: TopBarConfig | null) => void;
}

export const TopBarContext = createContext<TopBarContextValue | null>(null);

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TopBarConfig | null>(null);
  return (
    <TopBarContext.Provider value={{ config, setConfig }}>
      {children}
    </TopBarContext.Provider>
  );
}

export function usePageTitle(config: TopBarConfig) {
  const ctx = useContext(TopBarContext);
  if (!ctx) throw new Error('usePageTitle must be used inside TopBarProvider');
  const { setConfig } = ctx;
  useEffect(() => {
    setConfig(config);
    return () => setConfig(null);
    // `config` is a new object on every render — depend on individual fields to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.title, config.resourceTitle, config.action?.label, config.action?.href, config.action?.onClick, setConfig]);
}
