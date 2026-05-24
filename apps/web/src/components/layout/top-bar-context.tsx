'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type TopBarConfig =
  | { variant: 'default'; title: string }
  | { variant: 'detail'; title: string; typeTag?: string };

interface TopBarContextValue {
  config: TopBarConfig | null;
  setTopBar: (config: TopBarConfig) => void;
}

const TopBarContext = createContext<TopBarContextValue | null>(null);

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [config, setTopBar] = useState<TopBarConfig | null>(null);

  return (
    <TopBarContext.Provider value={{ config, setTopBar }}>
      {children}
    </TopBarContext.Provider>
  );
}

export function useTopBar() {
  const ctx = useContext(TopBarContext);
  if (!ctx) throw new Error('useTopBar must be used inside TopBarProvider');
  return ctx;
}
